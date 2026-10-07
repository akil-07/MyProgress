import React, { useState } from 'react'
import {
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const SortableItem = ({ id, repo, idx, handleRepoChange, removeRepo }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        display: 'flex', gap: 16, 
        background: isDragging ? 'rgba(30, 30, 35, 0.8)' : 'rgba(255, 255, 255, 0.02)', 
        backdropFilter: 'blur(12px)',
        padding: '20px', 
        borderRadius: '16px', 
        border: '1px solid rgba(255, 255, 255, 0.06)',
        alignItems: 'center',
        boxShadow: isDragging ? '0 15px 35px rgba(0,0,0,0.4), 0 0 0 1px var(--accent)' : '0 4px 20px rgba(0,0,0,0.15)',
        zIndex: isDragging ? 999 : 1,
        position: isDragging ? 'relative' : 'static'
    };

    const inputStyle = {
        background: 'rgba(0, 0, 0, 0.2)', 
        border: '1px solid rgba(255, 255, 255, 0.05)',
        color: '#fff', 
        borderRadius: '10px', 
        outline: 'none', 
        transition: 'all 0.2s ease',
        boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)'
    };

    const inputFocus = (e) => {
        e.target.style.borderColor = 'var(--accent)';
        e.target.style.background = 'rgba(0, 0, 0, 0.4)';
        e.target.style.boxShadow = '0 0 0 3px rgba(var(--accent-rgb), 0.15), inset 0 2px 4px rgba(0,0,0,0.1)';
    };
    const inputBlur = (e) => {
        e.target.style.borderColor = 'rgba(255, 255, 255, 0.05)';
        e.target.style.background = 'rgba(0, 0, 0, 0.2)';
        e.target.style.boxShadow = 'inset 0 2px 4px rgba(0,0,0,0.1)';
    };

    return (
        <div ref={setNodeRef} style={style} className="sortable-row-premium">
            {/* Drag Handle */}
            <div 
                {...attributes} 
                {...listeners} 
                style={{ 
                    color: 'rgba(255, 255, 255, 0.2)', display: 'flex', alignItems: 'center', 
                    cursor: 'grab', touchAction: 'none', padding: '5px',
                    transition: 'color 0.2s'
                }} 
                onMouseOver={e => e.currentTarget.style.color = 'var(--accent)'}
                onMouseOut={e => e.currentTarget.style.color = 'rgba(255, 255, 255, 0.2)'}
                title="Drag to reorder"
            >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="9" cy="12" r="1.5"></circle>
                  <circle cx="9" cy="5" r="1.5"></circle>
                  <circle cx="9" cy="19" r="1.5"></circle>
                  <circle cx="15" cy="12" r="1.5"></circle>
                  <circle cx="15" cy="5" r="1.5"></circle>
                  <circle cx="15" cy="19" r="1.5"></circle>
                </svg>
            </div>
            
            {/* Numbering */}
            <div style={{ 
                width: 36, height: 36, borderRadius: '10px', 
                background: 'linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.01))',
                border: '1px solid rgba(255,255,255,0.05)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 'bold', color: 'var(--accent)', flexShrink: 0,
                fontSize: '15px',
                boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.1)'
            }}>
                {idx + 1}
            </div>
            
            {/* Inputs */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                    <input 
                        value={repo.title}
                        onChange={(e) => handleRepoChange(repo.id, 'title', e.target.value)}
                        style={{ ...inputStyle, width: '100%', fontWeight: 500, padding: '10px 14px', fontSize: '15px', letterSpacing: '0.3px' }}
                        onFocus={inputFocus} onBlur={inputBlur}
                        placeholder="Experiment Title"
                    />
                </div>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <div style={{ position: 'relative', width: 140 }}>
                        <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)', pointerEvents: 'none' }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                        </div>
                        <input 
                            value={repo.date}
                            onChange={(e) => handleRepoChange(repo.id, 'date', e.target.value)}
                            style={{ ...inputStyle, width: '100%', fontSize: '13px', padding: '8px 10px 8px 34px' }}
                            onFocus={inputFocus} onBlur={inputBlur}
                            placeholder="DD/MM/YYYY"
                        />
                    </div>
                    <div style={{ position: 'relative', flex: 1 }}>
                         <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)', pointerEvents: 'none' }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
                        </div>
                        <input 
                            value={repo.url}
                            onChange={(e) => handleRepoChange(repo.id, 'url', e.target.value)}
                            style={{ ...inputStyle, width: '100%', fontSize: '13px', padding: '8px 10px 8px 34px', color: 'rgba(255,255,255,0.7)' }}
                            onFocus={inputFocus} onBlur={inputBlur}
                            placeholder="Paste Link (https://...)"
                        />
                    </div>
                </div>
            </div>
            
            {/* Controls */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0, paddingLeft: '4px' }}>
                <button 
                    style={{ 
                        background: 'transparent', border: 'none', 
                        color: 'rgba(255, 255, 255, 0.2)', cursor: 'pointer',
                        padding: '10px', borderRadius: '10px',
                        transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}
                    onMouseOver={(e) => { e.currentTarget.style.color = '#ff453a'; e.currentTarget.style.background = 'rgba(255, 69, 58, 0.1)' }}
                    onMouseOut={(e) => { e.currentTarget.style.color = 'rgba(255, 255, 255, 0.2)'; e.currentTarget.style.background = 'transparent' }}
                    onClick={() => removeRepo(repo.id)}
                    title="Remove Experiment"
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line>
                    </svg>
                </button>
            </div>
        </div>
    );
}

