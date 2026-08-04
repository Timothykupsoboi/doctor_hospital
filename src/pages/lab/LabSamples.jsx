// =============================================================
// FILE: LabSamples.jsx
// PURPOSE: React component / entry point for the eDoc Hospital
//          frontend. Part of the Vite + React SPA.
// =============================================================
import React, { useState, useEffect, useCallback } from 'react';
import { Droplets, Search, Scan, CheckCircle, XCircle, Clock, AlertTriangle, RefreshCw } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export default function LabSamples() {
    const [samples, setSamples] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sampleId, setSampleId] = useState('');
    const [found, setFound] = useState(null);
    const [notFound, setNotFound] = useState(false);
    const [toast, setToast] = useState(null);

    const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

    const fetchSamples = useCallback(async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('lab_requests')
                .select(`
                    *,
                    appointment!inner(
                        schedule!inner(
                            doctor!inner(docname)
                        )
                    ),
                    patient!inner(pid, pname, pgender)
                `)
                .eq('status', 'pending')
                .order('created_at', { ascending: false });

            if (error) throw error;
            
            const mapped = (data || []).map(r => ({
                ...r,
                pname: r.patient?.pname || r.appointment?.patient?.pname || 'Unknown',
                pgender: r.patient?.pgender || r.appointment?.patient?.pgender || 'Unknown',
                docname: r.appointment?.schedule?.doctor?.docname || 'Unknown'
            }));
            
            setSamples(mapped);
        } catch (e) { setSamples([]); }
        setLoading(false);
    }, []);

    useEffect(() => { fetchSamples(); }, [fetchSamples]);

    const handleSearch = () => {
        const hit = samples.find(s => String(s.id) === sampleId.trim() || (s.pname && s.pname.toLowerCase().includes(sampleId.toLowerCase())));
        if (hit) { setFound(hit); setNotFound(false); }
        else { setFound(null); setNotFound(true); }
    };

    const handleAction = async (id, action) => {
        const newStatus = action === 'collected' ? 'sample_collected' : 'sample_rejected';
        try {
            const { error } = await supabase.from('lab_requests').update({ status: newStatus }).eq('id', id);
            if (error) throw error;
            showToast(action === 'collected' ? '✓ Sample collected successfully' : 'Sample marked as rejected');
            setFound(null);
            setSampleId('');
            fetchSamples();
        } catch (e) {
            showToast('Update failed', 'error');
        }
    };

    const urgentSamples = samples.filter(s => s.urgency === 'Urgent');

    return (
        <div style={{ padding: '40px 56px', maxWidth: '1600px', margin: '0 auto', background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
                {toast && <div style={{ position: 'fixed', top: 24, right: 24, zIndex: 9999, background: toast.type === 'error' ? '#ef4444' : '#10b981', color: 'white', padding: '12px 24px', borderRadius: 12, fontWeight: 600, boxShadow: '0 8px 24px rgba(0,0,0,0.15)' }}>{toast.msg}</div>}
                
                <div style={{ marginBottom: 32 }}>
                    <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 12 }}>
                        <Droplets size={28} color="#0ea5e9" /> Sample Collection
                    </h1>
                    <p style={{ color: '#64748b', marginTop: 4 }}>Scan or enter a request ID to collect and track clinical samples.</p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 28, marginBottom: 32 }}>
                    {/* Scan/Search Widget */}
                    <div style={{ background: 'white', borderRadius: 20, border: '1px solid #e2e8f0', padding: 32, boxShadow: '0 4px 16px rgba(0,0,0,0.05)' }}>
                        <h2 style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Scan size={18} color="#0ea5e9" /> Scan or Lookup
                        </h2>
                        <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: 24 }}>Enter a request ID or patient name to locate the sample</p>
                        <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
                            <input value={sampleId} onChange={e => setSampleId(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()}
                                placeholder="e.g. Request ID or Patient Name" style={{ flex: 1, padding: '12px 16px', borderRadius: 12, border: '2px solid #e2e8f0', fontSize: '1rem', letterSpacing: 1, fontWeight: 600, outline: 'none' }} autoFocus />
                            <button onClick={handleSearch} style={{ padding: '12px 20px', borderRadius: 12, background: '#0ea5e9', color: 'white', border: 'none', fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem' }}>
                                Search
                            </button>
                        </div>

                        {notFound && !found && (
                            <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 10, padding: '12px 16px', color: '#dc2626', fontWeight: 500, fontSize: '0.875rem' }}>
                                No matching request found. Check the ID and try again.
                            </div>
                        )}

                        {found && (
                            <div style={{ border: '2px solid #0ea5e9', borderRadius: 14, overflow: 'hidden' }}>
                                <div style={{ background: '#0ea5e9', color: 'white', padding: '12px 16px', fontWeight: 700, fontSize: '0.9rem' }}>
                                    Request #{found.id} — {found.test_name}
                                </div>
                                <div style={{ padding: 16 }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                                        {[
                                            { label: 'Patient', value: found.pname },
                                            { label: 'Gender', value: found.pgender },
                                            { label: 'Specimen', value: found.specimen_type || 'Not specified' },
                                            { label: 'Ordered By', value: `Dr. ${found.docname}` },
                                            { label: 'Priority', value: found.urgency || 'Normal' },
                                        ].map((f, i) => (
                                            <div key={i}>
                                                <div style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600, marginBottom: 2 }}>{f.label}</div>
                                                <div style={{ fontWeight: 600, color: '#1e293b', fontSize: '0.9rem' }}>{f.value}</div>
                                            </div>
                                        ))}
                                    </div>
                                    <div style={{ display: 'flex', gap: 10 }}>
                                        <button onClick={() => handleAction(found.id, 'collected')}
                                            style={{ flex: 1, padding: '12px', borderRadius: 10, background: '#10b981', color: 'white', border: 'none', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                                            <CheckCircle size={16} /> Confirm Collected
                                        </button>
                                        <button onClick={() => handleAction(found.id, 'rejected')}
                                            style={{ flex: 1, padding: '12px', borderRadius: 10, background: '#fef2f2', color: '#ef4444', border: '1px solid #fca5a5', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                                            <XCircle size={16} /> Reject Sample
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Urgent Queue */}
                    <div style={{ background: 'white', borderRadius: 20, border: '1px solid #e2e8f0', padding: 28 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                            <h2 style={{ fontWeight: 700, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                                <AlertTriangle size={18} color="#ef4444" /> Urgent Queue
                            </h2>
                            <button onClick={fetchSamples} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}><RefreshCw size={14} /></button>
                        </div>
                        {urgentSamples.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '32px 0', color: '#94a3b8' }}>
                                <CheckCircle size={32} color="#10b981" style={{ marginBottom: 8 }} />
                                <p style={{ fontWeight: 500 }}>No urgent requests</p>
                            </div>
                        ) : urgentSamples.map((s, i) => (
                            <div key={i} style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 12, padding: '14px 16px', marginBottom: 10 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div>
                                        <div style={{ fontWeight: 700, color: '#1e293b' }}>{s.pname}</div>
                                        <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: 2 }}>{s.test_name} · {s.specimen_type}</div>
                                    </div>
                                    <button onClick={() => { setFound(s); setSampleId(String(s.id)); setNotFound(false); }}
                                        style={{ padding: '4px 12px', borderRadius: 8, background: '#ef4444', color: 'white', border: 'none', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}>
                                        Collect
                                    </button>
                                </div>
                                <div style={{ fontSize: '0.75rem', color: '#ef4444', marginTop: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                                    <Clock size={11} /> {new Date(s.created_at).toLocaleTimeString()}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Pending Collection Table */}
                <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                    <div style={{ padding: '18px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3 style={{ fontWeight: 700, fontSize: '0.95rem' }}>All Pending Sample Collections</h3>
                        <span style={{ background: '#fef3c7', color: '#b45309', padding: '3px 10px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 700 }}>{samples.length} pending</span>
                    </div>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: '#f8fafc' }}>
                                {['#', 'Patient', 'Test', 'Specimen', 'Priority', 'Doctor', 'Ordered At', 'Action'].map(h => (
                                    <th key={h} style={{ textAlign: 'left', padding: '12px 20px', fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={8} style={{ textAlign: 'center', padding: 48, color: '#94a3b8' }}>Loading...</td></tr>
                            ) : samples.length === 0 ? (
                                <tr><td colSpan={8} style={{ textAlign: 'center', padding: 48, color: '#94a3b8' }}>All samples accounted for</td></tr>
                            ) : samples.map((s, i) => (
                                <tr key={i} style={{ borderBottom: '1px solid #f8fafc', transition: '0.15s' }}
                                    onMouseOver={e => e.currentTarget.style.background = '#f8fafc'}
                                    onMouseOut={e => e.currentTarget.style.background = 'white'}>
                                    <td style={{ padding: '14px 20px', color: '#94a3b8', fontSize: '0.8rem' }}>#{s.id}</td>
                                    <td style={{ padding: '14px 20px' }}>
                                        <div style={{ fontWeight: 600, color: '#1e293b' }}>{s.pname}</div>
                                        <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{s.pgender}</div>
                                    </td>
                                    <td style={{ padding: '14px 20px', fontWeight: 500, fontSize: '0.875rem' }}>{s.test_name}</td>
                                    <td style={{ padding: '14px 20px', fontSize: '0.875rem', color: '#64748b' }}>{s.specimen_type || '—'}</td>
                                    <td style={{ padding: '14px 20px' }}>
                                        <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 700, background: s.urgency === 'Urgent' ? '#fef2f2' : '#f0f9ff', color: s.urgency === 'Urgent' ? '#ef4444' : '#0369a1' }}>
                                            {s.urgency || 'Normal'}
                                        </span>
                                    </td>
                                    <td style={{ padding: '14px 20px', fontSize: '0.875rem' }}>Dr. {s.docname}</td>
                                    <td style={{ padding: '14px 20px', fontSize: '0.78rem', color: '#94a3b8' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={11} /> {new Date(s.created_at).toLocaleString()}</div>
                                    </td>
                                    <td style={{ padding: '14px 20px' }}>
                                        <button onClick={() => { setFound(s); setNotFound(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                                            style={{ padding: '6px 16px', borderRadius: 8, background: '#0ea5e9', color: 'white', border: 'none', fontWeight: 600, fontSize: '0.78rem', cursor: 'pointer' }}>
                                            Process
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
        </div>
    );
}
