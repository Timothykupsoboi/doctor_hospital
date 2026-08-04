// =============================================================
// FILE: DoctorMessages.jsx
// PURPOSE: React component / entry point for the eDoc Hospital
//          frontend. Part of the Vite + React SPA.
// =============================================================
import React from 'react';
import { MessageSquare } from 'lucide-react';

const DoctorMessages = () => {
    return (
        <div style={{ padding: '40px 56px', maxWidth: '1600px', margin: '0 auto', background: '#f8fafc', minHeight: '100vh' }}>
                <header style={{ marginBottom: '48px' }}>
                    <h1 style={{ fontSize: '1.875rem', fontWeight: '700', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <MessageSquare size={32} color="#007bff" /> Internal Messages
                    </h1>
                    <p style={{ color: '#64748b' }}>Communicate with lab technicians, nurses, and admins.</p>
                </header>
                
                <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '48px', textAlign: 'center', color: '#64748b' }}>
                    Inbox is empty.
                </div>
        </div>
    );
};

export default DoctorMessages;