export default function RecordGenerator() {
    const [activeTab, setActiveTab] = useState('auto') // 'auto' | 'manual' | 'history'
    const [historyData, setHistoryData] = useState(() => {
        try { return JSON.parse(localStorage.getItem('record_history')) || [] } catch { return [] }
    })
    const [step, setStep] = useState(1) // 1: Input, 1.5: Select Repos, 2: Editor, 3: Print
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [allFetchedRepos, setAllFetchedRepos] = useState([])
    const [selectedImportIds, setSelectedImportIds] = useState([])
    const [searchTerm, setSearchTerm] = useState('')

    // Premium input styling
    const premiumInputStyle = {
        width: '100%',
        padding: '12px 16px',
        borderRadius: '10px',
        border: '1.5px solid var(--border)',
        background: 'var(--bg-secondary)',
        color: 'var(--text-primary)',
        fontSize: '14px',
        outline: 'none',
        transition: 'all 0.2s',
    }
    
    // Form State
    const [username, setUsername] = useState('')
    const [keyword, setKeyword] = useState('')
    const [courseTitle, setCourseTitle] = useState('19EY708 - Career Development And Skills')
    const [studentName, setStudentName] = useState('')
    const [registerNumber, setRegisterNumber] = useState('')
    const [date, setDate] = useState('') // Blank by default, can be filled if needed
    
    // Repos data (flattened for easy editing)
    const [repos, setRepos] = useState([])

    const fetchRepos = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        try {
            const res = await fetch(`https://api.github.com/users/${username}/repos?per_page=100&sort=created&direction=asc`)
            if (!res.ok) {
                if (res.status === 404) throw new Error("GitHub user not found.")
                else throw new Error("Failed to fetch repositories.")
            }
            const data = await res.json()

            // Filter by keyword in name or description
            const filtered = data.filter(r => {
                const nameMatch = r.name?.toLowerCase().includes(keyword.toLowerCase())
                const descMatch = r.description?.toLowerCase().includes(keyword.toLowerCase())
                return nameMatch || descMatch
            })

            if (filtered.length === 0) {
                throw new Error("No repositories found containing that keyword.")
            }

            // Map to editable format
            const editableData = filtered.map(r => ({
                id: r.id,
                title: r.description || r.name,
                date: new Date(r.created_at).toLocaleDateString('en-GB'),
                url: r.html_url
            }))

            setRepos(editableData)
            setStep(2) // Go to Editor!
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const fetchAccountRepos = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError(null)
        try {
            const res = await fetch(`https://api.github.com/users/${username}/repos?per_page=100&sort=created&direction=desc`)
            if (!res.ok) throw new Error("GitHub user not found.")
            const data = await res.json()
            if (data.length === 0) throw new Error("No repositories found.")
            setAllFetchedRepos(data.map(r => ({
                id: r.id,
                title: r.description || r.name,
                date: new Date(r.created_at).toLocaleDateString('en-GB'),
                url: r.html_url
            })))
            setSelectedImportIds([]) // reset
            setStep(1.5)
        } catch (err) { setError(err.message) }
        finally { setLoading(false) }
    }

    const confirmImport = () => {
        const selected = allFetchedRepos.filter(r => selectedImportIds.includes(r.id))
        setRepos(selected)
        setStep(2)
    }

    const toggleImportId = (id) => {
        setSelectedImportIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])
    }

    const startManualEntry = (e) => {
        e.preventDefault()
        // Provide one blank row immediately
        setRepos([{ id: Date.now(), title: '', date: new Date().toLocaleDateString('en-GB'), url: '' }])
        setStep(2)
    }

    const addNewRepo = () => {
        setRepos(prev => [...prev, { id: Date.now(), title: '', date: new Date().toLocaleDateString('en-GB'), url: '' }])
    }

    // Handlers for Step 2 (Editor)
    const handleRepoChange = (id, field, value) => {
        setRepos(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r))
    }

    const removeRepo = (id) => {
        setRepos(prev => prev.filter(r => r.id !== id))
    }

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = (event) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            setRepos((items) => {
                const oldIndex = items.findIndex((item) => item.id === active.id);
                const newIndex = items.findIndex((item) => item.id === over.id);
                return arrayMove(items, oldIndex, newIndex);
            });
        }
    };

    const handleProceedToPrint = () => {
        const newEntry = {
            id: Date.now(),
            username, keyword, courseTitle, studentName, registerNumber, date, repos,
            savedAt: new Date().toLocaleString()
        }
        // Save to local storage
        const updated = [newEntry, ...historyData].slice(0, 30) // Keep last 30
        setHistoryData(updated)
        localStorage.setItem('record_history', JSON.stringify(updated))
        setStep(3)
    }

    const loadFromHistory = (entry) => {
        setUsername(entry.username || '')
        setKeyword(entry.keyword || '')
        setCourseTitle(entry.courseTitle || '')
        setStudentName(entry.studentName || '')
        setRegisterNumber(entry.registerNumber || '')
        setDate(entry.date || '')
        setRepos(entry.repos || [])
        setStep(2) // Jump directly to editor
        setActiveTab('auto')
    }

    const deleteHistoryItem = (id) => {
        const updated = historyData.filter(h => h.id !== id)
        setHistoryData(updated)
        localStorage.setItem('record_history', JSON.stringify(updated))
    }

    // =========== STEP 3: PRINT VIEW ===========
    if (step === 3) {
        return (
            <div className="record-generator-print-wrapper">
                <style>
                    {`
                    @media print {
                        @page { margin: 15mm; }
                        html, body, #root, .app-layout, .main-content {
                            height: auto !important;
                            overflow: visible !important;
                            display: block !important;
                            margin: 0 !important;
                            padding: 0 !important;
                            background: #fff !important;
                        }
                        .sidebar, .mobile-header, .top-bar, .no-print { display: none !important; }
                        
                        .record-generator-print-wrapper { width: 100%; margin: 0; padding: 0; background: #fff !important; }
                        .document-paper { box-shadow: none !important; padding: 0 !important; margin: 0 !important; border-radius: 0 !important; }
                        .record-table { page-break-inside: auto; }
                        .record-table tr { page-break-inside: avoid; page-break-after: auto; }
                        .record-generator-footer { page-break-inside: avoid; }
                    }
                    @media screen {
                        .record-generator-print-wrapper {
                            position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
                            overflow-y: auto; z-index: 9999;
                            background-color: var(--bg-primary);
                            padding-bottom: 80px;
                        }
                        .document-paper {
                            box-shadow: 0 25px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.05);
                            border-radius: 12px;
                            margin: 120px auto 40px auto !important; /* space for top bar */
                        }
                        .top-bar {
                            position: fixed; top: 0; left: 0; width: 100%; height: 80px;
                            background: rgba(10,10,12, 0.7); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
                            border-bottom: 1px solid rgba(255,255,255,0.08);
                            display: flex; align-items: center; justify-content: center; gap: 20px;
                            z-index: 10000;
                            box-shadow: 0 4px 30px rgba(0,0,0,0.3);
                        }
                    }
                    
                    /* General Document Styling */
                    .document-paper {
                        background: #ffffff;
                        color: #0f172a;
                        font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                        padding: 60px 70px;
                        max-width: 950px;
                        position: relative;
                        box-sizing: border-box;
                    }
                    .document-paper * { color: #0f172a; }
                    .document-paper h2 { font-weight: 800; color: #020617; letter-spacing: -0.5px; }
                    .document-paper h3 { font-weight: 600; color: #334155; text-transform: uppercase; letter-spacing: 1.5px; font-size: 14px; margin-top: 5px; }
                    
                    /* Table Styling */
                    .record-table { width: 100%; border-collapse: collapse; margin-top: 35px; margin-bottom: 40px; border: 2px solid #0f172a; }
                    .record-table th, .record-table td { border: 1px solid #cbd5e1; padding: 14px 16px; text-align: center; vertical-align: middle; }
                    .record-table th { background-color: #f8fafc !important; font-weight: 700; text-transform: uppercase; font-size: 12px; letter-spacing: 0.8px; color: #0f172a !important; border-bottom: 2px solid #0f172a !important; }
                    .record-table td { font-size: 14px; color: #1e293b; background-color: #ffffff; }
                    .record-table td.text-left { text-align: left; }
                    .record-table tr:nth-child(even) td { background-color: #fafafa; }
                    
                    /* Link and QR */
                    .document-paper a { color: #2563eb !important; text-decoration: none; font-weight: 600; transition: color 0.2s; }
                    .document-paper a:hover { color: #1d4ed8 !important; text-decoration: underline; }
                    .qr-image-container { display: inline-flex; padding: 5px; border: 1px solid #e2e8f0; border-radius: 8px; background: #fff; box-shadow: 0 2px 4px rgba(0,0,0,0.02); }
                    .qr-image { width: 65px; height: 65px; object-fit: contain; mix-blend-mode: multiply; }
                    
                    /* Footer Styling */
                    .record-generator-footer { font-size: 15px; font-weight: 500; margin-top: 50px; line-height: 1.6; }
                    .sig-block { display: flex; justify-content: space-between; margin-bottom: 30px; align-items: flex-end; }
                    .sig-label { font-weight: 600; color: #334155; }
                    .dotted-line { flex: 1; border-bottom: 1px dashed #cbd5e1; margin: 0 15px; transform: translateY(-4px); }
                    .sig-value { font-weight: 700; color: #0f172a; font-size: 16px; }
                    `}
                </style>

                {/* Floating Top Bar for Screen */}
                <div className="top-bar">
                    <button className="btn-secondary" onClick={() => setStep(2)} style={{ padding: '12px 24px', borderRadius: '12px', fontSize: '15px', fontWeight: 600 }}>
                        <span style={{ marginRight: '8px' }}>←</span> Back to Editor
                    </button>
                    <button className="btn-primary" onClick={() => window.print()} style={{ padding: '12px 28px', borderRadius: '12px', fontSize: '15px', fontWeight: 600, boxShadow: '0 4px 15px var(--accent-light)' }}>
                        <span style={{ marginRight: '8px' }}>🖨️</span> Print PDF
                    </button>
                </div>

                {/* Actual Document Paper */}
                <div className="document-paper">
                    <div style={{ position: 'absolute', top: '25px', right: '35px', fontSize: '11px', color: '#94a3b8', fontStyle: 'italic', fontWeight: 500, letterSpacing: '0.5px' }}>
                        Generated with MyNotion
                    </div>

                    {/* Header Section */}
                    <div style={{ marginBottom: 30, textAlign: 'center', borderBottom: '3px solid #1e3a8a', paddingBottom: 25 }}>
                        <img src="/HEADER.png" alt="Saveetha Header" style={{ width: '100%', maxWidth: '750px', objectFit: 'contain', display: 'block', margin: '0 auto' }} />
                    </div>

                    {/* Sub Header */}
                    <div style={{ textAlign: 'center', marginBottom: 35 }}>
                        <h2 style={{ fontSize: '22px', margin: '0 0 8px 0' }}>{courseTitle}</h2>
                        <h3 style={{ margin: 0 }}>Table of content</h3>
                    </div>

                    {/* Table */}
                    <table className="record-table">
                        <thead>
                            <tr>
                                <th style={{ width: '6%' }}>Exp</th>
                                <th style={{ width: '14%' }}>Date</th>
                                <th style={{ width: '38%' }}>Name of The Experiment</th>
                                <th style={{ width: '14%' }}>QR Code</th>
                                <th style={{ width: '13%' }}>Mark</th>
                                <th style={{ width: '15%' }}>Signature</th>
                            </tr>
                        </thead>
                        <tbody>
                            {repos.map((repo, idx) => {
                                const expNum = String(idx + 1).padStart(2, '0');
                                const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(repo.url)}`;

                                return (
                                    <tr key={repo.id}>
                                        <td style={{ fontWeight: 600, color: '#475569' }}>{expNum}</td>
                                        <td style={{ fontWeight: 500 }}>{repo.date}</td>
                                        <td className="text-left">
                                            <div style={{ marginBottom: 8, fontWeight: 700, fontSize: '15px', color: '#0f172a' }}>{repo.title}</div>
                                            <a href={repo.url} style={{ fontSize: '13px', wordBreak: 'break-all', display: 'inline-block', lineHeight: 1.4 }} target="_blank" rel="noopener noreferrer">
                                                {repo.url}
                                            </a>
                                        </td>
                                        <td>
                                            <div className="qr-image-container">
                                                <img src={qrUrl} alt={`QR for ${repo.title}`} className="qr-image" />
                                            </div>
                                        </td>
                                        <td></td>
                                        <td></td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>

                    {/* Footer Declaration */}
                    <div className="record-generator-footer">
                        <p style={{ marginBottom: 45, textAlign: 'center', color: '#334155', fontStyle: 'italic' }}>
                            "I confirm that the experiments and GitHub links provided are entirely my own work."
                        </p>
                        
                        <div className="sig-block">
                            <div style={{ display: 'flex', flex: 1, alignItems: 'flex-end', paddingRight: '20px' }}>
                                <span className="sig-label">Name:</span>
                                <span className="dotted-line"></span>
                                <span className="sig-value">{studentName}</span>
                            </div>
                            <div style={{ display: 'flex', flex: 1, alignItems: 'flex-end', paddingLeft: '20px' }}>
                                <span className="sig-label">Register No:</span>
                                <span className="dotted-line"></span>
                                <span className="sig-value">{registerNumber}</span>
                            </div>
                        </div>
                        
                        <div className="sig-block" style={{ marginTop: '40px' }}>
                            <div style={{ display: 'flex', flex: 1, alignItems: 'flex-end', paddingRight: '20px' }}>
                                <span className="sig-label">Date:</span>
                                <span className="dotted-line"></span>
                                <span className="sig-value">{date}</span>
                            </div>
                            <div style={{ display: 'flex', flex: 1, alignItems: 'flex-end', paddingLeft: '20px' }}>
                                <span className="sig-label">Learner's Signature:</span>
                                <span className="dotted-line"></span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    // =========== STEP 1.5: SELECT REPOS VIEW ===========
    if (step === 1.5) {
        return (
            <div className="page-container" style={{ maxWidth: 800, margin: '0 auto', paddingTop: 40, paddingBottom: 60 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 }}>
                    <div>
                        <h1 className="page-title" style={{ marginBottom: 5 }}>Select Repositories</h1>
                        <p style={{ color: 'var(--text-secondary)' }}>Choose exactly which repositories you want to include in your record.</p>
                    </div>
                    <div style={{ display: 'flex', gap: 10 }}>
                        <button className="btn-secondary" onClick={() => setStep(1)}>Back</button>
                        <button className="btn-primary" onClick={confirmImport} disabled={selectedImportIds.length === 0}>
                            Import {selectedImportIds.length > 0 ? selectedImportIds.length : ''} Items ✨
                        </button>
                    </div>
                </div>

                <div style={{ marginBottom: 20 }}>
                    <input 
                        type="search"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ ...premiumInputStyle, padding: '14px 16px', fontSize: '15px' }}
                        placeholder="🔍 Search fetched repositories by name..."
                        onFocus={e => e.target.style.borderColor = 'var(--accent)'} 
                        onBlur={e => e.target.style.borderColor = 'var(--border)'}
                    />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15 }}>
                    {allFetchedRepos.filter(r => r.title.toLowerCase().includes(searchTerm.toLowerCase())).map(repo => {
                        const isSelected = selectedImportIds.includes(repo.id);
                        return (
                            <div 
                                key={repo.id} 
                                onClick={() => toggleImportId(repo.id)}
                                style={{ 
                                    padding: '16px', borderRadius: '12px', border: `2px solid ${isSelected ? 'var(--accent)' : 'var(--border)'}`,
                                    background: isSelected ? 'var(--bg-active)' : 'var(--bg-card)',
                                    cursor: 'pointer', transition: 'all 0.2s', display: 'flex', gap: '15px'
                                }}
                            >
                                <div style={{ 
                                    width: '20px', height: '20px', borderRadius: '4px', marginTop: '2px',
                                    border: `2px solid ${isSelected ? 'var(--accent)' : 'var(--text-muted)'}`,
                                    background: isSelected ? 'var(--accent)' : 'transparent',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}>
                                    {isSelected && <span style={{ color: '#fff', fontSize: '14px', lineHeight: 1 }}>✓</span>}
                                </div>
                                <div style={{ overflow: 'hidden' }}>
                                    <h4 style={{ margin: '0 0 5px 0', fontSize: '15px', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{repo.title}</h4>
                                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{repo.date}</div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        )
    }

    // =========== STEP 2: EDITOR VIEW ===========
    if (step === 2) {
        return (
            <div className="page-container" style={{ maxWidth: 800, margin: '0 auto', paddingTop: 40, paddingBottom: 60 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 }}>
                    <div>
                        <h1 className="page-title" style={{ marginBottom: 5 }}>Edit Experiments</h1>
                        <p style={{ color: 'var(--text-secondary)' }}>Review, edit, and reorder your fetched GitHub records before generating the final template.</p>
                    </div>
                    <div style={{ display: 'flex', gap: 10 }}>
                        <button className="btn-secondary" onClick={() => setStep(1)}>Cancel</button>
                        <button className="btn-primary" onClick={handleProceedToPrint}>Continue to Print ✨</button>
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {repos.length === 0 && (
                        <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', border: '1px dashed var(--border)', borderRadius: 12 }}>
                            All experiments removed. Go back and fetch again!
                        </div>
                    )}
                    
                    <DndContext 
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                    >
                        <SortableContext 
                            items={repos.map(r => r.id)}
                            strategy={verticalListSortingStrategy}
                        >
                            {repos.map((repo, idx) => (
                                <SortableItem 
                                    key={repo.id} 
                                    id={repo.id} 
                                    repo={repo} 
                                    idx={idx} 
                                    handleRepoChange={handleRepoChange} 
                                    removeRepo={removeRepo} 
                                />
                            ))}
                        </SortableContext>
                    </DndContext>
                    
                    <div style={{ display: 'flex', justifyContent: 'center', marginTop: 10 }}>
                        <button className="btn-secondary" onClick={addNewRepo} style={{ padding: '12px 20px', borderStyle: 'dashed', width: '100%', fontWeight: 600 }}>
                            + Add Custom Experiment Row
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    // =========== STEP 1: INPUT FORM & HISTORY ===========
    return (
        <div className="page-container" style={{ maxWidth: 650, margin: '0 auto', paddingTop: 60, paddingBottom: 60 }}>
            <div style={{ textAlign: 'center', marginBottom: 30 }}>
                <h1 className="page-title" style={{ fontSize: '32px', marginBottom: 10 }}>Record Generator</h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>
                    Automatically fetch your GitHub repositories and generate a beautifully formatted Record Note PDF template complete with QR codes.
                </p>
            </div>

            {/* Toggle Tabs */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginBottom: 35 }}>
                <button 
                    onClick={() => setActiveTab('auto')} 
                    style={{ padding: '8px 20px', borderRadius: 20, border: 'none', cursor: 'pointer', fontWeight: 600, transition: 'all 0.2s', background: activeTab === 'auto' ? 'var(--accent)' : 'var(--bg-secondary)', color: activeTab === 'auto' ? '#fff' : 'var(--text-secondary)' }}
                >🤖 Auto (GitHub)</button>
                <button 
                    onClick={() => setActiveTab('import')} 
                    style={{ padding: '8px 20px', borderRadius: 20, border: 'none', cursor: 'pointer', fontWeight: 600, transition: 'all 0.2s', background: activeTab === 'import' ? 'var(--accent)' : 'var(--bg-secondary)', color: activeTab === 'import' ? '#fff' : 'var(--text-secondary)' }}
                >📥 Import</button>
                <button 
                    onClick={() => setActiveTab('manual')} 
                    style={{ padding: '8px 20px', borderRadius: 20, border: 'none', cursor: 'pointer', fontWeight: 600, transition: 'all 0.2s', background: activeTab === 'manual' ? 'var(--accent)' : 'var(--bg-secondary)', color: activeTab === 'manual' ? '#fff' : 'var(--text-secondary)' }}
                >✍️ Manual Entry</button>
                <button 
                    onClick={() => setActiveTab('history')} 
                    style={{ padding: '8px 20px', borderRadius: 20, border: 'none', cursor: 'pointer', fontWeight: 600, transition: 'all 0.2s', background: activeTab === 'history' ? 'var(--accent)' : 'var(--bg-secondary)', color: activeTab === 'history' ? '#fff' : 'var(--text-secondary)' }}
                >⏳ History ({historyData.length})</button>
            </div>

            {activeTab === 'history' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {historyData.length === 0 ? (
                        <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', border: '1px dashed var(--border)', borderRadius: 12 }}>
                            No saved records found. Create one first!
                        </div>
                    ) : (
                        historyData.map(entry => (
                            <div key={entry.id} style={{ 
                                background: 'var(--bg-card)', padding: 20, borderRadius: 16, border: '1px solid var(--border)',
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                            }}>
                                <div>
                                    <h3 style={{ margin: '0 0 6px 0', fontSize: 16 }}>{entry.courseTitle || 'Untitled Course'}</h3>
                                    <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                                        Saved on {entry.savedAt} • {entry.repos?.length || 0} Exps
                                    </div>
                                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                                        {entry.studentName} ({entry.registerNumber})
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: 8 }}>
                                    <button onClick={() => deleteHistoryItem(entry.id)} className="btn-secondary" style={{ padding: '8px', color: 'var(--danger)', borderColor: 'var(--danger)' }} title="Delete">🗑️</button>
                                    <button onClick={() => loadFromHistory(entry)} className="btn-primary" style={{ padding: '8px 16px' }}>Load & Print</button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {(activeTab === 'auto' || activeTab === 'import' || activeTab === 'manual') && (
                <form onSubmit={activeTab === 'auto' ? fetchRepos : activeTab === 'import' ? fetchAccountRepos : startManualEntry} style={{ 
                    display: 'flex', flexDirection: 'column', gap: 24, 
                    background: 'var(--bg-card)', padding: '35px', 
                    backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
                    borderRadius: '20px', border: '1px solid var(--border)',
                    boxShadow: 'var(--shadow-lg), 0 0 0 1px rgba(255, 255, 255, 0.05) inset'
                }}>
                {error && <div style={{ color: 'var(--danger)', padding: 12, border: '1px solid var(--danger)', borderRadius: 10, background: 'var(--danger-light)' }}>{error}</div>}

                {(activeTab === 'auto' || activeTab === 'import') && (
                    <div style={{ display: 'grid', gridTemplateColumns: activeTab === 'import' ? '1fr' : '1fr 1fr', gap: 20 }}>
                        <div>
                            <label className="form-label" style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>GitHub Username <span style={{color:'var(--accent)'}}>*</span></label>
                            <input required style={premiumInputStyle} value={username} onChange={e => setUsername(e.target.value)} placeholder="Add here"
                                   onFocus={e => e.target.style.borderColor = 'var(--accent)'} onBlur={e => e.target.style.borderColor = 'var(--border)'} />
                        </div>
                        {activeTab === 'auto' && (
                            <div>
                                <label className="form-label" style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Keyword Filter <span style={{color:'var(--accent)'}}>*</span></label>
                                <input required style={premiumInputStyle} value={keyword} onChange={e => setKeyword(e.target.value)} placeholder="Add here"
                                       onFocus={e => e.target.style.borderColor = 'var(--accent)'} onBlur={e => e.target.style.borderColor = 'var(--border)'} />
                            </div>
                        )}
                    </div>
                )}

                <div>
                    <label className="form-label" style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Course Title</label>
                    <input style={premiumInputStyle} value={courseTitle} onChange={e => setCourseTitle(e.target.value)} placeholder="Add here"
                           onFocus={e => e.target.style.borderColor = 'var(--accent)'} onBlur={e => e.target.style.borderColor = 'var(--border)'} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                    <div>
                        <label className="form-label" style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Your Name <span style={{color:'var(--accent)'}}>*</span></label>
                        <input required style={premiumInputStyle} value={studentName} onChange={e => setStudentName(e.target.value)} placeholder="Add here"
                               onFocus={e => e.target.style.borderColor = 'var(--accent)'} onBlur={e => e.target.style.borderColor = 'var(--border)'} />
                    </div>
                    <div>
                        <label className="form-label" style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Register Number <span style={{color:'var(--accent)'}}>*</span></label>
                        <input required style={premiumInputStyle} value={registerNumber} onChange={e => setRegisterNumber(e.target.value)} placeholder="Add here"
                               onFocus={e => e.target.style.borderColor = 'var(--accent)'} onBlur={e => e.target.style.borderColor = 'var(--border)'} />
                    </div>
                </div>

                <div>
                    <label className="form-label" style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Date of Submission</label>
                    <input type="date" style={premiumInputStyle} value={date} onChange={e => setDate(e.target.value)}
                           onFocus={e => e.target.style.borderColor = 'var(--accent)'} onBlur={e => e.target.style.borderColor = 'var(--border)'} />
                </div>

                <button type="submit" className="btn-primary" disabled={loading} style={{ 
                    marginTop: 10, padding: '14px', fontSize: '15px', fontWeight: 600,
                    background: 'var(--accent-gradient)', border: 'none', borderRadius: '12px',
                    boxShadow: '0 4px 15px var(--accent-light)', color: '#fff', cursor: 'pointer', transition: 'all 0.2s'
                }}>
                    {activeTab === 'auto' ? (loading ? 'Fetching from GitHub...' : 'Review & Edit Experiments ✨') 
                    : activeTab === 'import' ? (loading ? 'Fetching Repositories...' : 'Fetch My Repositories ✨') 
                    : 'Start Manual Entry ✨'}
                </button>
            </form>
            )}
        </div>
    )
}
