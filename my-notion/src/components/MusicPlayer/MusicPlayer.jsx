import React, { useState, useRef, useEffect } from 'react'

export default function MusicPlayer() {
    const [isOpen, setIsOpen] = useState(false)
    const [playlist, setPlaylist] = useState([])
    const [currentTrackIdx, setCurrentTrackIdx] = useState(0)
    const [isPlaying, setIsPlaying] = useState(false)
    
    const audioRef = useRef(null)
    const fileInputRef = useRef(null)

    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = 0.5
        }
    }, [])

    const handleFileUpload = (e) => {
        const files = Array.from(e.target.files)
        if (files.length === 0) return

        const newTracks = files.map(file => ({
            name: file.name.replace(/\.[^/.]+$/, ""), // remove extension
            url: URL.createObjectURL(file), // create temporary URL
        }))

        setPlaylist(prev => [...prev, ...newTracks])
        
        // Auto-play if it's the first track
        if (playlist.length === 0) {
            setCurrentTrackIdx(0)
        }
    }

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
            // It will auto-play because of the useEffect checking currentTrackIdx unless we say stop
        }
    }

    if (!isOpen) return (
        <button
            className="no-print"
            onClick={() => setIsOpen(true)}
            title="Open Music Player"
            style={{
                position: 'fixed', bottom: 24, right: 96, zIndex: 900,
                width: 56, height: 56, borderRadius: '50%',
                background: 'var(--bg-card)', border: '1px solid var(--border)',
                color: 'var(--text-primary)', fontSize: 22,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
                cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s',
            }}
            onMouseOver={e => { e.currentTarget.style.transform = 'scale(1.08)'; e.currentTarget.style.boxShadow = '0 6px 28px rgba(0,0,0,0.3)' }}
            onMouseOut={e  => { e.currentTarget.style.transform = 'scale(1)';    e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.2)' }}
        >
            🎧
        </button>
    )

    return (
        <div className="no-print" style={{
            position: 'fixed', bottom: 24, right: 96, zIndex: 900,
            width: 320, background: 'var(--bg-card)',
            border: '1px solid var(--border)', borderRadius: 18,
            boxShadow: '0 8px 40px rgba(0,0,0,0.25)',
            display: 'flex', flexDirection: 'column', overflow: 'hidden',
        }}>
            {/* Header */}
            <div style={{
                padding: '14px 16px', borderBottom: '1px solid var(--border)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                background: 'var(--bg-secondary)',
            }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    🎧 Study Focus Music
                </div>
                <button onClick={() => setIsOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 16 }}>
                    ✕
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
                
                <audio ref={audioRef} onEnded={handleTrackEnd} style={{ display: 'none' }} />
            </div>

            {/* Playlist */}
            <div style={{ maxHeight: 200, overflowY: 'auto', background: 'var(--bg-secondary)' }}>
                {playlist.length === 0 ? (
                    <div style={{ padding: '30px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                        No music uploaded yet.<br/>Upload your lofi/focus mp3 files below!
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
            <div style={{ padding: '12px 16px', background: 'var(--bg-card)', borderTop: '1px solid var(--border)' }}>
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
    )
}

const controlBtnSt = {
    background: 'var(--bg-secondary)', border: '1px solid var(--border)',
    color: 'var(--text-primary)', width: 36, height: 36, borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', fontSize: 14, transition: 'background 0.2s'
}
