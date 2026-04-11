import React, { useEffect, useMemo, useState } from 'react'
import useMoodleStore from '../store/moodleStore.js'
import '../styles/moodle.css'

const FILTERS = ['all', 'pending', 'submitted', 'overdue', 'draft']

const STATUS_META = {
    pending: { label: 'Pending', tone: 'warning' },
    draft: { label: 'Draft', tone: 'neutral' },
    overdue: { label: 'Overdue', tone: 'danger' },
    submitted: { label: 'Submitted', tone: 'success' },
    'submitted-late': { label: 'Submitted late', tone: 'success' },
}

function formatDateTime(value) {
    if (!value) {
        return 'No date'
    }

    return new Date(value).toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    })
}

function formatRelativeDue(assignment) {
    if (assignment.submission.isSubmitted) {
        return assignment.submission.isLate ? 'Turned in after the deadline' : 'Turned in'
    }

    if (!assignment.dueAt) {
        return 'No due date listed'
    }

    const diffInDays = Math.ceil((new Date(assignment.dueAt).getTime() - Date.now()) / 86400000)

    if (diffInDays < 0) {
        return `${Math.abs(diffInDays)} day${Math.abs(diffInDays) === 1 ? '' : 's'} overdue`
    }

    if (diffInDays === 0) {
        return 'Due today'
    }

    if (diffInDays === 1) {
        return '1 day left'
    }

    return `${diffInDays} days left`
}

function matchesFilter(assignment, filter) {
    if (filter === 'all') {
        return true
    }

    if (filter === 'submitted') {
        return assignment.submission.isSubmitted
    }

    return assignment.submission.state === filter
}

function EmptyConnectionState() {
    return (
        <section className="moodle-empty-state">
            <h2>Connect Moodle to see live subjects and remaining work.</h2>
            <p>
                Paste your Moodle web service token once, sync, and this page will surface your
                courses, upcoming deadlines, submitted work, and the items still left to finish.
            </p>
        </section>
    )
}

function StatCard({ label, value, hint }) {
    return (
        <article className="moodle-stat-card">
            <span className="moodle-stat-label">{label}</span>
            <strong className="moodle-stat-value">{value}</strong>
            <span className="moodle-stat-hint">{hint}</span>
        </article>
    )
}

function CourseCard({ course }) {
    const { metrics } = course
    const progressWidth = Math.max(0, Math.min(metrics.progressPercent || 0, 100))
    const summary = metrics.hasCompletionTracking
        ? `${metrics.completedWork} of ${metrics.trackedWork} tracked activities complete`
        : `${metrics.submittedAssignments} of ${metrics.totalAssignments} assignments submitted`

    return (
        <article className="moodle-course-card">
            <div className="moodle-course-header">
                <div>
                    <h3>{course.name}</h3>
                    <p>{course.shortName || course.categoryName || 'Current subject'}</p>
                </div>
                <span className="moodle-chip">{metrics.progressPercent}%</span>
            </div>

            <div className="moodle-progress-track">
                <div className="moodle-progress-fill" style={{ width: `${progressWidth}%` }} />
            </div>

            <p className="moodle-course-summary">{summary}</p>

            <div className="moodle-course-stats">
                <div>
                    <span>Remaining</span>
                    <strong>{metrics.remainingWork}</strong>
                </div>
                <div>
                    <span>Due soon</span>
                    <strong>{metrics.dueSoonAssignments}</strong>
                </div>
                <div>
                    <span>Overdue</span>
                    <strong>{metrics.overdueAssignments}</strong>
                </div>
            </div>
        </article>
    )
}

function EventList({ events }) {
    if (!events.length) {
        return (
            <div className="moodle-empty-panel">
                Upcoming calendar events will appear here after the first successful sync.
            </div>
        )
    }

    return (
        <div className="moodle-event-list">
            {events.map(event => (
                <article key={event.id} className="moodle-event-card">
                    <div>
                        <h3>{event.title}</h3>
                        <p>{event.courseName || event.type}</p>
                    </div>
                    <span>{formatDateTime(event.startAt)}</span>
                </article>
            ))}
        </div>
    )
}

function AssignmentList({ assignments }) {
    if (!assignments.length) {
        return (
            <div className="moodle-empty-panel">
                No work matches this filter right now.
            </div>
        )
    }

    return (
        <div className="moodle-assignment-list">
            {assignments.map(assignment => {
                const status = STATUS_META[assignment.submission.state] || STATUS_META.pending

                return (
                    <article key={assignment.id} className={`moodle-assignment-card moodle-tone-${status.tone}`}>
                        <div className="moodle-assignment-header">
                            <div>
                                <h3>{assignment.name}</h3>
                                <p>{assignment.courseName}</p>
                            </div>
                            <span className={`moodle-pill moodle-pill-${status.tone}`}>{status.label}</span>
                        </div>

                        <div className="moodle-assignment-meta">
                            <span>{formatRelativeDue(assignment)}</span>
                            <span>{assignment.dueAt ? `Due ${formatDateTime(assignment.dueAt)}` : 'No deadline listed'}</span>
                            {assignment.submission.submittedAt && (
                                <span>{`Submitted ${formatDateTime(assignment.submission.submittedAt)}`}</span>
                            )}
                        </div>

                        {assignment.intro && (
                            <p className="moodle-assignment-copy">{assignment.intro}</p>
                        )}
                    </article>
                )
            })}
        </div>
    )
}

