import React from 'react';

const COLORS = [
    'var(--blue-glass)',
    'var(--green-glass)',
    'var(--purple-glass)',
    'var(--orange-glass)',
    'var(--pink-glass)',
    'var(--teal-glass)',
    'var(--yellow-glass)'
];

// Helper to determine string color
function getColorForSubject(code) {
    let hash = 0;
    for (let i = 0; i < code.length; i++) {
        hash = code.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % COLORS.length;
    return COLORS[index];
}

export default function TimetableGrid({ timetable }) {
    const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    const TIME_SLOTS = [
        '08:00', '09:00', '10:00', '11:00', '12:00',
        '13:00', '14:00', '15:00', '16:00', '17:00'
    ];

    return (
        <div className="timetable-grid-container">
            <div className="timetable-scroll">
                <table className="timetable-table">
                    <thead>
                        <tr>
                            <th className="time-col">Day / Time</th>
                            {TIME_SLOTS.map(t => (
                                <th key={t}>{t} - {parseInt(t) + 1}:00</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {DAYS.map(day => (
                            <tr key={day}>
                                <td className="day-cell">{day}</td>
                                {TIME_SLOTS.map(time => {
                                    // Find if there's a class passing through here
                                    // Very basic exact matching for demo purposes
                                    let cellData = null;
                                    let bgColor = 'transparent';
                                    
                                    timetable.forEach(({ subject, section }) => {
                                        section.slots.forEach(slot => {
                                            if (slot.day === day && slot.time.startsWith(time)) {
                                                cellData = { subject, section, room: slot.room };
                                                bgColor = getColorForSubject(subject.code);
                                            }
                                        });
                                    });

                                    return (
                                        <td key={`${day}-${time}`} className="class-cell" style={{ backgroundColor: cellData ? bgColor : 'transparent' }}>
                                            {cellData && (
                                                <div className="cell-content">
                                                    <div className="cell-code" title={cellData.subject.name}>{cellData.subject.code}</div>
                                                    <div className="cell-sec">Sec: {cellData.section.name}</div>
                                                    <div className="cell-staff truncate" title={cellData.section.staff}>{cellData.section.staff}</div>
                                                    <div className="cell-room">{cellData.room}</div>
                                                </div>
                                            )}
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
