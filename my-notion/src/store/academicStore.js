import { create } from 'zustand'

/* ── helpers ─────────────────────────────────────────── */
const LS = (key) => ({ load: () => { try { return JSON.parse(localStorage.getItem(key)) } catch { return null } }, save: (v) => localStorage.setItem(key, JSON.stringify(v)) })

const subjectLS = LS('mynotion_subjects')
const attendLS = LS('mynotion_attendance')
const assignLS = LS('mynotion_assignments')
const semesterLS = LS('mynotion_semester')

function id() { return Math.random().toString(36).slice(2) + Date.now().toString(36) }
function todayStr() { return new Date().toISOString().slice(0, 10) }

const DEFAULT_SUBJECTS = []
const DEFAULT_SEMESTER = {
    name: 'Semester',
    startDate: '',
    endDate: '',
    events: [],
}

/* ── store ───────────────────────────────────────────── */
const useAcademicStore = create((set, get) => ({

    /* ════════════ SUBJECTS / ATTENDANCE CALCULATOR ════════════════ */
    subjects: subjectLS.load() || DEFAULT_SUBJECTS,

    addSubject: (name, color = '#7c5cfc', target = 80) => {
        const s = {
            id: id(), name, color, target: Number(target),
            conducted: 0, attended: 0,
            timetable: [1, 2, 3, 4, 5], // default Mon-Fri
            excludedDates: [],
        }
        const subjects = [...get().subjects, s]
        subjectLS.save(subjects)
        set({ subjects })
    },

    removeSubject: (subjectId) => {
        const subjects = get().subjects.filter(s => s.id !== subjectId)
        subjectLS.save(subjects)
        set({ subjects })
    },

    updateSubject: (subjectId, data) => {
        const subjects = get().subjects.map(s => s.id === subjectId ? { ...s, ...data } : s)
        subjectLS.save(subjects)
        set({ subjects })
    },

    getSubjectStats: (subjectId) => {
        const s = get().subjects.find(s => s.id === subjectId)
        if (!s) return null

        // Calculate future classes from tomorrow until semester end
        let futureDays = 0
        let current = new Date()
        current.setDate(current.getDate() + 1)
        current.setHours(0, 0, 0, 0)

        const sem = get().semester
        let end = sem.endDate ? new Date(sem.endDate) : new Date(todayStr())
        end.setHours(0, 0, 0, 0)

        const globalHolidays = (sem.events || []).filter(e => e.type === 'holiday').map(e => e.date)
        const allExcluded = new Set([...(s.excludedDates || []), ...globalHolidays])

        while (current <= end) {
            const dateStr = current.getTime() - (current.getTimezoneOffset() * 60000)
            const ds = new Date(dateStr).toISOString().slice(0, 10)
            if ((s.timetable || []).includes(current.getDay()) && !allExcluded.has(ds)) {
                futureDays++
            }
            current.setDate(current.getDate() + 1)
        }

        // Each full day counts as 2 periods, but if subject includes '0.5' or '.5' it counts as 0.5
        const periodsPerDay = s.name.includes('0.5') || s.name.includes('.5') ? 0.5 : 2
        const futureClasses = futureDays * periodsPerDay

        const conducted = Number(s.conducted) || 0
        const attended = Number(s.attended) || 0
        const currentPct = conducted === 0 ? 100 : Math.round((attended / conducted) * 100)

        const finalConducted = conducted + futureClasses
        const finalAttended = attended + futureClasses
        const projectedPct = finalConducted === 0 ? 100 : Math.round((finalAttended / finalConducted) * 100)

        return {
            currentPct, projectedPct, futureClasses, futureDays,
            conducted, attended, finalConducted, finalAttended
        }
    },

    getBunkBudget: (subjectId) => {
        const s = get().subjects.find(s => s.id === subjectId)
        if (!s) return 0
        const stats = get().getSubjectStats(subjectId)
        const target = s.target / 100

        // budget <= finalAttended - (target * finalConducted)
        const budget = Math.floor(stats.finalAttended - (target * stats.finalConducted))
        return Math.max(0, budget)
    },

    getRecoverClasses: (subjectId) => {
        const s = get().subjects.find(s => s.id === subjectId)
        if (!s) return 0
        const stats = get().getSubjectStats(subjectId)
        if (stats.projectedPct >= s.target) return 0
        const target = s.target / 100
        if (target === 1) return Infinity

        // How many EXTRA classes beyond the schedule do you need to attend?
        // (finalAttended + x) / (finalConducted + x) >= target
        const extra = Math.ceil((target * stats.finalConducted - stats.finalAttended) / (1 - target))
        return Math.max(0, extra)
    },

    /* ════════════ ASSIGNMENTS ═══════════════════════════ */
    assignments: assignLS.load() || [],

    addAssignment: (data) => {
        const a = {
            id: id(),
            title: data.title,
            subject: data.subject || '',
            dueDate: data.dueDate || '',
            priority: data.priority || 'medium',  // 'high' | 'medium' | 'low'
            status: 'pending',                  // 'pending' | 'submitted' | 'late'
            notes: data.notes || '',
            createdAt: new Date().toISOString(),
        }
        const assignments = [a, ...get().assignments]
        assignLS.save(assignments)
        set({ assignments })
    },

    updateAssignment: (id, data) => {
        const assignments = get().assignments.map(a => a.id === id ? { ...a, ...data } : a)
        assignLS.save(assignments)
        set({ assignments })
    },

    deleteAssignment: (id) => {
        const assignments = get().assignments.filter(a => a.id !== id)
        assignLS.save(assignments)
        set({ assignments })
    },

    /* ════════════ SEMESTER PLANNER ══════════════════════ */
    semester: semesterLS.load() || DEFAULT_SEMESTER,

    updateSemester: (data) => {
        const semester = { ...get().semester, ...data }
        semesterLS.save(semester)
        set({ semester })
    },

    addEvent: (event) => {
        const e = { id: id(), ...event }
        const semester = { ...get().semester, events: [...(get().semester.events || []), e] }
        semesterLS.save(semester)
        set({ semester })
    },

    updateEvent: (eventId, data) => {
        const events = (get().semester.events || []).map(e => e.id === eventId ? { ...e, ...data } : e)
        const semester = { ...get().semester, events }
        semesterLS.save(semester)
        set({ semester })
    },

    deleteEvent: (eventId) => {
        const events = (get().semester.events || []).filter(e => e.id !== eventId)
        const semester = { ...get().semester, events }
        semesterLS.save(semester)
        set({ semester })
    },
}))

export default useAcademicStore
