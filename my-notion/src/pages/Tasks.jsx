import React, { useState, useRef, useEffect } from 'react'
import useTaskStore from '../store/taskStore.js'

const CATEGORIES = ['General', 'Work', 'Study', 'Health', 'Personal', 'Other']

const CATEGORY_COLORS = {
    General: '#7c5cfc',
    Work: '#3b82f6',
    Study: '#f59e0b',
    Health: '#22c55e',
    Personal: '#ec4899',
    Other: '#8b5cf6',
}

function todayStr() {
    return new Date().toISOString().slice(0, 10)
}

/* ── Streak Card ────────────────────────────────────────── */
function StreakCard({ streak, tasks }) {
    const total = tasks.length
    const done = tasks.filter(t => t.completed).length
    const todayDone = tasks.filter(t =>
        t.completed && t.completedAt && t.completedAt.slice(0, 10) === todayStr()
    ).length
    const percent = total === 0 ? 0 : Math.round((done / total) * 100)

    const flames = streak.current >= 7 ? '🔥🔥🔥' :
        streak.current >= 3 ? '🔥🔥' :
            streak.current >= 1 ? '🔥' : '💤'

    return (
        <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: 14,
            marginBottom: 28,
        }}>
            {/* Current Streak */}
            <div style={cardStyle('#7c5cfc')}>
                <div style={{ fontSize: 36 }}>{flames}</div>
                <div style={{ fontSize: 28, fontWeight: 800, color: '#fff', lineHeight: 1 }}>
                    {streak.current}
                </div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', fontWeight: 500 }}>
                    Day Streak
                </div>
                {streak.current === 0 && (
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', marginTop: 2 }}>
                        Complete a task to start!
                    </div>
                )}
            </div>

            {/* Longest Streak */}
            <div style={cardStyle('#f59e0b')}>
                <div style={{ fontSize: 34 }}>🏆</div>
                <div style={{ fontSize: 28, fontWeight: 800, color: '#fff', lineHeight: 1 }}>
                    {streak.longest}
                </div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', fontWeight: 500 }}>
                    Best Streak
                </div>
            </div>

            {/* Today's Progress */}
            <div style={cardStyle('#22c55e')}>
                <div style={{ fontSize: 34 }}>✅</div>
                <div style={{ fontSize: 28, fontWeight: 800, color: '#fff', lineHeight: 1 }}>
                    {todayDone}
                </div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', fontWeight: 500 }}>
                    Done Today
                </div>
            </div>

            {/* Overall completion */}
            <div style={cardStyle('#3b82f6')}>
                <div style={{
                    width: 52, height: 52,
                    borderRadius: '50%',
                    background: `conic-gradient(#fff ${percent * 3.6}deg, rgba(255,255,255,0.2) 0deg)`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                    <div style={{
                        width: 38, height: 38, borderRadius: '50%',
                        background: '#3b82f6',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 13, fontWeight: 700, color: '#fff',
                    }}>{percent}%</div>
                </div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', fontWeight: 500, marginTop: 4 }}>
                    {done}/{total} Tasks
                </div>
            </div>
        </div>
    )
}

function cardStyle(color) {
    return {
        background: `linear-gradient(135deg, ${color}, ${color}cc)`,
        borderRadius: 14,
        padding: '20px 18px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 6,
        boxShadow: `0 4px 20px ${color}44`,
        minWidth: 0,
    }
}

