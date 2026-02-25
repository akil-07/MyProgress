import React, { useState } from 'react'
import useAcademicStore from '../store/academicStore.js'

const PRIORITY_META = {
    high: { label: '🔴 High', color: '#ef4444', bg: '#fef2f2' },
    medium: { label: '🟡 Medium', color: '#f59e0b', bg: '#fffbeb' },
    low: { label: '🟢 Low', color: '#22c55e', bg: '#f0fdf4' },
}
const STATUS_META = {
    pending: { label: 'Pending', color: '#7c5cfc', icon: '⏳' },
    submitted: { label: 'Submitted', color: '#22c55e', icon: '✅' },
    late: { label: 'Late', color: '#ef4444', icon: '🚨' },
}

function daysLeft(dueDate) {
    if (!dueDate) return null
    const diff = Math.ceil((new Date(dueDate) - new Date()) / 86400000)
    return diff
}

function formatDate(d) {
    if (!d) return '—'
    return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

/* ── Add Assignment Form ─────────────────────────────── */
function AddForm({ subjects, onAdd, onClose }) {
    const [form, setForm] = useState({ title: '', subject: '', dueDate: '', priority: 'medium', notes: '' })
    const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

    const submit = (e) => {
        e.preventDefault()
        if (!form.title.trim()) return
        onAdd(form)
        onClose()
    }

    const inputStyle = {
        width: '100%', padding: '10px 14px', borderRadius: 9,
        border: '1.5px solid var(--border)', background: 'var(--bg-secondary)',
        color: 'var(--text-primary)', fontSize: 14, outline: 'none',
        fontFamily: 'var(--font)', boxSizing: 'border-box',
    }

    return (
        <form onSubmit={submit} style={{
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: 16, padding: '22px 24px', marginBottom: 24,
            boxShadow: 'var(--shadow-md)',
        }}>
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 16, color: 'var(--text-primary)' }}>
                📋 New Assignment
            </div>
            <div className="form-grid-2" style={{ marginBottom: 12 }}>
                <div style={{ gridColumn: '1/-1' }}>
                    <input value={form.title} onChange={e => set('title', e.target.value)}
                        placeholder="Assignment title…" autoFocus style={inputStyle} />
                </div>
                <input value={form.subject} onChange={e => set('subject', e.target.value)}
                    placeholder="Subject / Course" style={inputStyle} />
                <input type="date" value={form.dueDate} onChange={e => set('dueDate', e.target.value)}
                    style={inputStyle} />
                <select value={form.priority} onChange={e => set('priority', e.target.value)} style={inputStyle}>
                    <option value="high">🔴 High Priority</option>
                    <option value="medium">🟡 Medium Priority</option>
                    <option value="low">🟢 Low Priority</option>
                </select>
                <textarea value={form.notes} onChange={e => set('notes', e.target.value)}
                    placeholder="Notes (optional)…" rows={2}
                    style={{ ...inputStyle, resize: 'none', fontFamily: 'var(--font)' }} />
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
                <button type="submit" style={{ padding: '9px 24px', borderRadius: 9, background: 'var(--accent)', color: '#fff', fontWeight: 600, fontSize: 14, border: 'none', cursor: 'pointer', fontFamily: 'var(--font)' }}>
                    Add Assignment
                </button>
                <button type="button" onClick={onClose} style={{ padding: '9px 16px', borderRadius: 9, background: 'var(--bg-active)', color: 'var(--text-secondary)', fontSize: 14, border: 'none', cursor: 'pointer', fontFamily: 'var(--font)' }}>
                    Cancel
                </button>
            </div>
        </form>
    )
}

