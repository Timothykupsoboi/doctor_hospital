// =============================================================
// FILE: RegistrarHistory.jsx [v1.1 - Stable]
// PURPOSE: React component for viewing patient history.
// =============================================================
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Clock, ChevronRight, Activity, Calendar, FlaskConical, Pill, ArrowRight, UserPlus, FileText, ListOrdered, CreditCard, Stethoscope } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

const RegistrarHistory = () => {
    const { profile } = useAuth();
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState(new URLSearchParams(window.location.search).get('tab') || 'waiting');
    const [doctors, setDoctors] = useState([]);
    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(true);

    const [selectedPatient, setSelectedPatient] = useState(null);
    const [showBookingModal, setShowBookingModal] = useState(false);
    const [bookingData, setBookingData] = useState({ docid: '' });
    const [bookingError, setBookingError] = useState('');

    useEffect(() => {
        fetchDoctors();
        fetchPatients();

        // LIVE SYNC: Listen for appointment changes
        const channel = supabase
            .channel('clinical-updates')
            .on('postgres_changes', { event: '*', table: 'appointment' }, (payload) => {
                console.log("[Realtime] Appointment Update Received:", payload);
                fetchPatients(true);
            })
            .subscribe((status) => {
                console.log("[Realtime] Subscription Status:", status);
            });

        // FALLBACK: Poll every 5 seconds in case Realtime is disabled in Supabase Console
        const pollInterval = setInterval(() => fetchPatients(true), 5000);

        return () => {
            supabase.removeChannel(channel);
            clearInterval(pollInterval);
        };
    }, []);

    const fetchDoctors = async () => {
        try {
            const { data, error } = await supabase.from('doctor').select('docid, docname, specialties');
            if (data) setDoctors(data);
        } catch (err) {
            console.error('Error fetching doctors:', err);
        }
    };

    const fetchPatients = async (silent = false) => {
        try {
            if (!silent) setLoading(true);
            
            if (activeTab === 'archive') {
                // Fetch ALL patients for Master Archive
                const { data, error } = await supabase
                    .from('patient')
                    .select('*')
                    .order('pname', { ascending: true });
                if (data) {
                    setPatients(data.map(p => ({ ...p, appointment: null })));
                }
            } else {
                // Fetch active appointments for Clinical Pipeline
                const { data: appointments, error } = await supabase
                    .from('appointment')
                    .select('appoid, status, patient:pid(*), doctor:docid(docname)')
                    .in('status', ['waiting', 'in_consultation', 'pending_lab', 'lab_processing', 'lab_results_partial', 'lab_completed']);
                    
                if (appointments) {
                    const bookedPatients = appointments.map(app => ({
                        ...app.patient,
                        appointment: {
                            appoid: app.appoid,
                            status: app.status,
                            doctor_name: app.doctor?.docname
                        }
                    }));
                    const uniquePatients = Array.from(new Map(bookedPatients.map(p => [p.pid, p])).values());
                    setPatients(uniquePatients);
                }
            }
        } catch (err) {
            console.error('Error fetching patients:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPatients();
    }, [activeTab]);

    const handleHandoverClick = (patient) => {
        setSelectedPatient(patient);
        setBookingError('');
        setBookingData({ docid: '' });
        setShowBookingModal(true);
    };

    const confirmBooking = async () => {
        if (!bookingData.docid) {
            setBookingError('Please select a doctor to handover the patient.');
            return;
        }

        try {
            const today = new Date().toISOString().split('T')[0];
            const appointmentId = selectedPatient.appointment?.appoid;

            if (!appointmentId) throw new Error("No active appointment found to update.");
            
            // 1. Get or create schedule for this doctor today
            let scheduleId;
            const { data: existingSchedule } = await supabase
                .from('schedule')
                .select('scheduleid, nop')
                .eq('docid', bookingData.docid)
                .eq('scheduledate', today)
                .single();
                
            if (existingSchedule) {
                scheduleId = existingSchedule.scheduleid;
                await supabase.from('schedule').update({ nop: existingSchedule.nop + 1 }).eq('scheduleid', scheduleId);
            } else {
                const { data: newSchedule } = await supabase
                    .from('schedule')
                    .insert([{ docid: bookingData.docid, title: 'Session', scheduledate: today, nop: 1 }])
                    .select('scheduleid')
                    .single();
                scheduleId = newSchedule.scheduleid;
            }
            
            // 2. UPDATE the existing appointment (Change Doctor)
            const { error } = await supabase
                .from('appointment')
                .update({
                    docid: bookingData.docid,
                    scheduleid: scheduleId
                })
                .eq('appoid', appointmentId);

            if (error) throw error;

            // 3. Update the consultation record too
            await supabase
                .from('consultations')
                .update({ docid: bookingData.docid })
                .eq('appointment_id', appointmentId);
            
            setShowBookingModal(false);
            fetchPatients();
        } catch (err) {
            setBookingError(err.message || 'Failed to change doctor.');
        }
    };

    const filteredPatients = patients.filter(p => {
        const matchesSearch = p.pname?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                              p.patient_display_id?.toLowerCase().includes(searchQuery.toLowerCase());
        const status = p.appointment?.status || 'unknown';
        if (activeTab === 'waiting') return matchesSearch && status === 'waiting';
        if (activeTab === 'consulting') return matchesSearch && status === 'in_consultation';
        if (activeTab === 'lab') return matchesSearch && ['pending_lab', 'lab_processing', 'lab_results_partial', 'lab_completed'].includes(status);
        if (activeTab === 'archive') return matchesSearch;
        return matchesSearch;
    });

    return (
        <div style={{ padding: '48px 64px', maxWidth: '1600px', margin: '0 auto', background: '#f8fafc', minHeight: '100vh' }}>
                <header style={{ marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <div>
                        <h1 style={{ fontSize: '1.875rem', fontWeight: '800', color: '#0f172a', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <ListOrdered color="var(--primary)" size={28} /> Clinical History & Rerouting
                        </h1>
                        <p style={{ color: '#64748b', fontSize: '1.1rem' }}>Track patient journeys and manage department rerouting.</p>
                    </div>
                </header>

                {/* Tabs & Search */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', background: 'white', padding: '16px 24px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: 'var(--shadow-sm)' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        {[ 
                            { id: 'waiting', label: 'Waiting Area' },
                            { id: 'consulting', label: 'In Consultation' },
                            { id: 'lab', label: 'At Laboratory' },
                            { id: 'archive', label: 'Master Archive' }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                style={{
                                    padding: '8px 16px',
                                    borderRadius: '10px',
                                    border: 'none',
                                    fontWeight: '600',
                                    fontSize: '0.9rem',
                                    cursor: 'pointer',
                                    background: activeTab === tab.id ? '#2563eb' : 'transparent',
                                    color: activeTab === tab.id ? 'white' : '#64748b',
                                    boxShadow: activeTab === tab.id ? '0 4px 6px -1px rgba(37, 99, 235, 0.2)' : 'none',
                                    transition: '0.2s'
                                }}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    <div style={{ position: 'relative', width: '350px' }}>
                        <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                        <input
                            type="text"
                            placeholder="Search patients..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{ width: '100%', padding: '12px 16px 12px 42px', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '0.9rem', outline: 'none' }}
                        />
                    </div>
                </div>

                {/* Premium Data Table */}
                <div style={{ background: 'white', borderRadius: '24px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                                <th style={{ padding: '20px 24px', textAlign: 'left', fontSize: '0.75rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>Patient Information</th>
                                <th style={{ padding: '20px 24px', textAlign: 'left', fontSize: '0.75rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>Clinical Status</th>
                                <th style={{ padding: '20px 24px', textAlign: 'left', fontSize: '0.75rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>Assigned Specialist</th>
                                <th style={{ padding: '20px 24px', textAlign: 'right', fontSize: '0.75rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={4} style={{ textAlign: 'center', padding: '64px' }}>
                                        <Activity size={48} color="#3b82f6" style={{ marginBottom: '16px', opacity: 0.5, animation: 'pulse 2s infinite' }} />
                                        <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#475569' }}>Synchronizing clinical cycles...</h3>
                                    </td>
                                </tr>
                            ) : filteredPatients.length === 0 ? (
                                <tr>
                                    <td colSpan={4} style={{ textAlign: 'center', padding: '64px' }}>
                                        <Search size={48} color="#94a3b8" style={{ marginBottom: '16px', opacity: 0.5 }} />
                                        <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#475569' }}>No patients found</h3>
                                        <p style={{ color: '#64748b', fontSize: '0.9rem' }}>Try adjusting your search or department filter.</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredPatients.map(patient => (
                                    <tr key={patient.pid} style={{ borderBottom: '1px solid #f1f5f9', transition: '0.2s' }} className="hover-row">
                                        <td style={{ padding: '20px 24px' }}>
                                            <div style={{ fontWeight: '800', color: '#0f172a', fontSize: '1rem' }}>{patient.pname}</div>
                                            <div style={{ fontSize: '0.72rem', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', marginTop: '2px' }}>ID: {patient.patient_display_id}</div>
                                        </td>
                                        <td style={{ padding: '20px 24px' }}>
                                            <div style={{ 
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '8px',
                                                padding: '6px 14px', 
                                                borderRadius: '20px', 
                                                fontSize: '0.75rem', 
                                                fontWeight: '800',
                                                background: 
                                                    patient.appointment?.status === 'waiting' ? '#fff7ed' : 
                                                    patient.appointment?.status === 'in_consultation' ? '#eff6ff' : 
                                                    patient.appointment?.status === 'pending_lab' ? '#f5f3ff' : '#f8fafc',
                                                color: 
                                                    patient.appointment?.status === 'waiting' ? '#d97706' : 
                                                    patient.appointment?.status === 'in_consultation' ? '#2563eb' : 
                                                    patient.appointment?.status === 'pending_lab' ? '#7c3aed' : '#64748b'
                                            }}>
                                                {patient.appointment?.status === 'waiting' && <><Clock size={12}/> Waiting</>}
                                                {patient.appointment?.status === 'in_consultation' && <><Activity size={12}/> Consulting</>}
                                                {['pending_lab', 'lab_processing', 'lab_results_partial'].includes(patient.appointment?.status) && <><FlaskConical size={12}/> At Laboratory</>}
                                                {patient.appointment?.status === 'lab_completed' && <><CheckCircle size={12}/> Results Ready</>}
                                                {!['waiting', 'in_consultation', 'pending_lab', 'lab_processing', 'lab_results_partial', 'lab_completed'].includes(patient.appointment?.status) && <span>{patient.appointment?.status || 'Active'}</span>}
                                            </div>
                                        </td>
                                        <td style={{ padding: '20px 24px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#f8fafc', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    <Stethoscope size={16} color="#3b82f6" />
                                                </div>
                                                <div style={{ fontWeight: '700', color: '#1e293b', fontSize: '0.9rem' }}>
                                                    {activeTab === 'archive' ? '---' : (patient.appointment?.doctor_name ? `Dr. ${patient.appointment.doctor_name}` : 'Unassigned')}
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ padding: '20px 24px', textAlign: 'right' }}>
                                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                                                <button 
                                                    onClick={() => handleHandoverClick(patient)}
                                                    style={{ padding: '8px 14px', background: '#0f172a', border: 'none', borderRadius: '10px', fontSize: '0.8rem', fontWeight: '800', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                                                >
                                                    Reroute <ChevronRight size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                <style>{`
                    .hover-row:hover { background: #f8fafc !important; }
                    @keyframes pulse { 0% { opacity: 0.5; } 50% { opacity: 1; } 100% { opacity: 0.5; } }
                `}</style>

            {/* Handover / Re-Route Modal */}
            {showBookingModal && selectedPatient && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div style={{ background: 'white', width: '500px', borderRadius: '24px', padding: '32px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', animation: 'slideUp 0.3s ease-out' }}>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#0f172a', marginBottom: '8px' }}>Re-Route Patient</h2>
                        <p style={{ color: '#64748b', marginBottom: '24px' }}>Transfer <strong>{selectedPatient.pname}</strong> to another clinical department or doctor.</p>
                        
                        {bookingError && (
                            <div style={{ padding: '12px', background: '#fef2f2', color: '#dc2626', borderRadius: '8px', fontSize: '0.9rem', marginBottom: '16px' }}>
                                {bookingError}
                            </div>
                        )}

                        <div style={{ marginBottom: '24px' }}>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: '#475569', marginBottom: '8px' }}>Assign Doctor / Specialist</label>
                            <select 
                                value={bookingData.docid} 
                                onChange={(e) => setBookingData({...bookingData, docid: e.target.value})}
                                style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '1rem', outline: 'none' }}
                            >
                                <option value="">-- Select Available Doctor --</option>
                                {doctors.map(doc => (
                                    <option key={doc.docid} value={doc.docid}>Dr. {doc.docname} ({doc.specialties || 'General'})</option>
                                ))}
                            </select>
                        </div>

                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '32px' }}>
                            <button onClick={() => setShowBookingModal(false)} style={{ padding: '12px 24px', background: '#f1f5f9', border: 'none', borderRadius: '10px', fontWeight: '700', color: '#475569', cursor: 'pointer' }}>Cancel</button>
                            <button onClick={confirmBooking} style={{ padding: '12px 24px', background: '#ff7200', border: 'none', borderRadius: '10px', fontWeight: '700', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                Confirm Reroute <ArrowRight size={18} />
                            </button>
                        </div>
                    </div>
                </div>
            )}
            <style>{`@keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }`}</style>

        </div>
    );
};

export default RegistrarHistory;
