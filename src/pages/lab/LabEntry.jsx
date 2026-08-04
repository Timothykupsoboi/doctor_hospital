// =============================================================
// FILE: LabEntry.jsx
// PURPOSE: React component / entry point for the eDoc Hospital
//          frontend. Part of the Vite + React SPA.
// =============================================================
import React from 'react';
import { FileText } from 'lucide-react';

const LabEntry = () => {
    return (
        <div style={{ padding: '40px 56px', maxWidth: '1600px', margin: '0 auto', background: '#f8fafc', minHeight: '100vh' }}>
                <header style={{ marginBottom: '48px' }}>
                    <h1 style={{ fontSize: '1.875rem', fontWeight: '700', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <FileText size={32} color="#007bff" /> Result Entry
                    </h1>
                    <p style={{ color: '#64748b' }}>Input test results, abnormal flags, and clinical comments.</p>
                </header>

                <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '48px', color: '#64748b' }}>
                    Select a test from 'Test Requests' to start entry.
                </div>
        </div>
    );
};

export default LabEntry;
