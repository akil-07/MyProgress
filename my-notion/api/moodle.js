// Disable strict SSL verification for internal university services on Vercel
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

const DEFAULT_BASE_URL = process.env.MOODLE_BASE_URL || 'https://lms2.ai.saveetha.in'
const STATUS_LOOKBACK_SECONDS = 60 * 24 * 60 * 60
const STATUS_LOOKAHEAD_SECONDS = 150 * 24 * 60 * 60
const MAX_ASSIGNMENTS_WITH_STATUS = 60
const STATUS_CONCURRENCY = 6
const COURSE_CONCURRENCY = 4

function appendParam(searchParams, key, value) {
    if (value === undefined || value === null) {
        return
    }

    if (Array.isArray(value)) {
        value.forEach((item, index) => appendParam(searchParams, `${key}[${index}]`, item))
        return
    }

    if (typeof value === 'object') {
        Object.entries(value).forEach(([childKey, childValue]) => {
            appendParam(searchParams, `${key}[${childKey}]`, childValue)
        })
        return
    }

    searchParams.append(key, String(value))
}

function buildFormBody(params) {
    const searchParams = new URLSearchParams()

    Object.entries(params).forEach(([key, value]) => {
        appendParam(searchParams, key, value)
    })

    return searchParams
}

function cleanHtml(html = '') {
    return String(html)
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/\s+/g, ' ')
        .trim()
}

function toIsoDate(unixSeconds) {
    if (!unixSeconds) {
        return null
    }

    return new Date(unixSeconds * 1000).toISOString()
}

function isCompletionTracked(status) {
    return status.uservisible !== false && Number(status.tracking ?? 1) !== 0
}

function mapCourseCompletion(payload) {
    const rawStatuses = Array.isArray(payload?.statuses)
        ? payload.statuses
        : Array.isArray(payload?.completionstatus)
            ? payload.completionstatus
            : []

    const tracked = rawStatuses.filter(isCompletionTracked)
    const completed = tracked.filter(status => Number(status.state ?? 0) > 0)

    return {
        trackedActivities: tracked.length,
        completedActivities: completed.length,
        remainingActivities: Math.max(tracked.length - completed.length, 0),
        hasCompletionTracking: tracked.length > 0,
    }
}

function isRelevantForSubmissionStatus(assignment, nowInSeconds) {
    const comparisonDate = assignment.duedate || assignment.cutoffdate

    if (!comparisonDate) {
        return true
    }

    return comparisonDate >= nowInSeconds - STATUS_LOOKBACK_SECONDS
        && comparisonDate <= nowInSeconds + STATUS_LOOKAHEAD_SECONDS
}

function makeFallbackSubmission(assignment, nowInSeconds, statusKnown = false) {
    const overdue = Boolean(assignment.duedate && assignment.duedate < nowInSeconds)

    return {
        rawStatus: null,
        gradingStatus: null,
        submittedAt: null,
        isSubmitted: false,
        isLate: false,
        isPastDue: overdue,
        state: overdue ? 'overdue' : 'pending',
        label: overdue ? 'Overdue' : 'Pending',
        statusKnown,
    }
}

function normalizeSubmissionStatus(assignment, payload, nowInSeconds) {
    const submission = payload?.lastattempt?.submission || null
    const rawStatus = submission?.status || null
    const gradingStatus = submission?.gradingstatus || payload?.gradinginfo?.gradingstatus || null
    const submittedTimestamp = submission?.timemodified || submission?.timecreated || null

    const isSubmitted = rawStatus === 'submitted' || gradingStatus === 'graded'
    const isPastDue = Boolean(assignment.duedate && assignment.duedate < nowInSeconds)
    const isLate = Boolean(isSubmitted && assignment.duedate && submittedTimestamp && submittedTimestamp > assignment.duedate)

    if (isSubmitted) {
        return {
            rawStatus,
            gradingStatus,
            submittedAt: toIsoDate(submittedTimestamp),
            isSubmitted: true,
            isLate,
            isPastDue,
            state: isLate ? 'submitted-late' : 'submitted',
            label: isLate ? 'Submitted late' : 'Submitted',
            statusKnown: true,
        }
    }

    if (rawStatus === 'draft') {
        return {
            rawStatus,
            gradingStatus,
            submittedAt: null,
            isSubmitted: false,
            isLate: false,
            isPastDue,
            state: isPastDue ? 'overdue' : 'draft',
            label: isPastDue ? 'Overdue draft' : 'Draft',
            statusKnown: true,
        }
    }

    return {
        ...makeFallbackSubmission(assignment, nowInSeconds, true),
        rawStatus,
        gradingStatus,
    }
}

async function mapWithConcurrency(items, limit, mapper) {
    const results = new Array(items.length)
    let index = 0

    async function worker() {
        while (index < items.length) {
            const currentIndex = index
            index += 1
            results[currentIndex] = await mapper(items[currentIndex], currentIndex)
        }
    }

    const workers = Array.from({ length: Math.min(limit, items.length) }, () => worker())
    await Promise.all(workers)

    return results
}

