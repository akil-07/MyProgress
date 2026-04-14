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
    timetableRooms: LS('mynotion_timetableRooms').load() || {
        1: [null, null, null, null, null],
        2: [null, null, null, null, null],
        3: [null, null, null, null, null],
        4: [null, null, null, null, null],
        5: [null, null, null, null, null],
        6: [null, null, null, null, null]
    },
    updateTimetableSlot: (day, slot, subjectId) => {
        const newTimetable = { ...get().timetable }
        const daySlots = [...newTimetable[day]]
        daySlots[slot] = subjectId
        newTimetable[day] = daySlots
        LS('mynotion_timetable').save(newTimetable)
        set({ timetable: newTimetable })
    },
    updateTimetableRoom: (day, slot, room) => {
        const newRooms = { ...get().timetableRooms }
        for (let i=1; i<=6; i++) { if (!newRooms[i]) newRooms[i] = [null,null,null,null,null]; }
        const daySlots = [...newRooms[day]]
        daySlots[slot] = room
        newRooms[day] = daySlots
        LS('mynotion_timetableRooms').save(newRooms)
        set({ timetableRooms: newRooms })
    },

    bulkImportTimetable: (importedTimetable) => {
        const idFn = () => Math.random().toString(36).slice(2) + Date.now().toString(36);
        const daysMap = { 'MON': 1, 'TUE': 2, 'WED': 3, 'THU': 4, 'FRI': 5, 'SAT': 6 };
        
        const newTimetable = {
            1: [null, null, 'lunch', null, null],
            2: [null, null, 'lunch', null, null],
            3: [null, null, 'lunch', null, null],
            4: [null, null, 'lunch', null, null],
            5: [null, null, 'lunch', null, null],
            6: [null, null, 'lunch', null, null]
        };
        const newRooms = {};
        for (let i=1; i<=6; i++) newRooms[i] = [null, null, null, null, null];
        
        let updatedSubjects = [...get().subjects];
        const colors = ['#7c5cfc', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ef4444'];
        
        importedTimetable.forEach((item, index) => {
            const { subject, section } = item;
            
            let existingSub = updatedSubjects.find(s => 
                (s.code && s.code === subject.code) || 
                s.name.includes(subject.code) || 
                s.name.toLowerCase() === subject.name.toLowerCase()
            );
            
            if (!existingSub) {
                existingSub = {
                    id: idFn(),
                    name: `${subject.code} - ${subject.name}`,
                    code: subject.code,
                    color: colors[index % colors.length],
                    target: 80,
                    conducted: 0, attended: 0,
                    timetable: [1, 2, 3, 4, 5],
                    excludedDates: []
                };
                updatedSubjects.push(existingSub);
            }
            
            section.slots.forEach(slot => {
                const dayId = daysMap[slot.day];
                if (!dayId) return;
                
                let slotId = null;
                if (slot.time.includes('08:00') || slot.time.includes('09:00')) slotId = 0;
                else if (slot.time.includes('10:00') || slot.time.includes('11:00')) slotId = 1;
                else if (slot.time.includes('13:00') || slot.time.includes('14:00')) slotId = 3;
                else if (slot.time.includes('15:00') || slot.time.includes('16:00')) slotId = 4;
                
                if (slotId !== null) {
                    newTimetable[dayId][slotId] = existingSub.id;
                    if (slot.room && slot.room !== 'TBD') {
                        newRooms[dayId][slotId] = slot.room;
                    }
                }
            });
        });
        
        subjectLS.save(updatedSubjects);
        LS('mynotion_timetable').save(newTimetable);
        LS('mynotion_timetableRooms').save(newRooms);
        
        set({
            subjects: updatedSubjects,
            timetable: newTimetable,
            timetableRooms: newRooms
        });
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

    // ════════════ CONFIG ════════════
    hoursPerClass: LS('mynotion_hpc').load() || 2,
    setHoursPerClass: (h) => {
        LS('mynotion_hpc').save(h)
        set({ hoursPerClass: h })
    },

    getSubjectStats: (subjectId) => {
        const s = get().subjects.find(s => s.id === subjectId)
        if (!s) return null

        const sem = get().semester
        const timetable = get().timetable
        const absences = get().absences
        const hpc = get().hoursPerClass || 1

        // Calculate counts
        let conducted = (Number(s.conducted) || 0) / hpc
        let attended = (Number(s.attended) || 0) / hpc
        let futureClasses = 0

        const today = new Date(); today.setHours(0, 0, 0, 0)
        let end = sem.endDate ? new Date(sem.endDate) : new Date(today)
        end.setHours(0, 0, 0, 0)

        // Count future classes precisely from the calendar
        let curr = new Date(today); curr.setDate(curr.getDate() + 1)
        const globalHolidays = (sem.events || []).filter(e => e.type === 'holiday').map(e => e.date)
        const allExcluded = new Set([...(s.excludedDates || []), ...globalHolidays])

        while (curr <= end) {
            const ds = curr.toISOString().slice(0, 10)
            const dayOfWeek = curr.getDay()
            if (dayOfWeek >= 1 && dayOfWeek <= 6 && !allExcluded.has(ds)) {
                const slots = timetable[dayOfWeek] || []
                slots.forEach(subId => { if (subId === subjectId) futureClasses++ })
            }
            curr.setDate(curr.getDate() + 1)
        }

        // If no manual input, calculate past from timetable
        if (conducted === 0) {
            let pcurr = sem.startDate ? new Date(sem.startDate) : new Date(today)
            pcurr.setHours(0, 0, 0, 0)
            while (pcurr <= today) {
                const ds = pcurr.toISOString().slice(0, 10)
                const dayOfWeek = pcurr.getDay()
                if (dayOfWeek >= 1 && dayOfWeek <= 6 && !allExcluded.has(ds)) {
                    const slots = timetable[dayOfWeek] || []
                    slots.forEach(subId => { if (subId === subjectId) conducted++ })
                }
                pcurr.setDate(pcurr.getDate() + 1)
            }
            const absCount = absences.filter(a => a.subjectId === subjectId && new Date(a.date) <= today).length
            attended = Math.max(0, conducted - absCount)
        }

        const finalConducted = conducted + futureClasses
        const finalAttended = attended + futureClasses // best case attendance
        const currentPct = conducted === 0 ? 100 : Math.round((attended / conducted) * 100)
        const projectedPct = finalConducted === 0 ? 100 : Math.round((finalAttended / finalConducted) * 100)

        // Weekly context for UI reference
        let weeklyClasses = 0
        Object.values(timetable).forEach(daySlots => {
            daySlots.forEach(subId => { if (subId === subjectId) weeklyClasses++ })
        })

        const msLeft = end - today
        const weeksLeft = msLeft <= 0 ? 0 : Math.ceil(msLeft / (7 * 24 * 60 * 60 * 1000))

        return {
            currentPct, projectedPct, futureClasses,
            weeklyClasses, weeksLeft, hpc,
            conducted: +conducted.toFixed(1),
            attended: +attended.toFixed(1),
            finalConducted: +finalConducted.toFixed(1),
            finalAttended: +finalAttended.toFixed(1)
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
