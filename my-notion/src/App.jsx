import React, { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { onAuthStateChanged } from 'firebase/auth'
import { auth, isFirebaseConfigured } from './services/firebase.js'
import { loadUserData, setupSync } from './services/storeSync.js'
import Home from './pages/Home.jsx'
import Login from './pages/Login.jsx'
import useAuthStore from './store/authStore.js'

// Apply saved theme immediately
const savedTheme = localStorage.getItem('theme') || 'light'
document.documentElement.setAttribute('data-theme', savedTheme)

export default function App() {
  const [user, setUser]         = useState(null)
  const [loading, setLoading]   = useState(true)
  const [firebaseError, setFirebaseError] = useState(null)

  const doLoadUserData = async (uid) => {
    setFirebaseError(null)
    try {
      await loadUserData(uid)
    } catch (e) {
      const msg = e?.code === 'permission-denied'
        ? 'Firestore permission denied — your security rules may have expired. Go to Firebase Console → Firestore → Rules and update them.'
        : `Failed to load data from Firebase: ${e?.message || e}`
      setFirebaseError(msg)
      console.error('[App] Firebase load error:', e)
    }
  }

  useEffect(() => {
    if (!isFirebaseConfigured) {
      console.warn('[App] Firebase config is missing!')
      setLoading(false)
      return
    }

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser)
      useAuthStore.setState({ user: currentUser, loading: false })
      if (currentUser) {
        await doLoadUserData(currentUser.uid)
      }
      setLoading(false)
    })
    return unsubscribe
  }, [])

  // Start syncing only AFTER initial data has loaded
  useEffect(() => {
    if (user && !loading) {
      const unsync = setupSync(user.uid)
      return unsync
    }
  }, [user, loading])

  if (loading) {
    return <div className="page-loading"><div className="spinner" /></div>
  }

  if (isFirebaseConfigured && !user) {
    return <Login />
  }

  return (
    <>
      {/* ── Firebase error banner ── */}
      {firebaseError && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999,
          background: '#ef4444', color: '#fff',
          padding: '12px 20px', fontSize: 13, fontWeight: 500,
          display: 'flex', alignItems: 'center', gap: 16,
          fontFamily: 'var(--font, system-ui)',
          boxShadow: '0 2px 12px rgba(239,68,68,0.4)'
        }}>
          <span>⚠️ {firebaseError}</span>
          <button
            onClick={() => user && doLoadUserData(user.uid)}
            style={{
              marginLeft: 'auto', background: 'rgba(255,255,255,0.2)',
              border: '1px solid rgba(255,255,255,0.4)', color: '#fff',
              borderRadius: 8, padding: '4px 14px', cursor: 'pointer',
              fontWeight: 600, fontSize: 12, whiteSpace: 'nowrap'
            }}
          >
            🔄 Retry
          </button>
          <button
            onClick={() => setFirebaseError(null)}
            style={{
              background: 'transparent', border: 'none', color: '#fff',
              cursor: 'pointer', fontSize: 18, lineHeight: 1, padding: '0 4px'
            }}
          >×</button>
        </div>
      )}

      <BrowserRouter>
        <Routes>
          <Route path="/*" element={<Home />} />
        </Routes>
      </BrowserRouter>
    </>
  )
}
