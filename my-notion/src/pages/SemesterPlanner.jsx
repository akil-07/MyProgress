import React, { useState } from 'react'
import useAcademicStore from '../store/academicStore.js'

const EVENT_TYPES = {
    exam: { label: 'Exam', color: '#ef4444', icon: '📝' },
    deadline: { label: 'Deadline', color: '#f97316', icon: '⏰' },
    holiday: { label: 'Holiday', color: '#22c55e', icon: '🎉' },
    event: { label: 'Event', color: '#3b82f6', icon: '📌' },
    lab: { label: 'Lab', color: '#8b5cf6', icon: '🔬' },
    other: { label: 'Other', color: '#6b6b6b', icon: '📎' },
}

function formatDate(d) {
    if (!d) return '—'
    return new Date(d + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })
}

function daysLeft(date) {
    if (!date) return null
    return Math.ceil((new Date(date + 'T00:00:00') - new Date().setHours(0, 0, 0, 0)) / 86400000)
}

function weeksInRange(start, end) {
    if (!start || !end) return []
    const s = new Date(start + 'T00:00:00')
    const e = new Date(end + 'T00:00:00')
    const weeks = []
    let cur = new Date(s)
    let weekNo = 1
    while (cur <= e) {
        const weekStart = cur.toISOString().slice(0, 10)
        const weekEnd = new Date(cur)
        weekEnd.setDate(weekEnd.getDate() + 6)
        weeks.push({ weekNo, start: weekStart, end: weekEnd.toISOString().slice(0, 10) })
        cur.setDate(cur.getDate() + 7)
        weekNo++
    }
    return weeks.slice(0, 20) // max 20 weeks
}

/* ── Semester Setup ──────────────────────────────────── */
function SemesterSetup({ semester, onUpdate }) {
    const [editing, setEditing] = useState(!semester.startDate)
    const [form, setForm] = useState({ name: semester.name || '', startDate: semester.startDate || '', endDate: semester.endDate || '' })

    const submit = (e) => {
        e.preventDefault()
        onUpdate(form)
        setEditing(false)
    }

    if (editing) return (
        <form onSubmit={submit} style={{
            background: 'var(--bg-secondary)', border: '1px solid var(--border)',
            borderRadius: 14, padding: '20px 22px', marginBottom: 28,
        }}>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 14, color: 'var(--text-primary)' }}>
                ⚙️ Semester Setup
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 14 }}>
                {[
                    { label: 'Semester Name', key: 'name', type: 'text', placeholder: 'e.g. Semester 4' },
                    { label: 'Start Date', key: 'startDate', type: 'date' },
                    { label: 'End Date', key: 'endDate', type: 'date' },
                ].map(({ label, key, type, placeholder }) => (
                    <div key={key}>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 5, fontWeight: 500 }}>{label}</div>
                        <input type={type} value={form[key]}
                            onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                            placeholder={placeholder}
                            style={{
                                width: '100%', padding: '9px 12px', borderRadius: 9,
                                border: '1.5px solid var(--border)', background: 'var(--bg-card)',
                                color: 'var(--text-primary)', fontSize: 13, outline: 'none',
                                fontFamily: 'var(--font)', boxSizing: 'border-box',
                            }}
                        />
                    </div>
                ))}
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
                <button type="submit" style={{ padding: '8px 22px', borderRadius: 9, background: 'var(--accent)', color: '#fff', fontWeight: 600, fontSize: 13, border: 'none', cursor: 'pointer', fontFamily: 'var(--font)' }}>
                    Save
                </button>
                {semester.startDate && (
                    <button type="button" onClick={() => setEditing(false)} style={{ padding: '8px 16px', borderRadius: 9, background: 'var(--bg-active)', color: 'var(--text-secondary)', fontSize: 13, border: 'none', cursor: 'pointer', fontFamily: 'var(--font)' }}>
                        Cancel
                    </button>
                )}
            </div>
        </form>
    )

    const totalDays = semester.startDate && semester.endDate
        ? Math.ceil((new Date(semester.endDate) - new Date(semester.startDate)) / 86400000)
        : 0
    const daysPassed = semester.startDate
        ? Math.max(0, Math.min(totalDays, Math.ceil((new Date() - new Date(semester.startDate)) / 86400000)))
        : 0
    const progress = totalDays > 0 ? Math.round((daysPassed / totalDays) * 100) : 0

    return (
        <div style={{
            background: 'linear-gradient(135deg, var(--accent), #9580ff)',
            borderRadius: 16, padding: '22px 26px', marginBottom: 28, color: '#fff',
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <div style={{ fontSize: 13, opacity: 0.8, fontWeight: 500 }}>Current Semester</div>
                    <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: -0.5, marginTop: 2 }}>{semester.name}</div>
                    <div style={{ fontSize: 13, opacity: 0.75, marginTop: 4 }}>
                        {formatDate(semester.startDate)} → {formatDate(semester.endDate)}
                    </div>
                </div>
                <button onClick={() => setEditing(true)} style={{
                    background: 'rgba(255,255,255,0.18)', border: '1px solid rgba(255,255,255,0.3)',
                    color: '#fff', borderRadius: 9, padding: '7px 14px', fontSize: 13,
                    cursor: 'pointer', fontFamily: 'var(--font)',
                }}>Edit</button>
            </div>
            {totalDays > 0 && (
                <div style={{ marginTop: 18 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, opacity: 0.8, marginBottom: 6 }}>
                        <span>Progress</span>
                        <span>{daysPassed} / {totalDays} days ({progress}%)</span>
                    </div>
                    <div style={{ height: 8, borderRadius: 99, background: 'rgba(255,255,255,0.25)' }}>
                        <div style={{ height: '100%', borderRadius: 99, background: '#fff', width: `${progress}%`, transition: 'width 0.5s' }} />
                    </div>
                </div>
            )}
        </div>
    )
}

