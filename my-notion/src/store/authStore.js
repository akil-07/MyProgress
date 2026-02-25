import { create } from 'zustand'
import { auth, googleProvider } from '../services/firebase.js'
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth'

const useAuthStore = create((set) => ({
    user: null,
    loading: true,

    initAuth: () => {
        if (!auth) {
            set({ loading: false }) // Firebase not configured
            return
        }

        const unsubscribe = onAuthStateChanged(auth, (user) => {
            set({ user, loading: false })
        })
        return unsubscribe
    },

    signInWithGoogle: async () => {
        if (!auth || !googleProvider) {
            alert('Firebase is not configured! Check your .env setup.')
            return
        }
        try {
            await signInWithPopup(auth, googleProvider)
        } catch (error) {
            console.error('Login error:', error)
            alert('Failed to sign in: ' + error.message)
        }
    },

    logout: async () => {
        if (!auth) return
        try {
            await signOut(auth)
        } catch (error) {
            console.error('Logout error:', error)
        }
    }
}))

export default useAuthStore
