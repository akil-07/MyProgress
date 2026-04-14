import React, { useState } from 'react';
import { LiquidButton } from '../ui/liquid-glass-button';

export default function SubjectSelectStep({ subjects, selectedSubjects, setSelectedSubjects, onNext, onBack }) {
    const [search, setSearch] = useState('');

    const toggleSubject = (sub) => {
        if (selectedSubjects.some(s => s.code === sub.code)) {
            setSelectedSubjects(selectedSubjects.filter(s => s.code !== sub.code));
        } else {
            setSelectedSubjects([...selectedSubjects, sub]);
        }
    };

    const filtered = subjects.filter(s => 
        s.name.toLowerCase().includes(search.toLowerCase()) || 
        s.code.toLowerCase().includes(search.toLowerCase())
    );

    const totalCredits = selectedSubjects.reduce((acc, curr) => acc + (curr.credits || 0), 0);

    return (
        <div className="planner-step-container">
            <h2 className="step-title">2. Select Your Subjects 📚</h2>
            
            <div className="selection-header">
                <input 
                    type="text" 
                    className="planner-search-input" 
                    placeholder="Search by name or code..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
                <div className="selection-stats">
                    <span className="stat-badge">Selected: {selectedSubjects.length}</span>
                    <span className="stat-badge highlight">Credits: {totalCredits}</span>
                </div>
            </div>

            <div className="subjects-grid">
                {filtered.map(sub => {
                    const isSelected = selectedSubjects.some(s => s.code === sub.code);
                    return (
                        <div 
                            key={sub.code} 
                            className={`subject-card ${isSelected ? 'selected' : ''}`}
                            onClick={() => toggleSubject(sub)}
                        >
                            <div className="subject-card-header">
                                <h3>{sub.name}</h3>
                                {isSelected && <span className="check-icon">✓</span>}
                            </div>
                            <div className="subject-card-body">
                                <span>Code: {sub.code}</span>
                                <span>Sections: {sub.sections.length}</span>
                                <span>Credits: {sub.credits}</span>
                            </div>
                        </div>
                    );
                })}
                {filtered.length === 0 && (
                    <div className="empty-state-small">No subjects match your search.</div>
                )}
            </div>

            <div className="step-actions split">
                <button className="back-btn" onClick={onBack}>← Back</button>
                <LiquidButton 
                    onClick={onNext} 
                    disabled={selectedSubjects.length === 0}
                >
                    Next: Preferences →
                </LiquidButton>
            </div>
        </div>
    );
}
