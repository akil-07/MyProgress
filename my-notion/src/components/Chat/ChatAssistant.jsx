import React, { useState, useRef, useEffect, useCallback } from 'react'
import { askCerebrasStream, isCerebrasConfigured } from '../../services/cerebras.js'

const GREETING = `Hi! 👋 I'm your **MyNotion AI** — powered by Cerebras for lightning-fast responses.

Ask me anything:
• 📊 *"What's my attendance situation?"*
• 📝 *"Which assignments are due soon?"*
• 📚 *"Give me a study plan for this week"*
• 💡 *"How many classes can I skip in Maths?"*`

/* ── tiny markdown renderer (bold + bullet) ─── */
function renderMarkdown(text) {
    const lines = text.split('\n')
    return lines.map((line, i) => {
        // bullet points
        const isBullet = line.trimStart().startsWith('•') || line.trimStart().startsWith('-') || line.trimStart().startsWith('*')
        // bold **text**
        const parts = line.split(/\*\*(.*?)\*\*/g).map((part, j) =>
            j % 2 === 1 ? <b key={j}>{part}</b> : part
        )
        // italic *text*
        const finalParts = parts.flatMap((part, j) => {
            if (typeof part !== 'string') return [part]
            return part.split(/\*(.*?)\*/g).map((p, k) =>
                k % 2 === 1 ? <em key={`${j}-${k}`}>{p}</em> : p
            )
        })
        return (
            <span key={i} style={{ display: 'block', marginBottom: isBullet ? 4 : 2, paddingLeft: isBullet ? 4 : 0 }}>
                {finalParts}
            </span>
        )
    })
}

