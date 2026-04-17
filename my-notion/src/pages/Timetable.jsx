import React, { useState, useRef } from 'react'
import useAcademicStore from '../store/academicStore.js'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

const DAYS = [
    { id: 1, name: 'Monday' },
    { id: 2, name: 'Tuesday' },
    { id: 3, name: 'Wednesday' },
    { id: 4, name: 'Thursday' },
    { id: 5, name: 'Friday' },
    { id: 6, name: 'Saturday' },
]

const SLOTS = [
    { id: 0, time: '8:00 - 10:00' },
    { id: 1, time: '10:00 - 12:00' },
    { id: 2, time: '12:00 - 1:00 (Lunch)' },
    { id: 3, time: '1:00 - 3:00' },
    { id: 4, time: '3:00 - 5:00' },
]

export default function Timetable() {
    const { subjects, timetable, timetableRooms, updateTimetableSlot, updateTimetableRoom } = useAcademicStore()
    const [isEditing, setIsEditing] = useState(false)
    const timetableRef = useRef(null)

    const downloadPDF = async () => {
        if (!timetableRef.current) return
        
        try {
            const element = timetableRef.current;
            const originalOverflow = element.style.overflowX;
            const originalWidth = element.style.width;
            
            // Temporarily update styles so html2canvas captures entire content
            element.style.overflowX = 'visible';
            element.style.width = 'max-content';

            const canvas = await html2canvas(element, { 
                scale: 2, 
                useCORS: true,
                windowWidth: element.scrollWidth
            })
            
            // Restore styles
            element.style.overflowX = originalOverflow;
            element.style.width = originalWidth;

            const imgData = canvas.toDataURL('image/png')
            const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
            
            const pdfWidth = pdf.internal.pageSize.getWidth()
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width
            
            // Add a small margin at the top
            pdf.addImage(imgData, 'PNG', 0, 10, pdfWidth, pdfHeight)
            pdf.save('My_Timetable.pdf')
        } catch (error) {
            console.error('Failed to generate PDF', error)
        }
    }

    return (
        <div className="page-container" style={{ maxWidth: 1000 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
                <div>
                    <h1 style={{ fontSize: 34, fontWeight: 800, marginBottom: 8, color: 'var(--text-primary)' }}>📅 Timetable</h1>
                    <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.5, margin: 0, maxWidth: 600 }}>
                        Configure your weekly class schedule. The attendance calculator will automatically track classes based on this timetable.
                    </p>
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                    {!isEditing && (
                        <button 
                            onClick={downloadPDF}
                            style={{
                                padding: '10px 20px', borderRadius: 10,
                                background: 'transparent',
                                color: 'var(--text-primary)',
                                border: '1px solid var(--border)',
                                fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font)',
                                transition: 'all 0.2s', display: 'flex', gap: 8, alignItems: 'center', whiteSpace: 'nowrap'
                            }}
                        >
                            📥 Download PDF
                        </button>
                    )}
                    <button 
                        onClick={() => setIsEditing(!isEditing)}
                        style={{
                            padding: '10px 20px', borderRadius: 10,
                            background: isEditing ? 'var(--accent)' : 'var(--bg-card)',
                            color: isEditing ? '#fff' : 'var(--text-primary)',
                            border: `1px solid ${isEditing ? 'var(--accent)' : 'var(--border)'}`,
                            fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font)',
                            transition: 'all 0.2s', display: 'flex', gap: 8, alignItems: 'center', whiteSpace: 'nowrap',
                            boxShadow: isEditing ? '0 4px 12px rgba(99, 102, 241, 0.3)' : 'none'
                        }}
                    >
                        {isEditing ? '💾 Save Timetable' : '✏️ Edit Timetable'}
                    </button>
                </div>
            </div>

            <div ref={timetableRef} style={{ overflowX: 'auto', background: 'var(--bg-secondary)', borderRadius: 14, border: '1px solid var(--border)', padding: '16px' }}>
                <table style={{ width: '100%', minWidth: 800, borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                        <tr>
                            <th style={{ padding: '16px', borderBottom: '1px solid var(--border)', fontWeight: 700, color: 'var(--text-muted)' }}>Day</th>
                            {SLOTS.map(s => (
                                <th key={s.id} style={{ padding: '16px', borderBottom: '1px solid var(--border)', fontWeight: 700, color: 'var(--text-muted)' }}>{s.time}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {DAYS.map(d => (
                            <tr key={d.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                <td style={{ padding: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>{d.name}</td>
                                {SLOTS.map(s => {
                                    const selectedSubjectId = timetable[d.id]?.[s.id]
                                    const assignedSubject = subjects.find(sub => sub.id === selectedSubjectId)
                                    const roomNumber = timetableRooms?.[d.id]?.[s.id]
                                    
                                    return (
                                        <td key={s.id} style={{ padding: '12px', borderLeft: '1px solid var(--border)' }}>
                                            {s.id === 2 ? (
                                                <div style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', fontWeight: 500 }}>Lunch Break</div>
                                            ) : (
                                                isEditing ? (
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                                        <select
                                                            value={selectedSubjectId || ''}
                                                            onChange={(e) => updateTimetableSlot(d.id, s.id, e.target.value || null)}
                                                            style={{
                                                                width: '100%', padding: '8px 12px', borderRadius: 8,
                                                                border: '1px solid var(--border)', background: 'var(--bg-card)',
                                                                color: 'var(--text-primary)', outline: 'none', cursor: 'pointer', fontFamily: 'var(--font)'
                                                            }}
                                                        >
                                                            <option value="">- Free -</option>
                                                            {subjects.map(sub => (
                                                                <option key={sub.id} value={sub.id}>{sub.name}</option>
                                                            ))}
                                                        </select>
                                                        {selectedSubjectId && (
                                                            <input 
                                                                type="text" 
                                                                placeholder="Room / Class No."
                                                                value={roomNumber || ''}
                                                                onChange={(e) => updateTimetableRoom(d.id, s.id, e.target.value)}
                                                                style={{
                                                                    width: '100%', padding: '6px 10px', borderRadius: 6, fontSize: 12,
                                                                    border: '1px dashed var(--border)', background: 'var(--bg-primary)',
                                                                    color: 'var(--text-primary)', outline: 'none', fontFamily: 'var(--font)',
                                                                    boxSizing: 'border-box'
                                                                }}
                                                            />
                                                        )}
                                                    </div>
                                                ) : (
                                                    assignedSubject ? (
                                                        <div style={{
                                                            padding: '8px 12px', borderRadius: 8, textAlign: 'center',
                                                            background: 'var(--bg-card)', border: '1px solid var(--border)',
                                                            color: 'var(--text-primary)', fontWeight: 600, fontSize: 13,
                                                            boxShadow: 'var(--shadow-sm)', display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'center'
                                                        }}>
                                                            <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%' }}>
                                                                {assignedSubject.name}
                                                            </div>
                                                            {roomNumber && (
                                                                <div style={{ fontSize: 11, padding: '2px 6px', background: 'var(--bg-active)', borderRadius: 4, color: 'var(--text-muted)' }}>
                                                                    📍 {roomNumber}
                                                                </div>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <div style={{ padding: '8px 12px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13, opacity: 0.7 }}>
                                                            - Free -
                                                        </div>
                                                    )
                                                )
                                            )}
                                        </td>
                                    )
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
