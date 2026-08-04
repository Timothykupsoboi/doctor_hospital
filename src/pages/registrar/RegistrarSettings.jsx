// =============================================================
// FILE: RegistrarSettings.jsx
// PURPOSE: React component / entry point for the eDoc Hospital
//          frontend. Part of the Vite + React SPA.
// =============================================================
import React from 'react';
import StaffSettings from '../../components/StaffSettings';
import { Settings } from 'lucide-react';

const RegistrarSettings = () => {
    return (
        <div style={{ padding: '48px 64px', maxWidth: '1600px', margin: '0 auto', background: '#f8fafc', minHeight: '100vh' }}>
                <header style={{ marginBottom: '48px' }}>
                    <h1 style={{ fontSize: '1.875rem', fontWeight: '700', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Settings size={32} color="var(--primary)" /> Account Settings
                    </h1>
                    <p style={{ color: 'var(--text-muted)' }}>Manage your registrar profile and security settings.</p>
                </header>

                <StaffSettings userType="r" />
        </div>
    );
};

export default RegistrarSettings;
