import React, { useState, useEffect, useRef } from 'react';

export default function SearchModal({ pages, onClose, onSelect }) {
    const [query, setQuery] = useState('');
    const [selected, setSelected] = useState(0);
    const inputRef = useRef(null);

    useEffect(() => { inputRef.current?.focus(); }, []);

    /* Close on Escape */
    useEffect(() => {
        const handler = (e) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [onClose]);

    const filtered = pages.filter((p) =>
        p.title?.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 12);

    /* Arrow nav */
    const handleKey = (e) => {
        if (e.key === 'ArrowDown') setSelected((s) => Math.min(s + 1, filtered.length - 1));
        if (e.key === 'ArrowUp') setSelected((s) => Math.max(s - 1, 0));
        if (e.key === 'Enter' && filtered[selected]) onSelect(filtered[selected].id);
    };

    return (
        <>
            <div className="search-overlay" onClick={onClose}>
                <div className="search-modal" onClick={(e) => e.stopPropagation()}>
                    <div className="search-input-wrapper">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                        </svg>
                        <input
                            ref={inputRef}
                            className="search-input"
                            placeholder="Search pages…"
                            value={query}
                            onChange={(e) => { setQuery(e.target.value); setSelected(0); }}
                            onKeyDown={handleKey}
                        />
                    </div>

                    <div className="search-results">
                        {filtered.length === 0 ? (
                            <div className="search-empty">No pages found.</div>
                        ) : (
                            filtered.map((page, i) => (
                                <div
                                    key={page.id}
                                    className={`search-result-item ${i === selected ? 'selected' : ''}`}
                                    onClick={() => onSelect(page.id)}
                                    onMouseEnter={() => setSelected(i)}
                                >
                                    <span className="search-result-icon">{page.icon || '📄'}</span>
                                    <span className="search-result-title">{page.title || 'Untitled'}</span>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
