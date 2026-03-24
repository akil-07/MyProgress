import React, { useState, useEffect, useRef } from 'react'

const MODES = {
    work: { label: 'Focus Time', duration: 25 * 60, color: '#FF7E67', icon: '🐼' },
    shortBreak: { label: 'Short Break', duration: 5 * 60, color: '#2ecc71', icon: '🍃' },
    longBreak: { label: 'Long Break', duration: 15 * 60, color: '#3498db', icon: '💤' },
}

export default function Pomodoro() {
    const [mode, setMode] = useState('work')
    const [timeLeft, setTimeLeft] = useState(MODES.work.duration)
    const [isActive, setIsActive] = useState(false)
    const [sessions, setSessions] = useState(0)
    const timerRef = useRef(null)

    const totalSeconds = MODES[mode].duration
    const percent = ((totalSeconds - timeLeft) / totalSeconds) * 100

    useEffect(() => {
        if (isActive && timeLeft > 0) {
            timerRef.current = setInterval(() => {
                setTimeLeft(prev => prev - 1)
            }, 1000)
        } else if (timeLeft === 0) {
            handleComplete()
        } else {
            clearInterval(timerRef.current)
        }
        return () => clearInterval(timerRef.current)
    }, [isActive, timeLeft])

    const handleComplete = () => {
        setIsActive(false)
        if (mode === 'work') {
            setSessions(prev => prev + 1)
            // Notify or switch to break?
        }
    }

    const toggleTimer = () => setIsActive(!isActive)

    const resetTimer = () => {
        setIsActive(false)
        setTimeLeft(MODES[mode].duration)
    }

    const switchMode = (m) => {
        setMode(m)
        setIsActive(false)
        setTimeLeft(MODES[m].duration)
    }

    const formatTime = (s) => {
        const mins = Math.floor(s / 60)
        const secs = s % 60
        return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    return (
        <div className="page-container" style={{
            maxWidth: 600,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '80vh',
            padding: '2rem 0'
        }}>
            <div data-testid="panda-timer-header" style={{ textAlign: 'center', marginBottom: 32 }}>
                <h1 style={{
                    fontSize: 42,
                    fontWeight: 900,
                    color: 'var(--text-primary)',
                    marginBottom: 8,
                    letterSpacing: -1
                }}>🐼 Pandaroma</h1>
                <p style={{
                    fontSize: 15,
                    color: 'var(--text-muted)',
                    fontWeight: 500
                }}>Relax your mind, focus like a panda.</p>
            </div>

            {/* Mode Selector */}
            <div style={{
                display: 'flex',
                gap: 8,
                background: 'var(--bg-secondary)',
                padding: 6,
                borderRadius: 99,
                marginBottom: 40,
                border: '1.5px solid var(--border)',
                boxShadow: 'var(--shadow-sm)'
            }}>
                {Object.entries(MODES).map(([key, m]) => (
                    <button
                        key={key}
                        onClick={() => switchMode(key)}
                        style={{
                            padding: '10px 24px',
                            borderRadius: 99,
                            border: 'none',
                            background: mode === key ? m.color : 'transparent',
                            color: mode === key ? 'white' : 'var(--text-secondary)',
                            fontSize: 14,
                            fontWeight: 700,
                            cursor: 'pointer',
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            fontFamily: 'inherit'
                        }}
                    >
                        {m.label}
                    </button>
                ))}
            </div>

            {/* Timer Circle */}
            <div style={{
                position: 'relative',
                width: 340,
                height: 340,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 40
            }}>
                {/* SVG Progress Circle */}
                <svg width="340" height="340" viewBox="0 0 340 340" style={{ transform: 'rotate(-90deg)', position: 'absolute' }}>
                    <circle
                        cx="170" cy="170" r="160"
                        stroke="var(--bg-active)"
                        strokeWidth="12"
                        fill="transparent"
                        style={{ opacity: 0.5 }}
                    />
                    <circle
                        cx="170" cy="170" r="160"
                        stroke={MODES[mode].color}
                        strokeWidth="12"
                        fill="transparent"
                        strokeDasharray={2 * Math.PI * 160}
                        strokeDashoffset={2 * Math.PI * 160 * (1 - percent / 100)}
                        strokeLinecap="round"
                        style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.3s' }}
                    />
                </svg>

                <div style={{
                    textAlign: 'center',
                    zIndex: 2,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center'
                }}>
                    <div style={{ fontSize: 72, marginBottom: -10, animation: isActive ? 'pulse 2s infinite' : 'none' }}>{MODES[mode].icon}</div>
                    <div style={{
                        fontSize: 84,
                        fontWeight: 900,
                        color: 'var(--text-primary)',
                        fontFamily: "'JetBrains Mono', monospace",
                        letterSpacing: -4,
                        lineHeight: 1
                    }}>
                        {formatTime(timeLeft)}
                    </div>
                    <div style={{
                        fontSize: 14,
                        fontWeight: 800,
                        color: 'var(--text-muted)',
                        textTransform: 'uppercase',
                        letterSpacing: 2,
                        marginTop: 8
                    }}>
                        {MODES[mode].label}
                    </div>
                </div>
            </div>

            {/* Controls */}
            <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
                <button
                    onClick={toggleTimer}
                    style={{
                        padding: '18px 56px',
                        borderRadius: 20,
                        border: 'none',
                        background: MODES[mode].color,
                        color: 'white',
                        fontSize: 20,
                        fontWeight: 800,
                        cursor: 'pointer',
                        boxShadow: `0 12px 32px ${MODES[mode].color}44`,
                        transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                        transform: isActive ? 'scale(0.96)' : 'translateY(0)'
                    }}
                    onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'none'}
                >
                    {isActive ? 'PAUSE' : 'START FOCUS'}
                </button>

                <button
                    onClick={resetTimer}
                    style={{
                        width: 64,
                        height: 64,
                        borderRadius: 20,
                        border: '2px solid var(--border)',
                        background: 'var(--bg-secondary)',
                        color: 'var(--text-secondary)',
                        fontSize: 24,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s',
                        boxShadow: 'var(--shadow-sm)'
                    }}
                    onMouseEnter={e => {
                        e.currentTarget.style.background = 'var(--bg-active)';
                        e.currentTarget.style.transform = 'rotate(-45deg)';
                    }}
                    onMouseLeave={e => {
                        e.currentTarget.style.background = 'var(--bg-secondary)';
                        e.currentTarget.style.transform = 'rotate(0deg)';
                    }}
                >
                    ↺
                </button>
            </div>

            {/* Session Counter */}
            <div style={{
                marginTop: 60,
                display: 'flex',
                gap: 32,
                padding: '24px 40px',
                background: 'var(--bg-secondary)',
                borderRadius: 24,
                border: '1.5px solid var(--border)',
                backdropFilter: 'blur(10px)',
                boxShadow: 'var(--shadow-md)'
            }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Completed</div>
                    <div style={{ fontSize: 32, fontWeight: 900, color: 'var(--text-primary)', lineHeight: 1 }}>{sessions}</div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginTop: 4 }}>Sessions</div>
                </div>
                <div style={{ width: 1.5, background: 'var(--border)' }} />
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Goal Today</div>
                    <div style={{ fontSize: 32, fontWeight: 900, color: 'var(--accent)', lineHeight: 1 }}>8</div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginTop: 4 }}>Sessions</div>
                </div>
            </div>

            <style>{`
                @keyframes pulse {
                    0% { transform: scale(1); }
                    50% { transform: scale(1.05); }
                    100% { transform: scale(1); }
                }
            `}</style>
        </div>
    )
}