async function callMoodle(token, wsfunction, params = {}) {
    const body = buildFormBody({
        wstoken: token,
        wsfunction,
        moodlewsrestformat: 'json',
        ...params,
    })

    const response = await fetch(`${DEFAULT_BASE_URL.replace(/\/$/, '')}/webservice/rest/server.php`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Accept: 'application/json',
        },
        body,
    })

    if (!response.ok) {
        throw new Error(`Moodle request failed with status ${response.status}.`)
    }

    const payload = await response.json()

    if (payload?.exception) {
        const error = new Error(payload.message || 'Moodle request failed.')
        error.code = payload.errorcode || payload.exception
        throw error
    }

    return payload
}

function buildCalendarFallback(assignments) {
    return assignments
        .filter(assignment => assignment.dueAt && assignment.remaining)
        .sort((left, right) => {
            const leftTime = left.duedate || Number.MAX_SAFE_INTEGER
            const rightTime = right.duedate || Number.MAX_SAFE_INTEGER
            return leftTime - rightTime
        })
        .slice(0, 8)
        .map(assignment => ({
            id: `assignment-${assignment.id}`,
            title: assignment.name,
            courseId: assignment.courseId,
            courseName: assignment.courseName,
            startAt: assignment.dueAt,
            type: 'assignment',
            description: assignment.intro,
            url: null,
            overdue: assignment.submission.state === 'overdue',
        }))
}

async function getUpcomingEvents(token, courseNameById, assignments, nowInSeconds) {
    try {
        const payload = await callMoodle(token, 'core_calendar_get_action_events_by_timesort', {
            timesortfrom: nowInSeconds,
            timesortto: nowInSeconds + (60 * 24 * 60 * 60),
            limitnum: 10,
        })

        const events = Array.isArray(payload?.events) ? payload.events : []

        return {
            source: 'moodle',
            events: events.map(event => ({
                id: event.id,
                title: event.name || 'Upcoming event',
                courseId: event.courseid || null,
                courseName: courseNameById.get(event.courseid) || '',
                startAt: toIsoDate(event.timestart || event.timesort),
                type: event.modulename || event.eventtype || 'event',
                description: cleanHtml(event.description),
                url: event.url || null,
                overdue: Boolean(event.timestart && event.timestart < nowInSeconds),
            })),
        }
    } catch {
        return {
            source: 'assignments',
            events: buildCalendarFallback(assignments),
        }
    }
}

