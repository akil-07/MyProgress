import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import { Highlight } from '@tiptap/extension-highlight'
import { Underline } from '@tiptap/extension-underline'
import { TextStyle } from '@tiptap/extension-text-style'
import { Color } from '@tiptap/extension-color'
import SlashMenu from './SlashMenu.jsx'

/* ── debounce ─────────────────────────────────────────── */
function useDebounce(fn, delay) {
    const t = useRef(null)
    return useCallback((...args) => {
        clearTimeout(t.current)
        t.current = setTimeout(() => fn(...args), delay)
    }, [fn, delay])
}

/* ── Floating Format Toolbar ──────────────────────────── */
function FloatingToolbar({ editor }) {
    const [pos, setPos] = useState(null)
    const toolbarRef = useRef(null)

    useEffect(() => {
        if (!editor) return

        const update = () => {
            const { from, to, empty } = editor.state.selection
            if (empty) { setPos(null); return }

            // get bounding rect of selection
            const view = editor.view
            const start = view.coordsAtPos(from)
            const end = view.coordsAtPos(to)

            const editorRect = view.dom.getBoundingClientRect()
            const x = (start.left + end.left) / 2 - editorRect.left
            const y = start.top - editorRect.top - 46  // above selection

            setPos({ x, y })
        }

        editor.on('selectionUpdate', update)
        editor.on('transaction', update)
        return () => {
            editor.off('selectionUpdate', update)
            editor.off('transaction', update)
        }
    }, [editor])

    if (!pos || !editor) return null

    const btn = (label, active, onClick, title) => (
        <button
            key={label}
            className={`bubble-toolbar-btn${active ? ' active' : ''}`}
            title={title || label}
            onMouseDown={(e) => { e.preventDefault(); onClick() }}
        >{label}</button>
    )

    return (
        <div
            ref={toolbarRef}
            className="bubble-toolbar"
            style={{
                position: 'absolute',
                left: Math.max(0, pos.x),
                top: Math.max(0, pos.y),
                zIndex: 500,
                transform: 'translateX(-50%)',
                pointerEvents: 'auto',
            }}
        >
            {btn(<b>B</b>, editor.isActive('bold'), () => editor.chain().focus().toggleBold().run(), 'Bold')}
            {btn(<i>I</i>, editor.isActive('italic'), () => editor.chain().focus().toggleItalic().run(), 'Italic')}
            {btn(<u>U</u>, editor.isActive('underline'), () => editor.chain().focus().toggleUnderline().run(), 'Underline')}
            {btn(<s>S</s>, editor.isActive('strike'), () => editor.chain().focus().toggleStrike().run(), 'Strike')}
            <div className="bubble-toolbar-sep" />
            {btn('hl', editor.isActive('highlight'), () => editor.chain().focus().toggleHighlight().run(), 'Highlight')}
            {btn('`c`', editor.isActive('code'), () => editor.chain().focus().toggleCode().run(), 'Code')}
            <div className="bubble-toolbar-sep" />
            {btn('H1', editor.isActive('heading', { level: 1 }), () => editor.chain().focus().toggleHeading({ level: 1 }).run())}
            {btn('H2', editor.isActive('heading', { level: 2 }), () => editor.chain().focus().toggleHeading({ level: 2 }).run())}
        </div>
    )
}

/* ── Editor ───────────────────────────────────────────── */
export default function Editor({ content, onUpdate }) {
    const [slashMenu, setSlashMenu] = useState(null)
    const [slashQuery, setSlashQuery] = useState('')
    const wrapperRef = useRef(null)

    const debouncedSave = useDebounce((json) => onUpdate(json), 800)

    const checkSlash = useCallback((ed) => {
        const { from, empty } = ed.state.selection
        if (!empty) { setSlashMenu(null); return }

        const text = ed.state.doc.textBetween(Math.max(0, from - 30), from, '\n', '\0')
        const idx = text.lastIndexOf('/')

        if (idx !== -1 && !text.slice(idx).includes('\n') && !text.slice(idx).includes(' ')) {
            const query = text.slice(idx + 1)
            setSlashQuery(query)
            try {
                const coords = ed.view.coordsAtPos(from)
                const edRect = ed.view.dom.getBoundingClientRect()
                setSlashMenu({ x: coords.left - edRect.left, y: coords.bottom - edRect.top + 6 })
            } catch { setSlashMenu(null) }
        } else {
            setSlashMenu(null)
        }
    }, [])

    const editor = useEditor({
        extensions: [
            StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
            Placeholder.configure({
                placeholder: ({ node }) =>
                    node.type.name === 'heading'
                        ? 'Heading…'
                        : "Write something, or press '/' for commands…",
            }),
            TaskList,
            TaskItem.configure({ nested: true }),
            Highlight.configure({ multicolor: false }),
            Underline,
            TextStyle,
            Color,
        ],
        content: content || '',
        onUpdate: ({ editor: ed }) => {
            debouncedSave(ed.getJSON())
            checkSlash(ed)
        },
        onSelectionUpdate: ({ editor: ed }) => checkSlash(ed),
        editorProps: { attributes: { class: 'tiptap' } },
    })

    /* Sync content when switching pages */
    useEffect(() => {
        if (!editor || editor.isDestroyed) return
        if (content && JSON.stringify(editor.getJSON()) !== JSON.stringify(content)) {
            editor.commands.setContent(content, false)
        }
    }, [content])

    /* Close slash on Escape */
    useEffect(() => {
        if (!slashMenu) return
        const h = (e) => { if (e.key === 'Escape') setSlashMenu(null) }
        window.addEventListener('keydown', h)
        return () => window.removeEventListener('keydown', h)
    }, [slashMenu])

    const applySlash = useCallback((cmd) => {
        if (!editor) return
        setSlashMenu(null)
        const { from } = editor.state.selection
        const text = editor.state.doc.textBetween(Math.max(0, from - 50), from, '\n', '\0')
        const idx = text.lastIndexOf('/')
        const delFrom = from - (text.length - idx)
        editor.chain().focus().deleteRange({ from: delFrom, to: from }).run()
        cmd(editor)
    }, [editor])

    if (!editor) return null

    return (
        <div className="editor-wrapper" ref={wrapperRef} style={{ position: 'relative' }}>
            {/* Floating selection toolbar */}
            <FloatingToolbar editor={editor} />

            {/* Main content */}
            <EditorContent editor={editor} />

            {/* Slash command menu */}
            {slashMenu && (
                <div style={{ position: 'absolute', top: slashMenu.y, left: slashMenu.x, zIndex: 600 }}>
                    <SlashMenu
                        query={slashQuery}
                        onSelect={applySlash}
                        onClose={() => setSlashMenu(null)}
                    />
                </div>
            )}
        </div>
    )
}
