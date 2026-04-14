import React from 'react';
import ClashPlannerPage from '../components/ClashPlanner/ClashPlannerPage.jsx';
import '../styles/clash-planner.css'; // We'll add some specific cool styles here

export default function ClashPlanner() {
    return (
        <div className="page-container" style={{ padding: '2rem', height: '100%', overflowY: 'auto' }}>
            <div className="page-header">
                <h1 className="page-title">📅 SEC Clash Planner</h1>
                <p className="page-subtitle">Generate conflict-free timetables from your enrollment data.</p>
            </div>
            <ClashPlannerPage />
        </div>
    );
}
