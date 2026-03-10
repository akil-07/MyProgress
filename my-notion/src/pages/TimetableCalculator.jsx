import React, { useState, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import useAcademicStore from '../store/academicStore.js'

/* ─── Color palette ─────────────────────────────────────── */
const COLORS = [
    '#7c5cfc', '#3b82f6', '#22c55e', '#f59e0b',
    '#ec4899', '#ef4444', '#14b8a6', '#f97316',
    '#8b5cf6', '#06b6d4',
]

/* ─── Helpers ───────────────────────────────────────────── */
function uid() {
    return Math.random().toString(36).slice(2, 10)
}

function clamp(val, min, max) {
    return Math.max(min, Math.min(max, val))
}

/**
 * Given semester start / end dates (string yyyy-mm-dd or ''), compute:
 *   - totalWeeks    : full length of semester in weeks (rounded)
 *   - currentWeek   : which week we are in right now (1-based)
 *   - weeksLeft     : weeks remaining from today → end (>= 0)
 */
function getSemesterWeeks(startDate, endDate) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    if (!endDate) return { totalWeeks: null, currentWeek: null, weeksLeft: null }

    const end = new Date(endDate)
    end.setHours(0, 0, 0, 0)

    const start = startDate ? new Date(startDate) : today
    start.setHours(0, 0, 0, 0)

    const MS_PER_WEEK = 7 * 24 * 60 * 60 * 1000

    const totalWeeks = Math.max(0, Math.round((end - start) / MS_PER_WEEK))

    // Weeks left from today (inclusive of the current week's remaining days)
    const msLeft = end - today
    const weeksLeft = msLeft <= 0 ? 0 : Math.ceil(msLeft / MS_PER_WEEK)

    // Current week number (1-based from start)
    const msElapsed = today - start
    const currentWeek = msElapsed < 0
        ? 0
        : Math.min(totalWeeks, Math.floor(msElapsed / MS_PER_WEEK) + 1)

    return { totalWeeks, currentWeek, weeksLeft }
}

