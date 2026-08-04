// =============================================================
// FILE: DoctorSettings.jsx
// PURPOSE: React component / entry point for the eDoc Hospital
//          frontend. Part of the Vite + React SPA.
// =============================================================
import React from 'react';
import StaffSettings from '../../components/StaffSettings';
import { Settings } from 'lucide-react';

const DoctorSettings = () => {
    return (
        <div style={{ padding: '40px 56px', maxWidth: '1600px', margin: '0 auto', background: '#f8fafc', minHeight: '100vh' }}>
                <header style={{ marginBottom: '48px' }}>
                    <h1 style={{ fontSize: '1.875rem', fontWeight: '700', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Settings size={32} color="#007bff" /> Account Settings
                    </h1>
                    <p style={{ color: '#64748b' }}>Manage your professional profile and security settings.</p>
                </header>

                <StaffSettings userType="d" />
        </div>
    );
};

export default DoctorSettings;
