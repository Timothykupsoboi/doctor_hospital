// =============================================================
// FILE: AdminLogs.jsx
// PURPOSE: React component / entry point for the eDoc Hospital
//          frontend. Part of the Vite + React SPA.
// =============================================================
import React, { useState, useEffect } from 'react';
import { getAdminLogs } from '../../lib/api';
import { Shield, Clock, Search, Terminal, AlertCircle, Info, Lock } from 'lucide-react';

const AdminLogs = () => {
    const [logs, setLogs] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        getAdminLogs()
            .then(({ data, error }) => {
                if (!error) setLogs(data || []);
            })
            .catch(console.error);
    }, []);

    const getActionStyle = (action) => {
        if (action.includes('Login')) return { color: '#0ea5e9', icon: Lock };
        if (action.includes('Stock')) return { color: '#f59e0b', icon: Terminal };
        if (action.includes('Delete')) return { color: '#ef4444', icon: AlertCircle };
        return { color: '#64748b', icon: Info };
    };

    return (
        <div style={{ padding: '48px 64px', maxWidth: '1600px', margin: '0 auto', background: '#f8fafc', minHeight: '100vh' }}>
                <header style={{ marginBottom: '48px' }}>
                    <h1 style={{ fontSize: '2.25rem', fontWeight: '800', letterSpacing: '-0.02em', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <Shield size={36} color="var(--primary)" /> System Audit Logs
                    </h1>
                    <p style={{ color: 'var(--text-muted)' }}>Forensic activity trail for security and compliance monitoring.</p>
                </header>

                <div style={{ background: '#0f172a', borderRadius: '24px', padding: '32px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)', border: '1px solid #1e293b' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ width: '12px', height: '12px', background: '#22c55e', borderRadius: '50%' }}></div>
                            <span style={{ color: '#94a3b8', fontSize: '0.875rem', fontWeight: '700', letterSpacing: '0.1em' }}>LIVE SECURITY FEED</span>
                        </div>
                        <div style={{ position: 'relative' }}>
                            <Search size={16} style={{ position: 'absolute', left: '12px', top: '10px', color: '#64748b' }} />
                            <input 
                                type="text" 
                                placeholder="Filter by user or action..." 
                                style={{ background: '#1e293b', border: '1px solid #334155', color: 'white', padding: '8px 12px 8px 36px', borderRadius: '8px', fontSize: '0.875rem' }}
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '600px', overflowY: 'auto', paddingRight: '10px' }}>
                        {logs.filter(l => (l.action || '').toLowerCase().includes(searchTerm.toLowerCase()) || (l.user_email || '').toLowerCase().includes(searchTerm.toLowerCase())).map(log => {
                            const style = getActionStyle(log.action || '');
                            return (
                                <div key={log.id} style={{ display: 'grid', gridTemplateColumns: '180px 1fr 200px', gap: '20px', padding: '16px', background: '#1e293b50', borderRadius: '12px', borderLeft: `4px solid ${style.color}`, alignItems: 'center' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <Clock size={14} color="#64748b" />
                                        <span style={{ color: '#94a3b8', fontSize: '0.75rem', fontWeight: '600' }}>{new Date(log.created_at).toLocaleString()}</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <style.icon size={16} color={style.color} />
                                        <div>
                                            <span style={{ color: style.color, fontWeight: '800', fontSize: '0.85rem' }}>{(log.action || 'Unknown').toUpperCase()}</span>
                                            <p style={{ color: '#cbd5e1', fontSize: '0.875rem', marginTop: '2px' }}>{log.details}</p>
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <span style={{ color: '#94a3b8', fontSize: '0.75rem', fontWeight: '700' }}>BY: {log.user_email || 'System'}</span>
                                    </div>
                                </div>
                            );
                        })}
                        {logs.length === 0 && (
                            <div style={{ textAlign: 'center', padding: '40px', color: '#475569' }}>
                                <Terminal size={40} style={{ marginBottom: '16px', opacity: 0.5 }} />
                                <p>Initialize system for audit tracking...</p>
                            </div>
                        )}
                    </div>
                </div>
        </div>
    );
};

export default AdminLogs;
