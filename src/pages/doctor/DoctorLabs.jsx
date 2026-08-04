// =============================================================
// FILE: DoctorLabs.jsx
// PURPOSE: React component for the Doctor's Laboratory Tracking Dashboard.
//          Fetches and displays lab requests linked to the current doctor.
//          Uses schema-compliant queries (appointment-based filtering).
// =============================================================
import React, { useState, useEffect, useCallback } from 'react';
import { FlaskConical, Search, Clock, RefreshCw, User, Stethoscope, AlertTriangle } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

const DoctorLabs = () => {
    const { profile } = useAuth();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState('');
    const navigate = useNavigate();
    const location = useLocation();
    const query = new URLSearchParams(location.search);
    const statusFilter = query.get('status');

    const fetchOrders = useCallback(async () => {
        if (!profile?.docid) return;
        setLoading(true);
        setError(null);
        try {
            const docIdInt = parseInt(profile?.docid);
            if (isNaN(docIdInt)) {
                setLoading(false);
                return;
            }

            // 1. Fetch all appointments for this doctor with patient names (exclude completed)
            const { data: appointments, error: appError } = await supabase
                .from('appointment')
                .select('appoid, patient:pid(pid, pname)')
                .eq('docid', docIdInt)
                .neq('status', 'Completed');

            if (appError) throw appError;

            const appoids = (appointments || []).map(a => a.appoid);
            if (appoids.length === 0) {
                setOrders([]);
                setLoading(false);
                return;
            }

            // 2. Fetch lab requests for these appointments (Schema compliant)
            const { data: labData, error: labError } = await supabase
                .from('lab_requests')
                .select('id, test_name, status, created_at, appointment_id')
                .in('appointment_id', appoids)
                .order('created_at', { ascending: false });

            if (labError) throw labError;

            // 3. Combine and format
            const formatted = (labData || []).map(req => {
                const appo = appointments.find(a => a.appoid === req.appointment_id);
                const patient = appo?.patient;
                return {
                    id: req.id,
                    test_name: req.test_name,
                    status: req.status,
                    created_at: req.created_at,
                    appointment_id: req.appointment_id,
                    pid: patient?.pid || 'N/A',
                    pname: patient?.pname || 'Unknown'
                };
            });

            setOrders(formatted);
        } catch (e) { 
            console.error('[DoctorLabs] Fetch error:', e);
            setError(`Fetch failed: ${e.message}`);
        }
        setLoading(false);
    }, [profile?.docid]);

    useEffect(() => { fetchOrders(); }, [fetchOrders]);

    const filtered = orders.filter(o => {
        const matchesSearch = (
            (o.pname || '').toLowerCase().includes(search.toLowerCase()) || 
            (o.test_name || '').toLowerCase().includes(search.toLowerCase())
        );
        if (!statusFilter) return matchesSearch;
        const matchesStatus = statusFilter === 'ready' ? o.status === 'completed' : o.status !== 'completed';
        return matchesSearch && matchesStatus;
    });

    return (
        <div style={{ padding: '40px 56px', maxWidth: '1600px', margin: '0 auto', background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 32 }}>
                    <div>
                        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 12 }}>
                            <FlaskConical size={28} color="#2563eb" /> 
                            {statusFilter === 'ready' ? 'Ready Lab Results' : statusFilter === 'pending' ? 'Pending Lab Orders' : 'Lab Order Tracking'}
                        </h1>
                        <p style={{ color: '#64748b', marginTop: 4 }}>
                            Monitor the status of your diagnostic requests in real-time.
                        </p>
                    </div>
                    <button onClick={fetchOrders} style={{ padding: '10px 18px', borderRadius: 12, border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600, color: '#475569' }}>
                        <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Refresh Queue
                    </button>
                </div>

                {/* Search Bar */}
                <div style={{ background: 'white', padding: '20px', borderRadius: '16px', border: '1px solid #e2e8f0', marginBottom: '24px' }}>
                    <div style={{ position: 'relative' }}>
                        <Search size={18} style={{ position: 'absolute', left: '16px', top: '14px', color: '#94a3b8' }} />
                        <input 
                            value={search} 
                            onChange={e => setSearch(e.target.value)} 
                            type="text" 
                            placeholder="Search by patient name or test..." 
                            style={{ width: '100%', padding: '12px 16px 12px 48px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '0.9rem' }} 
                        />
                    </div>
                </div>

                {/* Orders Table */}
                <div style={{ background: 'white', borderRadius: 20, border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                                {['Patient', 'Test Name', 'Status', 'Ordered At', 'Actions'].map(h => (
                                    <th key={h} style={{ textAlign: 'left', padding: '16px 24px', fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={5} style={{ textAlign: 'center', padding: 80, color: '#94a3b8' }}>Loading orders...</td></tr>
                            ) : error ? (
                                <tr><td colSpan={5} style={{ textAlign: 'center', padding: 80, color: '#ef4444', fontSize: '0.95rem' }}>
                                    <AlertTriangle size={32} style={{ marginBottom: 12, display: 'block', margin: '0 auto' }} />
                                    <div>{error}</div>
                                </td></tr>
                            ) : filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={5} style={{ textAlign: 'center', padding: 80 }}>
                                        <FlaskConical size={48} color="#e2e8f0" style={{ marginBottom: 16 }} />
                                        <p style={{ color: '#94a3b8', fontWeight: 500 }}>No matching lab orders</p>
                                    </td>
                                </tr>
                            ) : filtered.map((order) => (
                                <tr key={order.id} style={{ borderBottom: '1px solid #f8fafc', transition: '0.2s' }}>
                                    <td style={{ padding: '20px 24px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                            <div style={{ width: 40, height: 40, borderRadius: 10, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}><User size={20} /></div>
                                            <div>
                                                <div style={{ fontWeight: 700, color: '#1e293b' }}>{order.pname}</div>
                                                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>PID: {order.pid}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td style={{ padding: '20px 24px' }}>
                                        <div style={{ fontWeight: 600, color: '#334155' }}>{order.test_name}</div>
                                    </td>
                                    <td style={{ padding: '20px 24px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: order.status === 'completed' ? '#10b981' : '#f59e0b' }} />
                                            <span style={{ fontWeight: 600, fontSize: '0.85rem', color: order.status === 'completed' ? '#10b981' : '#f59e0b' }}>
                                                {order.status === 'completed' ? '✅ Ready' : '⏳ Processing'}
                                            </span>
                                        </div>
                                    </td>
                                    <td style={{ padding: '20px 24px', fontSize: '0.85rem', color: '#64748b' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Clock size={14} /> {new Date(order.created_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</div>
                                    </td>
                                    <td style={{ padding: '20px 24px' }}>
                                        <div style={{ display: 'flex', gap: 8 }}>
                                            <button 
                                                onClick={() => navigate(`/doctor/consultation?appoid=${order.appointment_id}`)}
                                                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, border: '1px solid #2563eb', background: '#eff6ff', color: '#2563eb', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}
                                            >
                                                <Stethoscope size={14} /> Continue SOAP
                                            </button>
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
};

export default DoctorLabs;
