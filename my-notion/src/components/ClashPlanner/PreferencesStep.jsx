import React from 'react';
import { LiquidButton } from '../ui/liquid-glass-button';

export default function PreferencesStep({ 
    selectedSubjects, 
    preferences, 
    setPreferences, 
    onGenerate, 
    onBack,
    isGenerating
}) {
    const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

    const handleLeaveToggle = (day) => {
        const current = preferences.leaveDays || [];
        if (current.includes(day)) {
            setPreferences({ ...preferences, leaveDays: current.filter(d => d !== day) });
        } else {
            setPreferences({ ...preferences, leaveDays: [...current, day] });
        }
    };

    const handleStaffChange = (code, staff) => {
        setPreferences({
            ...preferences,
            staffPrefs: { ...preferences.staffPrefs, [code]: staff }
        });
    };

    const handleTimeChange = (time) => {
        setPreferences({ ...preferences, timePref: time });
    };

    return (
        <div className="planner-step-container">
            <h2 className="step-title">3. Set Your Preferences ⚙️</h2>
            
            <div className="preferences-grid">
                {/* Leave Days */}
                <div className="pref-panel">
                    <h3>🚫 Leave Days</h3>
                    <p className="pref-desc">Check the days you want completely free.</p>
                    <div className="days-grid">
                        {DAYS.map(day => (
                            <label key={day} className="day-checkbox">
                                <input 
                                    type="checkbox" 
                                    checked={(preferences.leaveDays || []).includes(day)}
                                    onChange={() => handleLeaveToggle(day)}
                                />
                                {day}
                            </label>
                        ))}
                    </div>
                </div>

                {/* Time Preference */}
                <div className="pref-panel">
                    <h3>⏰ Time Preference</h3>
                    <p className="pref-desc">When do you prefer to have classes?</p>
                    <div className="time-radios">
                        {['NO_PREF', 'MORNING', 'AFTERNOON', 'EVENING'].map(time => (
                            <label key={time} className="time-radio">
                                <input 
                                    type="radio" 
                                    name="timePref" 
                                    checked={(preferences.timePref || 'NO_PREF') === time}
                                    onChange={() => handleTimeChange(time)}
                                />
                                {time === 'NO_PREF' ? 'No Preference' : 
                                 time === 'MORNING' ? 'Morning (8am-12pm)' :
                                 time === 'AFTERNOON' ? 'Afternoon (12pm-4pm)' : 'Evening (4pm+)'}
                            </label>
                        ))}
                    </div>
                </div>

                {/* Staff Preferences */}
                <div className="pref-panel full-width">
                    <h3>⭐ Staff Preferences</h3>
                    <p className="pref-desc">Select preferred staff for your chosen subjects.</p>
                    <div className="staff-grid">
                        {selectedSubjects.map(sub => {
                            // Extract unique staff members for this subject
                            const allStaff = Array.from(new Set(sub.sections.map(s => s.staff)));
                            return (
                                <div key={sub.code} className="staff-pref-item">
                                    <span className="staff-sub-name">{sub.name} ({sub.code})</span>
                                    <select 
                                        value={(preferences.staffPrefs || {})[sub.code] || 'NO_PREF'}
                                        onChange={(e) => handleStaffChange(sub.code, e.target.value)}
                                        className="planner-select"
                                    >
                                        <option value="NO_PREF">No Preference</option>
                                        {allStaff.map(staff => (
                                            <option key={staff} value={staff}>{staff}</option>
                                        ))}
                                    </select>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            <div className="step-actions split">
                <button className="back-btn" onClick={onBack} disabled={isGenerating}>← Back</button>
                <LiquidButton onClick={onGenerate} disabled={isGenerating}>
                    {isGenerating ? <span className="spinner-small"></span> : '🚀 Generate Timetables'}
                </LiquidButton>
            </div>
        </div>
    );
}
