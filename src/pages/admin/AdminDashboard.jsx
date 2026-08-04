// =============================================================
// FILE: AdminDashboard.jsx
// PURPOSE: Integrated Super-User Oversight Terminal for eDoc.
//          Visualizes clinical volume, lab throughput, and pharmacy stock.
// =============================================================
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Users, Activity, DollarSign, Stethoscope,
    Pill, FlaskConical, Bell, Search, Calendar, CloudSun,
    Package, Truck, Microscope, Layout, ArrowRight, UserPlus, Trash2,
    RefreshCw, Clipboard, Save, AlertTriangle
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

const AdminDashboard = () => {
    const { profile } = useAuth();
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        totalPatients: 0,
        staff: { doctors: 0, registrars: 0, lab_techs: 0, pharmacists: 0 },
        todayClinicalVolume: 0,
        labPending: 0,
        lowStock: 0
    });
    const [loading, setLoading] = useState(true);

    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        fetchGlobalStats();
    }, []);

    const fetchGlobalStats = async () => {
        setLoading(true);
        try {
            // Get today's date in YYYY-MM-DD
            const today = new Date().toISOString().split('T')[0];

            // Run queries concurrently
            const [
                { count: patientCount },
                { count: appoToday },
                { count: docCount },
                { count: regCount },
                { count: labCount },
                { count: phCount },
                { count: labPending },
                { count: lowStock }
            ] = await Promise.all([
                supabase.from('patient').select('*', { count: 'exact', head: true }),
                supabase.from('appointment').select('*', { count: 'exact', head: true }).eq('appodate', today),
                supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'd'),
                supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'r'),
                supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'l'),
                supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'ph'),
                supabase.from('lab_requests').select('*', { count: 'exact', head: true }).in('status', ['pending', 'waiting']),
                supabase.from('medicine').select('*', { count: 'exact', head: true }).lt('stock_qty', 20)
            ]);

            setStats({
                totalPatients: patientCount || 0,
                staff: { 
                    doctors: docCount || 0, 
                    registrars: regCount || 0, 
                    lab_techs: labCount || 0, 
                    pharmacists: phCount || 0 
                },
                todayClinicalVolume: appoToday || 0,
                labPending: labPending || 0,
                lowStock: lowStock || 0
            });
        } catch (err) {
            console.error("Failed to fetch admin stats", err);
        } finally {
            setLoading(false);
        }
    };

    const todayDate = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const formattedTime = currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    const timeParts = formattedTime.split(' ');

    const getGreeting = () => {
        const hour = currentTime.getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 17) return 'Good Afternoon';
        return 'Good Evening';
    };

    const metrics = [
        { label: 'Clinical Volume', count: stats.todayClinicalVolume, icon: Activity, color: '#2563eb', path: '/doctor/appointments' },
        { label: 'Pending Labs', count: stats.labPending, icon: Microscope, color: '#d946ef', path: '/lab/workbench' },
        { label: 'Low Stock Drugs', count: stats.lowStock, icon: Package, color: '#f59e0b', path: '/pharmacy/inventory' },
        { label: 'Active Staff', count: (stats.staff.doctors + stats.staff.registrars + stats.staff.lab_techs + stats.staff.pharmacists), icon: Users, color: '#10b981', path: '/admin/staff' },
    ];

    return (
        <div style={{ padding: '40px', maxWidth: '1600px', margin: '0 auto', background: '#f8fafc', minHeight: '100vh' }}>
            {/* Header Section */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#1e293b' }}>Integrated Command Center</h2>
                    <p style={{ color: '#64748b' }}>Full operational oversight of hospital departments.</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: '700', color: '#1e293b' }}>{timeParts[0]} {timeParts[1]}</div>
                        <div style={{ fontSize: '0.875rem', color: '#64748b' }}>{todayDate}</div>
                    </div>
                    <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'white', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', cursor: 'pointer' }} onClick={fetchGlobalStats}>
                        <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                    </div>
                </div>
            </div>

            {/* Premium Admin Hero */}
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
                        <span style={{ color: '#60a5fa' }}>System Administrator Oversight</span>
                    </h2>
                    <p style={{ fontSize: '1.1rem', opacity: 1, fontWeight: '600', marginBottom: '32px', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
                        You are currently monitoring <span style={{ color: '#60a5fa', fontWeight: '800' }}>{stats.todayClinicalVolume}</span> clinical sessions and <span style={{ color: '#60a5fa', fontWeight: '800' }}>{stats.labPending}</span> pending laboratory requests.
                    </p>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <button onClick={() => navigate('/admin/financials')} style={{ padding: '12px 24px', background: '#3b82f6', border: 'none', borderRadius: '12px', color: 'white', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.2)' }}>
                            <DollarSign size={18} /> Financial Reports
                        </button>
                        <button onClick={() => navigate('/admin/staff')} style={{ padding: '12px 24px', background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '12px', color: 'white', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Users size={18} /> Staff Directory
                        </button>
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
                    <div style={{ fontSize: '1.25rem', fontWeight: '600', opacity: 0.9 }}>Nairobi HQ, Command Center</div>
                </div>
            </div>

            {/* Premium Departmental Metrics Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', marginBottom: '40px' }}>
                {metrics.map((stat, idx) => (
                    <div key={idx}
                        onClick={() => navigate(stat.path)}
                        style={{ 
                            background: 'white', 
                            padding: '32px 24px', 
                            borderRadius: '24px', 
                            border: '1px solid #e2e8f0', 
                            display: 'flex', 
                            flexDirection: 'column',
                            gap: '20px',
                            cursor: 'pointer', 
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', 
                            boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)',
                            position: 'relative',
                            overflow: 'hidden'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-6px)';
                            e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(0,0,0,0.1)';
                            e.currentTarget.style.borderColor = stat.color;
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0,0,0,0.05)';
                            e.currentTarget.style.borderColor = '#e2e8f0';
                        }}
                    >
                        <div style={{ 
                            width: '48px', 
                            height: '48px', 
                            background: `${stat.color}15`, 
                            color: stat.color, 
                            borderRadius: '14px', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            marginBottom: '4px'
                        }}>
                            <stat.icon size={26} strokeWidth={2.5} />
                        </div>
                        <div>
                            <div style={{ fontSize: '2.25rem', fontWeight: '900', color: '#0f172a', letterSpacing: '-0.025em', lineHeight: 1 }}>{stat.count}</div>
                            <div style={{ fontSize: '0.85rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '8px' }}>{stat.label}</div>
                        </div>
                        
                        <div style={{ 
                            position: 'absolute', 
                            right: '-10px', 
                            bottom: '-10px', 
                            opacity: 0.03, 
                            color: stat.color,
                            transform: 'rotate(-15deg)'
                        }}>
                            <stat.icon size={100} />
                        </div>
                    </div>
                ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '30px' }}>
                <div style={{ background: 'white', padding: '30px', borderRadius: '24px', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#1e293b', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Activity size={20} color="#2563eb" /> Recent Operational Pulse
                    </h3>
                    <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
                        <Activity size={48} style={{ opacity: 0.2, margin: '0 auto 16px' }} />
                        <p>Real-time clinical and lab activity logs will appear here.</p>
                    </div>
                </div>
                
                <div style={{ background: 'white', padding: '30px', borderRadius: '24px', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#1e293b', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Pill size={20} color="#f59e0b" /> Critical Stock Alerts
                    </h3>
                    <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
                        <Package size={48} style={{ opacity: 0.2, margin: '0 auto 16px' }} />
                        <p>{stats.lowStock > 0 ? `${stats.lowStock} items require immediate procurement.` : 'All inventory levels are currently optimal.'}</p>
                    </div>
                </div>
            </div>
            <style>{`
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                .animate-spin { animation: spin 1s linear infinite; }
            `}</style>
        </div>
    );
};

export default AdminDashboard;
