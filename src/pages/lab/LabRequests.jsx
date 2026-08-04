// =============================================================
// FILE: LabRequests.jsx
// PURPOSE: React component for the Laboratory Technician's Request Dashboard.
//          Fetches and displays pending lab orders.
//          Uses schema-compliant queries (appointment-based enrichment).
// =============================================================
import React, { useState, useEffect, useCallback } from 'react';
import { ClipboardList, Search, Filter, AlertTriangle, Clock, CheckCircle, RefreshCw, ChevronDown, User } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

export default function LabRequests() {
    const { profile } = useAuth();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [technicians, setTechnicians] = useState([]);
    const [selectedTechs, setSelectedTechs] = useState({});
    const [toast, setToast] = useState(null);

    const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

    const fetchRequests = useCallback(async () => {
        setLoading(true);
        try {
            // 1. Fetch raw pending requests
            const { data: rawData, error: labError } = await supabase
                .from('lab_requests')
                .select('id, test_name, status, urgency, created_at, appointment_id, technician_id')
                .neq('status', 'completed')
                .order('created_at', { ascending: false });

            if (labError) {
                console.error('[LabRequests] labError:', labError);
                throw labError;
            }
            console.log('[LabRequests] rawData:', rawData);
            if (!rawData || rawData.length === 0) { 
                console.log('[LabRequests] No requests found.');
                setRequests([]); 
                setLoading(false); 
                return; 
            }

            // 2. Fetch corresponding appointments to get patient and doctor info
            const appoids = [...new Set(rawData.map(r => r.appointment_id).filter(Boolean))];
            const { data: appos, error: appoError } = await supabase
                .from('appointment')
                .select(`
                    appoid, 
                    patient:pid(pid, pname, pgender),
                    doctor:docid(docid, docname)
                `)
                .in('appoid', appoids);

            if (appoError) throw appoError;

            // 3. Fetch technicians manually
            const { data: techData } = await supabase
                .from('lab_technician')
                .select('labid, labname, user_id');
            const techMap = (techData || []).reduce((acc, t) => {
                acc[t.user_id || t.labid] = t.labname;
                return acc;
            }, {});

            // 4. Map everything together
            const mapped = rawData.map(r => {
                const appo = appos?.find(a => a.appoid === r.appointment_id);
                const patient = appo?.patient;
                const doctor = appo?.doctor;
                return {
                    ...r,
                    pname: patient?.pname || 'Unknown',
                    pgender: patient?.pgender || 'N/A',
                    pid: patient?.pid || 'N/A',
                    docname: doctor?.docname || 'Clinical Staff',
                    assigned_tech_name: techMap[r.technician_id] || null
                };
            });
            
            setRequests(mapped);
        } catch (e) { 
            console.error('[LabRequests] Fetch failed:', e);
            showToast(`Fetch Error: ${e.message || 'Check console'}`, 'error');
        }
        setLoading(false);
    }, []);

    const fetchTechnicians = useCallback(async () => {
        try {
            const { data, error } = await supabase.from('lab_technician').select('labid, labname, labemail, user_id');
            if (error) throw error;
            setTechnicians(data || []);
            // Try to find the tech record matching the current user's email if possible
            if (profile?.email) {
                const myTech = data?.find(t => t.labemail === profile.email);
                if (myTech) setSelectedTechs(prev => ({ ...prev, [myTech.labid]: myTech.labid }));
            }
        } catch (e) { console.error("Technicians fetch failed", e); }
    }, [profile]);

    useEffect(() => { 
        fetchRequests(); 
        fetchTechnicians();
    }, [fetchRequests, fetchTechnicians]);

    const handleUpdateStatus = async (id, newStatus) => {
        try {
            const techId = selectedTechs[id];
            const updateData = { status: newStatus };
            if (techId) updateData.technician_id = techId; // UUID-safe

            const { error } = await supabase.from('lab_requests').update(updateData).eq('id', id);
            if (error) throw error;
            showToast(`Status updated to ${newStatus}`);
            fetchRequests();
        } catch (e) {
            showToast('Update failed', 'error');
        }
    };

    const filtered = requests.filter(r => {
        const matchS = !search || 
            r.pname?.toLowerCase().includes(search.toLowerCase()) || 
            r.test_name?.toLowerCase().includes(search.toLowerCase());
        return matchS;
    });

    return (
        <div style={{ padding: '40px 56px', maxWidth: '1600px', margin: '0 auto', background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
                {toast && <div style={{ position: 'fixed', top: 24, right: 24, zIndex: 9999, background: toast.type === 'error' ? '#ef4444' : '#10b981', color: 'white', padding: '12px 24px', borderRadius: 12, fontWeight: 600, boxShadow: '0 8px 24px rgba(0,0,0,0.15)' }}>{toast.msg}</div>}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 32 }}>
                    <div>
                        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 12 }}>
                            <ClipboardList size={28} color="#2563eb" /> Test Requests
                        </h1>
                        <p style={{ color: '#64748b', marginTop: 4 }}>Incoming lab orders from clinical departments.</p>
                    </div>
                    <button onClick={fetchRequests} style={{ padding: '10px 18px', borderRadius: 12, border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600, color: '#475569' }}>
                        <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Refresh Queue
                    </button>
                </div>

                {/* Filters Bar */}
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

                {/* Table */}
                <div style={{ background: 'white', borderRadius: 20, border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                                {['Patient', 'Test Name', 'Priority', 'Status', 'Ordered By', 'Actions'].map(h => (
                                    <th key={h} style={{ textAlign: 'left', padding: '16px 24px', fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={6} style={{ textAlign: 'center', padding: 80, color: '#94a3b8' }}>Loading requests...</td></tr>
                            ) : filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={6} style={{ textAlign: 'center', padding: 80 }}>
                                        <ClipboardList size={48} color="#e2e8f0" style={{ marginBottom: 16 }} />
                                        <p style={{ color: '#94a3b8', fontWeight: 500 }}>No pending test requests</p>
                                    </td>
                                </tr>
                            ) : filtered.map((req, i) => (
                                <tr key={req.id} style={{ borderBottom: '1px solid #f8fafc', transition: '0.2s' }}>
                                    <td style={{ padding: '20px 24px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                            <div style={{ width: 40, height: 40, borderRadius: 10, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}><User size={20} /></div>
                                            <div>
                                                <div style={{ fontWeight: 700, color: '#1e293b' }}>{req.pname}</div>
                                                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>PID: {req.pid} • {req.pgender}</div>
                                                {req.assigned_tech_name && (
                                                    <div style={{ fontSize: '0.7rem', color: '#059669', background: '#ecfdf5', padding: '2px 8px', borderRadius: '4px', display: 'inline-block', marginTop: 4, fontWeight: 700 }}>
                                                        👤 {req.assigned_tech_name}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td style={{ padding: '20px 24px' }}>
                                        <div style={{ fontWeight: 600, color: '#334155' }}>{req.test_name}</div>
                                        <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Req #{req.id}</div>
                                    </td>
                                    <td style={{ padding: '20px 24px' }}>
                                        <span style={{ padding: '4px 12px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 700, background: req.urgency === 'Urgent' ? '#fef2f2' : '#f0f9ff', color: req.urgency === 'Urgent' ? '#ef4444' : '#0369a1' }}>
                                            {req.urgency === 'Urgent' ? '⚡ URGENT' : 'Routine'}
                                        </span>
                                    </td>
                                    <td style={{ padding: '20px 24px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: req.status === 'sample_collected' ? '#3b82f6' : '#f59e0b' }} />
                                            <span style={{ fontWeight: 600, fontSize: '0.85rem', color: req.status === 'sample_collected' ? '#3b82f6' : '#f59e0b' }}>
                                                {req.status === 'sample_collected' ? '🧪 Collected' : '⏳ Pending'}
                                            </span>
                                        </div>
                                    </td>
                                    <td style={{ padding: '20px 24px' }}>
                                        <div style={{ fontWeight: 500, fontSize: '0.875rem' }}>Dr. {req.docname}</div>
                                        <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{new Date(req.created_at).toLocaleTimeString()}</div>
                                    </td>
                                     <td style={{ padding: '20px 24px' }}>
                                         <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                             {req.status === 'pending' && (
                                                  <>
                                                      <select 
                                                          value={selectedTechs[req.id] || ''} 
                                                          onChange={e => setSelectedTechs({...selectedTechs, [req.id]: e.target.value})}
                                                          style={{ padding: '6px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: '0.75rem' }}
                                                      >
                                                          <option value="">Assign Tech...</option>
                                                          {technicians.map(t => <option key={t.labid} value={t.user_id || t.labid}>{t.labname}</option>)}
                                                      </select>
                                                      <button onClick={() => handleUpdateStatus(req.id, 'sample_collected')}
                                                          style={{ padding: '8px 14px', borderRadius: 8, border: 'none', background: '#3b82f6', color: 'white', fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer' }}>
                                                          Mark Collected
                                                      </button>
                                                  </>
                                             )}
                                             {req.status === 'sample_collected' && (
                                                  <span style={{ color: '#10b981', fontWeight: 700, fontSize: '0.8rem' }}>Ready for Analysis</span>
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
