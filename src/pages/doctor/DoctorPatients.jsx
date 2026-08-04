// =============================================================
// FILE: DoctorPatients.jsx
// PURPOSE: React component / entry point for the eDoc Hospital
//          frontend. Part of the Vite + React SPA.
// =============================================================
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Search, Calendar, ChevronRight, MapPin, Phone, Clock } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

const DoctorPatients = () => {
    const navigate = useNavigate();
    const { profile, loading: authLoading } = useAuth();
    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterDate, setFilterDate] = useState('');
    const [filterGender, setFilterGender] = useState('');

    useEffect(() => {
        const fetchPatients = async () => {
            if (authLoading) return; // Wait for auth to resolve
            
            setLoading(true);
            try {
                const isAdmin = profile?.role === 'a' || profile?.role === 'Admin';
                let appointmentData = [];
                let appointmentError = null;

                if (isAdmin) {
                    // Admin sees all appointments
                    const { data, error } = await supabase
                        .from('appointment')
                        .select('pid, appodate, doctor:docid(docname)')
                        .order('appodate', { ascending: false });
                    appointmentData = data;
                    appointmentError = error;
                } else {
                    // Doctor sees only their appointments
                    if (!profile?.docid) {
                        console.warn('[DoctorPatients] No valid docid found for doctor profile');
                        setLoading(false);
                        return;
                    }
                    const docIdInt = parseInt(profile.docid);
                    if (isNaN(docIdInt)) {
                        console.warn('[DoctorPatients] docid is not a number:', profile.docid);
                        setLoading(false);
                        return;
                    }
                    const { data, error } = await supabase
                        .from('appointment')
                        .select('pid, appodate, doctor:docid(docname)')
                        .eq('docid', docIdInt)
                        .order('appodate', { ascending: false });
                    appointmentData = data;
                    appointmentError = error;
                }

                if (appointmentError) throw appointmentError;

                // Extract unique patient IDs from appointments
                const uniquePids = [...new Set((appointmentData || []).map(a => a.pid))];

                if (uniquePids.length === 0) {
                    setPatients([]);
                    setLoading(false);
                    return;
                }

                // Fetch patient details for those patients
                let query = supabase
                    .from('patient')
                    .select(`
                        pid, patient_display_id, pname, pdob, pgender, ptel, paddress
                    `)
                    .in('pid', uniquePids)
                    .order('pid', { ascending: false });

                if (searchTerm) {
                    query = query.or(`pname.ilike.%${searchTerm}%,patient_display_id.ilike.%${searchTerm}%,ptel.ilike.%${searchTerm}%`);
                }
                if (filterGender) {
                    query = query.eq('pgender', filterGender);
                }

                const { data, error } = await query;
                if (error) throw error;

                if (data) {
                    // Calculate last visit for each patient
                    let formatted = data.map(p => {
                        const patientAppointments = appointmentData.filter(a => a.pid === p.pid);
                        let lastVisit = null;
                        let lastDoctor = null;
                        if (patientAppointments && patientAppointments.length > 0) {
                            const latestAppo = patientAppointments[0];
                            lastVisit = latestAppo.appodate;
                            lastDoctor = latestAppo.doctor?.docname;
                        }
                        return { ...p, last_visit: lastVisit, last_doctor: lastDoctor };
                    });
                    
                    if (filterDate) {
                        formatted = formatted.filter(p => p.last_visit && p.last_visit.startsWith(filterDate));
                    }
                    
                    setPatients(formatted);
                }
            } catch (err) {
                console.error("Failed to fetch patients", err);
            } finally {
                setLoading(false);
            }
        };

        const timer = setTimeout(fetchPatients, 300);
        return () => clearTimeout(timer);
    }, [searchTerm, filterDate, filterGender, profile?.docid, authLoading]);

    const calculateAge = (dob) => {
        if (!dob) return '--';
        const birthDate = new Date(dob);
        const age = new Date().getFullYear() - birthDate.getFullYear();
        return age;
    };

    return (
        <div style={{ padding: '0', background: '#f1f5f9', minHeight: '100vh' }}>
                {/* Header Section */}
                <header style={{ 
                    padding: '32px 48px', 
                    background: 'white', 
                    borderBottom: '1px solid #e2e8f0',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <div>
                        <h1 style={{ fontSize: '1.75rem', fontWeight: '800', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '12px', margin: 0 }}>
                            <div style={{ padding: '10px', background: '#eff6ff', borderRadius: '12px', color: '#2563eb' }}><Users size={24} /></div>
                            Patient Directory
                        </h1>
                        <p style={{ color: '#64748b', marginTop: '4px', fontSize: '0.95rem' }}>Manage and search through your complete patient history.</p>
                    </div>
                </header>

                {/* Filter Toolbar */}
                <div style={{ padding: '24px 48px', background: 'white', borderBottom: '1px solid #e2e8f0', display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <div style={{ position: 'relative', flex: 1 }}>
                        <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                        <input 
                            type="text" 
                            placeholder="Search by Name, Patient ID, or Phone..." 
                            style={{ 
                                width: '100%', padding: '12px 16px 12px 48px', borderRadius: '12px', 
                                border: '1.5px solid #e2e8f0', background: '#f8fafc', fontSize: '0.95rem',
                                transition: '0.2s', outline: 'none'
                            }}
                            onFocus={e => e.target.style.borderColor = '#2563eb'}
                            onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                    
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <div style={{ position: 'relative' }}>
                            <Calendar size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                            <input 
                                type="date" 
                                style={{ padding: '10px 12px 10px 36px', borderRadius: '10px', border: '1.5px solid #e2e8f0', background: 'white', fontSize: '0.85rem', fontWeight: '600' }}
                                value={filterDate}
                                onChange={e => setFilterDate(e.target.value)}
                            />
                        </div>

                        <select 
                            style={{ padding: '10px 16px', borderRadius: '10px', border: '1.5px solid #e2e8f0', background: 'white', fontSize: '0.85rem', fontWeight: '600', color: '#1e293b' }}
                            value={filterGender}
                            onChange={e => setFilterGender(e.target.value)}
                        >
                            <option value="">All Genders</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                        </select>

                        <button 
                            onClick={() => { setSearchTerm(''); setFilterDate(''); setFilterGender(''); }}
                            style={{ padding: '10px 16px', borderRadius: '10px', border: 'none', background: '#f1f5f9', color: '#64748b', fontSize: '0.85rem', fontWeight: '700', cursor: 'pointer' }}
                        >
                            Reset
                        </button>
                    </div>
                </div>

                {/* Table Section */}
                <div style={{ padding: '32px 48px' }}>
                    <div style={{ background: 'white', borderRadius: '20px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead>
                                <tr style={{ background: '#f8fafc', borderBottom: '2px solid #f1f5f9' }}>
                                    <th style={{ padding: '20px 24px', fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.05em' }}>Patient / ID</th>
                                    <th style={{ padding: '20px 24px', fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.05em' }}>Details</th>
                                    <th style={{ padding: '20px 24px', fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.05em' }}>Contact Info</th>
                                    <th style={{ padding: '20px 24px', fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.05em' }}>Last Visit</th>
                                    <th style={{ padding: '20px 24px', textAlign: 'right' }}></th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan="5" style={{ padding: '100px 0', textAlign: 'center' }}>
                                            <div className="animate-spin" style={{ margin: '0 auto', width: '32px', height: '32px', border: '4px solid #eff6ff', borderTopColor: '#2563eb', borderRadius: '50%' }}></div>
                                            <p style={{ marginTop: '16px', color: '#64748b', fontWeight: '500' }}>Loading patient database...</p>
                                        </td>
                                    </tr>
                                ) : patients.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" style={{ padding: '100px 0', textAlign: 'center' }}>
                                            <Users size={48} color="#e2e8f0" style={{ margin: '0 auto 16px' }} />
                                            <p style={{ color: '#64748b', fontWeight: '600' }}>No patients found matching your criteria.</p>
                                        </td>
                                    </tr>
                                ) : (
                                    patients.map((p) => (
                                        <tr key={p.pid} style={{ borderBottom: '1px solid #f8fafc', transition: '0.2s' }} onMouseEnter={e => e.currentTarget.style.background = '#fcfdfe'} onMouseLeave={e => e.currentTarget.style.background = 'white'}>
                                            <td style={{ padding: '16px 24px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                    <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontWeight: '700' }}>
                                                        {p.pname.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <div style={{ fontWeight: '700', color: '#0f172a' }}>{p.pname}</div>
                                                        <div style={{ fontSize: '0.75rem', color: '#2563eb', fontWeight: '600' }}>{p.patient_display_id}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td style={{ padding: '16px 24px' }}>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                    <div style={{ fontSize: '0.9rem', color: '#334155', fontWeight: '600' }}>{calculateAge(p.pdob)} Yrs • {p.pgender}</div>
                                                    <div style={{ fontSize: '0.75rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}><MapPin size={12} /> {p.paddress || 'No address'}</div>
                                                </div>
                                            </td>
                                            <td style={{ padding: '16px 24px' }}>
                                                <div style={{ fontSize: '0.9rem', color: '#334155', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <Phone size={14} color="#64748b" /> {p.ptel}
                                                </div>
                                            </td>
                                            <td style={{ padding: '16px 24px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#334155', fontWeight: '600', fontSize: '0.9rem' }}>
                                                    <Clock size={14} color="#64748b" /> {p.last_visit ? `${new Date(p.last_visit).toLocaleDateString()} (${p.last_doctor || 'N/A'})` : 'New Patient'}
                                                </div>
                                            </td>
                                            <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                                                <button 
                                                    onClick={() => navigate(`/doctor/patient/${p.pid}`)}
                                                    style={{ 
                                                        background: 'white', border: '1.5px solid #e2e8f0', color: '#0f172a', 
                                                        padding: '8px 16px', borderRadius: '10px', fontSize: '0.8rem', fontWeight: '700', 
                                                        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', marginLeft: 'auto'
                                                    }}
                                                >
                                                    View Details <ChevronRight size={14} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                    <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#64748b', fontSize: '0.85rem' }}>
                        <div>Showing <strong>{patients.length}</strong> patients</div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button disabled style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #e2e8f0', background: 'white', cursor: 'not-allowed' }}>Previous</button>
                            <button disabled style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #e2e8f0', background: 'white', cursor: 'not-allowed' }}>Next</button>
                        </div>
                    </div>
                </div>
            <style>{`
                    @keyframes spin { to { transform: rotate(360deg); } }
                    .animate-spin { animation: spin 1s linear infinite; }
            `}</style>
        </div>
    );
};

export default DoctorPatients;
