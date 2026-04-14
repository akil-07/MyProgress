import React from 'react';
import { LiquidButton } from '../ui/liquid-glass-button';

export default function ConflictModal({ conflicts, onRemoveLeaveDays, onSkipSubjects }) {
    if (!conflicts || conflicts.length === 0) return null;

    return (
        <>
            <div className="planner-modal-overlay"></div>
            <div className="planner-modal">
                <div className="modal-icon">⚠️</div>
                <h3 className="modal-title">Conflict Detected!</h3>
                <p className="modal-desc">
                    The following subjects only have sections on your selected leave days:
                </p>
                <ul className="conflict-list">
                    {conflicts.map(c => (
                        <li key={c}>{c}</li>
                    ))}
                </ul>
                <div className="modal-actions">
                    <button className="base-btn secondary" onClick={onSkipSubjects}>
                        Skip These Subjects
                    </button>
                    <LiquidButton onClick={onRemoveLeaveDays}>
                        Remove Leave Days
                    </LiquidButton>
                </div>
            </div>
        </>
    );
}
