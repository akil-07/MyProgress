import React, { useState } from 'react';
import UploadStep from './UploadStep';
import SubjectSelectStep from './SubjectSelectStep';
import PreferencesStep from './PreferencesStep';
import TimetableStep from './TimetableStep';
import ConflictModal from './ConflictModal';
import { detectInitialConflicts, generateTimetables } from './timetableGenerator';

export default function ClashPlannerPage() {
    const [step, setStep] = useState(1);
    
    // State
    const [allSubjects, setAllSubjects] = useState([]);
    const [selectedSubjects, setSelectedSubjects] = useState([]);
    const [preferences, setPreferences] = useState({
        leaveDays: [],
        staffPrefs: {},
        timePref: 'NO_PREF'
    });
    
    const [combinations, setCombinations] = useState([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [conflicts, setConflicts] = useState([]);

    const handleParsed = (subjects) => {
        setAllSubjects(subjects);
        setStep(2);
    };

    const handleGenerate = () => {
        setIsGenerating(true);
        
        // Short timeout to allow UI to render spinner
        setTimeout(() => {
            const detectedConflicts = detectInitialConflicts(selectedSubjects, preferences.leaveDays || []);
            
            if (detectedConflicts.length > 0) {
                setConflicts(detectedConflicts);
                setIsGenerating(false);
                return;
            }

            const combos = generateTimetables(selectedSubjects, preferences);
            setCombinations(combos);
            setIsGenerating(false);
            setStep(4);
        }, 100);
    };

    const handleRemoveLeaveDays = () => {
        setPreferences({ ...preferences, leaveDays: [] });
        setConflicts([]);
    };

    const handleSkipSubjects = () => {
        // Remove conflicted subjects from selected
        const newSelected = selectedSubjects.filter(sub => !conflicts.includes(sub.name));
        setSelectedSubjects(newSelected);
        setConflicts([]);
    };

    return (
        <div className="clash-planner-wrapper">
            {/* Progress Tabs */}
            <div className="planner-tabs">
                {[1, 2, 3, 4].map(num => (
                    <div 
                        key={num} 
                        className={`planner-tab ${step === num ? 'active' : ''} ${step > num ? 'completed' : ''}`}
                    >
                        <div className="tab-bubble">{num}</div>
                        <span className="tab-label">
                            {num === 1 ? 'Upload' : num === 2 ? 'Select' : num === 3 ? 'Preferences' : 'Timetables'}
                        </span>
                    </div>
                ))}
            </div>

            <div className="planner-content fade-in">
                {step === 1 && (
                    <UploadStep onParsed={handleParsed} />
                )}
                
                {step === 2 && (
                    <SubjectSelectStep 
                        subjects={allSubjects}
                        selectedSubjects={selectedSubjects}
                        setSelectedSubjects={setSelectedSubjects}
                        onNext={() => setStep(3)}
                        onBack={() => setStep(1)}
                    />
                )}

                {step === 3 && (
                    <PreferencesStep 
                        selectedSubjects={selectedSubjects}
                        preferences={preferences}
                        setPreferences={setPreferences}
                        onGenerate={handleGenerate}
                        onBack={() => setStep(2)}
                        isGenerating={isGenerating}
                    />
                )}

                {step === 4 && (
                    <TimetableStep 
                        combinations={combinations}
                        onBack={() => setStep(3)}
                    />
                )}
            </div>

            <ConflictModal 
                conflicts={conflicts} 
                onRemoveLeaveDays={handleRemoveLeaveDays}
                onSkipSubjects={handleSkipSubjects}
            />
        </div>
    );
}
