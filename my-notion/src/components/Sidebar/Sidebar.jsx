import React, { useState, useRef, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { signOut } from 'firebase/auth'
import { auth, isFirebaseConfigured } from '../../services/firebase.js'
import usePageStore from '../../store/pageStore.js'
import useTaskStore from '../../store/taskStore.js'
import SearchModal from '../Search/SearchModal.jsx'

const EMOJIS = ['📄', '📝', '📌', '🗒️', '💡', '🎯', '🚀', '📚', '🗂️', '⭐', '🔥', '💎', '🌟', '🎨', '🏆', '🔖', '🧠', '✨', '🎪', '🌈', '🦋', '🦄', '🔬', '🍀', '🏔️', '🌊', '🎵', '🎮', '🌸', '🏄']

export default function Sidebar() {
    const navigate = useNavigate()
    const { pageId } = useParams()
    const { pages, createPage, deletePage, updatePage, setActivePage } = usePageStore()
    const { tasks } = useTaskStore()
    const pendingTasks = tasks.filter(t => !t.completed).length

    const handleLogout = async () => {
        if (auth && isFirebaseConfigured) {
            await signOut(auth)
            navigate('/')
        }
    }

    const [showSearch, setShowSearch] = useState(false)
    const [contextMenu, setContextMenu] = useState(null)
    const [dark, setDark] = useState(() =>
        document.documentElement.getAttribute('data-theme') === 'dark'
    )

    // ── Theme ───────────────────────────────────────────────
    const toggleTheme = () => {
        const next = dark ? 'light' : 'dark'
        document.documentElement.setAttribute('data-theme', next)
        localStorage.setItem('theme', next)
        setDark(!dark)
    }

    // ── Cmd+K → Search ──────────────────────────────────────
    useEffect(() => {
        const h = (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setShowSearch(true) }
        }
        window.addEventListener('keydown', h)
        return () => window.removeEventListener('keydown', h)
    }, [])

    const handleNewPage = (parentId = null) => {
        const id = createPage(parentId)
        navigate(`/doc/${id}`)
    }

    const rootPages = pages.filter(p => !p.parentId)

    return (
        <>
            {contextMenu && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 799 }}
                    onClick={() => setContextMenu(null)} />
            )}

            <aside className="sidebar">
                {/* Header */}
                <div className="sidebar-header">
                    <div className="sidebar-workspace">
                        <div className="sidebar-workspace-icon">✦</div>
                        <span className="sidebar-workspace-name">My Workspace</span>
                    </div>
                    <button className="sidebar-icon-btn theme-toggle" onClick={toggleTheme} title="Toggle theme">
                        {dark ? '☀️' : '🌙'}
                    </button>
                </div>

                {/* Nav */}
                <nav className="sidebar-nav">
                    <button className="sidebar-nav-item" onClick={() => setShowSearch(true)}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>
                        <span>Search</span>
                        <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text-muted)' }}>⌘K</span>
                    </button>
                    <button className="sidebar-nav-item" onClick={() => navigate('/')}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
                        <span>Home</span>
                    </button>
                    <button className="sidebar-nav-item" onClick={() => navigate('/tasks')}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg>
                        <span>Tasks & Streaks</span>
                        {pendingTasks > 0 && (
                            <span style={{ marginLeft: 'auto', background: 'var(--accent)', color: '#fff', fontSize: 10, fontWeight: 700, borderRadius: 99, padding: '1px 7px', minWidth: 18, textAlign: 'center' }}>{pendingTasks}</span>
                        )}
                    </button>
                </nav>

                {/* Academic Section */}
                <div className="sidebar-section-label">Academic</div>
                <nav className="sidebar-nav">
                    <button className="sidebar-nav-item" onClick={() => navigate('/attendance')}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /><path d="m9 16 2 2 4-4" /></svg>
                        <span>Attendance</span>
                    </button>
                    <button className="sidebar-nav-item" onClick={() => navigate('/assignments')}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>
                        <span>Assignments</span>
                    </button>
                    <button className="sidebar-nav-item" onClick={() => navigate('/semester')}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>
                        <span>Semester Planner</span>
                    </button>
                </nav>

                {/* Pages label */}
                <div className="sidebar-section-label">Pages</div>

                {/* Page tree */}
                <div className="sidebar-pages">
                    {rootPages.length === 0 && (
                        <div style={{ padding: '10px 14px', fontSize: 13, color: 'var(--text-muted)' }}>
                            No pages yet. Click + to begin.
                        </div>
                    )}
                    {rootPages.map(page => (
                        <PageTreeItem
                            key={page.id}
                            page={page}
                            allPages={pages}
                            depth={0}
                            activeId={pageId}
                            onNavigate={(id) => { setActivePage(id); navigate(`/doc/${id}`) }}
                            onNewChild={handleNewPage}
                            onContext={(e, id) => {
                                e.preventDefault(); e.stopPropagation()
                                setContextMenu({ x: e.clientX, y: e.clientY, pageId: id })
                            }}
                            onUpdate={updatePage}
                        />
                    ))}
                </div>

                {/* New Page */}
                <div style={{ padding: '4px 8px', flexShrink: 0 }}>
                    <button className="sidebar-nav-item" style={{ color: 'var(--text-muted)' }}
                        onClick={() => handleNewPage(null)}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" /></svg>
                        <span>New Page</span>
                    </button>
                </div>

                {/* Footer */}
                <div className="sidebar-footer">
                    <div style={{ padding: '8px 12px', fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>✦ synced via Firebase</span>
                        {isFirebaseConfigured && (
                            <span style={{ cursor: 'pointer', textDecoration: 'underline' }} onClick={handleLogout}>Sign Out</span>
                        )}
                    </div>
                </div>
            </aside>

            {/* Context menu */}
            {contextMenu && (
                <ContextMenu
                    x={contextMenu.x} y={contextMenu.y}
                    pageId={contextMenu.pageId} pages={pages}
                    onClose={() => setContextMenu(null)}
                    onNewChild={handleNewPage}
                    onDelete={deletePage}
                    onUpdate={updatePage}
                />
            )}

            {/* Search */}
            {showSearch && (
                <SearchModal
                    pages={pages}
                    onClose={() => setShowSearch(false)}
                    onSelect={(id) => {
                        setActivePage(id); navigate(`/doc/${id}`); setShowSearch(false)
                    }}
                />
            )}
        </>
    )
}

