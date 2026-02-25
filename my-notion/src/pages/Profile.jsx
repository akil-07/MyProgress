import React from 'react'
import useAuthStore from '../store/authStore.js'
import usePageStore from '../store/pageStore.js'
import useTaskStore from '../store/taskStore.js'

export default function Profile() {
    const { user } = useAuthStore()
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
                    <div style={{ color: 'var(--text-secondary)', fontSize: 15 }}>
                        {user.email}
                    </div>
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
