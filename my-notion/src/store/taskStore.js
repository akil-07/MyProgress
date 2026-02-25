import { create } from 'zustand'

const TASKS_KEY = 'mynotion_tasks'
const STREAK_KEY = 'mynotion_streak'

function makeId() {
    return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

function todayStr() {
    return new Date().toISOString().slice(0, 10) // "YYYY-MM-DD"
}

function yesterdayStr() {
    const d = new Date()
    d.setDate(d.getDate() - 1)
    return d.toISOString().slice(0, 10)
}

function loadTasks() {
    try { return JSON.parse(localStorage.getItem(TASKS_KEY)) || [] } catch { return [] }
}

function loadStreak() {
    try {
        return JSON.parse(localStorage.getItem(STREAK_KEY)) || {
            current: 0,
            longest: 0,
            lastActiveDate: null,   // last date a task was completed
            completedDates: [],      // array of date strings when ≥1 task was done
        }
    } catch {
        return { current: 0, longest: 0, lastActiveDate: null, completedDates: [] }
    }
}

function saveStreak(s) {
    localStorage.setItem(STREAK_KEY, JSON.stringify(s))
}
function saveTasks(t) {
    localStorage.setItem(TASKS_KEY, JSON.stringify(t))
}

/* ── Recalculate streak from completedDates ────────────── */
function recalcStreak(completedDates) {
    const sorted = [...new Set(completedDates)].sort()
    if (sorted.length === 0) return { current: 0, longest: 0 }

    let current = 0
    let longest = 0
    let streak = 1

    for (let i = 1; i < sorted.length; i++) {
        const prev = new Date(sorted[i - 1])
        const curr = new Date(sorted[i])
        const diff = (curr - prev) / (1000 * 60 * 60 * 24)
        if (diff === 1) {
            streak++
        } else {
            longest = Math.max(longest, streak)
            streak = 1
        }
    }
    longest = Math.max(longest, streak)

    // current streak: does it reach today or yesterday?
    const last = sorted[sorted.length - 1]
    const today = todayStr()
    const yesterday = yesterdayStr()
    current = (last === today || last === yesterday) ? streak : 0

    return { current, longest }
}

const useTaskStore = create((set, get) => ({
    tasks: loadTasks(),
    streak: loadStreak(),

    /* ── Add task ───────────────────────────── */
    addTask: (title, category = 'General') => {
        const newTask = {
            id: makeId(),
            title: title.trim(),
            category,
            completed: false,
            createdAt: new Date().toISOString(),
            completedAt: null,
        }
        const tasks = [newTask, ...get().tasks]
        saveTasks(tasks)
        set({ tasks })
    },

    /* ── Toggle complete ────────────────────── */
    toggleTask: (id) => {
        const tasks = get().tasks.map(t => {
            if (t.id !== id) return t
            const completing = !t.completed
            return {
                ...t,
                completed: completing,
                completedAt: completing ? new Date().toISOString() : null,
            }
        })
        saveTasks(tasks)

        // Update streak
        const doneDates = tasks
            .filter(t => t.completed && t.completedAt)
            .map(t => t.completedAt.slice(0, 10))

        const streakData = get().streak
        const { current, longest } = recalcStreak(doneDates)

        // add today to completedDates if any task done today
        const completedToday = tasks.some(
            t => t.completed && t.completedAt && t.completedAt.slice(0, 10) === todayStr()
        )
        let completedDates = [...(streakData.completedDates || [])]
        if (completedToday && !completedDates.includes(todayStr())) {
            completedDates.push(todayStr())
        } else if (!completedToday) {
            completedDates = completedDates.filter(d => d !== todayStr())
        }

        const newStreak = {
            ...streakData,
            current,
            longest: Math.max(longest, streakData.longest),
            lastActiveDate: completedToday ? todayStr() : streakData.lastActiveDate,
            completedDates,
        }
        saveStreak(newStreak)
        set({ tasks, streak: newStreak })
    },

    /* ── Delete task ────────────────────────── */
    deleteTask: (id) => {
        const tasks = get().tasks.filter(t => t.id !== id)
        saveTasks(tasks)
        set({ tasks })
    },

    /* ── Edit task title ────────────────────── */
    editTask: (id, title) => {
        const tasks = get().tasks.map(t => t.id === id ? { ...t, title } : t)
        saveTasks(tasks)
        set({ tasks })
    },

    /* ── Clear completed ────────────────────── */
    clearCompleted: () => {
        const tasks = get().tasks.filter(t => !t.completed)
        saveTasks(tasks)
        set({ tasks })
    },
}))

export default useTaskStore
