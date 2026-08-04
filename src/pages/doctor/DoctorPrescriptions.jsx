// =============================================================
// FILE: DoctorPrescriptions.jsx
// PURPOSE: React component / entry point for the eDoc Hospital
//          frontend. Part of the Vite + React SPA.
// =============================================================
import React, { useState, useEffect } from 'react';
import EntityDetailModal from '../../components/pharmacy/EntityDetailModal';
import { Pill, Search, Calendar, Filter, Eye } from 'lucide-react';

import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

const DoctorPrescriptions = () => {
    const { profile } = useAuth();
    const [prescriptions, setPrescriptions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [intelModal, setIntelModal] = useState({ open: false, data: null });
    const user = profile || {};

    useEffect(() => {
        if (profile?.docid) {
            fetchPrescriptions();
        }
    }, [profile]);

    const fetchPrescriptions = async () => {
        setLoading(true);
        try {
            const docIdInt = parseInt(profile?.docid);
            if (isNaN(docIdInt)) return;

            const { data, error } = await supabase
                .from('prescriptions')
                .select(`
                    id, appointment_id, drug_name, dosage, total_quantity, instructions, status, created_at,
                    appointment!inner(
                        appodate,
                        docid,
                        patient!inner(pid, pname, ptel, patient_display_id)
                    )
                `)
                .eq('appointment.docid', docIdInt)
                .order('created_at', { ascending: false });

            if (error) throw error;

            if (data) {
                // Group by appointment_id
                const grouped = data.reduce((acc, curr) => {
                    if (!acc[curr.appointment_id]) {
                        acc[curr.appointment_id] = {
                            id: curr.id, // MIN id equivalent
                            appointment_id: curr.appointment_id,
                            pname: curr.appointment.patient?.pname,
                            patient_display_id: curr.appointment.patient?.patient_display_id,
                            ptel: curr.appointment.patient?.ptel,
                            consultation_date: curr.appointment.appodate,
                            drug_list_array: [],
                            status: curr.status,
                            created_at: curr.created_at
                        };
                    }
                    // Keep the latest status and created_at (similar to MAX in SQL)
                    if (new Date(curr.created_at) > new Date(acc[curr.appointment_id].created_at)) {
                        acc[curr.appointment_id].created_at = curr.created_at;
                        acc[curr.appointment_id].status = curr.status;
                    }
                    
                    acc[curr.appointment_id].drug_list_array.push(
                        `${curr.drug_name}::${curr.dosage}::${curr.total_quantity}::${curr.instructions}`
                    );
                    
                    return acc;
                }, {});

                const formatted = Object.values(grouped).map(group => ({
                    ...group,
                    drug_list: group.drug_list_array.join('|||'),
                    drug_count: group.drug_list_array.length
                }));
                
                // Sort by created_at DESC
                formatted.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

                setPrescriptions(formatted);
            }
        } catch (err) {
            console.error("Fetch error:", err);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case 'dispensed': return '#10b981';
            case 'pending': return '#f59e0b';
            case 'cancelled': return '#ef4444';
            default: return '#64748b';
        }
    };

    const filtered = prescriptions.filter(p => {
        const matchesSearch = 
            (p.pname || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
            (p.drug_list || '').toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = filterStatus === 'all' || p.status?.toLowerCase() === filterStatus;
        return matchesSearch && matchesFilter;
    });

    return (
        <div style={{ padding: '0', background: '#f1f5f9', minHeight: '100vh' }}>
                {/* Modern Header */}
                <header style={{ 
                    padding: '24px 48px', 
                    background: 'white', 
                    borderBottom: '1px solid #e2e8f0',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                }}>
                    <div>
                        <h1 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <Pill size={28} style={{ color: '#0ea5e9' }} /> Pharmacy Handover History
                        </h1>
                        <p style={{ color: '#64748b', fontSize: '0.875rem', marginTop: '4px' }}>Track medications sent to the pharmacy and their dispensing status.</p>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <div style={{ position: 'relative' }}>
                            <Filter size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: '#64748b' }} />
                            <select 
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                style={{ padding: '8px 12px 8px 36px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.875rem', background: 'white', outline: 'none' }}
                            >
                                <option value="all">All Status</option>
                                <option value="pending">Pending</option>
                                <option value="dispensed">Dispensed</option>
                            </select>
                        </div>
                    </div>
                </header>

                <div style={{ padding: '32px 48px' }}>
                    {/* Search Bar */}
                    <div style={{ position: 'relative', marginBottom: '24px' }}>
                        <Search size={20} style={{ position: 'absolute', left: '16px', top: '14px', color: '#94a3b8' }} />
                        <input 
                            type="text" 
                            placeholder="Search by Patient Name or Medication..." 
                            style={{ 
                                width: '100%', 
                                padding: '14px 14px 14px 50px', 
                                borderRadius: '12px', 
                                border: '1px solid #e2e8f0', 
                                background: 'white',
                                fontSize: '1rem',
                                outline: 'none',
                                transition: '0.2s',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                            }}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    {/* Table Container */}
                    <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                                <tr>
                                    <th style={{ textAlign: 'left', padding: '16px 24px', fontSize: '0.75rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Patient</th>
                                    <th style={{ textAlign: 'left', padding: '16px 24px', fontSize: '0.75rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Medications</th>
                                    <th style={{ textAlign: 'left', padding: '16px 24px', fontSize: '0.75rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Items</th>
                                    <th style={{ textAlign: 'left', padding: '16px 24px', fontSize: '0.75rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Status</th>
                                    <th style={{ textAlign: 'left', padding: '16px 24px', fontSize: '0.75rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Ordered On</th>
                                    <th style={{ textAlign: 'left', padding: '16px 24px', fontSize: '0.75rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan="6" style={{ padding: '48px', textAlign: 'center', color: '#94a3b8' }}>Loading records...</td></tr>
                                ) : filtered.length === 0 ? (
                                    <tr><td colSpan="6" style={{ padding: '48px', textAlign: 'center', color: '#94a3b8' }}>No prescriptions found matching your search.</td></tr>
                                ) : filtered.map(p => (
                                    <tr 
                                        key={p.id} 
                                        style={{ borderBottom: '1px solid #f1f5f9', transition: '0.2s', cursor: 'pointer' }} 
                                        onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                        onClick={() => setIntelModal({ open: true, data: { ...p, docname: user.docname || user.name } })}
                                    >
                                        <td style={{ padding: '16px 24px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0ea5e9', fontWeight: '700' }}>
                                                    {p.pname ? p.pname.charAt(0) : 'P'}
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: '700', color: '#1e293b' }}>{p.pname}</div>
                                                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>ID: {p.patient_display_id}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ padding: '16px 24px' }}>
                                            <div style={{ fontWeight: '700', color: '#0ea5e9' }}>
                                                {p.drug_list?.split('|||')[0].split('::')[0]}
                                                {p.drug_count > 1 && <span style={{ marginLeft: '8px', padding: '2px 8px', background: '#f0f9ff', borderRadius: '4px', fontSize: '0.7rem', color: '#0369a1' }}>+{p.drug_count - 1} more</span>}
                                            </div>
                                        </td>
                                        <td style={{ padding: '16px 24px' }}>
                                            <div style={{ fontSize: '0.875rem', color: '#1e293b', fontWeight: '600' }}>{p.drug_count} Drugs</div>
                                        </td>
                                        <td style={{ padding: '16px 24px' }}>
                                            <span style={{ 
                                                padding: '4px 10px', 
                                                borderRadius: '20px', 
                                                fontSize: '0.7rem', 
                                                fontWeight: '800', 
                                                textTransform: 'uppercase',
                                                background: `${getStatusColor(p.status)}20`,
                                                color: getStatusColor(p.status),
                                                border: `1px solid ${getStatusColor(p.status)}40`
                                            }}>
                                                {p.status}
                                            </span>
                                        </td>
                                        <td style={{ padding: '16px 24px' }}>
                                            <div style={{ fontSize: '0.875rem', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <Calendar size={14} color="#64748b" />
                                                {new Date(p.created_at).toLocaleDateString()}
                                            </div>
                                        </td>
                                        <td style={{ padding: '16px 24px' }}>
                                            <button 
                                                style={{ padding: '8px', borderRadius: '8px', border: '1px solid #e2e8f0', background: 'white', color: '#64748b', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
                                                onClick={(e) => { e.stopPropagation(); setIntelModal({ open: true, data: { ...p, docname: user.docname || user.name } }); }}
                                            >
                                                <Eye size={16} /> Details
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
                
                <EntityDetailModal 
                    isOpen={intelModal.open} 
                    onClose={() => setIntelModal({ open: false, data: null })} 
                    data={intelModal.data} 
                    type="prescription"
                />
        </div>
    );
};

export default DoctorPrescriptions;