/* ── Streak Calendar (last 30 days) ─────────────────────── */
function StreakCalendar({ streak }) {
    const days = []
    for (let i = 29; i >= 0; i--) {
        const d = new Date()
        d.setDate(d.getDate() - i)
        days.push(d.toISOString().slice(0, 10))
    }
    const active = new Set(streak.completedDates || [])

    return (
        <div style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border)',
            borderRadius: 14,
            padding: '18px 20px',
            marginBottom: 28,
        }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 12 }}>
                📅 Last 30 days
            </div>
            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                {days.map(day => {
                    const isToday = day === todayStr()
                    const isDone = active.has(day)
                    return (
                        <div key={day} title={day} style={{
                            width: 24,
                            height: 24,
                            borderRadius: 6,
                            background: isDone
                                ? 'linear-gradient(135deg, #7c5cfc, #9580ff)'
                                : 'var(--bg-active)',
                            border: isToday ? '2px solid var(--accent)' : '2px solid transparent',
                            boxShadow: isDone ? '0 2px 8px rgba(124,92,252,0.4)' : 'none',
                            transition: 'all 0.2s',
                        }} />
                    )
                })}
            </div>
            <div style={{ display: 'flex', gap: 16, marginTop: 12, fontSize: 12, color: 'var(--text-muted)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <div style={{ width: 12, height: 12, borderRadius: 3, background: 'linear-gradient(135deg, #7c5cfc, #9580ff)' }} />
                    Completed
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <div style={{ width: 12, height: 12, borderRadius: 3, background: 'var(--bg-active)', border: '2px solid var(--accent)' }} />
                    Today
                </div>
            </div>
        </div>
    )
}

/* ── Add Task Form ───────────────────────────────────────── */
function AddTaskForm({ onAdd }) {
    const [title, setTitle] = useState('')
    const [category, setCategory] = useState('General')
    const inputRef = useRef(null)

    const handleSubmit = (e) => {
        e.preventDefault()
        if (!title.trim()) return
        onAdd(title, category)
        setTitle('')
        inputRef.current?.focus()
    }

    return (
        <form onSubmit={handleSubmit} style={{
            display: 'flex', gap: 10, marginBottom: 20, alignItems: 'stretch',
        }}>
            <input
                ref={inputRef}
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Add a new task…"
                style={{
                    flex: 1,
                    padding: '11px 16px',
                    borderRadius: 10,
                    border: '1.5px solid var(--border)',
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    fontSize: 14,
                    outline: 'none',
                    transition: 'border-color 0.18s',
                    fontFamily: 'var(--font)',
                }}
                onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'}
            />
            <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                style={{
                    padding: '11px 12px',
                    borderRadius: 10,
                    border: '1.5px solid var(--border)',
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    fontSize: 13,
                    outline: 'none',
                    cursor: 'pointer',
                    fontFamily: 'var(--font)',
                }}
            >
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <button type="submit" style={{
                padding: '11px 20px',
                borderRadius: 10,
                background: 'var(--accent)',
                color: '#fff',
                fontWeight: 600,
                fontSize: 14,
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.18s',
                fontFamily: 'var(--font)',
                boxShadow: '0 2px 8px rgba(124,92,252,0.35)',
                whiteSpace: 'nowrap',
            }}
                onMouseEnter={e => e.target.style.opacity = '0.88'}
                onMouseLeave={e => e.target.style.opacity = '1'}
            >
                + Add
            </button>
        </form>
    )
}

/* ── Single Task Row ────────────────────────────────────── */
function TaskRow({ task, onToggle, onDelete, onEdit }) {
    const [editing, setEditing] = useState(false)
    const [val, setVal] = useState(task.title)
    const inputRef = useRef(null)

    useEffect(() => { if (editing) inputRef.current?.select() }, [editing])

    const commitEdit = () => {
        setEditing(false)
        if (val.trim() && val.trim() !== task.title) onEdit(task.id, val.trim())
        else setVal(task.title)
    }

    const color = CATEGORY_COLORS[task.category] || '#7c5cfc'

    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '12px 16px',
            borderRadius: 12,
            background: task.completed ? 'var(--bg-secondary)' : 'var(--bg-card)',
            border: '1px solid var(--border)',
            marginBottom: 8,
            transition: 'all 0.2s',
            opacity: task.completed ? 0.7 : 1,
        }}>
            {/* Checkbox */}
            <button
                onClick={() => onToggle(task.id)}
                style={{
                    width: 22, height: 22, borderRadius: 6,
                    border: `2px solid ${task.completed ? color : 'var(--border)'}`,
                    background: task.completed ? color : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0, cursor: 'pointer', transition: 'all 0.18s',
                }}
            >
                {task.completed && (
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                )}
            </button>

            {/* Category dot */}
            <div style={{
                width: 8, height: 8, borderRadius: '50%',
                background: color, flexShrink: 0,
            }} title={task.category} />

            {/* Title */}
            {editing ? (
                <input
                    ref={inputRef}
                    value={val}
                    onChange={e => setVal(e.target.value)}
                    onBlur={commitEdit}
                    onKeyDown={e => {
                        if (e.key === 'Enter') commitEdit()
                        if (e.key === 'Escape') { setVal(task.title); setEditing(false) }
                    }}
                    style={{
                        flex: 1, fontSize: 14, background: 'transparent',
                        border: 'none', outline: 'none', color: 'var(--text-primary)',
                        fontFamily: 'var(--font)',
                    }}
                />
            ) : (
                <span
                    onDoubleClick={() => !task.completed && setEditing(true)}
                    style={{
                        flex: 1, fontSize: 14,
                        color: task.completed ? 'var(--text-muted)' : 'var(--text-primary)',
                        textDecoration: task.completed ? 'line-through' : 'none',
                        cursor: task.completed ? 'default' : 'text',
                    }}
                >{task.title}</span>
            )}

            {/* Category badge */}
            <span style={{
                fontSize: 11, fontWeight: 500,
                padding: '2px 8px', borderRadius: 99,
                background: color + '22', color, flexShrink: 0,
            }}>{task.category}</span>

            {/* Delete */}
            <button
                onClick={() => onDelete(task.id)}
                title="Delete task"
                style={{
                    width: 26, height: 26, borderRadius: 6,
                    border: 'none', background: 'transparent',
                    color: 'var(--text-muted)', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 14, flexShrink: 0, transition: 'all 0.15s',
                }}
                onMouseEnter={e => { e.target.style.background = 'var(--danger-light)'; e.target.style.color = 'var(--danger)' }}
                onMouseLeave={e => { e.target.style.background = 'transparent'; e.target.style.color = 'var(--text-muted)' }}
            >✕</button>
        </div>
    )
}