/* ── Assignment Card ─────────────────────────────────── */
function AssignmentCard({ a, onUpdate, onDelete }) {
    const days = daysLeft(a.dueDate)
    const priority = PRIORITY_META[a.priority] || PRIORITY_META.medium
    const status = STATUS_META[a.status] || STATUS_META.pending
    const overdue = days !== null && days < 0 && a.status === 'pending'

    const urgencyColor = overdue ? '#ef4444' :
        days === 0 ? '#f59e0b' :
            days !== null && days <= 3 ? '#f97316' : 'var(--text-muted)'

    return (
        <div style={{
            background: 'var(--bg-card)',
            border: `1px solid ${overdue ? '#ef444433' : 'var(--border)'}`,
            borderLeft: `4px solid ${priority.color}`,
            borderRadius: 14, padding: '18px 20px', marginBottom: 10,
            opacity: a.status === 'submitted' ? 0.65 : 1,
            transition: 'all 0.2s',
        }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                {/* Status toggle */}
                <button
                    onClick={() => onUpdate(a.id, { status: a.status === 'submitted' ? 'pending' : 'submitted' })}
                    style={{
                        width: 24, height: 24, borderRadius: 6, flexShrink: 0, marginTop: 2,
                        border: `2px solid ${a.status === 'submitted' ? '#22c55e' : 'var(--border)'}`,
                        background: a.status === 'submitted' ? '#22c55e' : 'transparent',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', transition: 'all 0.15s',
                    }}
                >
                    {a.status === 'submitted' && (
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                            <path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                    )}
                </button>

                <div style={{ flex: 1, minWidth: 0 }}>
                    {/* Title + badges */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                        <span style={{
                            fontSize: 15, fontWeight: 600, color: 'var(--text-primary)',
                            textDecoration: a.status === 'submitted' ? 'line-through' : 'none',
                            color: a.status === 'submitted' ? 'var(--text-muted)' : 'var(--text-primary)',
                        }}>{a.title}</span>

                        <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 99, background: priority.bg, color: priority.color, fontWeight: 600 }}>
                            {priority.label}
                        </span>
                        <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 99, background: 'var(--accent-light)', color: 'var(--accent)', fontWeight: 600 }}>
                            {status.icon} {status.label}
                        </span>
                    </div>

                    {/* Subject + due date */}
                    <div style={{ display: 'flex', gap: 16, fontSize: 13, color: 'var(--text-secondary)', flexWrap: 'wrap' }}>
                        {a.subject && <span>📚 {a.subject}</span>}
                        {a.dueDate && (
                            <span style={{ color: urgencyColor, fontWeight: days !== null && days <= 3 ? 600 : 400 }}>
                                📅 Due: {formatDate(a.dueDate)}
                                {days !== null && a.status !== 'submitted' && (
                                    <span style={{ marginLeft: 6, fontWeight: 700 }}>
                                        ({overdue ? `${Math.abs(days)}d overdue` : days === 0 ? 'Due TODAY' : `${days}d left`})
                                    </span>
                                )}
                            </span>
                        )}
                    </div>

                    {a.notes && (
                        <div style={{ marginTop: 6, fontSize: 12.5, color: 'var(--text-muted)', fontStyle: 'italic' }}>
                            {a.notes}
                        </div>
                    )}
                </div>

                {/* Mark late + delete */}
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                    {a.status === 'pending' && overdue && (
                        <button onClick={() => onUpdate(a.id, { status: 'late' })} style={{
                            fontSize: 11, padding: '4px 10px', borderRadius: 7,
                            border: '1px solid #ef4444', color: '#ef4444', background: 'transparent',
                            cursor: 'pointer', fontFamily: 'var(--font)',
                        }}>Mark Late</button>
                    )}
                    <button onClick={() => onDelete(a.id)} style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: 'var(--text-muted)', fontSize: 15, padding: 4,
                    }}>✕</button>
                </div>
            </div>
        </div>
    )
}

