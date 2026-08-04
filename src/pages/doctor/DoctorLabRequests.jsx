// =============================================================
// FILE: DoctorLabRequests.jsx
// PURPOSE: React component / entry point for the eDoc Hospital
//          frontend. Part of the Vite + React SPA.
// =============================================================
import React, { useState, useEffect, useCallback } from 'react';
import { FlaskConical, Search, Clock, RefreshCw, ChevronRight, User, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

export default function DoctorLabRequests() {
    const { profile } = useAuth();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const navigate = useNavigate();

    const fetchOrders = useCallback(async () => {
        if (!profile?.docid) return;
        setLoading(true);
        try {
            const docIdInt = parseInt(profile?.docid);
            if (isNaN(docIdInt)) {
                setLoading(false);
                return;
            }

            // 1. Fetch appointments for this doctor to get a list of valid IDs (exclude completed)
            const { data: appts, error: apptError } = await supabase
                .from('appointment')
                .select(`
                    appoid,
                    patient:pid(pid, pname)
                `)
                .eq('docid', docIdInt)
                .neq('status', 'Completed');

            if (apptError) throw apptError;
            if (!appts || appts.length === 0) {
                setOrders([]);
                setLoading(false);
                return;
            }

            const apptIds = appts.map(a => a.appoid);
            const apptLookup = appts.reduce((acc, a) => {
                acc[a.appoid] = a.patient;
                return acc;
            }, {});

            // 2. Fetch lab requests matching those appointments
            const { data, error } = await supabase
                .from('lab_requests')
                .select('*')
                .in('appointment_id', apptIds)
                .order('id', { ascending: false });

            if (error) throw error;

            if (data) {
                const formatted = data.map(req => {
                    const patient = apptLookup[req.appointment_id];
                    return {
                        id: req.id,
                        test_type: req.test_type,
                        specimen_type: req.specimen_type,
                        urgency: req.urgency,
                        status: req.status,
                        created_at: req.created_at,
                        appointment_id: req.appointment_id,
                        patient_id: patient?.pid,
                        pname: patient?.pname || 'Unknown'
                    };
                });
                setOrders(formatted);
            } else {
                setOrders([]);
            }
        } catch (e) { 
            console.error("[DoctorLabRequests] Fetch Error:", e);
        }
        setLoading(false);
    }, [profile?.docid]);

    useEffect(() => { fetchOrders(); }, [fetchOrders]);

    const filtered = orders.filter(o => 
        (o.pname || '').toLowerCase().includes(search.toLowerCase()) || 
        (o.test_type || '').toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div style={{ padding: '40px 56px', maxWidth: '1600px', margin: '0 auto', background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 32 }}>
                    <div>
                        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 12 }}>
                            <FlaskConical size={28} color="#2563eb" /> Lab Order Tracking
                        </h1>
                        <p style={{ color: '#64748b', marginTop: 4 }}>Monitor the status of all your diagnostic requests in real-time.</p>
                    </div>
                    <button onClick={fetchOrders} style={{ padding: '10px 18px', borderRadius: 12, border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600, color: '#475569' }}>
                        <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Refresh Queue
                    </button>
                </div>

                {/* Search Bar */}
                <div style={{ position: 'relative', marginBottom: 24 }}>
                    <Search size={18} style={{ position: 'absolute', left: 16, top: 14, color: '#94a3b8' }} />
                    <input 
                        value={search} 
                        onChange={e => setSearch(e.target.value)} 
                        type="text" 
                        placeholder="Search by patient name or test type..." 
                        style={{ width: '100%', padding: '14px 16px 14px 48px', borderRadius: 16, border: '1px solid #e2e8f0', fontSize: '0.95rem', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', outline: 'none' }} 
                    />
                </div>

                {/* Orders List */}
                <div style={{ background: 'white', borderRadius: 20, border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                                {['Patient', 'Test Details', 'Order Priority', 'Current Status', 'Ordered At', 'Actions'].map(h => (
                                    <th key={h} style={{ textAlign: 'left', padding: '16px 24px', fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={6} style={{ textAlign: 'center', padding: 80, color: '#94a3b8' }}>Loading your orders...</td></tr>
                            ) : filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={6} style={{ textAlign: 'center', padding: 80 }}>
                                        <FlaskConical size={48} color="#e2e8f0" style={{ marginBottom: 16 }} />
                                        <p style={{ color: '#94a3b8', fontWeight: 500 }}>No active lab orders found.</p>
                                    </td>
                                </tr>
                            ) : filtered.map((order, i) => (
                                <tr key={order.id} style={{ borderBottom: '1px solid #f8fafc', transition: '0.2s' }} onMouseOver={e => e.currentTarget.style.background = '#f8fafc'} onMouseOut={e => e.currentTarget.style.background = 'white'}>
                                    <td style={{ padding: '20px 24px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                            <div style={{ width: 40, height: 40, borderRadius: 10, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}><User size={20} /></div>
                                            <div>
                                                <div style={{ fontWeight: 700, color: '#1e293b' }}>{order.pname}</div>
                                                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>PID: {order.patient_id}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td style={{ padding: '20px 24px' }}>
                                        <div style={{ fontWeight: 600, color: '#334155' }}>{order.test_type}</div>
                                        {order.specimen_type && <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Specimen: {order.specimen_type}</div>}
                                    </td>
                                    <td style={{ padding: '20px 24px' }}>
                                        <span style={{ padding: '4px 12px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 700, background: order.urgency === 'Urgent' ? '#fef2f2' : '#f0f9ff', color: order.urgency === 'Urgent' ? '#ef4444' : '#0369a1' }}>
                                            {order.urgency === 'Urgent' ? '⚡ URGENT' : 'Routine'}
                                        </span>
                                    </td>
                                    <td style={{ padding: '20px 24px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: order.status === 'completed' ? '#10b981' : (order.status === 'pending' ? '#f59e0b' : '#3b82f6') }} />
                                            <span style={{ fontWeight: 600, fontSize: '0.85rem', color: order.status === 'completed' ? '#10b981' : (order.status === 'pending' ? '#f59e0b' : '#3b82f6') }}>
                                                {order.status === 'pending' ? 'Awaiting Sample' : (order.status === 'completed' ? 'Results Ready' : 'Processing')}
                                            </span>
                                        </div>
                                    </td>
                                    <td style={{ padding: '20px 24px', fontSize: '0.85rem', color: '#64748b' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Clock size={14} /> {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                    </td>
                                    <td style={{ padding: '20px 24px' }}>
                                        <div style={{ display: 'flex', gap: 8 }}>
                                            <button 
                                                onClick={() => navigate(`/doctor/consultation?appoid=${order.appointment_id}`)}
                                                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, border: '1px solid #e2e8f0', background: 'white', color: '#1e293b', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' }}
                                            >
                                                Open File <ChevronRight size={14} />
                                            </button>
                                            {order.status === 'completed' && (
                                                <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, border: 'none', background: '#2563eb', color: 'white', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' }}>
                                                    View Results <ExternalLink size={14} />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            <style>{`
                    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                    .animate-spin { animation: spin 1s linear infinite; }
            `}</style>
        </div>
    );
}
