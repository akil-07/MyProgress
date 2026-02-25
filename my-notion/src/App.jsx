import React, { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { onAuthStateChanged } from 'firebase/auth'
import { auth, isFirebaseConfigured } from './services/firebase.js'
import { loadUserData, setupSync } from './services/storeSync.js'
import Home from './pages/Home.jsx'
import Login from './pages/Login.jsx'

// Apply saved theme immediately
const savedTheme = localStorage.getItem('theme') || 'light'
document.documentElement.setAttribute('data-theme', savedTheme)

export default function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isFirebaseConfigured) {
      console.warn("Firebase config is missing!")
      setLoading(false)
      return
    }

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser)
      if (currentUser) {
        // Load the data initially from Firestore
        await loadUserData(currentUser.uid)
      }
      setLoading(false)
    })
    return unsubscribe
  }, [])

  // Sync state cleanly after initial load
  useEffect(() => {
    if (user && !loading) {
      const unsync = setupSync(user.uid)
      return unsync
    }
  }, [user, loading])

  if (loading) {
    return <div className="page-loading"><div className="spinner" /></div>
  }

  // If Firebase is configured and user is NOT logged in, show Login page
  if (isFirebaseConfigured && !user) {
    return <Login />
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/*" element={<Home />} />
      </Routes>
    </BrowserRouter>
  )
}
