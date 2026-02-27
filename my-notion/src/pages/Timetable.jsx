import React from 'react'
import useAcademicStore from '../store/academicStore.js'

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
    const { subjects, timetable, updateTimetableSlot } = useAcademicStore()

    return (
        <div className="page-container" style={{ maxWidth: 1000 }}>
            <h1 style={{ fontSize: 34, fontWeight: 800, marginBottom: 24, color: 'var(--text-primary)' }}>📅 Timetable</h1>
            <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 28, lineHeight: 1.5 }}>
                Configure your weekly class schedule. The attendance calculator will automatically track classes based on this timetable.
            </p>

            <div style={{ overflowX: 'auto', background: 'var(--bg-secondary)', borderRadius: 14, border: '1px solid var(--border)' }}>
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
                                {SLOTS.map(s => (
                                    <td key={s.id} style={{ padding: '12px', borderLeft: '1px solid var(--border)' }}>
                                        {s.id === 2 ? (
                                            <div style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', fontWeight: 500 }}>Lunch Break</div>
                                        ) : (
                                            <select
                                                value={timetable[d.id]?.[s.id] || ''}
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
                                        )}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