/* ── Page ─────────────────────────────────────────────── */
export default function Assignments() {
    const { assignments, addAssignment, updateAssignment, deleteAssignment, subjects } = useAcademicStore()
    const [showForm, setShowForm] = useState(false)
    const [filter, setFilter] = useState('all')  // all | pending | submitted | late
    const [sortBy, setSortBy] = useState('dueDate') // dueDate | priority | created

    const filtered = assignments
        .filter(a => filter === 'all' || a.status === filter)
        .sort((a, b) => {
            if (sortBy === 'dueDate') {
                if (!a.dueDate) return 1; if (!b.dueDate) return -1
                return new Date(a.dueDate) - new Date(b.dueDate)
            }
            if (sortBy === 'priority') {
                const order = { high: 0, medium: 1, low: 2 }
                return order[a.priority] - order[b.priority]
            }
            return new Date(b.createdAt) - new Date(a.createdAt)
        })

    const pending = assignments.filter(a => a.status === 'pending').length
    const submitted = assignments.filter(a => a.status === 'submitted').length
    const overdue = assignments.filter(a => a.status === 'pending' && daysLeft(a.dueDate) < 0).length
    const dueThisWeek = assignments.filter(a => {
        const d = daysLeft(a.dueDate)
        return a.status === 'pending' && d !== null && d >= 0 && d <= 7
    }).length

    return (
        <div className="page-container" style={{ maxWidth: 760 }}>
            <div style={{ marginBottom: 24 }}>
                <h1 style={{ fontSize: 34, fontWeight: 800, letterSpacing: -0.5, margin: 0, color: 'var(--text-primary)' }}>
                    📋 Assignments
                </h1>
                <p style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 6 }}>
                    Track deadlines. Never miss a submission.
                </p>
            </div>

            {/* Stats */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
                {[
                    { label: 'Pending', val: pending, color: '#7c5cfc', icon: '⏳' },
                    { label: 'Submitted', val: submitted, color: '#22c55e', icon: '✅' },
                    { label: 'Overdue', val: overdue, color: '#ef4444', icon: '🚨' },
                    { label: 'This Week', val: dueThisWeek, color: '#f59e0b', icon: '📅' },
                ].map(({ label, val, color, icon }) => (
                    <div key={label} style={{
                        flex: '1 1 120px', background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                        borderRadius: 12, padding: '14px', textAlign: 'center',
                    }}>
                        <div style={{ fontSize: 20 }}>{icon}</div>
                        <div style={{ fontSize: 24, fontWeight: 800, color, lineHeight: 1.2 }}>{val}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>{label}</div>
                    </div>
                ))}
            </div>

            {/* Add button */}
            {!showForm && (
                <button onClick={() => setShowForm(true)} style={{
                    width: '100%', padding: '13px', borderRadius: 12, marginBottom: 20,
                    border: '2px dashed var(--border)', background: 'transparent',
                    color: 'var(--text-muted)', fontSize: 14, cursor: 'pointer',
                    fontFamily: 'var(--font)', transition: 'all 0.15s',
                }}
                    onMouseEnter={e => e.target.style.borderColor = 'var(--accent)'}
                    onMouseLeave={e => e.target.style.borderColor = 'var(--border)'}
                >+ New Assignment</button>
            )}
            {showForm && <AddForm subjects={subjects} onAdd={addAssignment} onClose={() => setShowForm(false)} />}

            {/* Filters + sort */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
                {['all', 'pending', 'submitted', 'late'].map(f => (
                    <button key={f} onClick={() => setFilter(f)} style={{
                        padding: '5px 14px', borderRadius: 99, fontSize: 13, fontWeight: 500,
                        border: '1.5px solid', fontFamily: 'var(--font)', cursor: 'pointer',
                        borderColor: filter === f ? 'var(--accent)' : 'var(--border)',
                        background: filter === f ? 'var(--accent-light)' : 'transparent',
                        color: filter === f ? 'var(--accent)' : 'var(--text-secondary)',
                    }}>{f.charAt(0).toUpperCase() + f.slice(1)}</button>
                ))}
                <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Sort:</span>
                    <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{
                        padding: '5px 10px', borderRadius: 8, border: '1px solid var(--border)',
                        background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: 12,
                        outline: 'none', cursor: 'pointer', fontFamily: 'var(--font)',
                    }}>
                        <option value="dueDate">Due Date</option>
                        <option value="priority">Priority</option>
                        <option value="created">Newest</option>
                    </select>
                </div>
            </div>

            {/* List */}
            {filtered.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
                    <div style={{ fontSize: 50, marginBottom: 12 }}>📭</div>
                    <div style={{ fontSize: 16, fontWeight: 600 }}>No assignments here</div>
                    <div style={{ fontSize: 14, marginTop: 4 }}>
                        {assignments.length === 0 ? 'Add your first assignment above.' : 'Try a different filter.'}
                    </div>
                </div>
            ) : filtered.map(a => (
                <AssignmentCard key={a.id} a={a} onUpdate={updateAssignment} onDelete={deleteAssignment} />
            ))}
        </div>
    )
}
