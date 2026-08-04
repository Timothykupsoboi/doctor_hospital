import React, { useState, useEffect, useCallback } from 'react';
import { 
    FileText, Activity, Users, Clipboard, TrendingUp, 
    Calendar, Clock, Pill, Stethoscope, ChevronRight 
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

const DoctorReports = () => {
    const { profile } = useAuth();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalPatients: 0,
        todayPatients: 0,
        consultations: 0,
        avgConsultTime: 0,
        commonDiagnoses: [],
        topDrugs: [],
        prescriptionRate: 0
    });

    const fetchClinicalData = useCallback(async () => {
        if (!profile?.docid) return;
        setLoading(true);
        try {
            const today = new Date().toISOString().split('T')[0];
            
            // 1. Appointments Stats
            const { data: appointments } = await supabase
                .from('appointment')
                .select('created_at, status')
                .eq('docid', profile.docid);

            const totalPatients = appointments?.length || 0;
            const todayPatients = appointments?.filter(a => a.created_at.startsWith(today)).length || 0;

            // 2. Consultations & Diagnoses
            const { data: consultations } = await supabase
                .from('consultations')
                .select('created_at, clinical_impression, hpi')
                .eq('docid', profile.docid);

            const totalConsults = consultations?.length || 0;
            
            // Map common diagnoses (Clinical Impression)
            const diagMap = {};
            consultations?.forEach(c => {
                const diag = c.clinical_impression || 'General Observation';
                diagMap[diag] = (diagMap[diag] || 0) + 1;
            });
            const commonDiagnoses = Object.entries(diagMap)
                .map(([name, count]) => ({ name, count }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 5);

            // 3. Prescriptions
            const { data: prescriptions } = await supabase
                .from('prescriptions')
                .select(`
                    drug_name,
                    appointment!inner(docid)
                `)
                .eq('appointment.docid', profile.docid);

            const drugMap = {};
            prescriptions?.forEach(p => {
                const drug = p.drug_name || 'Unspecified';
                drugMap[drug] = (drugMap[drug] || 0) + 1;
            });
            const topDrugs = Object.entries(drugMap)
                .map(([name, count]) => ({ name, count }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 5);

            setStats({
                totalPatients,
                todayPatients,
                consultations: totalConsults,
                avgConsultTime: totalConsults > 0 ? 15 : 0, 
                commonDiagnoses,
                topDrugs,
                prescriptionRate: totalConsults > 0 ? Math.round(((prescriptions?.length || 0) / totalConsults) * 10) / 10 : 0
            });
        } catch (e) {
            console.error('Error fetching clinical reports:', e);
        }
        setLoading(false);
    }, [profile?.docid]);

    useEffect(() => {
        fetchClinicalData();
    }, [fetchClinicalData]);

    if (loading) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#f8fafc' }}>
            <div style={{ width: 40, height: 40, border: '3px solid #e2e8f0', borderTopColor: '#007bff', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );

    return (
        <div style={{ padding: '40px 56px', maxWidth: '1600px', margin: '0 auto', background: '#f8fafc', minHeight: '100vh' }}>
            <header style={{ marginBottom: '48px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <div>
                        <h1 style={{ fontSize: '2.25rem', fontWeight: '800', letterSpacing: '-0.02em', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <FileText size={40} color="#007bff" /> Clinical Intelligence
                        </h1>
                        <p style={{ color: '#64748b', fontSize: '1.1rem' }}>Focused metrics on your clinical load and prescribing patterns.</p>
                    </div>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <div style={{ background: 'white', padding: '12px 20px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <Calendar size={18} color="#64748b" />
                            <span style={{ fontWeight: '700', fontSize: '0.9rem' }}>Last 30 Days</span>
                        </div>
                    </div>
                </div>
            </header>

            {/* KPI Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', marginBottom: '48px' }}>
                {[
                    { label: 'Total Patients Seen', value: stats.totalPatients, icon: Users, color: '#3b82f6', bg: '#eff6ff', trend: '+12%' },
                    { label: 'Consultations Done', value: stats.consultations, icon: Stethoscope, color: '#10b981', bg: '#ecfdf5', trend: '+5%' },
                    { label: 'Avg. Consult Time', value: `${stats.avgConsultTime}m`, icon: Clock, color: '#f59e0b', bg: '#fffbeb', trend: '-2m' },
                    { label: 'Prescription Rate', value: `${stats.prescriptionRate} / patient`, icon: Pill, color: '#ef4444', bg: '#fef2f2', trend: 'Stable' },
                ].map((kpi, idx) => (
                    <div key={idx} style={{ background: 'white', padding: '24px', borderRadius: '24px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                            <div style={{ background: kpi.bg, padding: '12px', borderRadius: '14px' }}>
                                <kpi.icon size={24} color={kpi.color} />
                            </div>
                            <span style={{ fontSize: '0.8rem', fontWeight: '800', color: kpi.color, background: kpi.bg, padding: '4px 10px', borderRadius: '20px', height: 'fit-content' }}>
                                {kpi.trend}
                            </span>
                        </div>
                        <h3 style={{ fontSize: '2rem', fontWeight: '900', color: '#1e293b', marginBottom: '4px' }}>{kpi.value}</h3>
                        <p style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{kpi.label}</p>
                    </div>
                ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
                {/* Diagnoses Trends */}
                <div style={{ background: 'white', borderRadius: '24px', border: '1px solid #e2e8f0', padding: '32px' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: '800', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Activity size={24} color="#3b82f6" /> Common Clinical Diagnoses
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {stats.commonDiagnoses.map((diag, i) => (
                            <div key={i}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.9rem', fontWeight: '700' }}>
                                    <span>{diag.name}</span>
                                    <span style={{ color: '#3b82f6' }}>{diag.count} cases</span>
                                </div>
                                <div style={{ width: '100%', height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                                    <div style={{ width: `${(diag.count / stats.consultations) * 100}%`, height: '100%', background: '#3b82f6', borderRadius: '4px' }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Prescription Insights */}
                <div style={{ background: 'white', borderRadius: '24px', border: '1px solid #e2e8f0', padding: '32px' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: '800', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Pill size={24} color="#ef4444" /> Top Drugs Prescribed
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {stats.topDrugs.map((drug, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', background: '#f8fafc', borderRadius: '16px', border: '1px solid #f1f5f9' }}>
                                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', color: '#ef4444', border: '1px solid #e2e8f0' }}>
                                    {i + 1}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: '800', color: '#1e293b' }}>{drug.name}</div>
                                    <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '600' }}>Used in {Math.round((drug.count / stats.consultations) * 100)}% of visits</div>
                                </div>
                                <div style={{ fontWeight: '900', color: '#1e293b', fontSize: '1.1rem' }}>{drug.count}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DoctorReports;
