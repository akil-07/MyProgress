import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useAcademicStore from '../store/academicStore.js'

const COLORS = ['#7c5cfc', '#3b82f6', '#22c55e', '#f59e0b', '#ec4899', '#ef4444', '#14b8a6', '#f97316', '#8b5cf6', '#06b6d4']

const DAYS = [
    { val: 1, label: 'Mon' },
    { val: 2, label: 'Tue' },
    { val: 3, label: 'Wed' },
    { val: 4, label: 'Thu' },
    { val: 5, label: 'Fri' },
    { val: 6, label: 'Sat' },
    { val: 0, label: 'Sun' },
]

function formatDate(ds) {
    if (!ds) return ''
    return new Date(ds).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

/* ── Subject Card (Calculator Model) ──────────────────── */
function SubjectCard({ subject, updateSubject, onRemove, getStats, getBudget, getRecover }) {
    const [newDate, setNewDate] = useState('')
    const stats = getStats(subject.id)
    const budget = getBudget(subject.id)
    const recover = getRecover(subject.id)

    const s = (k, v) => updateSubject(subject.id, { [k]: v })

    const toggleDay = (d) => {
        const list = subject.timetable || []
        if (list.includes(d)) s('timetable', list.filter(x => x !== d))
        else s('timetable', [...list, d])
    }

    const addDate = () => {
        if (!newDate) return
        const list = subject.excludedDates || []
        if (!list.includes(newDate)) s('excludedDates', [...list, newDate])
        setNewDate('')
    }
    const removeDate = (ds) => {
        s('excludedDates', (subject.excludedDates || []).filter(x => x !== ds))
    }

    const isSafe = stats.projectedPct >= subject.target

    const inputStyle = {
        padding: '10px 14px', borderRadius: 8, border: '1.5px solid var(--border)',
        background: 'var(--bg-secondary)', color: 'var(--text-primary)',
        fontSize: 16, outline: 'none', fontFamily: 'var(--font)', width: '100%',
        boxSizing: 'border-box', fontWeight: 600
    }

    return (
        <div style={{
            background: 'var(--bg-card)', border: `1px solid var(--border)`,
            borderTop: `4px solid ${subject.color}`, borderRadius: 14,
            padding: '24px', marginBottom: 20, boxShadow: 'var(--shadow-sm)'
        }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: subject.color + '22', color: subject.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700 }}>
                    {subject.name[0]}
                </div>
                <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 800, fontSize: 18, color: 'var(--text-primary)', letterSpacing: -0.3 }}>{subject.name}</div>
                    <div style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>Target: {subject.target}%</div>
                </div>
                <button onClick={() => onRemove(subject.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 16, padding: 4 }}>✕</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
                {/* Left Column: Inputs */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

                    {/* Current Attendance */}
                    <div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: 0.5, marginBottom: 8, textTransform: 'uppercase' }}>
                            Past Attendance
                        </div>
                        <div className="form-grid-2">
                            <div>
                                <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4, fontWeight: 600 }}>CONDUCTED</div>
                                <input type="number" min="0" value={subject.conducted || ''} onChange={e => s('conducted', Number(e.target.value))} placeholder="e.g. 45" style={inputStyle} />
                            </div>
                            <div>
                                <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4, fontWeight: 600 }}>ATTENDED</div>
                                <input type="number" min="0" max={subject.conducted || Number.MAX_SAFE_INTEGER} value={subject.attended || ''} onChange={e => s('attended', Number(e.target.value))} placeholder="e.g. 35" style={inputStyle} />
                            </div>
                        </div>
                        {stats.conducted > 0 && (
                            <div style={{ fontSize: 13, marginTop: 8, color: 'var(--text-muted)', fontWeight: 500 }}>
                                Current Rate: <b style={{ color: 'var(--text-primary)' }}>{stats.currentPct}%</b>
                            </div>
                        )}
                    </div>

                    {/* Timetable */}
                    <div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: 0.5, marginBottom: 8, textTransform: 'uppercase' }}>
                            Weekly Timetable
                        </div>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                            {DAYS.map(d => {
                                const active = (subject.timetable || []).includes(d.val)
                                return (
                                    <button key={d.val} onClick={() => toggleDay(d.val)} style={{
                                        padding: '8px 12px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                                        cursor: 'pointer', transition: 'all 0.15s', border: '1.5px solid',
                                        borderColor: active ? subject.color : 'var(--border)',
                                        background: active ? subject.color : 'transparent',
                                        color: active ? '#fff' : 'var(--text-secondary)',
                                        fontFamily: 'var(--font)', flex: '1 1 40px', textAlign: 'center'
                                    }}>{d.label}</button>
                                )
                            })}
                        </div>
                    </div>

                    {/* Excluded Dates */}
                    <div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: 0.5, marginBottom: 8, textTransform: 'uppercase' }}>
                            Excluded Dates (Cancellations)
                        </div>
                        <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                            <input type="date" value={newDate} onChange={e => setNewDate(e.target.value)} style={{ ...inputStyle, flex: 1, padding: '8px 12px', fontSize: 14 }} />
                            <button onClick={addDate} style={{
                                padding: '0 16px', borderRadius: 8, background: 'var(--bg-active)',
                                border: '1.5px solid var(--border)', color: 'var(--text-primary)',
                                fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font)'
                            }}>Add</button>
                        </div>
                        {(subject.excludedDates || []).length > 0 && (
                            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                {(subject.excludedDates || []).map(ds => (
                                    <div key={ds} style={{
                                        display: 'flex', alignItems: 'center', gap: 6, padding: '4px 8px 4px 10px',
                                        borderRadius: 99, background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                                        fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)'
                                    }}>
                                        {formatDate(ds)}
                                        <button onClick={() => removeDate(ds)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: 14, display: 'flex', padding: 2 }}>✕</button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column: Calculator Output */}
                <div style={{
                    background: isSafe ? '#22c55e0a' : '#ef44440a',
                    border: `1.5px solid ${isSafe ? '#22c55e33' : '#ef444433'}`,
                    borderRadius: 12, padding: '24px', display: 'flex', flexDirection: 'column'
                }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: isSafe ? '#22c55e' : '#ef4444', letterSpacing: 0.5, marginBottom: 16, textTransform: 'uppercase' }}>
                        Final Projected Status
                    </div>

                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
                        <span style={{ fontSize: 42, fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>
                            {stats.projectedPct}%
                        </span>
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 24, fontWeight: 500 }}>
                        if you attend all {stats.futureDays} remaining days ({stats.futureClasses} cls)
                    </div>

                    <div className="form-grid-2" style={{ marginBottom: 24 }}>
                        <div style={{ background: 'var(--bg-card)', padding: '12px', borderRadius: 10, border: '1px solid var(--border)' }}>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 4 }}>FINAL CONDUCTED</div>
                            <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)' }}>{stats.finalConducted}</div>
                        </div>
                        <div style={{ background: 'var(--bg-card)', padding: '12px', borderRadius: 10, border: '1px solid var(--border)' }}>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 4 }}>FINAL ATTENDED</div>
                            <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)' }}>{stats.finalAttended}</div>
                        </div>
                    </div>

                    <div style={{ marginTop: 'auto' }}>
                        {isSafe ? (
                            <div style={{ background: '#22c55e15', padding: '16px', borderRadius: 10, border: '1px solid #22c55e33' }}>
                                <div style={{ fontSize: 16, fontWeight: 700, color: '#16a34a', marginBottom: 4 }}>✅ Safe Zone</div>
                                <div style={{ fontSize: 14, color: '#15803d', fontWeight: 500 }}>
                                    You can safely skip <b style={{ fontSize: 18 }}>{budget}</b> more class{budget !== 1 ? 'es' : ''} to stay above {subject.target}%.
                                </div>
                            </div>
                        ) : (
                            <div style={{ background: '#ef444415', padding: '16px', borderRadius: 10, border: '1px solid #ef444433' }}>
                                <div style={{ fontSize: 16, fontWeight: 700, color: '#dc2626', marginBottom: 4 }}>⚠️ Danger Zone</div>
                                {recover === Infinity ? (
                                    <div style={{ fontSize: 14, color: '#b91c1c', fontWeight: 500 }}>
                                        Impossible to recover to {subject.target}% purely within normal schedule.
                                    </div>
                                ) : recover > 0 ? (
                                    <div style={{ fontSize: 14, color: '#b91c1c', fontWeight: 500 }}>
                                        You need <b style={{ fontSize: 18 }}>{recover}</b> extra classes beyond schedule to recover.
                                    </div>
                                ) : (
                                    <div style={{ fontSize: 14, color: '#b91c1c', fontWeight: 500 }}>
                                        You must attend every remaining class.
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

/* ── Add Subject Form ─────────────────────────────────── */
function AddSubjectForm({ onAdd }) {
    const [name, setName] = useState('')
    const [color, setColor] = useState(COLORS[0])
    const [target, setTarget] = useState(80)
    const [open, setOpen] = useState(false)

    const submit = (e) => {
        e.preventDefault()
        if (!name.trim()) return
        onAdd(name.trim(), color, target)
        setName(''); setOpen(false)
    }

    if (!open) return (
        <button onClick={() => setOpen(true)} style={{
            width: '100%', padding: '14px', borderRadius: 12,
            border: '2px dashed var(--border)', background: 'transparent',
            color: 'var(--text-muted)', fontSize: 15, cursor: 'pointer',
            fontFamily: 'var(--font)', transition: 'all 0.15s', marginBottom: 28, fontWeight: 600
        }}
            onMouseEnter={e => e.target.style.borderColor = 'var(--accent)'}
            onMouseLeave={e => e.target.style.borderColor = 'var(--border)'}
        >+ Track New Subject</button>
    )

    return (
        <form onSubmit={submit} style={{
            background: 'var(--bg-secondary)', border: '1px solid var(--border)',
            borderRadius: 14, padding: '22px 24px', marginBottom: 28,
            boxShadow: 'var(--shadow-md)'
        }}>
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 16, color: 'var(--text-primary)' }}>📚 New Subject</div>
            <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                <input value={name} onChange={e => setName(e.target.value)} placeholder="Subject name…"
                    autoFocus
                    style={{ flex: 1, padding: '10px 14px', borderRadius: 9, border: '1.5px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)', fontSize: 14, outline: 'none', fontFamily: 'var(--font)' }} />
                <input type="number" value={target} onChange={e => setTarget(Number(e.target.value))}
                    min="1" max="100" style={{ width: 80, padding: '10px 14px', borderRadius: 9, border: '1.5px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)', fontSize: 14, outline: 'none', fontFamily: 'var(--font)' }}
                    title="Target attendance %" />
                <span style={{ display: 'flex', alignItems: 'center', fontSize: 13, color: 'var(--text-muted)' }}>% target</span>
            </div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
                {COLORS.map(c => (
                    <button key={c} type="button" onClick={() => setColor(c)} style={{
                        width: 28, height: 28, borderRadius: 6, background: c,
                        border: color === c ? '3px solid var(--text-primary)' : '3px solid transparent',
                        cursor: 'pointer', transition: 'all 0.15s'
                    }} />
                ))}
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
                <button type="submit" style={{ padding: '9px 24px', borderRadius: 9, background: 'var(--accent)', color: '#fff', fontWeight: 600, fontSize: 13, border: 'none', cursor: 'pointer', fontFamily: 'var(--font)' }}>Add</button>
                <button type="button" onClick={() => setOpen(false)} style={{ padding: '9px 18px', borderRadius: 9, background: 'var(--bg-active)', color: 'var(--text-secondary)', fontSize: 13, border: 'none', cursor: 'pointer', fontFamily: 'var(--font)' }}>Cancel</button>
            </div>
        </form>
    )
}

/* ── Page ─────────────────────────────────────────────── */
export default function Attendance() {
    const navigate = useNavigate()
    const { subjects, addSubject, updateSubject, removeSubject, getSubjectStats, getBunkBudget, getRecoverClasses, semester } = useAcademicStore()

    return (
        <div className="page-container" style={{ maxWidth: 840 }}>
            {/* Header */}
            <div style={{ marginBottom: 24 }}>
                <h1 style={{ fontSize: 34, fontWeight: 800, letterSpacing: -0.5, margin: 0, color: 'var(--text-primary)' }}>
                    📊 Attendance Calculator
                </h1>
                <p style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 8, lineHeight: 1.5 }}>
                    Predict your final attendance before the semester ends! <br />
                    Calculated based on your weekly timetable and semester dates.
                </p>
            </div>

            {/* Global Semester Info Banner */}
            <div style={{
                background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 12,
                padding: '16px 20px', marginBottom: 28, display: 'flex', alignItems: 'center', justifyContent: 'space-between'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ fontSize: 24 }}>🗓️</div>
                    <div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Semester Dates</div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginTop: 2 }}>
                            {semester.startDate ? formatDate(semester.startDate) : 'Not Set'} → {semester.endDate ? formatDate(semester.endDate) : 'Not Set'}
                        </div>
                    </div>
                </div>
                <button onClick={() => navigate('/semester')} style={{
                    padding: '8px 16px', borderRadius: 8, background: 'var(--bg-active)', color: 'var(--text-primary)',
                    fontSize: 13, fontWeight: 600, border: '1px solid var(--border)', cursor: 'pointer', fontFamily: 'var(--font)'
                }}>
                    Edit in Semester Planner
                </button>
            </div>

            {!semester.endDate && (
                <div style={{ background: '#f59e0b15', border: '1px solid #f59e0b33', borderRadius: 10, padding: '12px 16px', color: '#d97706', fontSize: 13, marginBottom: 24, fontWeight: 500 }}>
                    ⚠️ Please set your Semester End Date in the Semester Planner for accurate future calculation!
                </div>
            )}

            <AddSubjectForm onAdd={addSubject} />

            {subjects.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
                    <div style={{ fontSize: 56, marginBottom: 12 }}>🧮</div>
                    <div style={{ fontSize: 18, fontWeight: 600 }}>No subjects configured</div>
                    <div style={{ fontSize: 14, marginTop: 6 }}>Add a subject above to start calculating.</div>
                </div>
            ) : (
                subjects.map(s => (
                    <SubjectCard
                        key={s.id} subject={s}
                        updateSubject={updateSubject}
                        onRemove={removeSubject}
                        getStats={getSubjectStats}
                        getBudget={getBunkBudget}
                        getRecover={getRecoverClasses}
                    />
                ))
            )}
        </div>
    )
}