/* ── Add Event Modal ─────────────────────────────────── */
function AddEventForm({ onAdd, onClose }) {
    const [form, setForm] = useState({ title: '', type: 'exam', date: '', description: '' })
    const s = (k, v) => setForm(f => ({ ...f, [k]: v }))

    const submit = (e) => {
        e.preventDefault()
        if (!form.title.trim() || !form.date) return
        onAdd(form)
        onClose()
    }

    const inp = {
        padding: '9px 14px', borderRadius: 9, border: '1.5px solid var(--border)',
        background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: 14,
        outline: 'none', fontFamily: 'var(--font)', width: '100%', boxSizing: 'border-box',
    }

    return (
        <form onSubmit={submit} style={{
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: 14, padding: '20px 22px', marginBottom: 20,
            boxShadow: 'var(--shadow-md)',
        }}>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 14 }}>📅 Add Event / Exam</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div style={{ gridColumn: '1/-1' }}>
                    <input value={form.title} onChange={e => s('title', e.target.value)} placeholder="Event title…" autoFocus style={inp} />
                </div>
                <select value={form.type} onChange={e => s('type', e.target.value)} style={inp}>
                    {Object.entries(EVENT_TYPES).map(([k, v]) => (
                        <option key={k} value={k}>{v.icon} {v.label}</option>
                    ))}
                </select>
                <input type="date" value={form.date} onChange={e => s('date', e.target.value)} style={inp} />
                <div style={{ gridColumn: '1/-1' }}>
                    <input value={form.description} onChange={e => s('description', e.target.value)} placeholder="Description (optional)…" style={inp} />
                </div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
                <button type="submit" style={{ padding: '8px 22px', borderRadius: 9, background: 'var(--accent)', color: '#fff', fontWeight: 600, fontSize: 13, border: 'none', cursor: 'pointer', fontFamily: 'var(--font)' }}>Add</button>
                <button type="button" onClick={onClose} style={{ padding: '8px 16px', borderRadius: 9, background: 'var(--bg-active)', color: 'var(--text-secondary)', fontSize: 13, border: 'none', cursor: 'pointer', fontFamily: 'var(--font)' }}>Cancel</button>
            </div>
        </form>
    )
}