/* ── PageTreeItem ─────────────────────────────────────── */
function PageTreeItem({ page, allPages, depth, activeId, onNavigate, onNewChild, onContext, onUpdate }) {
    const children = allPages.filter(p => p.parentId === page.id)
    const [expanded, setExpanded] = useState(false)
    const [renaming, setRenaming] = useState(false)
    const [title, setTitle] = useState(page.title)
    const inputRef = useRef(null)

    useEffect(() => setTitle(page.title), [page.title])
    useEffect(() => { if (renaming) inputRef.current?.select() }, [renaming])

    const commitRename = () => {
        setRenaming(false)
        const t = title.trim() || 'Untitled'
        onUpdate(page.id, { title: t })
    }

    const isActive = page.id === activeId

    return (
        <div className="page-tree-item">
            <div
                className={`page-tree-row${isActive ? ' active' : ''}`}
                style={{ paddingLeft: `${depth * 16 + 6}px` }}
                onClick={() => onNavigate(page.id)}
                onContextMenu={(e) => onContext(e, page.id)}
            >
                <button
                    className={`page-tree-toggle${expanded ? ' expanded' : ''}`}
                    style={{ visibility: children.length ? 'visible' : 'hidden' }}
                    onClick={(e) => { e.stopPropagation(); setExpanded(x => !x) }}
                >▶</button>

                <span className="page-tree-icon">{page.icon || '📄'}</span>

                {renaming ? (
                    <input
                        ref={inputRef}
                        className="page-tree-title-input"
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        onBlur={commitRename}
                        onKeyDown={e => {
                            if (e.key === 'Enter') inputRef.current?.blur()
                            if (e.key === 'Escape') { setTitle(page.title); setRenaming(false) }
                        }}
                        onClick={e => e.stopPropagation()}
                    />
                ) : (
                    <span className="page-tree-title" onDoubleClick={() => setRenaming(true)}>
                        {page.title || 'Untitled'}
                    </span>
                )}

                <div className="page-tree-actions">
                    <button className="page-tree-action-btn" title="Add sub-page"
                        onClick={(e) => { e.stopPropagation(); onNewChild(page.id); setExpanded(true) }}>+</button>
                    <button className="page-tree-action-btn" title="More"
                        onClick={(e) => { e.stopPropagation(); onContext(e, page.id) }}>···</button>
                </div>
            </div>

            {expanded && children.length > 0 && (
                <div className="page-tree-children">
                    {children.map(child => (
                        <PageTreeItem key={child.id} page={child} allPages={allPages}
                            depth={depth + 1} activeId={activeId} onNavigate={onNavigate}
                            onNewChild={onNewChild} onContext={onContext} onUpdate={onUpdate} />
                    ))}
                </div>
            )}
        </div>
    )
}

/* ── ContextMenu ─────────────────────────────────────── */
function ContextMenu({ x, y, pageId, pages, onClose, onNewChild, onDelete, onUpdate }) {
    const [pickEmoji, setPickEmoji] = useState(false)
    const style = { top: Math.min(y, window.innerHeight - 200), left: Math.min(x, window.innerWidth - 200) }

    return (
        <div className="context-menu" style={style}>
            {pickEmoji ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 2, padding: 6 }}>
                    {EMOJIS.map(e => (
                        <button key={e} className="emoji-option"
                            onClick={async () => { await onUpdate(pageId, { icon: e }); onClose() }}>{e}</button>
                    ))}
                </div>
            ) : (
                <>
                    <button className="context-menu-item" onClick={() => setPickEmoji(true)}>🎨 Change Icon</button>
                    <button className="context-menu-item" onClick={() => { onNewChild(pageId); onClose() }}>➕ Add Sub-page</button>
                    <div className="context-menu-sep" />
                    <button className="context-menu-item danger" onClick={() => { onDelete(pageId); onClose() }}>🗑️ Delete</button>
                </>
            )}
        </div>
    )
}
