import React, { useState } from 'react';

const STEPS = [
    {
        num: '01',
        title: 'Create a Firebase Project',
        desc: 'Go to the Firebase Console and create a new project.',
        action: 'Open Firebase Console →',
        link: 'https://console.firebase.google.com',
        detail: 'Click "Add project", name it anything (e.g. "my-notion"), and finish setup.',
    },
    {
        num: '02',
        title: 'Enable Google Sign-In',
        desc: 'In your project, enable Google as an authentication provider.',
        detail: 'Go to Authentication → Sign-in method → Google → Enable → Save.',
    },
    {
        num: '03',
        title: 'Create Firestore Database',
        desc: 'Your pages will be stored in Firestore.',
        detail: 'Go to Firestore Database → Create database → Start in test mode → Next → Enable.',
    },
    {
        num: '04',
        title: 'Get Your Web App Config',
        desc: 'Register a Web App and copy the config object.',
        detail: 'Project Settings (⚙️) → Your apps → Web (</>)  → Register app → Copy the firebaseConfig object.',
    },
    {
        num: '05',
        title: 'Add Config to .env File',
        desc: 'Create a .env file in the my-notion folder.',
        detail: 'Copy the template below into a file named .env in the my-notion folder.',
    },
];

const ENV_TEMPLATE = `VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id_here
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id_here
VITE_FIREBASE_APP_ID=your_app_id_here`;

export default function Setup() {
    const [copied, setCopied] = useState(false);

    const copyTemplate = () => {
        navigator.clipboard.writeText(ENV_TEMPLATE);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="login-page" style={{ alignItems: 'flex-start', padding: '40px 20px', overflowY: 'auto' }}>
            <div className="login-bg-orb login-bg-orb-1" />
            <div className="login-bg-orb login-bg-orb-2" />

            <div style={{
                position: 'relative', zIndex: 1,
                maxWidth: 640, width: '100%', margin: '0 auto',
                display: 'flex', flexDirection: 'column', gap: 24,
            }}>
                {/* Header */}
                <div style={{ textAlign: 'center', padding: '16px 0' }}>
                    <div style={{ fontSize: 48, marginBottom: 12 }}>✦</div>
                    <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: -0.5, color: 'var(--text-primary)', margin: 0 }}>
                        Welcome to MyNotion
                    </h1>
                    <p style={{ fontSize: 15, color: 'var(--text-secondary)', marginTop: 8 }}>
                        One-time Firebase setup required. Follow the steps below — it takes about 3 minutes.
                    </p>
                </div>

                {/* Steps */}
                {STEPS.map((step, i) => (
                    <div key={step.num} style={{
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius-lg)',
                        padding: '20px 24px',
                        boxShadow: 'var(--shadow-sm)',
                        display: 'flex', gap: 20, alignItems: 'flex-start',
                    }}>
                        <div style={{
                            width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                            background: 'var(--accent-light)',
                            color: 'var(--accent)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontWeight: 700, fontSize: 13, letterSpacing: 1,
                        }}>{step.num}</div>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--text-primary)', marginBottom: 4 }}>
                                {step.title}
                            </div>
                            <div style={{ fontSize: 13.5, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                                {step.detail}
                            </div>
                            {step.link && (
                                <a href={step.link} target="_blank" rel="noopener noreferrer" style={{
                                    display: 'inline-flex', alignItems: 'center', gap: 6,
                                    marginTop: 10, fontSize: 13.5, fontWeight: 500,
                                    color: 'var(--accent)', textDecoration: 'none',
                                }}>
                                    {step.action} ↗
                                </a>
                            )}

                            {/* ENV template for step 5 */}
                            {i === 4 && (
                                <div style={{ marginTop: 12 }}>
                                    <div style={{
                                        background: '#1e1e2e', borderRadius: 10,
                                        padding: '14px 16px', position: 'relative',
                                        fontFamily: 'monospace', fontSize: 12.5,
                                        color: '#cdd6f4', lineHeight: 1.8,
                                        whiteSpace: 'pre',
                                        border: '1px solid rgba(255,255,255,0.08)',
                                    }}>
                                        {ENV_TEMPLATE}
                                        <button
                                            onClick={copyTemplate}
                                            style={{
                                                position: 'absolute', top: 10, right: 10,
                                                background: copied ? '#22c55e22' : '#ffffff15',
                                                color: copied ? '#22c55e' : '#cdd6f4',
                                                border: '1px solid rgba(255,255,255,0.15)',
                                                borderRadius: 6, padding: '4px 10px',
                                                fontSize: 11.5, fontWeight: 500, cursor: 'pointer',
                                                fontFamily: 'sans-serif',
                                                transition: 'all 0.2s',
                                            }}
                                        >
                                            {copied ? '✓ Copied!' : 'Copy'}
                                        </button>
                                    </div>
                                    <p style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 8 }}>
                                        📁 Save this as <code style={{ background: 'var(--bg-hover)', padding: '1px 5px', borderRadius: 4 }}>.env</code> in{' '}
                                        <code style={{ background: 'var(--bg-hover)', padding: '1px 5px', borderRadius: 4 }}>my-notion/</code> folder, then restart the dev server with <code style={{ background: 'var(--bg-hover)', padding: '1px 5px', borderRadius: 4 }}>npm run dev</code>.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                ))}

                {/* Refresh button */}
                <div style={{ textAlign: 'center', paddingBottom: 40 }}>
                    <button
                        className="btn-primary"
                        onClick={() => window.location.reload()}
                        style={{ fontSize: 15 }}
                    >
                        ✦ I've added my config — Launch App
                    </button>
                    <p style={{ marginTop: 12, fontSize: 12, color: 'var(--text-muted)' }}>
                        After saving .env, restart the server with <code style={{ background: 'var(--bg-hover)', padding: '1px 5px', borderRadius: 4 }}>npm run dev</code> and click above.
                    </p>
                </div>
            </div>
        </div>
    );
}