export default function MoodleActivity() {
    const {
        token,
        snapshot,
        loading,
        error,
        syncMoodle,
        disconnect,
        clearError,
    } = useMoodleStore()

    const [tokenInput, setTokenInput] = useState(token)
    const [showToken, setShowToken] = useState(false)
    const [filter, setFilter] = useState('all')

    useEffect(() => {
        setTokenInput(token)
    }, [token])

    useEffect(() => {
        if (token && !snapshot && !loading) {
            syncMoodle().catch(() => {})
        }
    }, [token, snapshot, loading, syncMoodle])

    const filteredAssignments = useMemo(() => {
        const list = snapshot?.assignments || []

        return list
            .filter(assignment => matchesFilter(assignment, filter))
            .sort((left, right) => {
                const leftDue = left.duedate || Number.MAX_SAFE_INTEGER
                const rightDue = right.duedate || Number.MAX_SAFE_INTEGER

                return leftDue - rightDue || left.name.localeCompare(right.name)
            })
    }, [filter, snapshot])

    async function handleSync(event) {
        event.preventDefault()
        clearError()

        try {
            await syncMoodle(tokenInput)
        } catch {
            return
        }
    }

    async function handleRefresh() {
        clearError()

        try {
            await syncMoodle(tokenInput || token)
        } catch {
            return
        }
    }

    function handleDisconnect() {
        disconnect()
        setTokenInput('')
        setShowToken(false)
        setFilter('all')
    }

    const summary = snapshot?.summary
    const coverage = snapshot?.meta?.assignmentStatusCoverage

    return (
        <div className="page-container moodle-page">
            <section className="moodle-hero">
                <div>
                    <span className="moodle-eyebrow">Academic sync</span>
                    <h1>Moodle Activity</h1>
                    <p>
                        Pull your Saveetha Moodle subjects into MyProgress and keep an eye on
                        completed work, upcoming deadlines, and what still needs attention.
                    </p>
                </div>

                <div className="moodle-hero-actions">
                    {snapshot && (
                        <>
                            <button className="moodle-button moodle-button-secondary" onClick={handleRefresh} disabled={loading}>
                                {loading ? 'Syncing...' : 'Refresh'}
                            </button>
                            <button className="moodle-button moodle-button-ghost" onClick={handleDisconnect}>
                                Disconnect
                            </button>
                        </>
                    )}
                </div>
            </section>

            <section className="moodle-connection-card">
                <form className="moodle-connection-form" onSubmit={handleSync}>
                    <label className="moodle-field">
                        <span>Moodle token</span>
                        <div className="moodle-token-row">
                            <input
                                type={showToken ? 'text' : 'password'}
                                value={tokenInput}
                                onChange={event => {
                                    setTokenInput(event.target.value)
                                    if (error) {
                                        clearError()
                                    }
                                }}
                                placeholder="Paste your Moodle web service token"
                                autoComplete="off"
                            />
                            <button
                                type="button"
                                className="moodle-toggle-button"
                                onClick={() => setShowToken(current => !current)}
                            >
                                {showToken ? 'Hide' : 'Show'}
                            </button>
                        </div>
                    </label>

                    <button className="moodle-button moodle-button-primary" type="submit" disabled={loading}>
                        {loading ? 'Syncing Moodle...' : snapshot ? 'Refresh Moodle' : 'Connect Moodle'}
                    </button>
                </form>

                <div className="moodle-connection-meta">
                    <span>
                        {snapshot
                            ? `Last synced ${formatDateTime(snapshot.fetchedAt)}`
                            : 'The token is stored only in this browser until you disconnect.'}
                    </span>
                    <span>
                        {snapshot
                            ? `${snapshot.user.name} | ${snapshot.user.siteName}`
                            : 'Ready for Saveetha Moodle'}
                    </span>
                </div>

                {error && <div className="moodle-alert">{error}</div>}
            </section>

            {!snapshot && <EmptyConnectionState />}

            {snapshot && (
                <>
                    <section className="moodle-stats-grid">
                        <StatCard label="Subjects" value={summary.totalCourses} hint="Enrolled courses synced" />
                        <StatCard label="Remaining" value={summary.remainingWork} hint="Open work still left" />
                        <StatCard label="Submitted" value={summary.submittedAssignments} hint="Assignments already turned in" />
                        <StatCard label="Upcoming" value={summary.upcomingEvents} hint="Events and deadlines ahead" />
                    </section>

                    <div className="moodle-main-grid">
                        <section className="moodle-panel">
                            <div className="moodle-panel-heading">
                                <div>
                                    <h2>Subjects</h2>
                                    <p>Progress per course using tracked Moodle work when available.</p>
                                </div>
                            </div>

                            <div className="moodle-course-grid">
                                {snapshot.courses.map(course => (
                                    <CourseCard key={course.id} course={course} />
                                ))}
                            </div>
                        </section>

                        <section className="moodle-panel moodle-panel-side">
                            <div className="moodle-panel-heading">
                                <div>
                                    <h2>Upcoming</h2>
                                    <p>{snapshot.meta?.calendarSource === 'moodle' ? 'Pulled from calendar actions.' : 'Built from upcoming assignment deadlines.'}</p>
                                </div>
                            </div>

                            <EventList events={snapshot.events} />
                        </section>
                    </div>

                    <section className="moodle-panel">
                        <div className="moodle-panel-heading moodle-panel-heading-wrap">
                            <div>
                                <h2>Work queue</h2>
                                <p>See what is done, what is pending, and what needs attention next.</p>
                            </div>

                            <div className="moodle-filter-row">
                                {FILTERS.map(item => (
                                    <button
                                        key={item}
                                        className={`moodle-filter-chip${filter === item ? ' active' : ''}`}
                                        onClick={() => setFilter(item)}
                                        type="button"
                                    >
                                        {item}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {coverage && (
                            <p className="moodle-coverage-note">
                                Submission status loaded for {coverage.loaded} of {coverage.total} assignments.
                            </p>
                        )}

                        <AssignmentList assignments={filteredAssignments} />
                    </section>
                </>
            )}
        </div>
    )
}