function formatDate(ds) {
    if (!ds) return '—'
    return new Date(ds).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

/**
 * Core calculation:
 *   classesPerWeek  – how many classes this subject has per week
 *   weeksLeft       – weeks remaining in semester
 *   conducted       – classes already held (past)
 *   attended        – classes student attended (past)
 *   target          – target attendance % (e.g. 75)
 */
function calcStats({ classesPerWeek, weeksLeft, conducted, attended, target }) {
    const futureClasses = Math.round((classesPerWeek || 0) * (weeksLeft || 0))
    const finalConducted = conducted + futureClasses
    const finalAttended = attended + futureClasses          // best case: attend all future
    const projectedPct = finalConducted > 0
        ? Math.round((finalAttended / finalConducted) * 100)
        : 0
    const currentPct = conducted > 0
        ? Math.round((attended / conducted) * 100)
        : 0

    // How many future classes can be skipped to stay ≥ target?
    const budgetRaw = finalAttended - (target / 100) * finalConducted
    const budget = Math.max(0, Math.floor(budgetRaw))

    // Extra classes needed if below target even attending all future
    let recover = 0
    if (projectedPct < target) {
        const t = target / 100
        const deficit = (t * finalConducted) - finalAttended
        const denominator = 1 - t
        if (denominator <= 0) recover = Infinity
        else recover = Math.ceil(deficit / denominator)
    }

    return { futureClasses, finalConducted, finalAttended, projectedPct, currentPct, budget, recover }
}

/* ─── Subject Row ───────────────────────────────────────── */
function SubjectRow({ subject, onChange, onRemove, weeksLeft, colorIdx }) {
    const s = subject
    const stats = calcStats({
        classesPerWeek: s.classesPerWeek || 0,
        weeksLeft: weeksLeft || 0,
        conducted: s.conducted || 0,
        attended: s.attended || 0,
        target: s.target || 75,
    })

    const isSafe = stats.projectedPct >= (s.target || 75)
    const color = COLORS[colorIdx % COLORS.length]

    const inputSt = {
        padding: '8px 12px', borderRadius: 8, border: '1.5px solid var(--border)',
        background: 'var(--bg-secondary)', color: 'var(--text-primary)',
        fontSize: 14, outline: 'none', fontFamily: 'var(--font)', width: '100%',
        boxSizing: 'border-box', fontWeight: 600,
    }

    return (
        <div style={{
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderLeft: `4px solid ${color}`, borderRadius: 14,
            padding: '20px 24px', marginBottom: 16,
            boxShadow: 'var(--shadow-sm)',
        }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>

                {/* Subject Icon + Name */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: '1 1 160px', minWidth: 160 }}>
                    <div style={{
                        width: 36, height: 36, borderRadius: 10,
                        background: color + '22', color, display: 'flex',
                        alignItems: 'center', justifyContent: 'center',
                        fontSize: 18, fontWeight: 800, flexShrink: 0,
                    }}>
                        {(s.name || '?')[0].toUpperCase()}
                    </div>
                    <input
                        value={s.name}
                        onChange={e => onChange({ name: e.target.value })}
                        placeholder="Subject name"
                        style={{
                            ...inputSt, fontWeight: 700, fontSize: 15,
                            background: 'transparent', border: 'none',
                            borderBottom: '2px solid var(--border)', borderRadius: 0, padding: '4px 0',
                        }}
                    />
                </div>

                {/* Classes / week */}
                <div style={{ flex: '0 1 110px', minWidth: 90 }}>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 4 }}>
                        Classes/week
                    </div>
                    <input
                        type="number" min="0" max="50" step="0.5"
                        value={s.classesPerWeek === 0 ? '' : s.classesPerWeek}
                        onChange={e => onChange({ classesPerWeek: parseFloat(e.target.value) || 0 })}
                        placeholder="e.g. 4"
                        style={inputSt}
                    />
                </div>

                {/* Conducted */}
                <div style={{ flex: '0 1 110px', minWidth: 90 }}>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 4 }}>
                        Conducted
                    </div>
                    <input
                        type="number" min="0"
                        value={s.conducted === 0 ? '' : s.conducted}
                        onChange={e => onChange({ conducted: parseInt(e.target.value) || 0 })}
                        placeholder="e.g. 45"
                        style={inputSt}
                    />
                </div>

                {/* Attended */}
                <div style={{ flex: '0 1 110px', minWidth: 90 }}>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 4 }}>
                        Attended
                    </div>
                    <input
                        type="number" min="0"
                        value={s.attended === 0 ? '' : s.attended}
                        onChange={e => onChange({ attended: parseInt(e.target.value) || 0 })}
                        placeholder="e.g. 35"
                        style={inputSt}
                    />
                </div>

                {/* Target % */}
                <div style={{ flex: '0 1 90px', minWidth: 70 }}>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 4 }}>
                        Target %
                    </div>
                    <input
                        type="number" min="1" max="100"
                        value={s.target}
                        onChange={e => onChange({ target: clamp(parseInt(e.target.value) || 75, 1, 100) })}
                        style={inputSt}
                    />
                </div>

                {/* Remove */}
                <button
                    onClick={() => onRemove(s.id)}
                    title="Remove subject"
                    style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: 'var(--text-muted)', fontSize: 18, padding: '2px 4px',
                        alignSelf: 'center', transition: 'color 0.15s', flexShrink: 0,
                    }}
                    onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                    onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                >✕</button>
            </div>

            {/* ── Result strip ── */}
            {(s.conducted > 0 || s.classesPerWeek > 0) && (
                <div style={{
                    marginTop: 16,
                    display: 'flex', flexWrap: 'wrap', gap: 12,
                    padding: '14px 18px',
                    borderRadius: 10,
                    background: isSafe ? '#22c55e0d' : '#ef44440d',
                    border: `1.5px solid ${isSafe ? '#22c55e30' : '#ef444430'}`,
                    alignItems: 'center',
                }}>
                    {/* Projected % */}
                    <div style={{ minWidth: 80 }}>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 2 }}>Projected</div>
                        <div style={{ fontSize: 30, fontWeight: 800, color: isSafe ? '#22c55e' : '#ef4444', lineHeight: 1 }}>
                            {stats.projectedPct}%
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                            ({stats.currentPct}% now)
                        </div>
                    </div>

                    {/* Future classes */}
                    <div style={{ minWidth: 80 }}>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 2 }}>Future cls</div>
                        <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>
                            {stats.futureClasses}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>remaining</div>
                    </div>

                    {/* Final conducted */}
                    <div style={{ minWidth: 80 }}>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 2 }}>End total</div>
                        <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>
                            {stats.finalConducted}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>conducted</div>
                    </div>

                    {/* Verdict */}
                    <div style={{ marginLeft: 'auto', textAlign: 'right', minWidth: 160 }}>
                        {isSafe ? (
                            <>
                                <div style={{ fontSize: 15, fontWeight: 700, color: '#16a34a' }}>✅ Safe Zone</div>
                                <div style={{ fontSize: 13, color: '#15803d', marginTop: 2 }}>
                                    Can skip <b>{stats.budget}</b> more class{stats.budget !== 1 ? 'es' : ''}
                                </div>
                            </>
                        ) : (
                            <>
                                <div style={{ fontSize: 15, fontWeight: 700, color: '#dc2626' }}>⚠️ Danger Zone</div>
                                <div style={{ fontSize: 13, color: '#b91c1c', marginTop: 2 }}>
                                    {stats.recover === Infinity
                                        ? 'Impossible to recover on schedule'
                                        : stats.recover > 0
                                            ? <><b>{stats.recover}</b> extra class{stats.recover !== 1 ? 'es' : ''} needed</>
                                            : 'Must attend every class'}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}

/* ─── Summary Bar ───────────────────────────────────────── */
function SummaryBar({ subjects, weeksLeft, currentWeek, totalWeeks }) {
    if (subjects.length === 0) return null
    const valid = subjects.filter(s => s.conducted > 0 || s.classesPerWeek > 0)
    if (valid.length === 0) return null

    const safeCount = valid.filter(s => {
        const st = calcStats({ classesPerWeek: s.classesPerWeek, weeksLeft, conducted: s.conducted, attended: s.attended, target: s.target })
        return st.projectedPct >= s.target
    }).length
    const dangerCount = valid.length - safeCount

    return (
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 24 }}>
            <div style={{
                flex: 1, minWidth: 120, padding: '16px 20px', borderRadius: 12,
                background: '#22c55e0d', border: '1.5px solid #22c55e30',
            }}>
                <div style={{ fontSize: 28, fontWeight: 800, color: '#22c55e' }}>{safeCount}</div>
                <div style={{ fontSize: 13, color: '#15803d', fontWeight: 600 }}>Safe Subject{safeCount !== 1 ? 's' : ''}</div>
            </div>
            <div style={{
                flex: 1, minWidth: 120, padding: '16px 20px', borderRadius: 12,
                background: dangerCount > 0 ? '#ef44440d' : 'var(--bg-secondary)',
                border: `1.5px solid ${dangerCount > 0 ? '#ef444430' : 'var(--border)'}`,
            }}>
                <div style={{ fontSize: 28, fontWeight: 800, color: dangerCount > 0 ? '#ef4444' : 'var(--text-muted)' }}>{dangerCount}</div>
                <div style={{ fontSize: 13, color: dangerCount > 0 ? '#b91c1c' : 'var(--text-muted)', fontWeight: 600 }}>At Risk</div>
            </div>
            {currentWeek !== null && (
                <div style={{
                    flex: 1, minWidth: 120, padding: '16px 20px', borderRadius: 12,
                    background: 'var(--bg-secondary)', border: '1.5px solid var(--border)',
                }}>
                    <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--accent)' }}>Wk {currentWeek}/{totalWeeks}</div>
                    <div style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>Current Week</div>
                </div>
            )}
            <div style={{
                flex: 1, minWidth: 120, padding: '16px 20px', borderRadius: 12,
                background: 'var(--bg-secondary)', border: '1.5px solid var(--border)',
            }}>
                <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--accent)' }}>{weeksLeft ?? '—'}</div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>Weeks Left</div>
            </div>
        </div>
    )
}

