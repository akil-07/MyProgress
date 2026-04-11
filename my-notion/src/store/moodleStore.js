import { create } from 'zustand'
import { fetchMoodleSnapshot } from '../services/moodleApi.js'

const TOKEN_KEY = 'mynotion_moodle_token'
const SNAPSHOT_KEY = 'mynotion_moodle_snapshot'

function loadToken() {
    try {
        return localStorage.getItem(TOKEN_KEY) || ''
    } catch {
        return ''
    }
}

function saveToken(token) {
    if (!token) {
        localStorage.removeItem(TOKEN_KEY)
        return
    }

    localStorage.setItem(TOKEN_KEY, token)
}

function loadSnapshot() {
    try {
        return JSON.parse(localStorage.getItem(SNAPSHOT_KEY)) || null
    } catch {
        return null
    }
}

function saveSnapshot(snapshot) {
    if (!snapshot) {
        localStorage.removeItem(SNAPSHOT_KEY)
        return
    }

    localStorage.setItem(SNAPSHOT_KEY, JSON.stringify(snapshot))
}

const useMoodleStore = create((set, get) => ({
    token: loadToken(),
    snapshot: loadSnapshot(),
    loading: false,
    error: '',

    syncMoodle: async (rawToken) => {
        const token = (rawToken ?? get().token).trim()

        if (!token) {
            const nextError = 'Paste your Moodle token to connect.'
            set({ error: nextError })
            throw new Error(nextError)
        }

        set({ loading: true, error: '' })

        try {
            const snapshot = await fetchMoodleSnapshot(token)
            saveToken(token)
            saveSnapshot(snapshot)
            set({
                token,
                snapshot,
                loading: false,
                error: '',
            })
            return snapshot
        } catch (error) {
            set({
                loading: false,
                error: error.message || 'Unable to sync Moodle right now.',
            })
            throw error
        }
    },

    clearError: () => set({ error: '' }),

    disconnect: () => {
        saveToken('')
        saveSnapshot(null)
        set({
            token: '',
            snapshot: null,
            loading: false,
            error: '',
        })
    },
}))

export default useMoodleStore
