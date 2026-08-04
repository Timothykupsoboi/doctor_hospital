// =============================================================
// FILE: LabValidation.jsx
// PURPOSE: React component / entry point for the eDoc Hospital
//          frontend. Part of the Vite + React SPA.
// =============================================================
import React, { useState, useEffect, useCallback } from 'react';
import { ShieldCheck, CheckCircle, AlertOctagon, Clock, Eye, X, User, Microscope, RefreshCw, Flag } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

export default function LabValidation() {
    const [queue, setQueue] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState(null);
    const [flagReason, setFlagReason] = useState('');
    const [toast, setToast] = useState(null);

    const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

    const { user } = useAuth();
    const fetchQueue = useCallback(async () => {
        setLoading(true);
        try {
            // 1. Fetch raw reports needing validation
            const { data: rawData, error: reportError } = await supabase
                .from('lab_reports')
                .select('*')
                .or('verified.is.null,verified.eq.0')
                .order('created_at', { ascending: false });

            if (reportError) throw reportError;

            // 2. Fetch patients manually
            const pids = [...new Set((rawData || []).map(r => r.patient_id).filter(Boolean))];
            let patients = [];
            if (pids.length > 0) {
                const { data: pData } = await supabase
                    .from('patient')
                    .select('pid, pname, pgender')
                    .in('pid', pids);
                patients = pData || [];
            }

            // 3. Fetch technicians manually
            const { data: techData } = await supabase
                .from('lab_technician')
                .select('labid, labname');
            const techMap = (techData || []).reduce((acc, t) => {
                acc[t.labid] = t.labname;
                return acc;
            }, {});

            const mapped = (rawData || []).map(r => {
                const pat = patients.find(p => p.pid === r.patient_id);
                return {
                    ...r,
                    pname: pat?.pname || 'Unknown',
                    pgender: pat?.pgender || 'Unknown',
                    technician_name: techMap[r.technician_id] || 'System'
                };
            });
            
            setQueue(mapped);
        } catch (e) { setQueue([]); }
        setLoading(false);
    }, []);

    useEffect(() => { fetchQueue(); }, [fetchQueue]);

    const handleAction = async (id, action) => {
        const verifiedVal = action === 'approved' ? 1 : 2;
        try {
            const { error } = await supabase
                .from('lab_reports')
                .update({ 
                    verified: verifiedVal, 
                    verified_by: user?.email || '', 
                    verified_at: new Date().toISOString(),
                    flag_reason: action === 'flagged' ? flagReason : null 
                })
                .eq('id', id);
            
            if (error) throw error;

            showToast(action === 'approved' ? '✓ Result approved and verified' : '⚑ Result flagged for review');
            setSelected(null);
            setFlagReason('');
            fetchQueue();
        } catch (e) {
            showToast('Failed to update result', 'error');
        }
    };

    const parseResults = (raw) => { try { return JSON.parse(raw || '{}'); } catch { return {}; } };

    return (
        <div style={{ padding: '40px 56px', maxWidth: '1600px', margin: '0 auto', background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
                {toast && <div style={{ position: 'fixed', top: 24, right: 24, zIndex: 9999, background: toast.type === 'error' ? '#ef4444' : '#10b981', color: 'white', padding: '12px 24px', borderRadius: 12, fontWeight: 600, boxShadow: '0 8px 24px rgba(0,0,0,0.15)' }}>{toast.msg}</div>}
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 32 }}>
                    <div>
                        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 12 }}>
                            <ShieldCheck size={28} color="#8b5cf6" /> Results Validation & QC
                        </h1>
                        <p style={{ color: '#64748b', marginTop: 4 }}>Senior staff review and verification of completed lab findings before delivery.</p>
                    </div>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                        <div style={{ background: '#fef3c7', border: '1px solid #fde68a', borderRadius: 10, padding: '8px 14px', fontSize: '0.82rem', fontWeight: 700, color: '#b45309' }}>
                            {queue.length} awaiting review
                        </div>
                        <button onClick={fetchQueue} style={{ padding: '10px 14px', borderRadius: 10, border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', color: '#64748b' }}><RefreshCw size={14} /></button>
                    </div>
                </div>

                {/* Process Info Banner */}
                <div style={{ background: 'linear-gradient(135deg, #1e1b4b, #312e81)', color: 'white', borderRadius: 16, padding: '20px 28px', marginBottom: 28, display: 'flex', alignItems: 'center', gap: 20 }}>
                    <div style={{ background: 'rgba(255,255,255,0.1)', padding: 14, borderRadius: 12 }}>
                        <ShieldCheck size={28} />
                    </div>
                    <div>
                        <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 4 }}>Quality Control Protocol</div>
                        <div style={{ opacity: 0.8, fontSize: '0.85rem' }}>
                            All completed results must be reviewed by a senior technician before they are marked as verified and sent to the doctor.
                            Flag any result that requires re-testing or clinical escalation.
                        </div>
                    </div>
                </div>

                {queue.length === 0 && !loading ? (
                    <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e2e8f0', padding: '80px 40px', textAlign: 'center' }}>
                        <CheckCircle size={56} color="#10b981" style={{ marginBottom: 16 }} />
                        <h3 style={{ fontWeight: 700, color: '#1e293b', marginBottom: 8 }}>All Clear!</h3>
                        <p style={{ color: '#64748b' }}>No results are pending validation. All completed tests have been reviewed.</p>
                    </div>
                ) : (
                    <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                                    {['Patient', 'Test Name', 'Technician', 'Date Completed', 'QC Action'].map(h => (
                                        <th key={h} style={{ textAlign: 'left', padding: '14px 20px', fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan={5} style={{ textAlign: 'center', padding: 64, color: '#94a3b8' }}>Loading validation queue...</td></tr>
                                ) : queue.map((item, i) => (
                                    <tr key={i} style={{ borderBottom: '1px solid #f8fafc', transition: '0.15s' }}
                                        onMouseOver={e => e.currentTarget.style.background = '#f8fafc'}
                                        onMouseOut={e => e.currentTarget.style.background = 'white'}>
                                        <td style={{ padding: '16px 20px' }}>
                                            <div style={{ fontWeight: 700, color: '#1e293b' }}>{item.pname}</div>
                                            <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{item.pgender}</div>
                                        </td>
                                        <td style={{ padding: '16px 20px' }}>
                                            <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                                                <Microscope size={14} color="#94a3b8" /> {item.test_name}
                                            </div>
                                        </td>
                                        <td style={{ padding: '16px 20px', fontSize: '0.875rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                <User size={13} color="#94a3b8" /> {item.technician_name || 'Unknown'}
                                            </div>
                                        </td>
                                        <td style={{ padding: '16px 20px', fontSize: '0.82rem', color: '#64748b' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                                <Clock size={12} /> {new Date(item.created_at).toLocaleString()}
                                            </div>
                                        </td>
                                        <td style={{ padding: '16px 20px' }}>
                                            <div style={{ display: 'flex', gap: 8 }}>
                                                <button onClick={() => { setSelected(item); setFlagReason(''); }}
                                                    style={{ padding: '6px 14px', borderRadius: 8, background: '#eef2ff', color: '#6366f1', border: '1px solid #c7d2fe', fontWeight: 600, fontSize: '0.78rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                                                    <Eye size={13} /> Review
                                                </button>
                                                <button onClick={() => handleAction(item.id, 'approved')}
                                                    style={{ padding: '6px 14px', borderRadius: 8, background: '#ecfdf5', color: '#059669', border: '1px solid #86efac', fontWeight: 600, fontSize: '0.78rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                                                    <CheckCircle size={13} /> Approve
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Review Modal */}
                {selected && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
                        <div style={{ background: 'white', borderRadius: 20, width: 600, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 25px 50px rgba(0,0,0,0.25)' }}>
                            <div style={{ padding: '24px 28px', background: '#1e1b4b', borderRadius: '20px 20px 0 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'white' }}>
                                <div>
                                    <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>QC Review: {selected.test_name}</div>
                                    <div style={{ fontSize: '0.8rem', opacity: 0.7, marginTop: 2 }}>Patient: {selected.pname} · Tech: {selected.technician_name}</div>
                                </div>
                                <button onClick={() => setSelected(null)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', padding: '6px 10px', borderRadius: 8, cursor: 'pointer', color: 'white' }}><X size={16} /></button>
                            </div>
                            <div style={{ padding: 28 }}>
                                <h4 style={{ fontWeight: 700, marginBottom: 12 }}>Test Findings</h4>
                                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 24 }}>
                                    <thead><tr style={{ background: '#f8fafc' }}>
                                        <th style={{ textAlign: 'left', padding: '10px 14px', fontSize: '0.75rem', color: '#64748b' }}>Parameter</th>
                                        <th style={{ textAlign: 'left', padding: '10px 14px', fontSize: '0.75rem', color: '#64748b' }}>Value Recorded</th>
                                    </tr></thead>
                                    <tbody>
                                        {Object.entries(parseResults(selected.results)).map(([k, v], i) => (
                                            <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                <td style={{ padding: '10px 14px', color: '#64748b', fontSize: '0.875rem' }}>{k}</td>
                                                <td style={{ padding: '10px 14px', fontWeight: 700, color: '#1e293b' }}>
                                                    {typeof v === 'object' && v !== null ? (
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                            {v.value} <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>{v.unit || ''}</span>
                                                            {v.status && v.status !== 'Normal' && (
                                                                <span style={{ padding: '2px 6px', borderRadius: 4, fontSize: '0.65rem', background: '#fef2f2', color: '#ef4444' }}>
                                                                    {v.status}
                                                                </span>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        String(v)
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {selected.notes && (
                                    <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10, padding: '12px 16px', marginBottom: 24 }}>
                                        <div style={{ fontWeight: 700, fontSize: '0.78rem', color: '#b45309', marginBottom: 4 }}>Technician Notes</div>
                                        <div style={{ fontSize: '0.875rem', color: '#78350f' }}>{selected.notes}</div>
                                    </div>
                                )}
                                <div style={{ background: '#fef3c7', border: '1px solid #fde68a', borderRadius: 12, padding: 16, marginBottom: 20 }}>
                                    <label style={{ display: 'block', fontWeight: 700, fontSize: '0.82rem', color: '#b45309', marginBottom: 8 }}>
                                        <Flag size={13} style={{ display: 'inline', marginRight: 6 }} />Flag Reason (required if flagging)
                                    </label>
                                    <textarea rows={2} value={flagReason} onChange={e => setFlagReason(e.target.value)} placeholder="e.g. Haemoglobin value is unusually low — please re-collect sample..."
                                        style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #fde68a', fontSize: '0.875rem', resize: 'vertical', boxSizing: 'border-box', background: 'white' }} />
                                </div>
                                <div style={{ display: 'flex', gap: 10 }}>
                                    <button onClick={() => handleAction(selected.id, 'approved')}
                                        style={{ flex: 1, padding: '13px', borderRadius: 12, background: '#059669', color: 'white', border: 'none', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                                        <CheckCircle size={16} /> Approve & Verify
                                    </button>
                                    <button onClick={() => { if (!flagReason.trim()) return alert('Please enter a flag reason'); handleAction(selected.id, 'flagged'); }}
                                        style={{ flex: 1, padding: '13px', borderRadius: 12, background: '#fef3c7', color: '#b45309', border: '1px solid #fde68a', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                                        <AlertOctagon size={16} /> Flag for Re-Review
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
        </div>
    );
}