/* ─── Page ──────────────────────────────────────────────── */
const DEFAULT_SUBJECT = () => ({
    id: uid(), name: '', classesPerWeek: '', conducted: 0, attended: 0, target: 75,
})

export default function TimetableCalculator() {
    const navigate = useNavigate()
    const { semester } = useAcademicStore()
    const [subjects, setSubjects] = useState([DEFAULT_SUBJECT()])

    /* Derive week info from semester dates */
    const { totalWeeks, currentWeek, weeksLeft } = useMemo(
        () => getSemesterWeeks(semester.startDate, semester.endDate),
        [semester.startDate, semester.endDate]
    )

    const addSubject = () => setSubjects(prev => [...prev, DEFAULT_SUBJECT()])

    const updateSubject = useCallback((id, patch) => {
        setSubjects(prev => prev.map(s => s.id === id ? { ...s, ...patch } : s))
    }, [])

    const removeSubject = useCallback((id) => {
        setSubjects(prev => prev.filter(s => s.id !== id))
    }, [])

    const resetAll = () => {
        if (window.confirm('Clear all subjects?')) setSubjects([DEFAULT_SUBJECT()])
    }

    const semesterNotSet = !semester.endDate

    return (
        <div className="page-container" style={{ maxWidth: 900 }}>

            {/* Header */}
            <div style={{ marginBottom: 28 }}>
                <h1 style={{
                    fontSize: 34, fontWeight: 800, letterSpacing: -0.5,
                    margin: 0, color: 'var(--text-primary)',
                    display: 'flex', alignItems: 'center', gap: 12,
                }}>
                    🗓️ Timetable Calculator
                </h1>
                <p style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 8, lineHeight: 1.6 }}>
                    Quick attendance projection — enter how many classes each subject has per week and your
                    current record. Weeks are auto-synced from your semester dates.
                </p>
            </div>

            {/* ── Semester banner ── */}
            <div style={{
                display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap',
                background: semesterNotSet ? '#f59e0b0d' : 'var(--bg-secondary)',
                border: `1px solid ${semesterNotSet ? '#f59e0b40' : 'var(--border)'}`,
                borderRadius: 14, padding: '16px 22px', marginBottom: 28,
            }}>
                <div style={{ fontSize: 24 }}>⏳</div>
                <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>
                        Semester Progress
                    </div>
                    {semesterNotSet ? (
                        <div style={{ fontSize: 13, color: '#d97706', marginTop: 2 }}>
                            Semester end date not set — weeks remaining can't be calculated.
                        </div>
                    ) : (
                        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
                            {formatDate(semester.startDate)} → {formatDate(semester.endDate)}
                            {currentWeek !== null && (
                                <> &nbsp;·&nbsp; <b style={{ color: 'var(--text-primary)' }}>Week {currentWeek} of {totalWeeks}</b></>
                            )}
                            {weeksLeft !== null && (
                                <> &nbsp;·&nbsp; <b style={{ color: 'var(--accent)' }}>{weeksLeft} week{weeksLeft !== 1 ? 's' : ''} left</b></>
                            )}
                        </div>
                    )}
                </div>

                {/* Progress bar */}
                {!semesterNotSet && totalWeeks > 0 && (
                    <div style={{ flex: '0 1 220px', minWidth: 160 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)', marginBottom: 4, fontWeight: 600 }}>
                            <span>Start</span>
                            <span>{Math.round(((currentWeek || 0) / totalWeeks) * 100)}% elapsed</span>
                            <span>End</span>
                        </div>
                        <div style={{ height: 8, background: 'var(--border)', borderRadius: 99, overflow: 'hidden' }}>
                            <div style={{
                                height: '100%', borderRadius: 99,
                                background: 'linear-gradient(90deg, var(--accent), #7c5cfc)',
                                width: `${Math.min(100, Math.round(((currentWeek || 0) / totalWeeks) * 100))}%`,
                                transition: 'width 0.4s ease',
                            }} />
                        </div>
                    </div>
                )}

                <button
                    onClick={() => navigate('/semester')}
                    style={{
                        padding: '8px 14px', borderRadius: 8, background: 'var(--bg-active)',
                        color: 'var(--text-primary)', fontSize: 12, fontWeight: 600,
                        border: '1px solid var(--border)', cursor: 'pointer', fontFamily: 'var(--font)',
                        flexShrink: 0,
                    }}
                >
                    {semesterNotSet ? '⚙️ Set Dates' : '✏️ Edit Semester'}
                </button>
            </div>

            {/* Summary */}
            <SummaryBar
                subjects={subjects}
                weeksLeft={weeksLeft ?? 0}
                currentWeek={currentWeek}
                totalWeeks={totalWeeks}
            />

            {/* Column labels */}
            <div style={{
                display: 'flex', gap: 16, padding: '0 24px 0 66px', marginBottom: 8,
                color: 'var(--text-muted)', fontSize: 11, fontWeight: 700,
                letterSpacing: 0.5, textTransform: 'uppercase',
            }}>
                <span style={{ flex: '1 1 100px' }}>Subject</span>
                <span style={{ flex: '0 1 110px' }}>Classes/Week</span>
                <span style={{ flex: '0 1 110px' }}>Conducted</span>
                <span style={{ flex: '0 1 110px' }}>Attended</span>
                <span style={{ flex: '0 1 90px' }}>Target %</span>
                <span style={{ width: 30 }}></span>
            </div>

            {/* Subject rows */}
            {subjects.length === 0 && (
                <div style={{
                    textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)',
                    background: 'var(--bg-secondary)', borderRadius: 14, border: '1px solid var(--border)',
                    marginBottom: 16,
                }}>
                    <div style={{ fontSize: 48, marginBottom: 12 }}>🗒️</div>
                    <div style={{ fontSize: 16, fontWeight: 600 }}>No subjects yet</div>
                    <div style={{ fontSize: 13, marginTop: 6 }}>Click "+ Add Subject" below to get started.</div>
                </div>
            )}

            {subjects.map((s, idx) => (
                <SubjectRow
                    key={s.id}
                    subject={s}
                    colorIdx={idx}
                    weeksLeft={weeksLeft ?? 0}
                    onChange={patch => updateSubject(s.id, patch)}
                    onRemove={removeSubject}
                />
            ))}

            {/* Actions */}
            <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                <button
                    onClick={addSubject}
                    style={{
                        flex: 1, padding: '14px', borderRadius: 12,
                        border: '2px dashed var(--border)', background: 'transparent',
                        color: 'var(--text-muted)', fontSize: 15, cursor: 'pointer',
                        fontFamily: 'var(--font)', fontWeight: 600, transition: 'all 0.15s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)' }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-muted)' }}
                >+ Add Subject</button>
                {subjects.length > 0 && (
                    <button
                        onClick={resetAll}
                        style={{
                            padding: '14px 20px', borderRadius: 12,
                            border: '2px solid var(--border)', background: 'transparent',
                            color: 'var(--text-muted)', fontSize: 14, cursor: 'pointer',
                            fontFamily: 'var(--font)', fontWeight: 600, transition: 'all 0.15s',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = '#ef4444'; e.currentTarget.style.color = '#ef4444' }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-muted)' }}
                    >🗑 Clear All</button>
                )}
            </div>

            {/* Tip */}
            <div style={{
                marginTop: 32, padding: '16px 20px', borderRadius: 12,
                background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.7,
            }}>
                <b style={{ color: 'var(--text-primary)' }}>💡 How it works</b><br />
                Enter <b>Classes/Week</b> for each subject (e.g. 4 lectures per week). The <b>weeks remaining</b>
                come directly from your <b>Semester Planner</b> end date — no manual entry needed.
                The result shows your best-case % if you attend <em>every</em> remaining class, and how many you can safely skip.
            </div>
        </div>
    )
}
