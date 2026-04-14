import React, { useState, useRef } from 'react';
import { extractTextFromPDF, parseTextToSubjects } from './pdfParser';
import { LiquidButton } from '../ui/liquid-glass-button';

export default function UploadStep({ onParsed }) {
    const [rawText, setRawText] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const fileInputRef = useRef(null);

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.type !== 'application/pdf') {
            setError('Please upload a valid PDF file.');
            return;
        }

        setLoading(true);
        setError('');
        try {
            const text = await extractTextFromPDF(file);
            setRawText(text);
        } catch (err) {
            console.error(err);
            setError('Failed to extract text from PDF. It might be an image-based PDF or encrypted.');
        } finally {
            setLoading(false);
        }
    };

    const handleParse = () => {
        if (!rawText.trim()) {
            // Check if demo requested
            setRawText('demo mode');
            setTimeout(() => {
                const subjects = parseTextToSubjects('demo mode');
                onParsed(subjects);
            }, 100);
            return;
        }

        try {
            const subjects = parseTextToSubjects(rawText);
            if (!subjects || subjects.length === 0) {
                setError('No subjects could be parsed. Check your data format.');
                return;
            }
            onParsed(subjects);
        } catch (err) {
            console.error(err);
            setError('Error parsing text. Please try again.');
        }
    };

    return (
        <div className="planner-step-container">
            <h2 className="step-title">1. Upload Enrollment Data 📤</h2>
            <p className="step-desc">
                Upload your SEC enrollment PDF or paste the raw text below.
                If you just want to test it out, leave it blank and click Parse to load demo data!
            </p>

            <div className="upload-box" onClick={() => fileInputRef.current?.click()}>
                <div className="upload-icon">📄</div>
                <div className="upload-text">Click or drag PDF here to upload</div>
                <input
                    type="file"
                    accept=".pdf"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                />
            </div>

            <div className="divider">OR PASTE TEXT</div>

            <textarea
                className="raw-text-area"
                placeholder="Paste tab-separated or pipe-separated enrollment table here..."
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
            />

            {error && <div className="error-message">{error}</div>}

            <div className="step-actions">
                <LiquidButton onClick={handleParse} disabled={loading}>
                    {loading ? 'Extracting...' : '🔍 Parse & Continue'}
                </LiquidButton>
            </div>
        </div>
    );
}
