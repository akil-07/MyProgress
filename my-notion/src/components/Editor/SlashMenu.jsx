import React, { useEffect, useRef, useState } from 'react';

const ALL_COMMANDS = [
    {
        group: 'Basic Blocks',
        items: [
            { icon: 'H1', label: 'Heading 1', desc: 'Large section heading', keywords: ['h1', 'heading', 'title'], cmd: (ed) => ed.chain().focus().toggleHeading({ level: 1 }).run() },
            { icon: 'H2', label: 'Heading 2', desc: 'Medium section heading', keywords: ['h2', 'heading'], cmd: (ed) => ed.chain().focus().toggleHeading({ level: 2 }).run() },
            { icon: 'H3', label: 'Heading 3', desc: 'Small section heading', keywords: ['h3', 'heading'], cmd: (ed) => ed.chain().focus().toggleHeading({ level: 3 }).run() },
            { icon: '—', label: 'Divider', desc: 'A horizontal separator', keywords: ['hr', 'divider', 'sep'], cmd: (ed) => ed.chain().focus().setHorizontalRule().run() },
        ],
    },
    {
        group: 'Lists',
        items: [
            { icon: '•', label: 'Bullet List', desc: 'Simple unordered list', keywords: ['bullet', 'list', 'ul'], cmd: (ed) => ed.chain().focus().toggleBulletList().run() },
            { icon: '1.', label: 'Numbered List', desc: 'Ordered numbered list', keywords: ['numbered', 'list', 'ol'], cmd: (ed) => ed.chain().focus().toggleOrderedList().run() },
            { icon: '☑', label: 'To-do List', desc: 'Checkable task list', keywords: ['todo', 'task', 'check'], cmd: (ed) => ed.chain().focus().toggleTaskList().run() },
        ],
    },
    {
        group: 'Media & Code',
        items: [
            { icon: '❝', label: 'Quote', desc: 'Highlighted block quote', keywords: ['quote', 'blockquote'], cmd: (ed) => ed.chain().focus().toggleBlockquote().run() },
            { icon: '<>', label: 'Code Block', desc: 'Monospace code block', keywords: ['code', 'pre', 'block'], cmd: (ed) => ed.chain().focus().toggleCodeBlock().run() },
        ],
    },
];

export default function SlashMenu({ x, y, query, onSelect, onClose }) {
    const [selectedIdx, setSelectedIdx] = useState(0);
    const menuRef = useRef(null);

    /* Filter based on slash query */
    const filteredGroups = ALL_COMMANDS.map((group) => ({
        ...group,
        items: group.items.filter(
            (item) =>
                !query ||
                item.label.toLowerCase().includes(query.toLowerCase()) ||
                item.keywords.some((k) => k.includes(query.toLowerCase()))
        ),
    })).filter((g) => g.items.length > 0);

    const flatItems = filteredGroups.flatMap((g) => g.items);

    /* Keyboard navigation */
    useEffect(() => {
        const handler = (e) => {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedIdx((i) => Math.min(i + 1, flatItems.length - 1));
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedIdx((i) => Math.max(i - 1, 0));
            } else if (e.key === 'Enter') {
                e.preventDefault();
                if (flatItems[selectedIdx]) onSelect(flatItems[selectedIdx].cmd);
            }
        };
        window.addEventListener('keydown', handler, true);
        return () => window.removeEventListener('keydown', handler, true);
    }, [flatItems, selectedIdx, onSelect]);

    /* Reset selection when query changes */
    useEffect(() => { setSelectedIdx(0); }, [query]);

    /* Position within viewport */
    const style = {
        top: Math.min(y, window.innerHeight - 360),
        left: Math.min(x, window.innerWidth - 300),
    };

    if (flatItems.length === 0) return null;

    let globalIdx = 0;

    return (
        <>
            <div style={{ position: 'fixed', inset: 0, zIndex: 999 }} onClick={onClose} />
            <div className="slash-menu" style={style} ref={menuRef}>
                {filteredGroups.map((group) => (
                    <div key={group.group}>
                        <div className="slash-menu-header">{group.group}</div>
                        {group.items.map((item) => {
                            const idx = globalIdx++;
                            const isSelected = idx === selectedIdx;
                            return (
                                <button
                                    key={item.label}
                                    className={`slash-menu-item ${isSelected ? 'selected' : ''}`}
                                    onMouseDown={(e) => { e.preventDefault(); onSelect(item.cmd); }}
                                    onMouseEnter={() => setSelectedIdx(idx)}
                                >
                                    <div className="slash-menu-item-icon">{item.icon}</div>
                                    <div className="slash-menu-item-info">
                                        <div className="slash-menu-item-title">{item.label}</div>
                                        <div className="slash-menu-item-desc">{item.desc}</div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                ))}
            </div>
        </>
    );
}
