import React, { useState } from 'react';
import TimetableGrid from './TimetableGrid';
import { exportTimetableToPDF, exportAllTimetables } from './pdfExporter';
import { LiquidButton } from '../ui/liquid-glass-button';
import { useNavigate } from 'react-router-dom';
import useAcademicStore from '../../store/academicStore';

export default function TimetableStep({ combinations, onBack }) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const navigate = useNavigate();
    const bulkImportTimetable = useAcademicStore(state => state.bulkImportTimetable);

    if (!combinations || combinations.length === 0) {
        return (
            <div className="planner-step-container">
                <h2 className="step-title">4. Generated Timetables 📅</h2>
                <div className="empty-state-large">
                    <div className="empty-icon">😢</div>
                    <h3>No valid combinations found!</h3>
                    <p>There are conflicts that cannot be resolved with your current selections and preferences.</p>
                </div>
                <div className="step-actions split">
                    <button className="back-btn" onClick={onBack}>← Change Preferences</button>
                </div>
            </div>
        );
    }

    const currentTimetable = combinations[currentIndex];

    const prev = () => setCurrentIndex(c => Math.max(0, c - 1));
    const next = () => setCurrentIndex(c => Math.min(combinations.length - 1, c + 1));

    return (
        <div className="planner-step-container">
            <h2 className="step-title">4. Generated Timetables 📅</h2>
            
            <div className="timetable-controls">
                <div className="nav-buttons">
                    <button className="nav-btn" onClick={prev} disabled={currentIndex === 0}>← Prev</button>
                    <span className="page-indicator">Option {currentIndex + 1} of {combinations.length}</span>
                    <button className="nav-btn" onClick={next} disabled={currentIndex === combinations.length - 1}>Next →</button>
                </div>
                
                <div className="export-actions">
                    <button className="export-btn outline" onClick={() => exportTimetableToPDF(currentTimetable, currentIndex, combinations.length)}>
                        📥 Download This
                    </button>
                    <button className="export-btn outline" onClick={() => exportAllTimetables(combinations)}>
                        📥 Download All
                    </button>
                    <button 
                        className="export-btn filled" 
                        onClick={() => {
                            if(window.confirm('Do you want to set this as your timetable?\n\nThis will apply it to your MyNotion workspace and import the subjects!')) {
                                bulkImportTimetable(currentTimetable);
                                navigate('/timetable');
                            }
                        }}
                    >
                        ✓ Set as Workspace Timetable
                    </button>
                </div>
            </div>

            <TimetableGrid timetable={currentTimetable} />

            <div className="summary-box">
                <h4>Summary for Option {currentIndex + 1}</h4>
                <div className="summary-grid">
                    {currentTimetable.map(({ subject, section }) => (
                        <div key={subject.code} className="summary-item">
                            <span className="sum-sub">{subject.name}</span>
                            <span className="sum-sec">Sec {section.name} • {section.staff}</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="step-actions">
                <button className="back-btn" onClick={onBack}>← Change Preferences</button>
            </div>
        </div>
    );
}