/* ── Main Tasks Page ────────────────────────────────────── */
export default function Tasks() {
    const { tasks, streak, addTask, toggleTask, deleteTask, editTask, clearCompleted } = useTaskStore()
    const [filter, setFilter] = useState('all')   // 'all' | 'active' | 'done'
    const [catFilter, setCatFilter] = useState('All')

    const filtered = tasks.filter(t => {
        const statusOk = filter === 'all' || (filter === 'active' ? !t.completed : t.completed)
        const catOk = catFilter === 'All' || t.category === catFilter
        return statusOk && catOk
    })

    const hasDone = tasks.some(t => t.completed)

    return (
        <div className="page-container" style={{ maxWidth: 760 }}>
            {/* Header */}
            <div style={{ marginBottom: 28 }}>
                <h1 style={{ fontSize: 34, fontWeight: 800, letterSpacing: -0.5, margin: 0, color: 'var(--text-primary)' }}>
                    ✦ My Tasks
                </h1>
                <p style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 6 }}>
                    Complete tasks to build your streak. Don't break the chain! 🔥
                </p>
            </div>

            {/* Streak Cards */}
            <StreakCard streak={streak} tasks={tasks} />

            {/* Streak Calendar */}
            <StreakCalendar streak={streak} />

            {/* Add Task */}
            <AddTaskForm onAdd={addTask} />

            {/* Filters */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
                {['all', 'active', 'done'].map(f => (
                    <button key={f} onClick={() => setFilter(f)} style={{
                        padding: '5px 14px', borderRadius: 99,
                        border: '1.5px solid',
                        borderColor: filter === f ? 'var(--accent)' : 'var(--border)',
                        background: filter === f ? 'var(--accent-light)' : 'transparent',
                        color: filter === f ? 'var(--accent)' : 'var(--text-secondary)',
                        fontSize: 13, fontWeight: 500, cursor: 'pointer', transition: 'all 0.15s',
                        fontFamily: 'var(--font)',
                    }}>
                        {f === 'all' ? 'All' : f === 'active' ? 'Pending' : 'Completed'}
                    </button>
                ))}

                <div style={{ width: 1, height: 20, background: 'var(--border)', margin: '0 4px' }} />

                {['All', ...CATEGORIES].map(c => (
                    <button key={c} onClick={() => setCatFilter(c)} style={{
                        padding: '5px 12px', borderRadius: 99,
                        border: '1.5px solid',
                        borderColor: catFilter === c ? (CATEGORY_COLORS[c] || 'var(--accent)') : 'var(--border)',
                        background: catFilter === c ? (CATEGORY_COLORS[c] + '22' || 'var(--accent-light)') : 'transparent',
                        color: catFilter === c ? (CATEGORY_COLORS[c] || 'var(--accent)') : 'var(--text-muted)',
                        fontSize: 12, fontWeight: 500, cursor: 'pointer', transition: 'all 0.15s',
                        fontFamily: 'var(--font)',
                    }}>{c}</button>
                ))}

                {hasDone && (
                    <button onClick={clearCompleted} style={{
                        marginLeft: 'auto', padding: '5px 14px', borderRadius: 99,
                        border: '1.5px solid var(--danger)',
                        background: 'transparent',
                        color: 'var(--danger)',
                        fontSize: 12, fontWeight: 500, cursor: 'pointer', transition: 'all 0.15s',
                        fontFamily: 'var(--font)',
                    }}>Clear Completed</button>
                )}
            </div>

            {/* Task List */}
            {filtered.length === 0 ? (
                <div style={{
                    textAlign: 'center', padding: '48px 20px',
                    color: 'var(--text-muted)', fontSize: 15,
                }}>
                    {tasks.length === 0
                        ? '🎯 Add your first task above and start your streak!'
                        : '✨ No tasks match this filter.'}
                </div>
            ) : (
                <div>
                    {filtered.map(task => (
                        <TaskRow
                            key={task.id}
                            task={task}
                            onToggle={toggleTask}
                            onDelete={deleteTask}
                            onEdit={editTask}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}
