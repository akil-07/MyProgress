import React, { useState, useEffect, useRef } from 'react'

const MODES = {
    work: { label: 'Focus Time', duration: 25 * 60, color: '#FF7E67', icon: '🐼', glow: 'rgba(255, 126, 103, 0.4)' },
    shortBreak: { label: 'Short Break', duration: 5 * 60, color: '#2ecc71', icon: '🍃', glow: 'rgba(46, 204, 113, 0.4)' },
    longBreak: { label: 'Long Break', duration: 15 * 60, color: '#3498db', icon: '💤', glow: 'rgba(52, 152, 219, 0.4)' },
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
            padding: '2rem 0',
            fontFamily: "'Inter', sans-serif"
        }}>
            <div data-testid="panda-timer-header" style={{ textAlign: 'center', marginBottom: 40, flexShrink: 0 }}>
                <h1 style={{
                    fontSize: 48,
                    fontWeight: 900,
                    color: 'var(--text-primary)',
                    marginBottom: 12,
                    letterSpacing: '-0.03em',
                    background: `linear-gradient(135deg, ${MODES[mode].color}, var(--text-primary))`,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    transition: 'background 0.5s ease'
                }}>🐼 Pandaroma</h1>
                <p style={{
                    fontSize: 16,
                    color: 'var(--text-muted)',
                    fontWeight: 500,
                    letterSpacing: '0.01em'
                }}>Relax your mind, focus like a panda.</p>
            </div>

            {/* Mode Selector */}
            <div style={{
                display: 'flex',
                flexShrink: 0,
                gap: 6,
                background: 'var(--bg-secondary)',
                padding: 8,
                borderRadius: 100,
                marginBottom: 48,
                border: '1px solid var(--border)',
                boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02), 0 4px 12px rgba(0,0,0,0.03)',
                position: 'relative',
                overflow: 'hidden'
            }}>
                {Object.entries(MODES).map(([key, m]) => (
                    <button
                        key={key}
                        onClick={() => switchMode(key)}
                        style={{
                            padding: '12px 28px',
                            borderRadius: 100,
                            border: 'none',
                            background: mode === key ? m.color : 'transparent',
                            color: mode === key ? 'white' : 'var(--text-secondary)',
                            fontSize: 14,
                            fontWeight: 700,
                            cursor: 'pointer',
                            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                            fontFamily: 'inherit',
                            position: 'relative',
                            zIndex: 1,
                            boxShadow: mode === key ? `0 4px 12px ${m.glow}` : 'none'
                        }}
                    >
                        {m.label}
                    </button>
                ))}
            </div>

            {/* Timer Circle */}
            <div style={{
                position: 'relative',
                width: 360,
                height: 360,
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 48
            }}>
                {/* Glow Background */}
                <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '100%',
                    height: '100%',
                    borderRadius: '50%',
                    background: MODES[mode].color,
                    filter: 'blur(80px)',
                    opacity: isActive ? 0.25 : 0.08,
                    transition: 'opacity 0.6s ease, background 0.6s ease',
                    zIndex: 0
                }} />

                {/* Main Card Ring container */}
                <div style={{
                    position: 'absolute',
                    inset: 0,
                    borderRadius: '50%',
                    background: 'var(--bg-secondary)',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.08), inset 0 2px 4px rgba(255,255,255,0.05)',
                    border: '1px solid var(--border)',
                    zIndex: 1
                }} />

                {/* SVG Progress Circle */}
                <svg width="360" height="360" viewBox="0 0 360 360" style={{ transform: 'rotate(-90deg)', position: 'absolute', zIndex: 2 }}>
                    <circle
                        cx="180" cy="180" r="166"
                        stroke="var(--bg-active)"
                        strokeWidth="8"
                        fill="transparent"
                        style={{ opacity: 0.3 }}
                    />
                    <circle
                        cx="180" cy="180" r="166"
                        stroke={MODES[mode].color}
                        strokeWidth="12"
                        fill="transparent"
                        strokeDasharray={2 * Math.PI * 166}
                        strokeDashoffset={2 * Math.PI * 166 * (1 - percent / 100)}
                        strokeLinecap="round"
                        style={{ 
                            transition: 'stroke-dashoffset 1s linear, stroke 0.5s ease',
                            filter: `drop-shadow(0 0 12px ${MODES[mode].glow})`
                        }}
                    />
                </svg>

                <div style={{
                    textAlign: 'center',
                    zIndex: 3,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center'
                }}>
                    <div style={{ 
                        fontSize: 64, 
                        marginBottom: isActive ? -5 : -10, 
                        animation: isActive ? 'bounce 2s infinite ease-in-out' : 'none',
                        transition: 'all 0.3s ease',
                        filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.1))'
                    }}>
                        {MODES[mode].icon}
                    </div>
                    <div style={{
                        fontSize: 88,
                        fontWeight: 900,
                        color: 'var(--text-primary)',
                        fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                        letterSpacing: -5,
                        lineHeight: 1,
                        textShadow: '0 4px 12px rgba(0,0,0,0.05)'
                    }}>
                        {formatTime(timeLeft)}
                    </div>
                    <div style={{
                        fontSize: 16,
                        fontWeight: 800,
                        color: MODES[mode].color,
                        textTransform: 'uppercase',
                        letterSpacing: 4,
                        marginTop: 12,
                        opacity: 0.9,
                        transition: 'color 0.5s ease'
                    }}>
                        {MODES[mode].label}
                    </div>
                </div>
            </div>

            {/* Controls */}
            <div style={{ display: 'flex', gap: 24, alignItems: 'center', flexShrink: 0 }}>
                <button
                    onClick={toggleTimer}
                    style={{
                        padding: '20px 64px',
                        borderRadius: 100,
                        border: 'none',
                        background: MODES[mode].color,
                        color: 'white',
                        fontSize: 20,
                        fontWeight: 800,
                        letterSpacing: '0.05em',
                        cursor: 'pointer',
                        boxShadow: `0 12px 36px ${MODES[mode].glow}, inset 0 2px 4px rgba(255,255,255,0.2)`,
                        transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                        transform: isActive ? 'scale(0.95) translateY(2px)' : 'scale(1) translateY(0)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12
                    }}
                    onMouseEnter={e => {
                        if (!isActive) e.currentTarget.style.transform = 'scale(1.05) translateY(-4px)';
                        e.currentTarget.style.boxShadow = `0 16px 40px ${MODES[mode].glow}, inset 0 2px 4px rgba(255,255,255,0.2)`;
                    }}
                    onMouseLeave={e => {
                        e.currentTarget.style.transform = isActive ? 'scale(0.95) translateY(2px)' : 'scale(1) translateY(0)';
                        e.currentTarget.style.boxShadow = `0 12px 36px ${MODES[mode].glow}, inset 0 2px 4px rgba(255,255,255,0.2)`;
                    }}
                >
                    {isActive ? (
                        <>
                            <span style={{ fontSize: 24 }}>⏸</span> PAUSE
                        </>
                    ) : (
                        <>
                            <span style={{ fontSize: 24 }}>▶</span> START
                        </>
                    )}
                </button>

                <button
                    onClick={resetTimer}
                    title="Reset Timer"
                    style={{
                        width: 68,
                        height: 68,
                        borderRadius: '50%',
                        border: '1px solid var(--border)',
                        background: 'var(--bg-secondary)',
                        color: 'var(--text-secondary)',
                        fontSize: 32,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.05), inset 0 2px 4px rgba(255,255,255,0.05)'
                    }}
                    onMouseEnter={e => {
                        e.currentTarget.style.background = 'var(--bg-active)';
                        e.currentTarget.style.transform = 'rotate(-180deg) scale(1.1)';
                        e.currentTarget.style.color = 'var(--text-primary)';
                    }}
                    onMouseLeave={e => {
                        e.currentTarget.style.background = 'var(--bg-secondary)';
                        e.currentTarget.style.transform = 'rotate(0deg) scale(1)';
                        e.currentTarget.style.color = 'var(--text-secondary)';
                    }}
                >
                    ↻
                </button>
            </div>

            {/* Session Counter */}
            <div style={{
                marginTop: 64,
                display: 'flex',
                flexShrink: 0,
                gap: 40,
                padding: '28px 48px',
                background: 'linear-gradient(180deg, var(--bg-secondary) 0%, rgba(255,255,255,0.02) 100%)',
                borderRadius: 32,
                border: '1px solid var(--border)',
                backdropFilter: 'blur(20px)',
                boxShadow: '0 12px 40px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.1)',
                position: 'relative',
                overflow: 'hidden'
            }}>
                {/* Decorative background element */}
                <div style={{
                    position: 'absolute',
                    top: 0, left: 0, right: 0, height: '3px',
                    background: `linear-gradient(90deg, transparent, ${MODES[mode].color}, transparent)`,
                    opacity: 0.8,
                    transition: 'background 0.5s ease'
                }} />

                <div style={{ textAlign: 'center', zIndex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8 }}>Completed</div>
                    <div style={{ fontSize: 36, fontWeight: 900, color: 'var(--text-primary)', lineHeight: 1, textShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>{sessions}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', marginTop: 8 }}>Sessions</div>
                </div>
                <div style={{ width: 1, background: 'var(--border)', opacity: 0.6, zIndex: 1 }} />
                <div style={{ textAlign: 'center', zIndex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8 }}>Goal Today</div>
                    <div style={{ fontSize: 36, fontWeight: 900, color: MODES[mode].color, lineHeight: 1, textShadow: `0 2px 10px ${MODES[mode].glow}`, transition: 'color 0.5s ease' }}>8</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', marginTop: 8 }}>Sessions</div>
                </div>
            </div>

            <style>{`
                @keyframes bounce {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-8px); }
                }
            `}</style>
        </div>
    )
}
