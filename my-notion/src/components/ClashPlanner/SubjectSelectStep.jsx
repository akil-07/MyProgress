import React, { useState } from 'react';
import { LiquidButton } from '../ui/liquid-glass-button';

export default function SubjectSelectStep({ subjects, selectedSubjects, setSelectedSubjects, onNext, onBack }) {
    const [search, setSearch] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('All');

    const toggleSubject = (sub) => {
        if (selectedSubjects.some(s => s.code === sub.code)) {
            setSelectedSubjects(selectedSubjects.filter(s => s.code !== sub.code));
        } else {
            setSelectedSubjects([...selectedSubjects, sub]);
        }
    };

    const FC_CODES = [
        '19CS404', '19AI305', '19CS406', '19CS306', '19CS405', '19CS415', 
        '19AI410', '19AI541', '19AI414', '19AI301', '19AI408', '19AI412', 
        '19AI505', '19AI411', '19AI307', '19CS301', '19AI404', '19AI413', 
        '19AI405', '19AI409', '19AI304', '19CS303', '19CS302'
    ];
    
    const SBC_CODES = [
        '19CS545', '19CS409', '19AM508', '19AM509', '19CS421', '19AI509', 
        '19AI407', '19CS509', '19CS417', '19CS580', '19AI406', '19AI555', 
        '19AI303', '19AI302', '19CS305', '19CS547', '19AI516', '19AI403', 
        '19CS408', '19AI801', '19CS549', '19AI533', '19AI534', '19CS416', 
        '19CS556', '19CS418', '19AI605', '19CS570', '19AI545', '19CS579', 
        '19AI547', '19CS407', '19AI553', '19AI513', '19AM401', '19GE628', 
        '19CS420', '19CS581', '19CS419', '19AI539', '19AI540', '19AI550'
    ];

    const filtered = subjects.filter(s => {
        const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase()) || 
                              s.code.toLowerCase().includes(search.toLowerCase());
        
        let matchesCategory = true;
        if (categoryFilter === 'FC') {
            matchesCategory = FC_CODES.includes(s.code.toUpperCase()) || s.name.includes('FC');
        } else if (categoryFilter === 'SBC') {
            matchesCategory = SBC_CODES.includes(s.code.toUpperCase()) || s.name.includes('SBC');
        }

        return matchesSearch && matchesCategory;
    });

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
                
                <div className="category-filters">
                    <button 
                        className={`filter-btn ${categoryFilter === 'All' ? 'active' : ''}`}
                        onClick={() => setCategoryFilter('All')}
                    >All</button>
                    <button 
                        className={`filter-btn ${categoryFilter === 'FC' ? 'active' : ''}`}
                        onClick={() => setCategoryFilter('FC')}
                    >FC</button>
                    <button 
                        className={`filter-btn ${categoryFilter === 'SBC' ? 'active' : ''}`}
                        onClick={() => setCategoryFilter('SBC')}
                    >SBC</button>
                </div>

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
                            className={`subject-card ${isSelected ? 'selected neon-gradient-border' : ''}`}
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
