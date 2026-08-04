// =============================================================
// FILE: LabProcessing.jsx
// PURPOSE: React component / entry point for the eDoc Hospital
//          frontend. Part of the Vite + React SPA.
// =============================================================
import React from 'react';
import { Activity } from 'lucide-react';

const LabProcessing = () => {
    return (
        <div style={{ padding: '40px 56px', maxWidth: '1600px', margin: '0 auto', background: '#f8fafc', minHeight: '100vh' }}>
                <header style={{ marginBottom: '48px' }}>
                    <h1 style={{ fontSize: '1.875rem', fontWeight: '700', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Activity size={32} color="#10b981" /> Test Processing
                    </h1>
                    <p style={{ color: '#64748b' }}>Monitor active tests, equipment status, and quality control checks.</p>
                </header>

                <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '48px', textAlign: 'center', color: '#64748b' }}>
                    No tests currently in progress.
                </div>
        </div>
    );
};

export default LabProcessing;
