import React, { useState, useRef, useEffect } from 'react';
import { askGeminiChat, isGeminiConfigured } from '../../services/gemini.js';

export default function ChatAssistant() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([{ role: 'assistant', content: 'Hi! I am your AI assistant. How can I help you today?' }]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        if (isOpen && messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, isOpen]);

    const handleSend = async (e) => {
        e?.preventDefault();
        if (!input.trim() || loading) return;

        const userMsg = input.trim();
        setInput('');

        const newMessages = [...messages, { role: 'user', content: userMsg }];
        setMessages(newMessages);
        setLoading(true);

        try {
            if (!isGeminiConfigured) {
                throw new Error("Gemini API key is not configured in .env (VITE_GEMINI_API_KEY)");
            }

            const reply = await askGeminiChat(newMessages);
            setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
        } catch (error) {
            setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${error.message}` }]);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                style={{
                    position: 'fixed', bottom: 24, right: 24, zIndex: 900,
                    width: 56, height: 56, borderRadius: '50%',
                    background: 'linear-gradient(135deg, var(--accent), #fc5c7d)',
                    color: '#fff', fontSize: 24, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 4px 16px rgba(var(--accent-rgb), 0.4)',
                    cursor: 'pointer', border: 'none', transition: 'transform 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
                ✨
            </button>
        );
    }

    return (
        <div style={{
            position: 'fixed', bottom: 24, right: 24, zIndex: 900,
            width: 340, height: 500, background: 'var(--bg-card)',
            border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)',
            boxShadow: 'var(--shadow-lg)', display: 'flex', flexDirection: 'column',
            overflow: 'hidden', animation: 'fadeSlideUp 0.3s ease'
        }}>
            <div style={{
                padding: '16px 20px', background: 'var(--bg-secondary)',
                borderBottom: '1px solid var(--border)', display: 'flex',
                alignItems: 'center', justifyContent: 'space-between'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: isGeminiConfigured ? '#22c55e' : 'var(--danger)' }} />
                    <span style={{ fontWeight: 600, fontSize: 15, color: 'var(--text-primary)' }}>AI Assistant</span>
                </div>
                <button onClick={() => setIsOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 18 }}>×</button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
                {messages.map((msg, idx) => (
                    <div key={idx} style={{
                        alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                        maxWidth: '85%', padding: '10px 14px',
                        background: msg.role === 'user' ? 'var(--accent)' : 'var(--bg-hover)',
                        color: msg.role === 'user' ? '#fff' : 'var(--text-primary)',
                        borderRadius: 'var(--radius-lg)',
                        borderBottomRightRadius: msg.role === 'user' ? 4 : 'var(--radius-lg)',
                        borderBottomLeftRadius: msg.role === 'user' ? 'var(--radius-lg)' : 4,
                        fontSize: 14, lineHeight: 1.5, wordBreak: 'break-word', whiteSpace: 'pre-wrap'
                    }}>
                        {msg.content}
                    </div>
                ))}
                {loading && (
                    <div style={{ alignSelf: 'flex-start', padding: '10px 14px', background: 'var(--bg-hover)', borderRadius: 'var(--radius-lg)', color: 'var(--text-muted)', fontSize: 14 }}>
                        <span className="saving-dot" style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: 'var(--text-muted)', animation: 'pulse 1s infinite' }} /> Typing...
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSend} style={{ padding: 12, borderTop: '1px solid var(--border)', display: 'flex', gap: 8 }}>
                <input
                    type="text"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    placeholder={isGeminiConfigured ? "Ask anything..." : "Add API key to .env"}
                    disabled={loading}
                    style={{
                        flex: 1, padding: '10px 14px', borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border)', background: 'var(--bg-primary)',
                        color: 'var(--text-primary)', fontSize: 14, outline: 'none'
                    }}
                />
                <button
                    type="submit"
                    disabled={loading || !input.trim()}
                    style={{
                        padding: '0 16px', borderRadius: 'var(--radius-md)', border: 'none',
                        background: 'var(--accent)', color: '#fff', fontWeight: 600, cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
                        opacity: loading || !input.trim() ? 0.7 : 1
                    }}
                >
                    ➤
                </button>
            </form>
        </div>
    );
}