/* ── Timeline View ───────────────────────────────────── */
function Timeline({ events, onDelete }) {
    const sorted = [...events].sort((a, b) => new Date(a.date) - new Date(b.date))
    const upcoming = sorted.filter(e => daysLeft(e.date) >= 0)
    const past = sorted.filter(e => daysLeft(e.date) < 0)

    const EventRow = ({ e }) => {
        const t = EVENT_TYPES[e.type] || EVENT_TYPES.other
        const d = daysLeft(e.date)
        const urgent = d !== null && d >= 0 && d <= 7

        return (
            <div style={{
                display: 'flex', gap: 14, alignItems: 'flex-start',
                padding: '12px 16px', borderRadius: 12,
                background: 'var(--bg-card)', border: `1px solid ${urgent ? t.color + '44' : 'var(--border)'}`,
                marginBottom: 8,
            }}>
                <div style={{
                    width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                    background: t.color + '22', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', fontSize: 18,
                }}>{t.icon}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}>{e.title}</span>
                        <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 99, background: t.color + '22', color: t.color, fontWeight: 600 }}>{t.label}</span>
                        {urgent && <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 99, background: '#fef2f2', color: '#ef4444', fontWeight: 700 }}>⚡ {d === 0 ? 'TODAY' : `${d}d left`}</span>}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>
                        {formatDate(e.date)}
                        {d !== null && d >= 0 && !urgent && <span style={{ marginLeft: 8 }}>({d} days away)</span>}
                        {e.description && <span style={{ marginLeft: 8, fontStyle: 'italic' }}>— {e.description}</span>}
                    </div>
                </div>
                <button onClick={() => onDelete(e.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 15, padding: 4 }}>✕</button>
            </div>
        )
    }

    return (
        <div>
            {upcoming.length > 0 && (
                <>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 10 }}>Upcoming</div>
                    {upcoming.map(e => <EventRow key={e.id} e={e} />)}
                </>
            )}
            {past.length > 0 && (
                <details style={{ marginTop: 16 }}>
                    <summary style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 10 }}>Past Events ({past.length})</summary>
                    <div style={{ marginTop: 10, opacity: 0.6 }}>
                        {past.map(e => <EventRow key={e.id} e={e} />)}
                    </div>
                </details>
            )}
        </div>
    )
}

