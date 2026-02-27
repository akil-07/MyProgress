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

    // ════════════ TIMETABLE ════════════
    timetable: LS('mynotion_timetable').load() || {
        1: [null, null, 'lunch', null, null],
        2: [null, null, 'lunch', null, null],
        3: [null, null, 'lunch', null, null],
        4: [null, null, 'lunch', null, null],
        5: [null, null, 'lunch', null, null],
        6: [null, null, 'lunch', null, null]
    },
    updateTimetableSlot: (day, slot, subjectId) => {
        const newTimetable = { ...get().timetable }
        const daySlots = [...newTimetable[day]]
        daySlots[slot] = subjectId
        newTimetable[day] = daySlots
        LS('mynotion_timetable').save(newTimetable)
        set({ timetable: newTimetable })
    },

    // ════════════ ABSENCES ════════════
    absences: LS('mynotion_absences').load() || [], // { id, date, slot, subjectId }
    markAbsent: (date, slot, subjectId) => {
        const abs = [...get().absences]
        if (!abs.find(a => a.date === date && a.slot === slot && a.subjectId === subjectId)) {
            abs.push({ id: id(), date, slot, subjectId })
            LS('mynotion_absences').save(abs)
            set({ absences: abs })
        }
    },
    removeAbsent: (date, slot, subjectId) => {
        const abs = get().absences.filter(a => !(a.date === date && a.slot === slot && a.subjectId === subjectId))
        LS('mynotion_absences').save(abs)
        set({ absences: abs })
    },

    getSubjectStats: (subjectId) => {
        const s = get().subjects.find(s => s.id === subjectId)
        if (!s) return null

        const sem = get().semester
        const timetable = get().timetable
        const absences = get().absences

        let conducted = 0
        let futureClasses = 0
        let slotWeight = s.name.includes('0.5') || s.name.includes('.5') ? 0.5 : 2

        let current = sem.startDate ? new Date(sem.startDate) : new Date(todayStr())
        current.setHours(0, 0, 0, 0)
        let end = sem.endDate ? new Date(sem.endDate) : new Date(todayStr())
        end.setHours(0, 0, 0, 0)

        let today = new Date(todayStr())
        today.setHours(0, 0, 0, 0)

        const globalHolidays = (sem.events || []).filter(e => e.type === 'holiday').map(e => e.date)
        const allExcluded = new Set([...(s.excludedDates || []), ...globalHolidays])

        while (current <= end) {
            const dateStr = current.getTime() - (current.getTimezoneOffset() * 60000)
            const ds = new Date(dateStr).toISOString().slice(0, 10)
            const dayOfWeek = current.getDay()

            if (dayOfWeek >= 1 && dayOfWeek <= 6 && !allExcluded.has(ds)) {
                const slots = timetable[dayOfWeek]
                for (let i = 0; i < 5; i++) {
                    if (slots[i] === subjectId) {
                        if (current <= today) {
                            conducted += slotWeight
                        } else {
                            futureClasses += slotWeight
                        }
                    }
                }
            }
            current.setDate(current.getDate() + 1)
        }

        // Add any manually entered baseline from the past (if user migrating)
        conducted += (Number(s.conducted) || 0)

        const subjectAbsences = absences.filter(a => a.subjectId === subjectId).length
        const totalAbsent = subjectAbsences * slotWeight

        let attended = Math.max(0, conducted - totalAbsent)
        // Adjust for any manual attended baseline
        if (s.conducted && s.attended) {
            const manualMissed = s.conducted - s.attended
            attended -= Math.max(0, manualMissed)
        }

        const currentPct = conducted === 0 ? 100 : Math.round((attended / conducted) * 100)
        const finalConducted = conducted + futureClasses
        const finalAttended = attended + futureClasses
        const projectedPct = finalConducted === 0 ? 100 : Math.round((finalAttended / finalConducted) * 100)

        return {
            currentPct, projectedPct, futureClasses, futureDays: futureClasses / slotWeight,
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
