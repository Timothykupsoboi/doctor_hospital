// =============================================================
// FILE: RegistrarDashboard.jsx [v1.1 - Stable]
// PURPOSE: React component / entry point for the eDoc Hospital
//          frontend. Part of the Vite + React SPA.
// =============================================================
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Users, CalendarRange, Clock, AlertTriangle, UserPlus,
    CalendarPlus, Search, Calendar, Activity, Bookmark, Layout,
    CloudSun, ArrowRight, CheckCircle, FlaskConical, Pill, FileText, RefreshCw
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

const RegistrarDashboard = () => {
    const navigate = useNavigate();
    const { profile } = useAuth();
    const todayDate = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const [currentTime, setCurrentTime] = useState(new Date());
    const [stats, setStats] = useState({ totalPatients: 0, totalDoctors: 0, todayBookings: 0, todaySessions: 0 });
    const [activeQueue, setActiveQueue] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const fetchDashboardData = async () => {
        try {
            // Get today's date in YYYY-MM-DD
            const today = new Date().toISOString().split('T')[0];

            // Run queries concurrently
            const [
                { count: patientsCount },
                { count: doctorsCount },
                { count: bookingsCount },
                { data: queueData }
            ] = await Promise.all([
                supabase.from('patient').select('*', { count: 'exact', head: true }),
                supabase.from('doctor').select('*', { count: 'exact', head: true }),
                supabase.from('appointment').select('*', { count: 'exact', head: true }).eq('appodate', today),
                supabase.from('appointment')
                    .select('appoid, status, patient:pid(patient_display_id, pname), doctor:docid(docname)')
                    .eq('appodate', today)
                    .order('created_at', { ascending: false })
            ]);

            setStats({
                totalPatients: patientsCount || 0,
                totalDoctors: doctorsCount || 0,
                todayBookings: bookingsCount || 0,
                todaySessions: 0
            });

            if (queueData) {
                const formattedQueue = queueData.map(item => ({
                    appoid: item.appoid,
                    patient_display_id: item.patient?.patient_display_id || 'Unknown',
                    pname: item.patient?.pname || 'Unknown Patient',
                    docname: item.doctor?.docname || 'Unknown',
                    status: item.status,
                    has_prescription: false, 
                    has_labs: false
                }));
                setActiveQueue(formattedQueue);
            }

        } catch (err) {
            console.error('Dashboard error:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const getGreeting = () => {
        const hour = currentTime.getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 17) return 'Nice afternoon';
        return 'Good evening';
    };

    const formattedTime = currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    const timeParts = formattedTime.split(' ');

    const metrics = [
        { label: 'Clinical Staff', count: stats.totalDoctors, icon: Activity, color: '#3b82f6' },
        { label: profile?.role === 'a' ? 'Total Patients' : 'Patient Registry', count: stats.totalPatients, icon: Users, color: '#8b5cf6' },
        { label: 'Today Bookings', count: stats.todayBookings, icon: Bookmark, color: '#ff7200' },
        { label: profile?.role === 'a' ? 'Clinical Completion' : 'Hospital Capacity', count: profile?.role === 'a' ? '88%' : '92%', icon: profile?.role === 'a' ? CheckCircle : Layout, color: '#10b981' },
    ];

    return (
        <div style={{ padding: '32px 48px', maxWidth: '1600px', margin: '0 auto', background: '#f8fafc', minHeight: '100vh' }}>
            {/* Header Section */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#1e293b' }}>Operational Hub</h2>
                    <p style={{ color: '#64748b' }}>Real-time clinical throughput and patient management.</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: '700', color: '#1e293b', fontSize: '1.1rem' }}>{timeParts[0]} {timeParts[1]}</div>
                    <div style={{ fontSize: '0.875rem', color: '#64748b' }}>{todayDate}</div>
                </div>
            </div>

            {/* Modern Dynamic Welcome Hero */}
            <div style={{
                backgroundImage: `linear-gradient(rgba(15, 23, 42, 0.45), rgba(15, 23, 42, 0.45)), url('/img/b8.jpg')`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                borderRadius: '24px',
                padding: '40px',
                marginBottom: '40px',
                color: 'white',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
                position: 'relative',
                overflow: 'hidden'
            }}>
                <div style={{ flex: 1 }}>
                    <h2 style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '12px' }}>
                        {getGreeting()},<br />
                        <span style={{ color: '#60a5fa' }}>{profile?.role === 'a' ? 'Administrator' : (profile?.regname || 'Registrar')}</span>
                    </h2>
                    <p style={{ fontSize: '1.1rem', opacity: 1, fontWeight: '600', marginBottom: '32px', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
                        Total patient volume for today is <span style={{ color: '#60a5fa', fontWeight: '800' }}>{stats.todayBookings}</span>.
                    </p>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <button onClick={() => navigate('/registrar/new-patient')} style={{ padding: '12px 24px', background: '#3b82f6', border: 'none', borderRadius: '12px', color: 'white', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.2)' }}>
                            <UserPlus size={18} /> New Registration
                        </button>
                        {profile?.role === 'a' ? (
                            <button onClick={() => navigate('/registrar/history?tab=archive')} style={{ padding: '12px 24px', background: '#8b5cf6', border: 'none', borderRadius: '12px', color: 'white', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.2)' }}>
                                <FileText size={18} /> Master Archive
                            </button>
                        ) : (
                            <button onClick={() => navigate('/registrar/patients')} style={{ padding: '12px 24px', background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '12px', color: 'white', fontWeight: '700', cursor: 'pointer' }}>
                                View Patient List
                            </button>
                        )}
                    </div>
                </div>

                <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '20px' }}>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '3rem', fontWeight: '800', lineHeight: 1 }}>24°C</div>
                            <div style={{ fontSize: '1rem', opacity: 0.9, fontWeight: '500' }}>Partly Cloudy</div>
                        </div>
                        <div style={{ background: 'rgba(255,255,255,0.15)', padding: '16px', borderRadius: '50%', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.2)' }}>
                            <CloudSun size={48} />
                        </div>
                    </div>
                    <div style={{ fontSize: '1.25rem', fontWeight: '600', opacity: 0.9 }}>Nairobi, Kenya</div>
                </div>
            </div>

            {/* Metrics Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', marginBottom: '40px' }}>
                {metrics.map((stat, idx) => (
                    <div key={idx} style={{ background: 'white', padding: '24px', borderRadius: '20px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                        <div>
                            <div style={{ fontSize: '1.875rem', fontWeight: '800', color: '#1e293b' }}>{stat.count}</div>
                            <div style={{ fontSize: '0.875rem', fontWeight: '600', color: '#64748b' }}>{stat.label}</div>
                        </div>
                        <div style={{ padding: '12px', background: `${stat.color}15`, color: stat.color, borderRadius: '12px' }}>
                            <stat.icon size={24} />
                        </div>
                    </div>
                ))}
            </div>

            {/* Main Content Area */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '32px' }}>
                <div style={{ background: 'white', borderRadius: '24px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
                    <div style={{ padding: '24px 32px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <h3 style={{ fontSize: '1.125rem', fontWeight: '800', color: '#1e293b' }}>Today's Clinical Handover Cycle</h3>
                            <p style={{ fontSize: '0.875rem', color: '#64748b' }}>Monitoring patient transitions from reception to clinical rooms.</p>
                        </div>
                        <button onClick={fetchDashboardData} style={{ padding: '8px 16px', background: '#f1f5f9', border: 'none', borderRadius: '10px', color: '#475569', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <RefreshCw size={16} /> Refresh
                        </button>
                    </div>

                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead style={{ background: '#f8fafc' }}>
                                <tr>
                                    <th style={{ textAlign: 'left', padding: '16px 32px', fontSize: '0.75rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Patient Details</th>
                                    <th style={{ textAlign: 'left', padding: '16px 32px', fontSize: '0.75rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Assigned Doctor</th>
                                    <th style={{ textAlign: 'left', padding: '16px 32px', fontSize: '0.75rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Workflow Status</th>
                                    <th style={{ textAlign: 'right', padding: '16px 32px', fontSize: '0.75rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {activeQueue.length > 0 ? (
                                    activeQueue.map((item) => (
                                        <tr key={item.appoid} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                            <td style={{ padding: '16px 32px' }}>
                                                <div style={{ fontWeight: '700', color: '#1e293b' }}>{item.pname}</div>
                                                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{item.patient_display_id}</div>
                                            </td>
                                            <td style={{ padding: '16px 32px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0369a1', fontSize: '0.7rem', fontWeight: '800' }}>Dr</div>
                                                    <div style={{ fontSize: '0.9rem', color: '#1e293b', fontWeight: '600' }}>{item.docname}</div>
                                                </div>
                                            </td>
                                            <td style={{ padding: '16px 32px' }}>
                                                {(() => {
                                                    const s = item.status?.toLowerCase() || '';
                                                    let bg = '#f1f5f9', color = '#475569', label = item.status;
                                                    
                                                    if (s === 'waiting') { bg = '#fffbeb'; color = '#9a3412'; label = 'Waiting for Doctor'; }
                                                    else if (s === 'pending_lab') { bg = '#eff6ff'; color = '#1d4ed8'; label = 'Awaiting Lab Samples'; }
                                                    else if (s === 'lab_processing') { bg = '#f5f3ff'; color = '#7c3aed'; label = 'Lab Session Active'; }
                                                    else if (s === 'lab_results_partial') { bg = '#fdf4ff'; color = '#a21caf'; label = 'Partial Lab Results'; }
                                                    else if (s === 'lab_completed') { bg = '#f0fdf4'; color = '#166534'; label = 'Lab Reports Ready'; }
                                                    else if (s === 'in_consultation') { bg = '#ecfdf5'; color = '#059669'; label = 'In Consultation'; }
                                                    else if (s === 'completed') { bg = '#f0fdf4'; color = '#166534'; label = 'Visit Completed'; }
                                                    
                                                    return (
                                                        <span style={{ 
                                                            padding: '6px 14px', 
                                                            borderRadius: '20px', 
                                                            fontSize: '0.75rem', 
                                                            fontWeight: '800',
                                                            background: bg,
                                                            color: color,
                                                            textTransform: 'uppercase',
                                                            border: `1px solid ${color}20`
                                                        }}>
                                                            {label}
                                                        </span>
                                                    );
                                                })()}
                                            </td>
                                            <td style={{ padding: '16px 32px', textAlign: 'right' }}>
                                                <button onClick={() => navigate(`/registrar/history`)} style={{ background: 'none', border: '1px solid #e2e8f0', padding: '6px 12px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: '600', color: '#475569', cursor: 'pointer' }}>View Lifecycle</button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="4" style={{ textAlign: 'center', padding: '64px' }}>
                                            <Activity size={48} color="#e2e8f0" style={{ marginBottom: '16px' }} />
                                            <p style={{ color: '#94a3b8', fontWeight: '500' }}>No active clinical cycle tracking data available.</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div style={{ padding: '24px 32px', background: '#f8fafc', borderTop: '1px solid #f1f5f9', textAlign: 'center' }}>
                        <button onClick={() => navigate('/registrar/patients')} style={{ background: 'white', border: '1px solid #e2e8f0', padding: '10px 20px', borderRadius: '12px', fontWeight: '700', color: '#1e293b', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                            Manage Patient Routing <ArrowRight size={16} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RegistrarDashboard;