/* ── Weekly Planner ──────────────────────────────────── */
function WeeklyView({ semester, events }) {
    const weeks = weeksInRange(semester.startDate, semester.endDate)
    if (!weeks.length) return null

    const today = new Date().toISOString().slice(0, 10)
    const curWeekIdx = weeks.findIndex(w => today >= w.start && today <= w.end)

    return (
        <div style={{ marginTop: 28 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 14 }}>📆 Week-by-Week</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {weeks.map((w, i) => {
                    const isCurrent = i === curWeekIdx
                    const isPast = today > w.end
                    const weekEvents = events.filter(e => e.date >= w.start && e.date <= w.end)

                    return (
                        <div key={i} style={{
                            display: 'flex', gap: 14, alignItems: 'center',
                            padding: '10px 16px', borderRadius: 10,
                            background: isCurrent ? 'var(--accent-light)' : isPast ? 'transparent' : 'var(--bg-secondary)',
                            border: `1px solid ${isCurrent ? 'var(--accent)' : 'var(--border)'}`,
                            opacity: isPast ? 0.5 : 1,
                        }}>
                            <div style={{
                                fontWeight: isCurrent ? 800 : 600,
                                fontSize: 13,
                                color: isCurrent ? 'var(--accent)' : 'var(--text-muted)',
                                minWidth: 64,
                            }}>
                                Week {w.weekNo}{isCurrent && ' 📍'}
                            </div>
                            <div style={{ fontSize: 12, color: 'var(--text-muted)', minWidth: 180 }}>
                                {formatDate(w.start)} → {formatDate(w.end)}
                            </div>
                            <div style={{ flex: 1, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                {weekEvents.map(e => {
                                    const t = EVENT_TYPES[e.type] || EVENT_TYPES.other
                                    return (
                                        <span key={e.id} style={{
                                            fontSize: 11, padding: '2px 8px', borderRadius: 99,
                                            background: t.color + '22', color: t.color, fontWeight: 600,
                                        }}>{t.icon} {e.title}</span>
                                    )
                                })}
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

/* ── Page ─────────────────────────────────────────────── */
export default function SemesterPlanner() {
    const { semester, updateSemester, addEvent, deleteEvent } = useAcademicStore()
    const [showAdd, setShowAdd] = useState(false)
    const [view, setView] = useState('timeline') // 'timeline' | 'weekly'

    const events = semester.events || []
    const upcoming7 = events.filter(e => { const d = daysLeft(e.date); return d !== null && d >= 0 && d <= 7 })

    return (
        <div style={{ maxWidth: 820, margin: '0 auto', padding: '48px 40px 80px', width: '100%' }}>
            <div style={{ marginBottom: 24 }}>
                <h1 style={{ fontSize: 34, fontWeight: 800, letterSpacing: -0.5, margin: 0, color: 'var(--text-primary)' }}>
                    🗓️ Semester Planner
                </h1>
                <p style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 6 }}>
                    Plan your entire semester — exams, deadlines, holidays and more.
                </p>
            </div>

            <SemesterSetup semester={semester} onUpdate={updateSemester} />

            {/* Upcoming alerts */}
            {upcoming7.length > 0 && (
                <div style={{
                    background: '#fef2f2', border: '1px solid #ef444433',
                    borderRadius: 12, padding: '14px 18px', marginBottom: 20,
                }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: '#ef4444', marginBottom: 8 }}>
                        ⚡ Coming up in 7 days
                    </div>
                    {upcoming7.map(e => {
                        const t = EVENT_TYPES[e.type] || EVENT_TYPES.other
                        const d = daysLeft(e.date)
                        return (
                            <div key={e.id} style={{ fontSize: 13, color: '#dc2626', marginBottom: 4 }}>
                                {t.icon} <b>{e.title}</b> — {d === 0 ? 'TODAY' : `in ${d} day${d !== 1 ? 's' : ''}`} ({formatDate(e.date)})
                            </div>
                        )
                    })}
                </div>
            )}

            {/* Controls */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 16, alignItems: 'center' }}>
                {!showAdd && (
                    <button onClick={() => setShowAdd(true)} style={{
                        padding: '8px 18px', borderRadius: 9, background: 'var(--accent)',
                        color: '#fff', fontWeight: 600, fontSize: 13, border: 'none',
                        cursor: 'pointer', fontFamily: 'var(--font)',
                    }}>+ Add Event / Exam</button>
                )}
                <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
                    {['timeline', 'weekly'].map(v => (
                        <button key={v} onClick={() => setView(v)} style={{
                            padding: '6px 14px', borderRadius: 8, fontSize: 13, fontWeight: 500,
                            border: '1.5px solid', cursor: 'pointer', fontFamily: 'var(--font)',
                            borderColor: view === v ? 'var(--accent)' : 'var(--border)',
                            background: view === v ? 'var(--accent-light)' : 'transparent',
                            color: view === v ? 'var(--accent)' : 'var(--text-secondary)',
                        }}>{v === 'timeline' ? '📋 Timeline' : '📆 Weekly'}</button>
                    ))}
                </div>
            </div>

            {showAdd && <AddEventForm onAdd={addEvent} onClose={() => setShowAdd(false)} />}

            {events.length === 0 && !showAdd ? (
                <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
                    <div style={{ fontSize: 50, marginBottom: 12 }}>🗓️</div>
                    <div style={{ fontSize: 16, fontWeight: 600 }}>No events yet</div>
                    <div style={{ fontSize: 14, marginTop: 4 }}>Add exams, deadlines, and holidays to plan your semester.</div>
                </div>
            ) : view === 'timeline' ? (
                <Timeline events={events} onDelete={deleteEvent} />
            ) : (
                <WeeklyView semester={semester} events={events} />
            )}
        </div>
    )
}
