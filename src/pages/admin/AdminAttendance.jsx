// =============================================================
// FILE: AdminAttendance.jsx
// PURPOSE: React component / entry point for the eDoc Hospital
//          frontend. Part of the Vite + React SPA.
// =============================================================
import React, { useState, useEffect } from 'react';
import { Clock, UserCheck, Calendar, Search, MapPin, Monitor } from 'lucide-react';
import { getAllStaff } from '../../lib/api';

const AdminAttendance = () => {
    const [attendance, setAttendance] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchStaffData = async () => {
            const { staff, errors } = await getAllStaff();
            if (errors.length > 0) {
                console.error("Staff fetch errors:", errors);
            }
            setAttendance(staff || []);
        };
        fetchStaffData();
    }, []);

    return (
        <div style={{ padding: '40px 56px', maxWidth: '1600px', margin: '0 auto', background: '#f8fafc', minHeight: '100vh' }}>
                <header style={{ marginBottom: '48px' }}>
                    <h1 style={{ fontSize: '2.25rem', fontWeight: '800', letterSpacing: '-0.02em', marginBottom: '8px' }}>Staff Attendance</h1>
                    <p style={{ color: '#64748b' }}>Monitor digital presence and operational hours across departments.</p>
                </header>

                <div style={{ marginBottom: '24px', position: 'relative' }}>
                    <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                    <input 
                        type="text" 
                        placeholder="Search by staff name or role..." 
                        style={{ width: '100%', padding: '12px 16px 12px 48px', borderRadius: '12px', border: '1px solid #e2e8f0', background: 'white', fontSize: '1rem', outline: 'none' }} 
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '24px' }}>
                    {attendance.filter(s => (s.name || '').toLowerCase().includes(searchTerm.toLowerCase())).map(s => (
                        <div key={`${s.role}-${s.id}`} style={{ background: 'white', padding: '24px', borderRadius: '24px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '20px' }}>
                            <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', color: '#007bff', fontSize: '1.25rem' }}>
                                {(s.name || 'U').charAt(0)}
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: '800', fontSize: '1.1rem' }}>{s.name}</div>
                                <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>{s.role}</div>
                                <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e' }}></div>
                                    <span style={{ fontSize: '0.875rem', fontWeight: '700', color: '#166534' }}>Online & Present</span>
                                </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Clock-in Today</div>
                                <div style={{ fontWeight: '700', fontSize: '1rem' }}>08:15 AM</div>
                            </div>
                        </div>
                    ))}
                </div>
        </div>
    );
};

export default AdminAttendance;
