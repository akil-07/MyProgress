import React, { useState, useRef, useEffect } from 'react'

export default function MusicPlayer() {
    const [isOpen, setIsOpen] = useState(false)
    const [playlist, setPlaylist] = useState([])
    const [currentTrackIdx, setCurrentTrackIdx] = useState(0)
    const [isPlaying, setIsPlaying] = useState(false)
    const [isDragging, setIsDragging] = useState(false)
    
    const audioRef = useRef(null)
    const fileInputRef = useRef(null)

    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = 0.5
        }
    }, [])

    const handleFiles = (filesArray) => {
        if (filesArray.length === 0) return

        const newTracks = filesArray.filter(f => f.type.startsWith('audio/')).map(file => ({
            name: file.name.replace(/\.[^/.]+$/, ""), // remove extension
            url: URL.createObjectURL(file), // create temporary URL
        }))

        if (newTracks.length === 0) return;

        setPlaylist(prev => {
            const newList = [...prev, ...newTracks]
            if (prev.length === 0) setCurrentTrackIdx(0)
            return newList
        })
    }

    const handleFileUpload = (e) => {
        handleFiles(Array.from(e.target.files))
    }

    const onDrop = (e) => {
        e.preventDefault()
        setIsDragging(false)
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFiles(Array.from(e.dataTransfer.files))
        }
    }

    const onDragOver = (e) => {
        e.preventDefault()
        setIsDragging(true)
    }

    const onDragLeave = () => setIsDragging(false)

    const playPause = () => {
        if (!audioRef.current || playlist.length === 0) return
        
        if (isPlaying) {
            audioRef.current.pause()
        } else {
            audioRef.current.play().catch(e => console.error("Playback failed:", e))
        }
        setIsPlaying(!isPlaying)
    }

    const playNext = () => {
        if (playlist.length === 0) return
        const nextIdx = (currentTrackIdx + 1) % playlist.length
        setCurrentTrackIdx(nextIdx)
        setIsPlaying(true)
    }

    const playPrev = () => {
        if (playlist.length === 0) return
        const prevIdx = (currentTrackIdx - 1 + playlist.length) % playlist.length
        setCurrentTrackIdx(prevIdx)
        setIsPlaying(true)
    }

    // When track changes, force play if isPlaying is true
    useEffect(() => {
        if (playlist[currentTrackIdx] && audioRef.current) {
            audioRef.current.src = playlist[currentTrackIdx].url
            if (isPlaying) {
                audioRef.current.play().catch(e => {
                    console.error("Playback failed:", e)
                    setIsPlaying(false)
                })
            }
        }
    }, [currentTrackIdx, playlist])

    const handleTrackEnd = () => {
        playNext()
    }

    const removeTrack = (e, index) => {
        e.stopPropagation()
        const newPlaylist = [...playlist]
        URL.revokeObjectURL(newPlaylist[index].url) // cleanup
        newPlaylist.splice(index, 1) // remove track
        
        setPlaylist(newPlaylist)
        
        if (newPlaylist.length === 0) {
            setCurrentTrackIdx(0)
            setIsPlaying(false)
            if (audioRef.current) audioRef.current.src = ''
        } else if (index < currentTrackIdx) {
            setCurrentTrackIdx(currentTrackIdx - 1)
        } else if (index === currentTrackIdx) {
            // Track being played was deleted
            const nextIdx = index >= newPlaylist.length ? 0 : index
            setCurrentTrackIdx(nextIdx)
        }
    }

    return (
        <>
            <style>
                {`
                @keyframes bounceIcon {
                    0%, 100% { transform: translateY(0) scale(1); }
                    50% { transform: translateY(-4px) scale(1.05); }
                }
                @keyframes pulseGlow {
                    0% { box-shadow: 0 0 0 0 rgba(124, 92, 252, 0.4); }
                    70% { box-shadow: 0 0 0 14px rgba(124, 92, 252, 0); }
                    100% { box-shadow: 0 0 0 0 rgba(124, 92, 252, 0); }
                }
                .music-fab-playing {
                    animation: bounceIcon 2s infinite ease-in-out, pulseGlow 2s infinite !important;
                    border: 2px solid var(--accent) !important;
                }
                .upload-zone-hint {
                    position: absolute; top: 0; left: 0; right: 0; bottom: 0;
                    background: rgba(124, 92, 252, 0.9); color: #fff;
                    display: flex; align-items: center; justify-content: center;
                    font-weight: 600; font-size: 14px; z-index: 10;
                    border-radius: 6px; pointer-events: none;
                }
                `}
            </style>
            
            {/* Audio stays mounted globally */}
            <audio ref={audioRef} onEnded={handleTrackEnd} style={{ display: 'none' }} />

            {/* Minimized FAB */}
            <div style={{ display: isOpen ? 'none' : 'block' }}>
                <button
                    className={`no-print ${isPlaying ? 'music-fab-playing' : ''}`}
                    onClick={() => setIsOpen(true)}
                    title="Open Music Player"
                    style={{
                        position: 'fixed', bottom: 24, right: 96, zIndex: 900,
                        width: 56, height: 56, borderRadius: '50%',
                        background: 'var(--bg-card)', border: '1px solid var(--border)',
                        color: 'var(--text-primary)', fontSize: 22,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
                        cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s, border 0.2s',
                    }}
                    onMouseOver={e => { if(!isPlaying) { e.currentTarget.style.transform = 'scale(1.08)'; e.currentTarget.style.boxShadow = '0 6px 28px rgba(0,0,0,0.3)' } }}
                    onMouseOut={e  => { if(!isPlaying) { e.currentTarget.style.transform = 'scale(1)';    e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.2)' } }}
                >
                    🎧
                </button>
            </div>

            {/* Open Player Window */}
            <div 
                className="no-print" 
                onDrop={onDrop}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                style={{
                    display: isOpen ? 'flex' : 'none',
                    position: 'fixed', bottom: 24, right: 96, zIndex: 900,
                    width: 320, background: 'var(--bg-card)',
                    border: `1px solid ${isDragging ? 'var(--accent)' : 'var(--border)'}`, 
                    borderRadius: 18,
                    boxShadow: isDragging ? '0 0 20px rgba(124, 92, 252, 0.5)' : '0 8px 40px rgba(0,0,0,0.25)',
                    flexDirection: 'column', overflow: 'hidden',
                    transition: 'border 0.2s, box-shadow 0.2s'
                }}
            >
                {/* Header */}
                <div style={{
                    padding: '14px 16px', borderBottom: '1px solid var(--border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    background: 'var(--bg-secondary)',
                }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                        🎧 Study Focus Music
                    </div>
                    <button onClick={() => setIsOpen(false)} title="Minimize" style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 16 }}>
                        ▼
                    </button>
                </div>

                {/* Now Playing / Controls */}
                <div style={{ padding: '16px', borderBottom: '1px solid var(--border)' }}>
                    <div style={{
                        fontSize: 13, fontWeight: 600, color: 'var(--accent)',
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                        marginBottom: 12, textAlign: 'center', height: 20
                    }}>
                        {playlist.length > 0 ? playlist[currentTrackIdx]?.name : 'No track selected'}
                    </div>
                    
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 16 }}>
                        <button onClick={playPrev} disabled={playlist.length === 0} style={controlBtnSt}>⏮</button>
                        <button onClick={playPause} disabled={playlist.length === 0} style={{
                            ...controlBtnSt, width: 44, height: 44, borderRadius: '50%',
                            background: 'var(--accent)', color: '#fff', border: 'none',
                        }}>
                            {isPlaying ? '⏸' : '▶'}
                        </button>
                        <button onClick={playNext} disabled={playlist.length === 0} style={controlBtnSt}>⏭</button>
                    </div>
                </div>

                {/* Playlist */}
                <div style={{ maxHeight: 200, overflowY: 'auto', background: 'var(--bg-secondary)' }}>
                    {playlist.length === 0 ? (
                        <div style={{ padding: '30px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13, pointerEvents: 'none' }}>
                            No music uploaded yet.<br/>Drag & Drop .mp3 files here!
                        </div>
                    ) : (
                        playlist.map((track, i) => (
                            <div key={i} style={{
                                display: 'flex', alignItems: 'center', padding: '10px 16px', gap: 10,
                                borderBottom: '1px solid var(--border)',
                                background: i === currentTrackIdx ? 'var(--bg-card)' : 'transparent',
                                cursor: 'pointer',
                            }} onClick={() => { setCurrentTrackIdx(i); setIsPlaying(true); }}>
                                <div style={{ fontSize: 13, color: i === currentTrackIdx ? 'var(--accent)' : 'var(--text-muted)' }}>
                                    {i === currentTrackIdx && isPlaying ? '🔊' : '🎵'}
                                </div>
                                <div style={{ 
                                    flex: 1, fontSize: 13, color: i === currentTrackIdx ? 'var(--text-primary)' : 'var(--text-secondary)',
                                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: i === currentTrackIdx ? 600 : 400
                                }}>
                                    {track.name}
                                </div>
                                <button onClick={(e) => removeTrack(e, i)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>✕</button>
                            </div>
                        ))
                    )}
                </div>

                {/* Upload Button */}
                <div style={{ padding: '12px 16px', background: 'var(--bg-card)', borderTop: '1px solid var(--border)', position: 'relative' }}>
                    {isDragging && <div className="upload-zone-hint">Drop audio files here!</div>}
                    <input 
                        type="file" 
                        accept="audio/*" 
                        multiple 
                        ref={fileInputRef} 
                        onChange={handleFileUpload} 
                        style={{ display: 'none' }} 
                    />
                    <button 
                        onClick={() => fileInputRef.current?.click()}
                        style={{
                            width: '100%', padding: '8px', borderRadius: 8,
                            background: 'var(--bg-active)', border: '1px dashed var(--border)',
                            color: 'var(--text-primary)', fontSize: 13, fontWeight: 500,
                            cursor: 'pointer', fontFamily: 'var(--font)'
                        }}
                    >
                        + Upload Local Music (mp3, wav)
                    </button>
                </div>
            </div>
        </>
    )
}

const controlBtnSt = {
    background: 'var(--bg-secondary)', border: '1px solid var(--border)',
    color: 'var(--text-primary)', width: 36, height: 36, borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', fontSize: 14, transition: 'background 0.2s'
}
