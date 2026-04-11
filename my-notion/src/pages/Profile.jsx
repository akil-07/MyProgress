import React from 'react'
import { useNavigate } from 'react-router-dom'
import useAuthStore from '../store/authStore.js'
import usePageStore from '../store/pageStore.js'
import useTaskStore from '../store/taskStore.js'

export default function Profile() {
    const { user, logout } = useAuthStore()
    const navigate = useNavigate()
    const { pages } = usePageStore()
    const { tasks } = useTaskStore()

    if (!user) {
        return (
            <div className="empty-state">
                <h1 className="empty-state-title">Not logged in</h1>
            </div>
        )
    }

    const completedTasks = tasks.filter(t => t.completed).length
    const totalTasks = tasks.length
    const totalPages = pages.length

    const handleLogout = async () => {
        await logout()
        navigate('/')
    }

    return (
        <div style={{ maxWidth: 860, margin: '0 auto', padding: '48px 96px', width: '100%', overflowY: 'auto' }}>
            <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 32, color: 'var(--text-primary)' }}>Profile</h1>

            <div style={{
                display: 'flex', alignItems: 'center', gap: 24,
                padding: 32, background: 'var(--bg-card)',
                borderRadius: 'var(--radius-xl)', border: '1px solid var(--border)',
                marginBottom: 32,
                boxShadow: 'var(--shadow-sm)'
            }}>
                {user.photoURL ? (
                    <img
                        src={user.photoURL}
                        alt="Avatar"
                        style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover' }}
                    />
                ) : (
                    <div style={{
                        width: 80, height: 80, borderRadius: '50%',
                        background: 'linear-gradient(135deg, var(--accent), #fc5c7d)', color: '#fff',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 32, fontWeight: 700,
                        boxShadow: '0 4px 16px rgba(var(--accent-rgb), 0.3)'
                    }}>
                        {user.displayName?.charAt(0) || 'U'}
                    </div>
                )}
                <div>
                    <h2 style={{ fontSize: 24, fontWeight: 600, margin: '0 0 4px', color: 'var(--text-primary)' }}>
                        {user.displayName || 'User'}
                    </h2>
                    <div style={{ color: 'var(--text-secondary)', fontSize: 15, marginBottom: 12 }}>
                        {user.email}
                    </div>
                    <button 
                        onClick={handleLogout}
                        style={{
                            padding: '6px 16px',
                            background: 'rgba(239, 68, 68, 0.1)',
                            border: '1px solid rgba(239, 68, 68, 0.2)',
                            color: 'var(--danger, #ef4444)',
                            borderRadius: 'var(--radius-md)',
                            cursor: 'pointer',
                            fontSize: 14,
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--danger, #ef4444)'; e.currentTarget.style.color = '#fff'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'; e.currentTarget.style.color = 'var(--danger, #ef4444)'; }}
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
                        Log out
                    </button>
                </div>
            </div>

            <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16, color: 'var(--text-primary)' }}>Your Stats</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
                <div style={{
                    padding: 24, background: 'var(--bg-card)',
                    borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)',
                    boxShadow: 'var(--shadow-sm)'
                }}>
                    <div style={{ fontSize: 13, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 600, marginBottom: 12 }}>Pages Created</div>
                    <div style={{ fontSize: 36, fontWeight: 700, color: 'var(--accent)', lineHeight: 1 }}>{totalPages}</div>
                </div>
                <div style={{
                    padding: 24, background: 'var(--bg-card)',
                    borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)',
                    boxShadow: 'var(--shadow-sm)'
                }}>
                    <div style={{ fontSize: 13, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 600, marginBottom: 12 }}>Tasks Completed</div>
                    <div style={{ fontSize: 36, fontWeight: 700, color: '#22c55e', lineHeight: 1 }}>{completedTasks} <span style={{ fontSize: 20, color: 'var(--text-muted)', fontWeight: 500 }}>/ {totalTasks}</span></div>
                </div>
            </div>
        </div>
    )
}
