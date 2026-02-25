import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import usePageStore from '../store/pageStore.js'
import Editor from '../components/Editor/Editor.jsx'

const EMOJIS = ['📄', '📝', '📌', '🗒️', '💡', '🎯', '🚀', '📚', '🗂️', '⭐', '🔥', '💎', '🌟', '🎨', '🏆', '🔖', '🧠', '✨', '🎪', '🌈', '🦋', '🦄', '🔬', '🍀', '🏔️', '🌊', '🎵', '🎮', '🌸', '🏄']

export default function Document() {
    const { pageId } = useParams()
    const { pages, updatePage } = usePageStore()
    const page = pages.find(p => p.id === pageId)

    const [title, setTitle] = useState('')
    const [saveMsg, setSaveMsg] = useState('Saved')
    const [showEmoji, setShowEmoji] = useState(false)
    const [emojiPos, setEmojiPos] = useState({ x: 0, y: 0 })
    const titleRef = useRef(null)
    const saveTimer = useRef(null)

    useEffect(() => {
        if (page) setTitle(page.title || '')
    }, [pageId, page?.title])

    useEffect(() => {
        if (page?.title === 'Untitled') setTimeout(() => titleRef.current?.select(), 80)
    }, [pageId])

    const handleTitleChange = (e) => {
        const val = e.target.value
        setTitle(val)
        setSaveMsg('Saving…')
        clearTimeout(saveTimer.current)
        saveTimer.current = setTimeout(() => {
            updatePage(pageId, { title: val || 'Untitled' })
            setSaveMsg('Saved')
        }, 600)
    }

    const handleContentUpdate = useCallback((json) => {
        setSaveMsg('Saving…')
        updatePage(pageId, { content: json })
        setSaveMsg('Saved')
    }, [pageId, updatePage])

    const openEmoji = (e) => {
        const r = e.currentTarget.getBoundingClientRect()
        setEmojiPos({ x: r.left, y: r.bottom + 8 })
        setShowEmoji(true)
    }

    if (!page) {
        return <div className="page-loading"><div className="spinner" /></div>
    }

    return (
        <div className="doc-page">
            {/* Emoji picker */}
            {showEmoji && (
                <>
                    <div className="emoji-picker-overlay" onClick={() => setShowEmoji(false)} />
                    <div className="emoji-grid" style={{ top: emojiPos.y, left: emojiPos.x }}>
                        {EMOJIS.map(e => (
                            <button key={e} className="emoji-option"
                                onClick={() => { updatePage(pageId, { icon: e }); setShowEmoji(false) }}>{e}</button>
                        ))}
                    </div>
                </>
            )}

            {/* Header */}
            <div className="doc-header">
                <button className="doc-icon-btn" onClick={openEmoji} title="Change icon">
                    {page.icon || '📄'}
                </button>
                <textarea
                    ref={titleRef}
                    className="doc-title-input"
                    value={title}
                    onChange={handleTitleChange}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === 'Tab') {
                            e.preventDefault()
                            document.querySelector('.tiptap')?.focus()
                        }
                    }}
                    onInput={(e) => {
                        e.target.style.height = 'auto'
                        e.target.style.height = e.target.scrollHeight + 'px'
                    }}
                    placeholder="Untitled"
                    rows={1}
                    style={{ overflow: 'hidden' }}
                />
            </div>

            {/* Meta */}
            <div className="doc-meta">
                <div className="doc-save-status">
                    <div className={`doc-save-dot${saveMsg === 'Saving…' ? ' saving' : ''}`} />
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{saveMsg}</span>
                </div>
                <span style={{ color: 'var(--border)' }}>·</span>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    {new Date(page.updatedAt).toLocaleDateString('en-IN', {
                        day: '2-digit', month: 'short', year: 'numeric',
                    })}
                </span>
            </div>

            {/* Editor */}
            <Editor key={pageId} content={page.content} onUpdate={handleContentUpdate} />
        </div>
    )
}