export default function ChatAssistant() {
    const [isOpen,    setIsOpen]    = useState(false)
    const [isMin,     setIsMin]     = useState(false)   // minimised (header only)
    const [messages,  setMessages]  = useState([{ role: 'assistant', content: GREETING }])
    const [input,     setInput]     = useState('')
    const [loading,   setLoading]   = useState(false)
    const [streaming, setStreaming] = useState('')       // live token buffer

    const messagesEndRef = useRef(null)
    const inputRef       = useRef(null)
    const abortRef       = useRef(null)

    // Auto-scroll on new content
    useEffect(() => {
        if (isOpen && !isMin) messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages, streaming, isOpen, isMin])

    // Focus input when opened
    useEffect(() => {
        if (isOpen && !isMin) setTimeout(() => inputRef.current?.focus(), 80)
    }, [isOpen, isMin])

    const handleSend = useCallback(async (e) => {
        e?.preventDefault()
        const text = input.trim()
        if (!text || loading) return
        setInput('')

        const userMsg = { role: 'user', content: text }
        const history = [...messages, userMsg]
        setMessages(history)
        setLoading(true)
        setStreaming('')

        // Create abort controller for cleanup
        abortRef.current = new AbortController()

        try {
            await askCerebrasStream(
                history,
                (chunk) => setStreaming(chunk),
                abortRef.current.signal
            )
            // Move finished stream into messages
            setMessages(prev => {
                const last = prev[prev.length - 1]
                // get the final value of streaming via the functional update
                return prev
            })
            setStreaming(prev => {
                if (prev) {
                    setMessages(m => [...m, { role: 'assistant', content: prev }])
                }
                return ''
            })
        } catch (err) {
            if (err.name !== 'AbortError') {
                setMessages(prev => [...prev, { role: 'assistant', content: `⚠️ ${err.message}` }])
            }
            setStreaming('')
        } finally {
            setLoading(false)
        }
    }, [input, loading, messages])

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) handleSend(e)
    }

    const clearChat = () => {
        abortRef.current?.abort()
        setMessages([{ role: 'assistant', content: GREETING }])
        setStreaming('')
        setLoading(false)
    }

    /* ── FAB (closed state) ────────────────────────────── */
    if (!isOpen) return (
        <button
            onClick={() => setIsOpen(true)}
            title="Open AI Assistant"
            style={{
                position: 'fixed', bottom: 24, right: 24, zIndex: 900,
                width: 56, height: 56, borderRadius: '50%',
                background: 'linear-gradient(135deg, #7c5cfc, #06b6d4)',
                color: '#fff', fontSize: 22,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 4px 20px rgba(124,92,252,0.45)',
                cursor: 'pointer', border: 'none', transition: 'transform 0.2s, box-shadow 0.2s',
            }}
            onMouseOver={e => { e.currentTarget.style.transform = 'scale(1.08)'; e.currentTarget.style.boxShadow = '0 6px 28px rgba(124,92,252,0.6)' }}
            onMouseOut={e  => { e.currentTarget.style.transform = 'scale(1)';    e.currentTarget.style.boxShadow = '0 4px 20px rgba(124,92,252,0.45)' }}
        >
            ✨
        </button>
    )

    /* ── Chat window ────────────────────────────────────── */
    return (
        <div style={{
            position: 'fixed', bottom: 24, right: 24, zIndex: 900,
            width: 360,
            height: isMin ? 56 : 520,
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 18,
            boxShadow: '0 8px 40px rgba(0,0,0,0.25)',
            display: 'flex', flexDirection: 'column',
            overflow: 'hidden',
            transition: 'height 0.25s cubic-bezier(0.4,0,0.2,1)',
        }}>

            {/* ── Header ── */}
            <div style={{
                padding: '12px 16px',
                background: 'linear-gradient(135deg, #7c5cfc22, #06b6d422)',
                borderBottom: isMin ? 'none' : '1px solid var(--border)',
                display: 'flex', alignItems: 'center', gap: 10,
                cursor: 'pointer', flexShrink: 0,
            }} onClick={() => setIsMin(m => !m)}>
                {/* Status dot */}
                <div style={{
                    width: 9, height: 9, borderRadius: '50%',
                    background: isCerebrasConfigured ? '#22c55e' : '#ef4444',
                    boxShadow: isCerebrasConfigured ? '0 0 6px #22c55e88' : 'none',
                    flexShrink: 0,
                }} />
                <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)', lineHeight: 1 }}>
                        MyNotion AI
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
                        {isCerebrasConfigured
                            ? (loading ? '⚡ Thinking...' : '✓ Cerebras · llama3.1-8b')
                            : '⚠ API key missing — check .env'}
                    </div>
                </div>
                {/* Controls */}
                <div style={{ display: 'flex', gap: 4 }} onClick={e => e.stopPropagation()}>
                    <button title="Clear chat" onClick={clearChat} style={btnSt}>🗑</button>
                    <button title={isMin ? 'Expand' : 'Minimise'} onClick={() => setIsMin(m => !m)} style={btnSt}>
                        {isMin ? '▲' : '▼'}
                    </button>
                    <button title="Close" onClick={() => setIsOpen(false)} style={btnSt}>✕</button>
                </div>
            </div>

            {/* ── Messages ── */}
            {!isMin && (
                <>
                    <div style={{ flex: 1, overflowY: 'auto', padding: '14px 14px 6px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {messages.map((msg, idx) => (
                            <div key={idx} style={bubbleSt(msg.role)}>
                                {msg.role === 'assistant'
                                    ? renderMarkdown(msg.content)
                                    : msg.content}
                            </div>
                        ))}

                        {/* Live streaming bubble */}
                        {streaming && (
                            <div style={{ ...bubbleSt('assistant'), borderBottom: '2px solid var(--accent)', opacity: 0.92 }}>
                                {renderMarkdown(streaming)}
                            </div>
                        )}

                        {/* Loading dots (before first token) */}
                        {loading && !streaming && (
                            <div style={{ ...bubbleSt('assistant') }}>
                                <span style={dotSt(0)} /> <span style={dotSt(0.2)} /> <span style={dotSt(0.4)} />
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>

                    {/* ── Input ── */}
                    <form onSubmit={handleSend} style={{
                        padding: '10px 12px', borderTop: '1px solid var(--border)',
                        display: 'flex', gap: 8, flexShrink: 0,
                        background: 'var(--bg-secondary)',
                    }}>
                        <textarea
                            ref={inputRef}
                            rows={1}
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder={isCerebrasConfigured ? 'Ask anything… (Enter to send)' : 'Add VITE_CEREBRAS_API_KEY to .env'}
                            disabled={loading || !isCerebrasConfigured}
                            style={{
                                flex: 1, padding: '9px 12px', borderRadius: 10,
                                border: '1.5px solid var(--border)',
                                background: 'var(--bg-card)', color: 'var(--text-primary)',
                                fontSize: 13, outline: 'none', resize: 'none',
                                fontFamily: 'var(--font)', lineHeight: 1.4,
                                transition: 'border-color 0.15s',
                            }}
                            onFocus={e  => e.target.style.borderColor = 'var(--accent)'}
                            onBlur={e   => e.target.style.borderColor = 'var(--border)'}
                        />
                        <button
                            type="submit"
                            disabled={loading || !input.trim() || !isCerebrasConfigured}
                            style={{
                                width: 38, height: 38, borderRadius: 10, border: 'none',
                                background: 'linear-gradient(135deg, #7c5cfc, #06b6d4)',
                                color: '#fff', fontSize: 16, cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                opacity: loading || !input.trim() ? 0.5 : 1,
                                transition: 'opacity 0.15s',
                                flexShrink: 0, alignSelf: 'flex-end',
                            }}
                        >➤</button>
                    </form>
                </>
            )}
        </div>
    )
}

/* ── Styles ─────────────────────────────────────────────── */
const btnSt = {
    background: 'none', border: 'none', cursor: 'pointer',
    color: 'var(--text-muted)', fontSize: 13, padding: '3px 6px',
    borderRadius: 6, transition: 'background 0.15s',
}

function bubbleSt(role) {
    return {
        alignSelf: role === 'user' ? 'flex-end' : 'flex-start',
        maxWidth: '88%',
        padding: '9px 13px',
        background: role === 'user'
            ? 'linear-gradient(135deg, #7c5cfc, #06b6d4)'
            : 'var(--bg-secondary)',
        color: role === 'user' ? '#fff' : 'var(--text-primary)',
        borderRadius: 13,
        borderBottomRightRadius: role === 'user' ? 3 : 13,
        borderBottomLeftRadius:  role === 'user' ? 13 : 3,
        fontSize: 13, lineHeight: 1.55,
        wordBreak: 'break-word',
        border: role === 'assistant' ? '1px solid var(--border)' : 'none',
    }
}

function dotSt(delay) {
    return {
        display: 'inline-block', width: 7, height: 7,
        borderRadius: '50%', background: 'var(--accent)',
        margin: '0 2px',
        animation: `pulse 1.2s ease-in-out ${delay}s infinite`,
    }
}
