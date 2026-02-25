import React, { useState, useEffect } from 'react'
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import Sidebar from '../components/Sidebar/Sidebar.jsx'
import Document from './Document.jsx'
import Tasks from './Tasks.jsx'
import Attendance from './Attendance.jsx'
import Assignments from './Assignments.jsx'
import SemesterPlanner from './SemesterPlanner.jsx'
import Profile from './Profile.jsx'
import usePageStore from '../store/pageStore.js'

export default function Home() {
    const { pages, createPage } = usePageStore()
    const navigate = useNavigate()
    const location = useLocation()
    const [sidebarOpen, setSidebarOpen] = useState(false)

    useEffect(() => {
        setSidebarOpen(false)
    }, [location.pathname])

    const handleCreateFirstPage = async () => {
        const id = createPage(null)
        navigate(`/doc/${id}`)
    }

    return (
        <div className={`app-layout ${sidebarOpen ? 'sidebar-open' : ''}`}>
            {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}

            <Sidebar />

            <main className="main-content">
                <div className="mobile-header">
                    <button className="mobile-menu-btn" onClick={() => setSidebarOpen(true)}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" /></svg>
                    </button>
                    <span className="mobile-header-title">My Workspace</span>
                </div>

                <Routes>
                    <Route path="/" element={<EmptyHome onCreatePage={handleCreateFirstPage} pageCount={pages.length} />} />
                    <Route path="/doc/:pageId" element={<Document />} />
                    <Route path="/tasks" element={<Tasks />} />
                    <Route path="/attendance" element={<Attendance />} />
                    <Route path="/assignments" element={<Assignments />} />
                    <Route path="/semester" element={<SemesterPlanner />} />
                    <Route path="/profile" element={<Profile />} />
                </Routes>
            </main>
        </div>
    )
}

function EmptyHome({ onCreatePage, pageCount }) {
    const tips = [
        { key: '/', label: 'Slash commands in editor' },
        { key: '⌘K', label: 'Search all pages' },
        { key: '⌘B', label: 'Bold selected text' },
        { key: '+', label: 'New page in sidebar' },
    ]

    return (
        <div className="empty-state">
            <div className="empty-state-icon">{pageCount === 0 ? '✦' : '👋'}</div>
            <h1 className="empty-state-title">
                {pageCount === 0 ? 'Welcome to MyNotion' : 'Select a page'}
            </h1>
            <p className="empty-state-sub">
                {pageCount === 0
                    ? 'Your personal workspace is ready. Create your first page to get started.'
                    : 'Pick a page from the sidebar, or create a new one.'}
            </p>

            {pageCount === 0 && (
                <button className="btn-primary" onClick={onCreatePage}>
                    ✦ Create First Page
                </button>
            )}

            <div className="empty-tips-grid" style={{
                marginTop: 40, display: 'grid',
                gap: 12, maxWidth: 380, width: '100%',
            }}>
                {tips.map(t => (
                    <div key={t.key} style={{
                        display: 'flex', alignItems: 'center', gap: 12,
                        padding: '12px 16px',
                        background: 'var(--bg-secondary)',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border)',
                    }}>
                        <span style={{
                            background: 'var(--bg-active)',
                            border: '1px solid var(--border)',
                            borderRadius: 6, padding: '2px 8px',
                            fontFamily: 'monospace', fontSize: 13,
                            fontWeight: 600, color: 'var(--accent)', flexShrink: 0,
                        }}>{t.key}</span>
                        <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{t.label}</span>
                    </div>
                ))}
            </div>
        </div>
    )
}
