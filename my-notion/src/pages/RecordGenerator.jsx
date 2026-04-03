import React, { useState } from 'react'

export default function RecordGenerator() {
    const [step, setStep] = useState(1) // 1: Input, 2: Editor, 3: Print
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    
    // Form State
    const [username, setUsername] = useState('')
    const [keyword, setKeyword] = useState('')
    const [courseTitle, setCourseTitle] = useState('19EY708 - Career Development And Skills')
    const [studentName, setStudentName] = useState('')
    const [registerNumber, setRegisterNumber] = useState('')
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]) // Automatically sets today's date
    
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

    // Handlers for Step 2 (Editor)
    const handleRepoChange = (id, field, value) => {
        setRepos(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r))
    }

    const moveRepo = (index, direction) => {
        setRepos(prev => {
            const newRepos = [...prev]
            if (direction === 'up' && index > 0) {
                const temp = newRepos[index];
                newRepos[index] = newRepos[index - 1];
                newRepos[index - 1] = temp;
            } else if (direction === 'down' && index < newRepos.length - 1) {
                const temp = newRepos[index];
                newRepos[index] = newRepos[index + 1];
                newRepos[index + 1] = temp;
            }
            return newRepos
        })
    }

    const removeRepo = (id) => {
        setRepos(prev => prev.filter(r => r.id !== id))
    }

    // =========== STEP 3: PRINT VIEW ===========
    if (step === 3) {
        return (
            <div className="record-generator-print-wrapper" style={{ padding: '40px', maxWidth: 'none', margin: '0 auto' }}>
                <div style={{ maxWidth: '900px', margin: '0 auto', background: '#fff', position: 'relative' }}>
                
                <div style={{ position: 'absolute', top: '-10px', right: '0px', fontSize: '11px', color: '#444', fontStyle: 'italic' }}>
                    Made with MyNotion
                </div>
                
                <style>
                    {`
                    @media print {
                        @page { margin: 0; }
                        html, body, #root, .app-layout, .main-content {
                            height: auto !important;
                            overflow: visible !important;
                            display: block !important;
                            margin: 0 !important;
                            padding: 0 !important;
                        }
                        .sidebar, .mobile-header, .no-print { display: none !important; }
                        
                        .record-generator-print-wrapper { 
                            width: 100%; 
                            margin: 0; 
                            padding: 0; 
                        }
                        .record-generator-print-wrapper img[alt="Saveetha Header"] {
                            max-width: 650px !important; 
                        }
                        .record-table { page-break-inside: auto; margin-bottom: 10px !important; }
                        .record-table tr { page-break-inside: avoid; page-break-after: auto; }
                        .record-table th, .record-table td { padding: 5px 8px !important; }
                        .qr-image { width: 55px !important; height: 55px !important; }
                        
                        /* Compress footer margins for print */
                        .record-generator-footer { page-break-inside: avoid; margin-top: 15px !important; }
                        .record-generator-footer p { margin-bottom: 25px !important; }
                        .record-generator-footer .sig-block { margin-bottom: 20px !important; }
                    }
                    @media screen {
                        .record-generator-print-wrapper {
                            position: fixed;
                            top: 0;
                            left: 0;
                            width: 100vw;
                            height: 100vh;
                            overflow-y: auto;
                            z-index: 9999;
                            background-color: #ffffff !important;
                            color: #000000 !important;
                        }
                    }
                    .record-generator-print-wrapper, .record-generator-print-wrapper * {
                        color: #000000 !important;
                    }
                    .record-generator-print-wrapper a {
                        color: #1a0dab !important;
                    }
                    .record-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; background-color: #fff !important; }
                    .record-table th, .record-table td { border: 1px solid #000 !important; padding: 10px; text-align: center; font-size: 14px; background-color: #fff !important; color: #000 !important; }
                    .record-table th { font-weight: bold; background-color: #f8f8f8 !important; }
                    .record-table td.text-left { text-align: left; }
                    .qr-image { width: 70px; height: 70px; object-fit: contain; }
                    `}
                </style>

                {/* Controls */}
                <div className="no-print" style={{ marginBottom: 20, display: 'flex', gap: 10 }}>
                    <button className="btn-secondary" onClick={() => setStep(2)}>← Back to Editor</button>
                    <button className="btn-primary" onClick={() => window.print()}>🖨️ Print to PDF</button>
                </div>

                {/* Header Section from Image */}
                <div style={{ marginBottom: 20, textAlign: 'center', borderBottom: '2px solid #0056b3', paddingBottom: 15 }}>
                    <img src="/HEADER.png" alt="Saveetha Header" style={{ width: '100%', maxWidth: '800px', objectFit: 'contain', display: 'block', margin: '0 auto' }} />
                </div>

                {/* Sub Header */}
                <div style={{ textAlign: 'center', marginBottom: 20 }}>
                    <h2 style={{ fontSize: '20px', margin: '0 0 10px 0' }}>{courseTitle}</h2>
                    <h3 style={{ fontSize: '18px', margin: 0 }}>Table of content</h3>
                </div>

                {/* Table */}
                <table className="record-table">
                    <thead>
                        <tr>
                            <th style={{ width: '5%' }}>Exp</th>
                            <th style={{ width: '15%' }}>Date</th>
                            <th style={{ width: '40%' }}>Name of The Experiment</th>
                            <th style={{ width: '15%' }}>QR Code</th>
                            <th style={{ width: '10%' }}>Mark</th>
                            <th style={{ width: '15%' }}>Signature</th>
                        </tr>
                    </thead>
                    <tbody>
                        {repos.map((repo, idx) => {
                            const expNum = String(idx + 1).padStart(2, '0');
                            const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(repo.url)}`;

                            return (
                                <tr key={repo.id}>
                                    <td>{expNum}</td>
                                    <td>{repo.date}</td>
                                    <td className="text-left">
                                        <div style={{ marginBottom: 5, fontWeight: 'bold', fontSize: '15px' }}>{repo.title}</div>
                                        <a href={repo.url} style={{ color: '#1a0dab', textDecoration: 'none', wordBreak: 'break-all', fontSize: '13px' }} target="_blank" rel="noopener noreferrer">
                                            {repo.url}
                                        </a>
                                    </td>
                                    <td><img src={qrUrl} alt={`QR for ${repo.title}`} className="qr-image" /></td>
                                    <td></td>
                                    <td></td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>

                {/* Footer Declaration */}
                <div className="record-generator-footer" style={{ marginTop: 25, fontSize: '14px', fontWeight: 'bold', color: '#000' }}>
                    <p style={{ marginBottom: 35, color: '#000' }}>I confirm that the experiments and GitHub links provided are entirely my own work.</p>
                    
                    <div className="sig-block" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 25, color: '#000' }}>
                        <div style={{color: '#000'}}>Name : {studentName}</div>
                        <div style={{color: '#000'}}>Register Number : {registerNumber}</div>
                    </div>
                    
                    <div className="sig-block" style={{ display: 'flex', justifyContent: 'space-between', color: '#000' }}>
                        <div style={{color: '#000'}}>Date : {date}</div>
                        <div style={{color: '#000'}}>Learner's Signature</div>
                    </div>
                </div>
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
                        <button className="btn-primary" onClick={() => setStep(3)}>Continue to Print ✨</button>
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {repos.length === 0 && (
                        <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', border: '1px dashed var(--border)', borderRadius: 12 }}>
                            All experiments removed. Go back and fetch again!
                        </div>
                    )}
                    {repos.map((repo, idx) => (
                        <div key={repo.id} style={{ 
                            display: 'flex', gap: 15, background: 'var(--bg-secondary)', 
                            padding: 16, borderRadius: 12, border: '1px solid var(--border)',
                            alignItems: 'center',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                        }}>
                            {/* Numbering */}
                            <div style={{ 
                                width: 32, height: 32, borderRadius: 8, background: 'var(--bg-active)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontWeight: 'bold', color: 'var(--accent)', flexShrink: 0
                            }}>
                                {idx + 1}
                            </div>
                            
                            {/* Inputs */}
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
                                <div>
                                    <input 
                                        value={repo.title}
                                        onChange={(e) => handleRepoChange(repo.id, 'title', e.target.value)}
                                        className="form-input"
                                        style={{ width: '100%', fontWeight: 600, padding: '8px 12px' }}
                                        placeholder="Experiment Title"
                                    />
                                </div>
                                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                                    <input 
                                        value={repo.date}
                                        onChange={(e) => handleRepoChange(repo.id, 'date', e.target.value)}
                                        className="form-input"
                                        style={{ width: 140, fontSize: 13, padding: '6px 10px' }}
                                        placeholder="DD/MM/YYYY"
                                    />
                                    <a href={repo.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: 'var(--text-muted)', textDecoration: 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 300 }}>
                                        {repo.url}
                                    </a>
                                </div>
                            </div>
                            
                            {/* Controls */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0 }}>
                                <div style={{ display: 'flex', gap: 4 }}>
                                    <button 
                                        className="btn-secondary" 
                                        style={{ padding: '6px 10px' }} 
                                        onClick={() => moveRepo(idx, 'up')}
                                        disabled={idx === 0}
                                        title="Move Up"
                                    >↑</button>
                                    <button 
                                        className="btn-secondary" 
                                        style={{ padding: '6px 10px' }} 
                                        onClick={() => moveRepo(idx, 'down')}
                                        disabled={idx === repos.length - 1}
                                        title="Move Down"
                                    >↓</button>
                                </div>
                                <button 
                                    className="btn-secondary" 
                                    style={{ padding: '6px 10px', color: 'var(--danger)', borderColor: 'var(--danger)' }} 
                                    onClick={() => removeRepo(repo.id)}
                                    title="Remove"
                                >🗑️ Remove</button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )
    }

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

    // =========== STEP 1: INPUT FORM ===========
    return (
        <div className="page-container" style={{ maxWidth: 650, margin: '0 auto', paddingTop: 60, paddingBottom: 60 }}>
            <div style={{ textAlign: 'center', marginBottom: 40 }}>
                <h1 className="page-title" style={{ fontSize: '32px', marginBottom: 10 }}>Record Generator</h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>
                    Automatically fetch your GitHub repositories and generate a beautifully formatted Record Note PDF template complete with QR codes.
                </p>
            </div>

            <form onSubmit={fetchRepos} style={{ 
                display: 'flex', flexDirection: 'column', gap: 24, 
                background: 'var(--bg-card)', padding: '35px', 
                borderRadius: '20px', border: '1px solid var(--border)',
                boxShadow: '0 8px 30px rgba(0,0,0,0.08)'
            }}>
                {error && <div style={{ color: 'var(--danger)', padding: 12, border: '1px solid var(--danger)', borderRadius: 10, background: 'var(--danger-light)' }}>{error}</div>}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                    <div>
                        <label className="form-label" style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>GitHub Username <span style={{color:'var(--accent)'}}>*</span></label>
                        <input required style={premiumInputStyle} value={username} onChange={e => setUsername(e.target.value)} placeholder="Add here"
                               onFocus={e => e.target.style.borderColor = 'var(--accent)'} onBlur={e => e.target.style.borderColor = 'var(--border)'} />
                    </div>
                    <div>
                        <label className="form-label" style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Keyword Filter <span style={{color:'var(--accent)'}}>*</span></label>
                        <input required style={premiumInputStyle} value={keyword} onChange={e => setKeyword(e.target.value)} placeholder="Add here"
                               onFocus={e => e.target.style.borderColor = 'var(--accent)'} onBlur={e => e.target.style.borderColor = 'var(--border)'} />
                    </div>
                </div>

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
                    background: 'linear-gradient(135deg, #7c5cfc, #06b6d4)', border: 'none', borderRadius: '12px'
                }}>
                    {loading ? 'Fetching from GitHub...' : 'Review & Edit Experiments ✨'}
                </button>
            </form>
        </div>
    )
}
