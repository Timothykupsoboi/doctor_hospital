// =============================================================
// FILE: RegistrarPatients.jsx
// PURPOSE: React component / entry point for the eDoc Hospital
//          frontend. Part of the Vite + React SPA.
// =============================================================
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Users, Search, CalendarPlus, User, Phone, Fingerprint, RefreshCw, 
    AlertTriangle, Edit, Trash2, X, Save, Thermometer, Info, ShieldCheck, 
    CreditCard, Camera, MapPin, Heart, Activity, Droplets, Wind, CheckCircle,
    FlaskConical, Stethoscope
} from 'lucide-react';
import Select from 'react-select';
import { useNotification } from '../../components/NotificationContext';
import { getPatients, getDoctors, deletePatient, updatePatient, bookAppointment } from '../../lib/api';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

const RegistrarPatients = () => {
    const navigate = useNavigate();
    const { profile } = useAuth();
    
    const [patients, setPatients] = useState([]);
    const [selectedPatients, setSelectedPatients] = useState(new Set());
    const [isBulkMode, setIsBulkMode] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { showNotification } = useNotification();
    
    // Modal States
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [bookingModalOpen, setBookingModalOpen] = useState(false);
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [editData, setEditData] = useState({});
    
// Booking State
    const [doctors, setDoctors] = useState([]);
    const [bookingData, setBookingData] = useState({ docid: '', reason: '', type: 'instant', date: '', time: '' });
    const [bookingMode, setBookingMode] = useState('consultation'); // 'consultation' or 'lab'
    const [labCatalog, setLabCatalog] = useState([]);
    const [selectedTests, setSelectedTests] = useState([]);
    const [bookingLoading, setBookingLoading] = useState(false);
    
    // Custom Alert State
    const [alert, setAlert] = useState({ show: false, title: '', message: '', type: 'info' });

    const fetchDoctorsList = async () => {
        try {
            const { data, error } = await supabase
                .from('doctor')
                .select('docid, docname, specialties');
            
            if (error) throw error;
            if (data) setDoctors(data);
        } catch (err) { 
            console.error('Fetch doctors error:', err); 
        }
    };

    const fetchLabCatalog = async () => {
        try {
            const { data, error } = await supabase
                .from('lab_catalog')
                .select('*')
                .order('test_name');
            if (data) {
                // Ensure price is a number
                const sanitized = data.map(t => ({ ...t, price: Number(t.price || 0) }));
                setLabCatalog(sanitized);
            }
        } catch (err) {
            console.error('Fetch lab catalog error:', err);
        }
    };

    const fetchPatients = async () => {
        setLoading(true);
        setError(null);
        try {
            const today = new Date().toISOString().split('T')[0];
            const { data, error } = await supabase
                .from('patient')
                .select(`
                    *,
                    appointment:appointment (
                        appoid,
                        appodate,
                        status
                    )
                `);
            
            if (error) throw error;
            if (data) {
                // FILTER: Only show patients who do NOT have an ACTIVE CLINICAL appointment TODAY
                const unbookedPatients = data.filter(p => {
                    const clinicalStatuses = ['waiting', 'in_consultation', 'pending_lab'];
                    const appos = Array.isArray(p.appointment) ? p.appointment : [];
                    const hasActiveClinicalAppo = appos.some(a => 
                        a.appodate === today && clinicalStatuses.includes(a.status)
                    );
                    return !hasActiveClinicalAppo;
                });

                // Sort chronologically in the queue (oldest first)
                // Use the earliest known timestamp fields if present.
                const toTime = (p) => {
                    // appointment rows should include appodate when loaded via join above
                    if (p.appointment?.[0]?.appodate) return new Date(p.appointment[0].appodate).getTime();
                    if (p.pdate_registered) return new Date(p.pdate_registered).getTime();
                    if (p.created_at) return new Date(p.created_at).getTime();
                    return 0;
                };

                const sorted = [...unbookedPatients].sort((a, b) => toTime(a) - toTime(b));
                setPatients(sorted);
            }
        } catch (err) {
            console.error('Fetch patients error:', err);
            setError("Network error. Please check your connection.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPatients();
        fetchDoctorsList();
        fetchLabCatalog();
    }, []); 

    const showAlert = (title, message, type = 'info') => {
        setAlert({ show: true, title, message, type });
        if (type === 'success') {
            setTimeout(() => setAlert(prev => ({ ...prev, show: false })), 3000);
        }
    };

    const confirmDelete = (patient) => {
        setSelectedPatient(patient);
        setDeleteModalOpen(true);
    };

    const openBookingModal = (patient) => {
        setSelectedPatient(patient);
        setIsBulkMode(false);
        setBookingModalOpen(true);
    };

    const openBulkBookingModal = () => {
        setIsBulkMode(true);
        setBookingModalOpen(true);
    };

    const handleDelete = async () => {
        const pid = selectedPatient.pid;
        setDeleteModalOpen(false);
        try {
            const { error } = await deletePatient(pid);
            if (!error) {
                showAlert("Deleted", "Patient record has been permanently removed.", "success");
                fetchPatients();
            } else {
                showAlert("Error", "Failed to delete patient record.", "error");
            }
        } catch (err) {
            showAlert("Error", "Network error while deleting.", "error");
        }
    };

    const openEditModal = (patient) => {
        setSelectedPatient(patient);
        setEditData({ ...patient });
        setEditModalOpen(true);
    };

    const togglePatientSelection = (pid) => {
        const newSelected = new Set(selectedPatients);
        if (newSelected.has(pid)) newSelected.delete(pid);
        else newSelected.add(pid);
        setSelectedPatients(newSelected);
    };

    const toggleSelectAll = () => {
        if (selectedPatients.size === filteredPatients.length) {
            setSelectedPatients(new Set());
        } else {
            setSelectedPatients(new Set(filteredPatients.map(p => p.pid)));
        }
    };

    const handleQuickBook = async (e) => {
        e.preventDefault();
        
        if (bookingMode === 'consultation' && !bookingData.docid) {
            showAlert("Error", "Please select a consultant.", "error");
            return;
        }

        if (bookingMode === 'lab' && selectedTests.length === 0) {
            showAlert("Error", "Please select at least one lab test.", "error");
            return;
        }

        setBookingLoading(true);
        try {
            const pidsToBook = isBulkMode ? Array.from(selectedPatients) : [selectedPatient.pid];
            let successCount = 0;
            
            const payloadDate = new Date().toISOString().split('T')[0];

            for (const pid of pidsToBook) {
                let appointmentData = {
                    pid,
                    appodate: payloadDate,
                    status: bookingMode === 'consultation' ? 'waiting' : 'pending_lab'
                };

                if (bookingMode === 'consultation') {
                    // Fetch or create schedule for doctor
                    let { data: schedules } = await supabase
                        .from('schedule')
                        .select('scheduleid')
                        .eq('docid', bookingData.docid)
                        .eq('scheduledate', payloadDate);
                    
                    let schedId;
                    if (!schedules || schedules.length === 0) {
                        const { data: newSched } = await supabase.from('schedule').insert([{
                            docid: bookingData.docid,
                            scheduledate: payloadDate,
                            title: 'Instant Consultation',
                            nop: 1
                        }]).select().single();
                        schedId = newSched?.scheduleid;
                    } else {
                        schedId = schedules[0].scheduleid;
                    }
                    
                    appointmentData.docid = bookingData.docid;
                    appointmentData.scheduleid = schedId;
                }

                // Create the appointment
                const { data: appo, error: appoErr } = await supabase
                    .from('appointment')
                    .insert([appointmentData])
                    .select()
                    .single();

                if (appoErr) throw appoErr;

                if (bookingMode === 'consultation') {
                    // Create consultation draft
                    await supabase.from('consultations').insert({
                        appointment_id: appo.appoid,
                        pid: pid,
                        docid: bookingData.docid,
                        consultation_date: payloadDate,
                        chief_complaint: bookingData.reason,
                        status: 'draft'
                    });
                } else {
                    // Create lab requests
                    for (const test of selectedTests) {
                        await supabase.from('lab_requests').insert({
                            appointment_id: appo.appoid,
                            test_name: test.test_name,
                            price: test.price || 0,
                            status: 'pending'
                        });
                    }
                }
                successCount++;
            }

            if (successCount > 0) {
                setBookingModalOpen(false);
                setSelectedTests([]);
                setBookingMode('consultation');
                showAlert("Success", `Handover Complete! Patients sent to ${bookingMode === 'lab' ? 'Laboratory' : 'Consultation'}.`, "success");
                const rolePath = window.location.pathname.startsWith('/admin') ? '/admin' : '/registrar';
                setTimeout(() => navigate(`${rolePath}/history`), 1200);
            }
        } catch (err) {
            console.error(err);
            showAlert("Error", "Booking failed: " + err.message, "error");
        } finally {
            setBookingLoading(false);
        }
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        try {
            // Clean data: convert empty strings to null
            const cleanedData = Object.fromEntries(
                Object.entries(editData).map(([key, value]) => [key, value === "" ? null : value])
            );
            
            const { error } = await updatePatient(selectedPatient.pid, cleanedData);
            if (!error) {
                setEditModalOpen(false);
                showAlert("Success", "Patient record updated successfully.", "success");
                fetchPatients();
            } else {
                showAlert("Update Failed", error.message, "error");
            }
        } catch (err) {
            showAlert("Error", "Network error during update.", "error");
        }
    };

    const filteredPatients = patients.filter(p => 
        (p.pname?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
        (p.ptel || '').includes(searchQuery) ||
        (p.patient_display_id?.toLowerCase() || '').includes(searchQuery.toLowerCase())
    );

    const SectionHeader = ({ icon: Icon, title }) => (
        <h3 style={{ fontSize: '1.1rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px', marginBottom: '16px', color: '#334155', display: 'flex', alignItems: 'center', gap: '8px', marginTop: '24px' }}>
            {Icon && <Icon size={18} color="var(--primary)" />} {title}
        </h3>
    );

    const customSelectStyles = {
        control: (base) => ({
            ...base,
            padding: '2px',
            borderRadius: '8px',
            border: '1px solid #cbd5e1',
            boxShadow: 'none',
            fontSize: '0.875rem',
            '&:hover': { border: '1px solid #3b82f6' }
        })
    };

    return (
        <div style={{ padding: '48px 64px', maxWidth: '1600px', margin: '0 auto', background: '#f8fafc', minHeight: '100vh' }}>
                <header style={{ marginBottom: '48px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <div>
                        <h1 style={{ fontSize: '1.875rem', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <Users size={28} color="var(--primary)" /> Patient Booking & Directory
                            {selectedPatients.size > 0 && (
                                <span style={{ 
                                    fontSize: '0.875rem', background: '#ff7200', color: 'white', 
                                    padding: '4px 12px', borderRadius: '100px', fontWeight: '800',
                                    animation: 'pulse 2s infinite'
                                }}>
                                    {selectedPatients.size} SELECTED
                                </span>
                            )}
                        </h1>
                        <p style={{ color: 'var(--text-muted)' }}>Manage records, routing, and clinical bookings for all patients.</p>
                    </div>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        {selectedPatients.size > 0 && (
                            <button onClick={openBulkBookingModal} className="btn-primary" style={{ background: '#ff7200', display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px' }}>
                                <Users size={18} /> Bulk Handover ({selectedPatients.size})
                            </button>
                        )}
                        <button onClick={fetchPatients} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 20px', background: 'white', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', color: '#475569' }}>
                            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} /> Refresh
                        </button>
                        <button onClick={() => navigate('/registrar/new-patient')} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px' }}>
                            <CalendarPlus size={20} /> New Registration
                        </button>
                    </div>
                </header>

                <div style={{ background: 'white', padding: '24px', borderRadius: '16px', border: '1px solid var(--border)', marginBottom: '32px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                    <div style={{ position: 'relative' }}>
                        <Search size={20} style={{ position: 'absolute', left: '16px', top: '14px', color: 'var(--text-muted)' }} />
                        <input 
                            type="text" 
                            placeholder="Search by name, ID, or phone..." 
                            className="input-field" 
                            style={{ paddingLeft: '48px', fontSize: '1rem' }} 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                {/* Premium Patient Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
                    {loading ? (
                        <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '64px', background: 'white', borderRadius: '24px', border: '1px solid #e2e8f0' }}>
                            <Activity size={48} color="#ff7200" className="animate-pulse" style={{ marginBottom: '16px', opacity: 0.5 }} />
                            <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#475569' }}>Loading patient database...</h3>
                        </div>
                    ) : filteredPatients.length > 0 ? (
                        filteredPatients.map((p, index) => (
                            <div 
                                key={p.pid} 
                                style={{ 
                                    background: 'white', 
                                    borderRadius: '24px', 
                                    padding: '24px', 
                                    border: '1px solid #e2e8f0', 
                                    boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '16px',
                                    transition: 'all 0.3s ease',
                                    position: 'relative',
                                    borderLeft: selectedPatients.has(p.pid) ? '6px solid #ff7200' : '1px solid #e2e8f0',
                                    overflow: 'hidden'
                                }}
                                onMouseOver={e => {
                                    e.currentTarget.style.transform = 'translateY(-4px)';
                                    e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(0,0,0,0.1)';
                                }}
                                onMouseOut={e => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0,0,0,0.05)';
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                        <div 
                                            onClick={() => togglePatientSelection(p.pid)}
                                            style={{ 
                                                width: '24px', height: '24px', borderRadius: '8px', 
                                                border: '2px solid #cbd5e1', background: selectedPatients.has(p.pid) ? '#ff7200' : 'white',
                                                borderColor: selectedPatients.has(p.pid) ? '#ff7200' : '#cbd5e1',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s'
                                            }}
                                        >
                                            {selectedPatients.has(p.pid) && <CheckCircle size={14} color="white" />}
                                        </div>
                                        <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: '#eff6ff', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)' }}>
                                            <User size={24} />
                                        </div>
                                    </div>
                                    <div style={{ 
                                        padding: '6px 14px', 
                                        borderRadius: '100px', 
                                        background: '#f1f5f9', 
                                        color: '#475569', 
                                        fontSize: '0.7rem', 
                                        fontWeight: '900',
                                        letterSpacing: '0.05em'
                                    }}>
                                        ENTRY #{index + 1}
                                    </div>
                                </div>

                                <div>
                                    <div style={{ fontSize: '1.2rem', fontWeight: '900', color: '#0f172a', letterSpacing: '-0.025em' }}>{p.pname}</div>
                                    <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: '600', marginTop: '2px' }}>{p.pgender} • {p.ptel}</div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', background: '#f8fafc', padding: '16px', borderRadius: '18px', border: '1px solid #f1f5f9' }}>
                                    <div>
                                        <div style={{ fontSize: '0.65rem', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Hospital ID</div>
                                        <div style={{ fontSize: '0.9rem', fontWeight: '900', color: '#334155' }}>{p.patient_display_id}</div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontSize: '0.65rem', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Visits</div>
                                        <div style={{ fontSize: '0.9rem', fontWeight: '900', color: '#10b981' }}>{p.appointment?.length || 0}</div>
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: '10px', alignItems: 'center', marginTop: '8px' }}>
                                    {p.appointment?.some(a => a.appodate === new Date().toISOString().split('T')[0] && a.status !== 'completed') ? (
                                        <div style={{ padding: '12px 20px', background: '#f8fafc', color: '#64748b', borderRadius: '14px', fontSize: '0.85rem', fontWeight: '800', border: '1px solid #e2e8f0', flex: 1, textAlign: 'center' }}>
                                            Currently in Queue
                                        </div>
                                    ) : (
                                        <button 
                                            onClick={() => openBookingModal(p)} 
                                            style={{ 
                                                padding: '12px 20px', 
                                                background: '#ff7200', 
                                                color: 'white', 
                                                border: 'none', 
                                                borderRadius: '14px', 
                                                cursor: 'pointer', 
                                                fontSize: '0.9rem', 
                                                fontWeight: '800',
                                                boxShadow: '0 10px 15px -3px rgba(255, 114, 0, 0.3)',
                                                transition: '0.2s',
                                                flex: 1
                                            }}
                                            onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                                            onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
                                        >
                                            Send To
                                        </button>
                                    )}
                                    <button onClick={() => openEditModal(p)} style={{ width: '44px', height: '44px', borderRadius: '14px', background: '#f1f5f9', border: 'none', cursor: 'pointer', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: '0.2s' }} title="Edit"><Edit size={18} /></button>
                                    <button onClick={() => confirmDelete(p)} style={{ width: '44px', height: '44px', borderRadius: '14px', background: '#fef2f2', border: 'none', cursor: 'pointer', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: '0.2s' }} title="Delete"><Trash2 size={18} /></button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '64px', background: 'white', borderRadius: '24px', border: '1px solid #e2e8f0' }}>
                            <Search size={48} color="#94a3b8" style={{ marginBottom: '16px', opacity: 0.5 }} />
                            <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#475569' }}>No clinical records found</h3>
                            <p style={{ color: '#64748b' }}>Try adjusting your search criteria.</p>
                        </div>
                    )}
                </div>

                {/* Edit Modal - Comprehensive View */}
                {editModalOpen && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(8px)', padding: '20px' }}>
                        <div style={{ background: 'white', width: '100%', maxWidth: '1000px', maxHeight: '90vh', borderRadius: '24px', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}>
                            {/* Modal Header */}
                            <div style={{ padding: '24px 40px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
                                <div>
                                    <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#0f172a' }}>Update Patient Record</h2>
                                    <p style={{ color: '#64748b', fontSize: '0.875rem' }}>Editing details for {editData.pname} ({editData.patient_display_id})</p>
                                </div>
                                <button onClick={() => setEditModalOpen(false)} style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'white', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748b' }}><X size={20} /></button>
                            </div>

                            {/* Modal Body (Scrollable) */}
                            <div style={{ flex: 1, overflowY: 'auto', padding: '40px' }}>
                                <form id="editForm" onSubmit={handleUpdate}>
                                    
                                    {/* BASIC INFO */}
                                    <section style={{ padding: '24px', borderRadius: '16px', background: '#ffffff', border: '1px solid #e2e8f0' }}>
                                        <SectionHeader icon={User} title="Basic Information" />
                                        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '20px' }}>
                                            <div>
                                                <label className="label-text">Full Name</label>
                                                <input type="text" className="input-field" value={editData.pname} onChange={(e) => setEditData({...editData, pname: e.target.value})} required />
                                            </div>
                                            <div>
                                                <label className="label-text">Date of Birth</label>
                                                <input type="date" className="input-field" value={editData.pdob} onChange={(e) => setEditData({...editData, pdob: e.target.value})} />
                                            </div>
                                            <div>
                                                <label className="label-text">Gender</label>
                                                <Select options={[{value:'Male',label:'Male'},{value:'Female',label:'Female'},{value:'Other',label:'Other'}]} value={{value:editData.pgender,label:editData.pgender}} onChange={(opt) => setEditData({...editData, pgender: opt.value})} styles={customSelectStyles} />
                                            </div>
                                            <div>
                                                <label className="label-text">Marital Status</label>
                                                <Select options={[{value:'Single',label:'Single'},{value:'Married',label:'Married'},{value:'Divorced',label:'Divorced'},{value:'Widowed',label:'Widowed'}]} value={{value:editData.pmarital,label:editData.pmarital}} onChange={(opt) => setEditData({...editData, pmarital: opt.value})} styles={customSelectStyles} />
                                            </div>
                                        </div>
                                    </section>

                                    {/* CONTACT */}
                                    <section style={{ padding: '24px', borderRadius: '16px', background: '#f8fafc', border: '1px solid #e2e8f0', marginTop: '20px' }}>
                                        <SectionHeader icon={Phone} title="Contact & Address" />
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                            <div>
                                                <label className="label-text">Phone Number</label>
                                                <input type="text" className="input-field" value={editData.ptel} onChange={(e) => setEditData({...editData, ptel: e.target.value})} required />
                                            </div>
                                            <div>
                                                <label className="label-text">Alternate Phone</label>
                                                <input type="text" className="input-field" value={editData.palttel} onChange={(e) => setEditData({...editData, palttel: e.target.value})} />
                                            </div>
                                            <div style={{ gridColumn: 'span 2' }}>
                                                <label className="label-text">Email Address</label>
                                                <input type="email" className="input-field" value={editData.pemail} onChange={(e) => setEditData({...editData, pemail: e.target.value})} />
                                            </div>
                                            <div style={{ gridColumn: 'span 2' }}>
                                                <label className="label-text">Physical Address</label>
                                                <textarea className="input-field" rows="2" value={editData.paddress} onChange={(e) => setEditData({...editData, paddress: e.target.value})} />
                                            </div>
                                            <div>
                                                <label className="label-text">City</label>
                                                <input type="text" className="input-field" value={editData.pcity} onChange={(e) => setEditData({...editData, pcity: e.target.value})} />
                                            </div>
                                        </div>
                                    </section>

                                    {/* MEDICAL */}
                                    <section style={{ padding: '24px', borderRadius: '16px', background: '#f0fdf4', border: '1px solid #bbf7d0', marginTop: '20px' }}>
                                        <SectionHeader icon={Droplets} title="Medical Background" />
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                            <div>
                                                <label className="label-text">Blood Group</label>
                                                <Select options={['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(g=>({value:g,label:g}))} value={{value:editData.pbloodgroup,label:editData.pbloodgroup}} onChange={(opt) => setEditData({...editData, pbloodgroup: opt.value})} styles={customSelectStyles} />
                                            </div>
                                            <div style={{ gridColumn: 'span 2' }}>
                                                <label className="label-text">Allergies</label>
                                                <textarea className="input-field" rows="2" value={editData.pallergies} onChange={(e) => setEditData({...editData, pallergies: e.target.value})} />
                                            </div>
                                            <div style={{ gridColumn: 'span 2' }}>
                                                <label className="label-text">Existing Conditions</label>
                                                <textarea className="input-field" rows="2" value={editData.pconditions} onChange={(e) => setEditData({...editData, pconditions: e.target.value})} />
                                            </div>
                                        </div>
                                    </section>

                                    {/* VITALS */}
                                    <section style={{ padding: '24px', borderRadius: '16px', background: '#f0f9ff', border: '1px solid #bae6fd', marginTop: '20px' }}>
                                        <SectionHeader icon={Thermometer} title="Vital Signs (Last Recorded)" />
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                                            <div>
                                                <label className="label-text">Temp (°C)</label>
                                                <input type="text" className="input-field" value={editData.ptemp} onChange={(e) => setEditData({...editData, ptemp: e.target.value})} />
                                            </div>
                                            <div>
                                                <label className="label-text">BP</label>
                                                <input type="text" className="input-field" value={editData.pbp} onChange={(e) => setEditData({...editData, pbp: e.target.value})} />
                                            </div>
                                            <div>
                                                <label className="label-text">Weight (kg)</label>
                                                <input type="text" className="input-field" value={editData.pweight} onChange={(e) => setEditData({...editData, pweight: e.target.value})} />
                                            </div>
                                            <div>
                                                <label className="label-text">Height (cm)</label>
                                                <input type="text" className="input-field" value={editData.pheight} onChange={(e) => setEditData({...editData, pheight: e.target.value})} />
                                            </div>
                                        </div>
                                    </section>

                                    {/* EMERGENCY */}
                                    <section style={{ padding: '24px', borderRadius: '16px', background: '#fffbeb', border: '1px solid #fde68a', marginTop: '20px' }}>
                                        <SectionHeader icon={ShieldCheck} title="Emergency Contact" />
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
                                            <div>
                                                <label className="label-text">Contact Name</label>
                                                <input type="text" className="input-field" value={editData.pemergency_name} onChange={(e) => setEditData({...editData, pemergency_name: e.target.value})} />
                                            </div>
                                            <div>
                                                <label className="label-text">Contact Phone</label>
                                                <input type="text" className="input-field" value={editData.pemergency_phone} onChange={(e) => setEditData({...editData, pemergency_phone: e.target.value})} />
                                            </div>
                                            <div>
                                                <label className="label-text">Relation</label>
                                                <input type="text" className="input-field" value={editData.pemergency_relation} onChange={(e) => setEditData({...editData, pemergency_relation: e.target.value})} />
                                            </div>
                                        </div>
                                    </section>

                                    {/* INSURANCE */}
                                    <section style={{ padding: '24px', borderRadius: '16px', background: '#f5f3ff', border: '1px solid #ddd6fe', marginTop: '20px' }}>
                                        <SectionHeader icon={CreditCard} title="Payment & Insurance" />
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
                                            <div>
                                                <label className="label-text">Payment Type</label>
                                                <Select options={[{value:'Cash',label:'Cash'},{value:'Card',label:'Card'},{value:'Insurance',label:'Insurance'}]} value={{value:editData.ppayment,label:editData.ppayment}} onChange={(opt) => setEditData({...editData, ppayment: opt.value})} styles={customSelectStyles} />
                                            </div>
                                            <div>
                                                <label className="label-text">Provider</label>
                                                <input type="text" className="input-field" value={editData.pinsurance_provider} onChange={(e) => setEditData({...editData, pinsurance_provider: e.target.value})} />
                                            </div>
                                            <div>
                                                <label className="label-text">Policy #</label>
                                                <input type="text" className="input-field" value={editData.pinsurance_number} onChange={(e) => setEditData({...editData, pinsurance_number: e.target.value})} />
                                            </div>
                                        </div>
                                    </section>
                                </form>
                            </div>

                            {/* Modal Footer */}
                            <div style={{ padding: '24px 40px', background: '#f8fafc', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end', gap: '16px' }}>
                                <button type="button" onClick={() => setEditModalOpen(false)} style={{ padding: '12px 24px', background: 'white', border: '1px solid #cbd5e1', borderRadius: '12px', color: '#475569', fontWeight: '600', cursor: 'pointer' }}>Discard Changes</button>
                                <button type="submit" form="editForm" className="btn-primary" style={{ padding: '12px 40px', display: 'flex', alignItems: 'center', gap: '8px' }}><Save size={20} /> Save Full Record</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Custom Delete Confirmation Modal */}
                {deleteModalOpen && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, backdropFilter: 'blur(12px)' }}>
                        <div style={{ background: 'white', width: '100%', maxWidth: '400px', borderRadius: '24px', padding: '32px', textAlign: 'center', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}>
                            <div style={{ width: '64px', height: '64px', background: '#fef2f2', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#dc2626', margin: '0 auto 20px' }}>
                                <Trash2 size={32} />
                            </div>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#1e293b', marginBottom: '12px' }}>Confirm Deletion</h3>
                            <p style={{ color: '#64748b', marginBottom: '32px', lineHeight: '1.6' }}>
                                Are you sure you want to remove <strong>{selectedPatient?.pname}</strong>? This action cannot be undone and all clinical records will be lost.
                            </p>
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <button onClick={() => setDeleteModalOpen(false)} style={{ flex: 1, padding: '12px', background: '#f1f5f9', border: 'none', borderRadius: '12px', color: '#475569', fontWeight: '600', cursor: 'pointer' }}>Cancel</button>
                                <button onClick={handleDelete} style={{ flex: 1, padding: '12px', background: '#dc2626', border: 'none', borderRadius: '12px', color: 'white', fontWeight: '600', cursor: 'pointer' }}>Delete Now</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Custom Alert/Notification Toast */}
                {alert.show && (
                    <div style={{ position: 'fixed', bottom: '40px', right: '40px', background: alert.type === 'error' ? '#dc2626' : alert.type === 'success' ? '#059669' : '#3b82f6', color: 'white', padding: '16px 24px', borderRadius: '12px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', gap: '12px', zIndex: 2000, animation: 'slideIn 0.3s ease-out' }}>
                        {alert.type === 'success' ? <Save size={20} /> : <AlertTriangle size={20} />}
                        <div>
                            <div style={{ fontWeight: '700', fontSize: '0.9rem' }}>{alert.title}</div>
                            <div style={{ fontSize: '0.8rem', opacity: 0.9 }}>{alert.message}</div>
                        </div>
                        <button onClick={() => setAlert({ ...alert, show: false })} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: '4px' }}><X size={18} /></button>
                    </div>
                )}
                
                {/* Quick Booking Modal */}
                {bookingModalOpen && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1200, backdropFilter: 'blur(10px)' }}>
                        <div style={{ background: 'white', width: '100%', maxWidth: '500px', borderRadius: '28px', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}>
                            <div style={{ padding: '32px', background: '#f8fafc', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#1e293b' }}>Clinical Handover</h3>
                                    <div style={{ display: 'flex', gap: '16px', marginTop: '20px' }}>
                                        <button 
                                            type="button"
                                            onClick={() => setBookingMode('lab')}
                                            style={{ 
                                                flex: 1,
                                                padding: '16px', 
                                                borderRadius: '20px', 
                                                border: bookingMode === 'lab' ? '2px solid #2563eb' : '1px solid #e2e8f0', 
                                                background: bookingMode === 'lab' ? '#eff6ff' : 'white', 
                                                color: '#1e40af', 
                                                fontSize: '0.875rem', 
                                                fontWeight: '800', 
                                                cursor: 'pointer',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'center',
                                                gap: '12px',
                                                boxShadow: bookingMode === 'lab' ? '0 10px 15px -3px rgba(37, 99, 235, 0.2)' : 'none',
                                                transition: '0.2s'
                                            }}
                                        >
                                            <FlaskConical size={24} color="#2563eb" />
                                            Send Directly to Lab
                                        </button>
                                        <button 
                                            type="button"
                                            onClick={() => setBookingMode('consultation')}
                                            style={{ 
                                                flex: 1,
                                                padding: '16px', 
                                                borderRadius: '20px', 
                                                border: 'none', 
                                                background: bookingMode === 'consultation' ? 'linear-gradient(135deg, #2563eb, #1d4ed8)' : '#f8fafc', 
                                                color: bookingMode === 'consultation' ? 'white' : '#64748b', 
                                                fontSize: '0.875rem', 
                                                fontWeight: '800', 
                                                cursor: 'pointer',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'center',
                                                gap: '12px',
                                                boxShadow: bookingMode === 'consultation' ? '0 10px 15px -3px rgba(37, 99, 235, 0.4)' : 'none',
                                                transition: '0.2s'
                                            }}
                                        >
                                            <Stethoscope size={24} color={bookingMode === 'consultation' ? 'white' : '#94a3b8'} />
                                            Send to Consultation
                                        </button>
                                    </div>
                                </div>
                                <button onClick={() => setBookingModalOpen(false)} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><X size={18} /></button>
                            </div>
                            
                            <form onSubmit={handleQuickBook} style={{ padding: '32px' }}>
                                {bookingMode === 'consultation' ? (
                                    <>
                                        <label className="label-text">Select Consultant</label>
                                        <div style={{ display: 'grid', gap: '12px', maxHeight: '200px', overflowY: 'auto', marginBottom: '24px', paddingRight: '4px' }}>
                                            {doctors.map(d => (
                                                <div 
                                                    key={d.docid}
                                                    onClick={() => setBookingData({...bookingData, docid: d.docid})}
                                                    style={{ 
                                                        padding: '16px', borderRadius: '16px', border: bookingData.docid === d.docid ? '2px solid #ff7200' : '1px solid #e2e8f0',
                                                        background: bookingData.docid === d.docid ? '#fff7ed' : 'white', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                                                    }}
                                                >
                                                    <div>
                                                        <div style={{ fontSize: '0.7rem', fontWeight: '800', color: bookingData.docid === d.docid ? '#ff7200' : '#94a3b8', textTransform: 'uppercase' }}>{d.specialties || 'General'}</div>
                                                        <div style={{ fontWeight: '700', color: '#1e293b' }}>Dr. {d.docname}</div>
                                                    </div>
                                                    {bookingData.docid === d.docid && <CheckCircle size={20} color="#ff7200" />}
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <label className="label-text">Select Lab Tests</label>
                                        <div style={{ display: 'grid', gap: '8px', maxHeight: '200px', overflowY: 'auto', marginBottom: '24px', paddingRight: '4px' }}>
                                            {labCatalog.map(test => (
                                                <div 
                                                    key={test.id}
                                                    onClick={() => {
                                                        const isSelected = selectedTests.some(t => t.id === test.id);
                                                        if (isSelected) setSelectedTests(selectedTests.filter(t => t.id !== test.id));
                                                        else setSelectedTests([...selectedTests, test]);
                                                    }}
                                                    style={{ 
                                                        padding: '16px 20px', borderRadius: '16px', border: selectedTests.some(t => t.id === test.id) ? '2px solid #ff7200' : '1px solid #e2e8f0',
                                                        background: selectedTests.some(t => t.id === test.id) ? '#fff7ed' : 'white', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                                        transition: '0.2s'
                                                    }}
                                                >
                                                    <div>
                                                        <div style={{ fontSize: '0.875rem', fontWeight: '800', color: '#1e293b' }}>{test.test_name}</div>
                                                        <div style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: '700' }}>KES {test.price.toLocaleString()}</div>
                                                    </div>
                                                    {selectedTests.some(t => t.id === test.id) && <CheckCircle size={20} color="#ff7200" />}
                                                </div>
                                            ))}
                                        </div>
                                        {selectedTests.length > 0 && (
                                            <div style={{ padding: '16px', background: '#f0fdf4', borderRadius: '12px', border: '1px solid #bbf7d0', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span style={{ fontWeight: '700', color: '#166534' }}>Estimated Total ({selectedTests.length} tests)</span>
                                                <span style={{ fontWeight: '900', color: '#10b981', fontSize: '1.1rem' }}>KES {selectedTests.reduce((sum, t) => sum + t.price, 0).toLocaleString()}</span>
                                            </div>
                                        )}
                                    </>
                                )}

                                <label className="label-text">Clinical Notes (Optional)</label>
                                <textarea className="input-field" rows="2" value={bookingData.reason} onChange={(e) => setBookingData({...bookingData, reason: e.target.value})} placeholder="Reason for consultation..." style={{ marginBottom: '32px' }} />

                                <div style={{ display: 'flex', gap: '12px' }}>
                                    <button type="button" onClick={() => setBookingModalOpen(false)} style={{ flex: 1, padding: '14px', borderRadius: '12px', border: 'none', background: '#f1f5f9', fontWeight: '700', color: '#475569', cursor: 'pointer' }}>Cancel</button>
                                    <button type="submit" disabled={bookingLoading} style={{ flex: 2, padding: '14px', borderRadius: '12px', border: 'none', background: '#ff7200', color: 'white', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                        {bookingLoading ? 'Sending...' : <><Save size={18} /> Confirm Handover</>}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
                
                <style>{`
                    .hover-row:hover { background-color: #f8fafc; }
                    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                    .animate-spin { animation: spin 1s linear infinite; }
                    @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
                    .input-field { width: 100%; padding: 10px 16px; border: 1px solid #cbd5e1; borderRadius: 10px; font-size: 0.875rem; transition: all 0.2s; background: white; }
                    .input-field:focus { outline: none; border-color: #3b82f6; box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1); }
                    .label-text { display: block; font-size: 0.75rem; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 6px; letter-spacing: 0.025em; }
                    
                    /* Custom Scrollbar for Modal */
                    ::-webkit-scrollbar { width: 8px; }
                    ::-webkit-scrollbar-track { background: #f1f5f9; }
                    ::-webkit-scrollbar-thumb { background: #cbd5e1; borderRadius: 4px; }
                    ::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
                `}</style>
                <style>{`
                    @keyframes pulse {
                        0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(255, 114, 0, 0.4); }
                        70% { transform: scale(1.05); box-shadow: 0 0 0 10px rgba(255, 114, 0, 0); }
                        100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(255, 114, 0, 0); }
                    }
                    @keyframes spin {
                        from { transform: rotate(0deg); }
                        to { transform: rotate(360deg); }
                    }
                    .animate-spin { animation: spin 2s linear infinite; }
                    .hover-row:hover { background-color: #f8fafc !important; }
                `}</style>
        </div>
    );
};

export default RegistrarPatients;