export default async function handler(req, res) {
    res.setHeader('Cache-Control', 'no-store, max-age=0')

    if (req.method !== 'POST') {
        res.status(405).json({ error: 'Use POST to sync Moodle data.' })
        return
    }

    try {
        const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {})
        const token = String(body.token || '').trim()

        if (!token) {
            res.status(400).json({ error: 'A Moodle token is required.' })
            return
        }

        const nowInSeconds = Math.floor(Date.now() / 1000)
        const siteInfo = await callMoodle(token, 'core_webservice_get_site_info')
        const rawCourses = await callMoodle(token, 'core_enrol_get_users_courses', {
            userid: siteInfo.userid,
        })

        const baseCourses = (Array.isArray(rawCourses) ? rawCourses : []).map(course => ({
            id: course.id,
            name: course.fullname || course.displayname || course.shortname || `Course ${course.id}`,
            shortName: course.shortname || '',
            summary: cleanHtml(course.summary),
            categoryName: course.categoryname || '',
            progress: typeof course.progress === 'number' ? course.progress : null,
            startAt: toIsoDate(course.startdate),
            endAt: toIsoDate(course.enddate),
            lastAccessAt: toIsoDate(course.lastaccess),
        }))

        const courseIds = baseCourses.map(course => course.id)
        const courseNameById = new Map(baseCourses.map(course => [course.id, course.name]))

        const assignmentsPayload = courseIds.length > 0
            ? await callMoodle(token, 'mod_assign_get_assignments', { courseids: courseIds })
            : { courses: [] }

        const rawAssignments = (assignmentsPayload?.courses || []).flatMap(courseEntry => (
            (courseEntry.assignments || []).map(assignment => ({
                id: assignment.id,
                courseId: courseEntry.id,
                courseName: courseNameById.get(courseEntry.id) || courseEntry.fullname || `Course ${courseEntry.id}`,
                name: assignment.name || 'Untitled assignment',
                intro: cleanHtml(assignment.intro),
                duedate: Number(assignment.duedate || 0),
                dueAt: toIsoDate(assignment.duedate),
                cutoffAt: toIsoDate(assignment.cutoffdate),
                unlockAt: toIsoDate(assignment.allowsubmissionsfromdate),
                maxAttempts: assignment.maxattempts,
                gradingMethod: assignment.markingworkflow ? 'workflow' : 'standard',
            }))
        ))

        const assignmentsForStatus = rawAssignments
            .filter(assignment => isRelevantForSubmissionStatus(assignment, nowInSeconds))
            .slice(0, MAX_ASSIGNMENTS_WITH_STATUS)

        const assignmentStatusPairs = await mapWithConcurrency(assignmentsForStatus, STATUS_CONCURRENCY, async assignment => {
            try {
                const payload = await callMoodle(token, 'mod_assign_get_submission_status', {
                    assignid: assignment.id,
                })

                return [assignment.id, normalizeSubmissionStatus(assignment, payload, nowInSeconds)]
            } catch {
                return [assignment.id, makeFallbackSubmission(assignment, nowInSeconds, false)]
            }
        })

        const submissionByAssignmentId = new Map(assignmentStatusPairs)

        const assignments = rawAssignments
            .map(assignment => {
                const submission = submissionByAssignmentId.get(assignment.id)
                    || makeFallbackSubmission(assignment, nowInSeconds, false)

                return {
                    ...assignment,
                    submission,
                    remaining: !submission.isSubmitted,
                    dueSoon: Boolean(
                        assignment.duedate
                        && assignment.duedate >= nowInSeconds
                        && assignment.duedate <= nowInSeconds + (7 * 24 * 60 * 60)
                    ),
                }
            })
            .sort((left, right) => {
                const leftTime = left.duedate || Number.MAX_SAFE_INTEGER
                const rightTime = right.duedate || Number.MAX_SAFE_INTEGER
                return leftTime - rightTime || left.name.localeCompare(right.name)
            })

        const completionPairs = await mapWithConcurrency(baseCourses, COURSE_CONCURRENCY, async course => {
            try {
                const payload = await callMoodle(token, 'core_completion_get_activities_completion_status', {
                    courseid: course.id,
                    userid: siteInfo.userid,
                })

                return [course.id, mapCourseCompletion(payload)]
            } catch {
                return [course.id, null]
            }
        })

        const completionByCourseId = new Map(completionPairs)

        const courses = baseCourses.map(course => {
            const courseAssignments = assignments.filter(assignment => assignment.courseId === course.id)
            const completion = completionByCourseId.get(course.id)

            const submittedAssignments = courseAssignments.filter(assignment => assignment.submission.isSubmitted).length
            const pendingAssignments = courseAssignments.filter(assignment => assignment.remaining).length
            const overdueAssignments = courseAssignments.filter(assignment => assignment.submission.state === 'overdue').length
            const dueSoonAssignments = courseAssignments.filter(assignment => assignment.remaining && assignment.dueSoon).length

            const trackedWork = completion?.trackedActivities || courseAssignments.length
            const completedWork = completion?.completedActivities || submittedAssignments
            const remainingWork = completion?.hasCompletionTracking
                ? completion.remainingActivities
                : pendingAssignments

            const progressPercent = trackedWork > 0
                ? Math.round((completedWork / trackedWork) * 100)
                : (course.progress ?? 0)

            return {
                ...course,
                metrics: {
                    trackedWork,
                    completedWork,
                    remainingWork,
                    progressPercent,
                    hasCompletionTracking: Boolean(completion?.hasCompletionTracking),
                    totalAssignments: courseAssignments.length,
                    submittedAssignments,
                    pendingAssignments,
                    overdueAssignments,
                    dueSoonAssignments,
                },
            }
        })

        const upcomingEvents = await getUpcomingEvents(token, courseNameById, assignments, nowInSeconds)

        const completionTotals = courses.reduce((totals, course) => {
            totals.trackedWork += course.metrics.trackedWork
            totals.completedWork += course.metrics.completedWork
            return totals
        }, { trackedWork: 0, completedWork: 0 })

        const summary = {
            totalCourses: courses.length,
            totalAssignments: assignments.length,
            pendingAssignments: assignments.filter(assignment => assignment.remaining).length,
            submittedAssignments: assignments.filter(assignment => assignment.submission.isSubmitted).length,
            overdueAssignments: assignments.filter(assignment => assignment.submission.state === 'overdue').length,
            upcomingEvents: upcomingEvents.events.length,
            completedWork: completionTotals.trackedWork > 0
                ? completionTotals.completedWork
                : assignments.filter(assignment => assignment.submission.isSubmitted).length,
            remainingWork: completionTotals.trackedWork > 0
                ? Math.max(completionTotals.trackedWork - completionTotals.completedWork, 0)
                : assignments.filter(assignment => assignment.remaining).length,
        }

        res.status(200).json({
            fetchedAt: new Date().toISOString(),
            user: {
                id: siteInfo.userid,
                name: siteInfo.fullname || siteInfo.username || 'Student',
                siteName: siteInfo.sitename || 'Moodle',
            },
            summary,
            courses,
            assignments,
            events: upcomingEvents.events,
            meta: {
                source: DEFAULT_BASE_URL,
                calendarSource: upcomingEvents.source,
                assignmentStatusCoverage: {
                    loaded: assignmentStatusPairs.filter(([, submission]) => submission.statusKnown).length,
                    total: assignments.length,
                },
                hasCompletionTracking: courses.some(course => course.metrics.hasCompletionTracking),
            },
        })
    } catch (error) {
        console.error('Moodle Sync Error:', error)
        const statusCode = error.code === 'invalidtoken' ? 401 : 500
        const message = error.code === 'invalidtoken'
            ? 'Invalid Moodle token. Generate a fresh token and try again.'
            : (error.message || 'Unable to sync Moodle right now.')

        res.status(statusCode).json({ error: message })
    }
}
