import React, { useState, useEffect, useCallback } from 'react';
import { 
    BarChart3, TrendingUp, Users, DollarSign, Activity, 
    Microscope, Pill, Calendar, Download, RefreshCw,
    ArrowUpRight, ArrowDownRight, UserPlus, FileText,
    Clock, AlertTriangle, Briefcase, Zap, ShieldAlert,
    ChevronRight, ChevronDown, Search, ListFilter, PieChart, Info, ShoppingCart, Eye,
    Printer, X
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { printDocument } from '../../utils/printDocument';

// --- CONSTANTS ---
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// --- HELPERS ---
const KPICard = ({ title, value, color, icon: Icon, subtext }) => (
    <div style={{ background: 'white', padding: '28px', borderRadius: '24px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.01)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', right: '-10px', top: '-10px', opacity: 0.05, color: color }}>
            <Icon size={100} />
        </div>
        <p style={{ fontSize: '0.65rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px' }}>{title}</p>
        <h2 style={{ fontSize: '1.85rem', fontWeight: '700', color: '#0f172a', marginBottom: '6px', letterSpacing: '-0.02em' }}>{value}</h2>
        <p style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Icon size={12} color={color} /> {subtext}
        </p>
    </div>
);

const Section = ({ title, icon: Icon, children }) => (
    <div style={{ background: 'white', borderRadius: '24px', border: '1px solid #e2e8f0', padding: '32px', boxShadow: '0 4px 15px rgba(0,0,0,0.02)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
            {Icon && <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '12px' }}><Icon size={20} color="#3b82f6" /></div>}
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#0f172a', letterSpacing: '-0.01em' }}>{title}</h3>
        </div>
        {children}
    </div>
);

const ProgressBar = ({ pct, color }) => (
    <div style={{ width: '100%', height: '12px', background: '#f1f5f9', borderRadius: '6px', overflow: 'hidden' }}>
        <div style={{ width: `${Math.min(pct, 100)}%`, height: '100%', background: color, borderRadius: '6px', transition: 'width 1s ease-out' }} />
    </div>
);

const AgingItem = ({ label, value, pct, color }) => (
    <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '1rem', fontWeight: '800' }}>
            <span style={{ color: '#475569' }}>{label}</span>
            <span style={{ color: '#0f172a' }}>{value}</span>
        </div>
        <ProgressBar pct={pct} color={color} />
    </div>
);

const AdminReports = () => {
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('revenue');
    const [selectedPatientAudit, setSelectedPatientAudit] = useState(null);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
    const [selectedDay, setSelectedDay] = useState(new Date().toISOString().split('T')[0]);
    const [reportFocus, setReportFocus] = useState('day'); // 'year', 'month', 'day'
    const [breakdownConfig, setBreakdownConfig] = useState({ show: false, level: 0, type: '', title: 'Intelligence Center', year: new Date().getFullYear(), monthIdx: null, dayDate: null, highlightedId: null });
    const [data, setData] = useState({
        revenue: { daily: 0, weekly: 0, monthly: 0, yearly: 0, methods: {}, departments: { Consultation: 0, Lab: 0, Pharmacy: 0 }, weeklyBreakdown: [], monthlyBreakdown: [], yearlyBreakdown: [], rawRevenue: [], multiYearBreakdown: [] },
        outstanding: { total: 0, patients: [], aging: { short: 0, medium: 0, long: 0 } },
        patients: { total: 0, newToday: 0, newMonth: 0, returning: 0, gender: { Male: 0, Female: 0, Other: 0 }, age: { '0-18': 0, '19-35': 0, '36-50': 0, '51+': 0 }, list: [] },
        staff: { doctors: [], labTechs: [], billing: [] },
        clinical: { totalConsults: 0, topDiagnoses: [], prescriptions: 0, referrals: 0 },
        pharmacy: { dispensed: 0, fastMoving: [], lowStock: [], expired: [] },
        growth: { monthlyPatients: [], monthlyRevenue: [] },
        raw: { consultations: [], labReports: [], prescriptions: [] }
    });

    const fetchAllData = useCallback(async () => {
        setLoading(true);
        try {
            const now = new Date();
            const today = now.toISOString().split('T')[0];
            
            // Calculate ranges based on SELECTED period
            const startOfRealMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
            const startOfSelectedDay = `${selectedDay}T00:00:00.000Z`;
            const endOfSelectedDay = `${selectedDay}T23:59:59.999Z`;
            const startOfSelectedMonth = new Date(selectedYear, selectedMonth, 1).toISOString();
            const endOfSelectedMonth = new Date(selectedYear, selectedMonth + 1, 0, 23, 59, 59).toISOString();
            const startOfSelectedYear = new Date(selectedYear, 0, 1).toISOString();
            
            const startOfWeek = new Date(new Date().setDate(now.getDate() - 7)).toISOString();

            // 1. Fetch Core Datasets
            const [
                { data: pharmaSales },
                { data: labReports },
                { data: patients },
                { data: appointments },
                { data: consults },
                { data: prescriptions },
                { data: inventory },
                { data: staffList }
            ] = await Promise.all([
                supabase.from('pharmacy_sale').select('*'),
                supabase.from('lab_reports').select('*'),
                supabase.from('patient').select('*'),
                supabase.from('appointment').select('*, doctor:docid(docname)'),
                supabase.from('consultations').select('*'),
                supabase.from('prescriptions').select('*'),
                supabase.from('medicine').select('*'),
                supabase.from('doctor').select('*')
            ]);

            const stats = { 
                daily: 0, weekly: 0, monthly: 0, yearly: 0, 
                methods: { 'Cash': 0, 'M-Pesa': 0, 'Credit Card': 0, 'Insurance': 0, 'Bank Transfer': 0 }, 
                departments: { Consultation: 0, Lab: 0, Pharmacy: 0 },
                weeklyBreakdown: [],
                monthlyBreakdown: [],
                yearlyBreakdown: [],
                multiYearBreakdown: [],
                rawRevenue: []
            };

            const yearlyMonths = Array.from({length: 12}, (_, i) => i);
            const startYear = 2024;
            const yearsToTrack = Array.from({ length: (now.getFullYear() + 1) - startYear + 1 }, (_, i) => startYear + i);

            const multiYearMap = {};
            yearsToTrack.forEach(y => multiYearMap[y] = 0);

            const currentMonthDays = Array.from({length: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate()}, (_, i) => {
                const d = new Date(new Date().getFullYear(), new Date().getMonth(), i + 1);
                return d.toISOString().split('T')[0];
            });

            const last7Days = Array.from({length: 7}, (_, i) => {
                const d = new Date();
                d.setDate(d.getDate() - i);
                return d.toISOString().split('T')[0];
            }).reverse();

            const dailyMap = {}; last7Days.forEach(d => dailyMap[d] = 0);
            const monthlyMap = {}; currentMonthDays.forEach(d => monthlyMap[d] = 0);
            const yearlyMap = {}; yearlyMonths.forEach(m => yearlyMap[m] = 0);
            
            const allRevenue = [
                ...(pharmaSales || []).map(s => ({ amount: Number(s.total_amount || s.grand_total || s.total_price || 0), date: s.sale_date || s.created_at, method: s.payment_method || 'Cash', dept: 'Pharmacy' })),
                ...(labReports || []).map(l => ({ amount: Number(l.cost || l.price || 0), date: l.created_at, method: 'Cash', dept: 'Lab' }))
            ];

            stats.rawRevenue = allRevenue;

            allRevenue.forEach(tx => {
                const date = tx.date?.split('T')[0];
                const txDateObj = new Date(tx.date);
                const txYear = txDateObj.getFullYear();
                const txMonth = txDateObj.getMonth();

                if (date === selectedDay) stats.daily += tx.amount;
                if (tx.date >= startOfWeek) stats.weekly += tx.amount;
                
                // Monthly logic based on FOCUS
                if (reportFocus === 'month' || reportFocus === 'day') {
                    if (tx.date >= startOfSelectedMonth && tx.date <= endOfSelectedMonth) stats.monthly += tx.amount;
                } else {
                    // If in yearly focus, monthly stats could show current real month or be disabled
                    if (tx.date >= startOfRealMonth) stats.monthly += tx.amount;
                }

                if (tx.date >= startOfSelectedYear) stats.yearly += tx.amount;
                
                if (dailyMap[date] !== undefined) dailyMap[date] += tx.amount;
                if (monthlyMap[date] !== undefined) monthlyMap[date] += tx.amount;
                if (txYear === selectedYear) yearlyMap[txMonth] += tx.amount;
                if (multiYearMap[txYear] !== undefined) multiYearMap[txYear] += tx.amount;

                // --- FOCUS FILTERING FOR DEPARTMENTS & METHODS ---
                let inFocus = false;
                if (reportFocus === 'day' && date === selectedDay) inFocus = true;
                else if (reportFocus === 'month' && tx.date >= startOfSelectedMonth && tx.date <= endOfSelectedMonth) inFocus = true;
                else if (reportFocus === 'year' && txYear === selectedYear) inFocus = true;

                if (inFocus) {
                    stats.methods[tx.method] = (tx.amount + (stats.methods[tx.method] || 0));
                    if (tx.dept === 'Pharmacy') stats.departments.Pharmacy += tx.amount;
                    if (tx.dept === 'Lab') stats.departments.Lab += tx.amount;
                    if (tx.dept === 'Consultation') stats.departments.Consultation += tx.amount;
                }
            });

            stats.multiYearBreakdown = yearsToTrack.map(y => ({
                label: `Year ${y}`,
                sublabel: `Full fiscal year ${y}`,
                amount: multiYearMap[y],
                year: y,
                isToday: y === now.getFullYear()
            }));

            stats.weeklyBreakdown = last7Days.map(d => ({
                label: DAY_NAMES[new Date(d).getDay()],
                sublabel: d,
                amount: dailyMap[d],
                isToday: d === today
            }));

            stats.monthlyBreakdown = currentMonthDays.map(d => ({
                label: `Day ${new Date(d).getDate()}`,
                sublabel: d,
                amount: monthlyMap[d],
                isToday: d === today
            }));

            stats.yearlyBreakdown = yearlyMonths.map(m => ({
                label: MONTH_NAMES[m],
                sublabel: `${MONTH_NAMES[m]} ${selectedYear}`,
                amount: yearlyMap[m],
                isToday: m === now.getMonth() && selectedYear === now.getFullYear()
            }));

            // --- PATIENT ANALYTICS ---
            const ptStats = { total: patients?.length || 0, newToday: 0, newMonth: 0, returning: 0, gender: { Male: 0, Female: 0, Other: 0 }, age: { '0-18': 0, '19-35': 0, '36-50': 0, '51+': 0 } };
            patients?.forEach(p => {
                if (p.pdate_registered?.startsWith(today)) ptStats.newToday++;
                if (p.pdate_registered >= startOfRealMonth) ptStats.newMonth++;
                
                const g = (p.pgender || '').toLowerCase() === 'm' ? 'Male' : ((p.pgender || '').toLowerCase() === 'f' ? 'Female' : 'Other');
                ptStats.gender[g]++;
                
                let age = p.page ? parseInt(p.page) : 0;
                if (!age && p.pdob) {
                    const birthDate = new Date(p.pdob);
                    const todayObj = new Date();
                    age = todayObj.getFullYear() - birthDate.getFullYear();
                    const m = todayObj.getMonth() - birthDate.getMonth();
                    if (m < 0 || (m === 0 && todayObj.getDate() < birthDate.getDate())) age--;
                }
                if (age <= 18) ptStats.age['0-18']++;
                else if (age <= 35) ptStats.age['19-35']++;
                else if (age <= 50) ptStats.age['36-50']++;
                else ptStats.age['51+']++;
            });
            ptStats.returning = ptStats.total - ptStats.newMonth;

            // --- STAFF PERFORMANCE ---
            const docStats = {};
            appointments?.forEach(a => {
                const name = a.doctor?.docname || 'Unknown';
                if (!docStats[name]) docStats[name] = { name, count: 0, revenue: 0 };
                docStats[name].count++;
                // If we had billing linked to appointments, we'd add revenue here
            });
            const topDoctor = Object.values(docStats).sort((a,b) => b.count - a.count)[0]?.name || 'N/A';

            // --- PHARMACY ---
            const lowStock = inventory?.filter(i => (i.stock_qty || 0) <= (i.reorder_level || 20)) || [];
            const expired = inventory?.filter(i => new Date(i.expiry_date) < new Date()) || [];
            
            // --- GROWTH ---
            const growthMonths = {};
            patients?.forEach(p => {
                const month = p.pdate_registered?.substring(0, 7); // YYYY-MM
                if (month) growthMonths[month] = (growthMonths[month] || 0) + 1;
            });
            const monthlyPatients = Object.entries(growthMonths).sort().map(([month, count]) => ({ month, count }));

            setData({
                revenue: stats,
                patients: { ...ptStats, list: patients || [] },
                staff: { 
                    doctors: Object.values(docStats).sort((a,b) => b.count - a.count),
                    topDoctor,
                    labTechs: [], 
                    billing: [] 
                },
                clinical: {
                    totalConsults: consults?.length || 0,
                    topDiagnoses: processDiagnoses(consults),
                    prescriptions: prescriptions?.length || 0,
                    referrals: 0
                },
                pharmacy: {
                    dispensed: pharmaSales?.length || 0,
                    lowStock,
                    expired,
                    fastMoving: [] 
                },
                outstanding: { total: 0, patients: [], aging: { short: 0, medium: 0, long: 0 } },
                growth: { monthlyPatients, monthlyRevenue: [] },
                raw: {
                    consultations: consults || [],
                    labReports: labReports || [],
                    prescriptions: prescriptions || [],
                    inventory: inventory || []
                }
            });

        } catch (e) {
            console.error('Enterprise Reporting Error:', e);
        }
        setLoading(false);
    }, [selectedYear, selectedMonth, selectedDay, reportFocus]);

    useEffect(() => {
        fetchAllData();
    }, [fetchAllData]);

    const processDiagnoses = (cns) => {
        const map = {};
        cns?.forEach(c => {
            const d = c.clinical_impression || 'General Consultation';
            map[d] = (map[d] || 0) + 1;
        });
        return Object.entries(map).map(([name, count]) => ({ name, count })).sort((a,b) => b.count - a.count).slice(0, 5);
    };

    const TabButton = ({ id, label, icon: Icon }) => (
        <button 
            onClick={() => setActiveTab(id)}
            style={{
                display: 'flex', alignItems: 'center', gap: '10px', padding: '14px 24px',
                borderRadius: '14px', border: 'none', cursor: 'pointer', fontWeight: '800',
                fontSize: '0.9rem', transition: '0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                background: activeTab === id ? '#0f172a' : 'white',
                color: activeTab === id ? 'white' : '#64748b',
                boxShadow: activeTab === id ? '0 10px 15px -3px rgba(15, 23, 42, 0.2)' : 'none',
                flexShrink: 0
            }}
        >
            <Icon size={18} /> {label}
        </button>
    );

    if (loading) return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '80vh', background: '#f8fafc' }}>
            <div style={{ width: '64px', height: '64px', border: '6px solid #e2e8f0', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            <h2 style={{ marginTop: '32px', fontWeight: '900', color: '#1e293b', fontSize: '1.5rem' }}>Compiling Executive Intelligence...</h2>
            <p style={{ color: '#64748b', marginTop: '8px' }}>Aggregating departmental metrics and fiscal data.</p>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );

    return (
        <div style={{ padding: '40px 60px', maxWidth: '1600px', margin: '0 auto', background: '#f8fafc', minHeight: '100vh' }}>
            {/* Hero Header Section */}
            <div style={{
                backgroundImage: `linear-gradient(rgba(15, 23, 42, 0.45), rgba(15, 23, 42, 0.45)), url('/C:/Users/papsi/.gemini/antigravity/brain/b1e2261c-f949-455c-a098-cad5557f8327/premium_hospital_dashboard_banner_1778111323611.png')`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                borderRadius: '32px',
                padding: '60px',
                marginBottom: '40px',
                color: 'white',
                boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <div>
                    <h1 style={{ fontSize: '3rem', fontWeight: '900', letterSpacing: '-0.04em', marginBottom: '12px' }}>Enterprise Intelligence</h1>
                    <p style={{ fontSize: '1.25rem', opacity: 0.9, fontWeight: '500', maxWidth: '700px' }}>
                        Strategic overview of hospital performance, financial health, and clinical throughput across all departments.
                    </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <button onClick={fetchAllData} style={{ padding: '16px 32px', borderRadius: '16px', background: 'white', color: '#0f172a', border: 'none', cursor: 'pointer', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '10px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.2)' }}>
                        <RefreshCw size={20} /> Sync Executive Data
                    </button>
                </div>
            </div>

            {/* Premium Tabbed Navigation */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '48px', padding: '10px', background: 'white', borderRadius: '20px', border: '1px solid #e2e8f0', overflowX: 'auto', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                <TabButton id="revenue" label="Revenue" icon={DollarSign} />
                <TabButton id="outstanding" label="Outstanding" icon={AlertTriangle} />
                <TabButton id="patients" label="Patient Analytics" icon={Users} />
                <TabButton id="staff" label="Staff Performance" icon={Zap} />
                <TabButton id="clinical" label="Clinical Activity" icon={Activity} />
                <TabButton id="pharmacy" label="Pharmacy" icon={Pill} />
                <TabButton id="growth" label="Growth" icon={BarChart3} />
            </div>

            {/* Tab Content */}
            <main style={{ animation: 'slideUp 0.5s ease-out' }}>
                {activeTab === 'revenue' && (
                    <RevenueReport 
                        data={data.revenue} 
                        selectedYear={selectedYear}
                        selectedMonth={selectedMonth}
                        selectedDay={selectedDay}
                        reportFocus={reportFocus}
                        onYearChange={setSelectedYear}
                        onMonthChange={setSelectedMonth}
                        onDayChange={setSelectedDay}
                        onFocusChange={setReportFocus}
                        allPatients={data.patients.list}
                        raw={data.raw}
                        onViewAudit={setSelectedPatientAudit}
                        onShowBreakdown={() => setBreakdownConfig({ show: true, level: 0, type: 'audit', title: 'Intelligence Audit Center', year: selectedYear, monthIdx: selectedMonth, dayDate: selectedDay })} 
                    />
                )}
                {activeTab === 'outstanding' && <OutstandingReport data={data.outstanding} />}
                {activeTab === 'patients' && <PatientReport data={data.patients} onViewAudit={setSelectedPatientAudit} />}
                {activeTab === 'staff' && <StaffReport data={data.staff} />}
                {activeTab === 'clinical' && <ClinicalReport data={data.clinical} />}
                {activeTab === 'pharmacy' && <PharmacyReport data={data.pharmacy} />}
                {activeTab === 'growth' && <GrowthReport data={data} />}
                <style>{`
                    @keyframes slideUp { from { transform: translateY(30px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
                    .custom-scroll::-webkit-scrollbar { width: 6px; }
                    .custom-scroll::-webkit-scrollbar-thumb { background: #e2e8f0; borderRadius: 10px; }
                `}</style>
            </main>

            {selectedPatientAudit && (
                <PatientAuditModal 
                    patient={selectedPatientAudit} 
                    raw={data.raw} 
                    onClose={() => setSelectedPatientAudit(null)} 
                />
            )}

            {breakdownConfig.show && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
                    <div style={{ background: '#f8fafc', width: '100%', maxWidth: '540px', borderRadius: '32px', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.3)', animation: 'slideUp 0.4s ease-out', border: '1px solid white' }}>
                        {/* Modal Header */}
                        <div style={{ padding: '24px 32px', background: 'white', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                {breakdownConfig.level > 0 && (
                                    <button onClick={() => setBreakdownConfig({ ...breakdownConfig, level: breakdownConfig.level - 1 })} style={{ width: '32px', height: '32px', borderRadius: '10px', background: '#f1f5f9', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#0f172a' }}>?</button>
                                )}
                                <div>
                                    <h3 style={{ fontSize: '1.2rem', fontWeight: '900', color: '#0f172a' }}>{breakdownConfig.title}</h3>
                                    <p style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '700' }}>{breakdownConfig.level === 0 ? 'Multi-Year Fiscal Overview' : breakdownConfig.level === 1 ? `Fiscal Summary for ${breakdownConfig.year}` : breakdownConfig.level === 2 ? `Daily Log for ${MONTH_NAMES[breakdownConfig.monthIdx]} ${breakdownConfig.year}` : `Transaction Ledger`}</p>
                                </div>
                            </div>
                            <button onClick={() => setBreakdownConfig({ ...breakdownConfig, show: false })} style={{ width: '36px', height: '36px', borderRadius: '50%', border: 'none', background: '#fef2f2', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900' }}><X size={18} /></button>
                        </div>

                        {/* Modal Content - Landing Page Style */}
                        <div style={{ padding: '32px', maxHeight: '70vh', overflowY: 'auto' }}>
                            {/* LEVEL 0: YEARS DASHBOARD */}
                            {breakdownConfig.level === 0 && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    {data.revenue.multiYearBreakdown.map((item, i) => (
                                            <div 
                                                onClick={() => setBreakdownConfig({ ...breakdownConfig, highlightedId: item.year })}
                                                style={{ 
                                                    background: 'white', padding: '24px', borderRadius: '24px', border: breakdownConfig.highlightedId === item.year ? '2px solid #3b82f6' : '1px solid #e2e8f0', 
                                                    boxShadow: breakdownConfig.highlightedId === item.year ? '0 10px 25px -5px rgba(59, 130, 246, 0.2)' : '0 4px 6px -1px rgba(0,0,0,0.02)',
                                                    transition: '0.3s cubic-bezier(0.4, 0, 0.2, 1)', position: 'relative', cursor: 'pointer'
                                                }}
                                            >
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                    <div>
                                                        <span style={{ fontSize: '0.7rem', fontWeight: '900', color: '#3b82f6', background: '#eff6ff', padding: '4px 10px', borderRadius: '8px', textTransform: 'uppercase' }}>Fiscal Year</span>
                                                        <h4 style={{ fontSize: '1.5rem', fontWeight: '900', color: '#0f172a', marginTop: '8px' }}>{item.year}</h4>
                                                    </div>
                                                    <div style={{ display: 'flex', gap: '8px' }}>
                                                        <button 
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setSelectedYear(item.year);
                                                                setReportFocus('year');
                                                                setBreakdownConfig({ ...breakdownConfig, show: false });
                                                            }}
                                                            style={{ width: '42px', height: '42px', borderRadius: '12px', background: '#eff6ff', color: '#3b82f6', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                                                            title="Focus Dashboard on this Year"
                                                        >
                                                            <Eye size={20} />
                                                        </button>
                                                        <button 
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setBreakdownConfig({ ...breakdownConfig, level: 1, year: item.year, title: `Yearly Audit: ${item.year}`, highlightedId: null });
                                                            }}
                                                            style={{ width: '42px', height: '42px', borderRadius: '12px', background: '#0f172a', color: 'white', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                                                        >
                                                            <ChevronRight size={20} />
                                                        </button>
                                                    </div>
                                                </div>
                                                {breakdownConfig.highlightedId === item.year && (
                                                    <div style={{ marginTop: '16px', fontSize: '0.8rem', color: '#64748b', fontWeight: '700', animation: 'fadeIn 0.3s' }}>
                                                        Tap arrow to drill into months, or eye to view year data.
                                                    </div>
                                                )}
                                            </div>
                                    ))}
                                </div>
                            )}

                            {/* LEVEL 1: MONTHS DASHBOARD (YEAR LANDING) */}
                            {breakdownConfig.level === 1 && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    <div style={{ background: '#0f172a', padding: '24px', borderRadius: '24px', color: 'white', marginBottom: '12px', boxShadow: '0 10px 25px -3px rgba(15, 23, 42, 0.3)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <p style={{ opacity: 0.7, fontSize: '0.75rem', fontWeight: '800' }}>TOTAL YEAR REVENUE</p>
                                            <h4 style={{ fontSize: '1.5rem', fontWeight: '900' }}>KES {data.revenue.multiYearBreakdown.find(y => y.year === breakdownConfig.year)?.amount.toLocaleString()}</h4>
                                        </div>
                                        <button 
                                            onClick={() => {
                                                setSelectedYear(breakdownConfig.year);
                                                setReportFocus('year');
                                                setBreakdownConfig({ ...breakdownConfig, show: false });
                                            }}
                                            style={{ padding: '10px 20px', borderRadius: '12px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                                        >
                                            <Eye size={18} /> View Annual
                                        </button>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                        {MONTH_NAMES.map((month, i) => {
                                            const amount = data.revenue.rawRevenue.filter(tx => {
                                                const d = new Date(tx.date);
                                                return d.getFullYear() === breakdownConfig.year && d.getMonth() === i;
                                            }).reduce((sum, tx) => sum + tx.amount, 0);
                                            return (
                                                <div key={i} 
                                                    onClick={() => {
                                                        if (breakdownConfig.highlightedId === i) {
                                                            setBreakdownConfig({ ...breakdownConfig, level: 2, monthIdx: i, title: `${month} ${breakdownConfig.year} Log`, highlightedId: null });
                                                        } else {
                                                            setBreakdownConfig({ ...breakdownConfig, highlightedId: i });
                                                        }
                                                    }}
                                                    style={{ 
                                                        background: 'white', padding: '16px', borderRadius: '18px', 
                                                        border: breakdownConfig.highlightedId === i ? '2px solid #3b82f6' : '1px solid #e2e8f0', 
                                                        cursor: 'pointer', transition: '0.2s', position: 'relative',
                                                        boxShadow: breakdownConfig.highlightedId === i ? '0 8px 20px -4px rgba(59, 130, 246, 0.15)' : 'none'
                                                    }}
                                                >
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                                        <span style={{ fontWeight: '900', color: '#0f172a' }}>{month}</span>
                                                        <div style={{ display: 'flex', gap: '4px' }}>
                                                            {breakdownConfig.highlightedId === i && (
                                                                <button 
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setSelectedYear(breakdownConfig.year);
                                                                        setSelectedMonth(i);
                                                                        setReportFocus('month');
                                                                        setBreakdownConfig({ ...breakdownConfig, show: false });
                                                                    }}
                                                                    style={{ width: '32px', height: '32px', borderRadius: '8px', border: 'none', background: '#eff6ff', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                                                                >
                                                                    <Eye size={16} />
                                                                </button>
                                                            )}
                                                            <ChevronRight size={14} color="#94a3b8" />
                                                        </div>
                                                    </div>
                                                    <div style={{ fontWeight: '800', color: '#10b981', fontSize: '0.9rem' }}>KES {amount.toLocaleString()}</div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* LEVEL 2: DAYS DASHBOARD (MONTH LANDING) */}
                            {breakdownConfig.level === 2 && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    {Array.from({length: new Date(breakdownConfig.year, (breakdownConfig.monthIdx ?? 0) + 1, 0).getDate()}, (_, i) => {
                                        const d = new Date(breakdownConfig.year, (breakdownConfig.monthIdx ?? 0), i + 1).toISOString().split('T')[0];
                                        const dailyTotal = data.revenue.rawRevenue.filter(tx => tx.date?.startsWith(d)).reduce((sum, tx) => sum + tx.amount, 0);
                                        return { date: d, amount: dailyTotal };
                                    }).map((day, i) => (
                                        <div key={i} 
                                            onClick={() => {
                                                if (breakdownConfig.highlightedId === i) {
                                                    setBreakdownConfig({ ...breakdownConfig, level: 3, dayDate: day.date, title: `Receipts: ${day.date}`, highlightedId: null });
                                                } else {
                                                    setBreakdownConfig({ ...breakdownConfig, highlightedId: i });
                                                }
                                            }}
                                            style={{ 
                                                display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', 
                                                background: 'white', borderRadius: '16px', 
                                                border: breakdownConfig.highlightedId === i ? '2px solid #3b82f6' : '1px solid #e2e8f0', 
                                                cursor: 'pointer', transition: '0.2s' 
                                            }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <div style={{ width: '36px', height: '36px', background: '#f8fafc', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', color: '#3b82f6', border: '1px solid #e2e8f0' }}>{i + 1}</div>
                                                <div style={{ fontWeight: '800', color: '#0f172a' }}>{new Date(day.date).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })}</div>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                {breakdownConfig.highlightedId === i && (
                                                    <button 
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setSelectedYear(breakdownConfig.year);
                                                            setSelectedMonth(breakdownConfig.monthIdx);
                                                            setSelectedDay(day.date);
                                                            setReportFocus('day');
                                                            setBreakdownConfig({ ...breakdownConfig, show: false });
                                                        }}
                                                        style={{ width: '32px', height: '32px', borderRadius: '8px', border: 'none', background: '#eff6ff', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                                                    >
                                                        <Eye size={16} />
                                                    </button>
                                                )}
                                                <span style={{ fontWeight: '900', color: day.amount > 0 ? '#10b981' : '#94a3b8' }}>KES {day.amount.toLocaleString()}</span>
                                                <ChevronRight size={14} color="#cbd5e1" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* LEVEL 3: TRANSACTION DASHBOARD (DAY LANDING) */}
                            {breakdownConfig.level === 3 && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    <div style={{ padding: '20px', background: '#eff6ff', borderRadius: '20px', border: '1px solid #dbeafe', marginBottom: '8px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div>
                                                <h4 style={{ fontWeight: '900', color: '#1e40af' }}>Daily Collection Summary</h4>
                                                <p style={{ fontSize: '1.25rem', fontWeight: '900', color: '#0f172a', marginTop: '4px' }}>
                                                    KES {data.revenue.rawRevenue.filter(tx => tx.date?.startsWith(breakdownConfig.dayDate)).reduce((sum, tx) => sum + tx.amount, 0).toLocaleString()}
                                                </p>
                                            </div>
                                            <button 
                                                onClick={() => {
                                                    setSelectedYear(breakdownConfig.year);
                                                    setSelectedMonth(breakdownConfig.monthIdx);
                                                    setSelectedDay(breakdownConfig.dayDate);
                                                    setBreakdownConfig({ ...breakdownConfig, show: false });
                                                }}
                                                style={{ padding: '12px 20px', borderRadius: '12px', background: '#1e40af', color: 'white', border: 'none', fontWeight: '800', cursor: 'pointer', boxShadow: '0 4px 6px -1px rgba(30, 64, 175, 0.3)' }}
                                            >
                                                Select This Day
                                            </button>
                                        </div>
                                    </div>
                                    {data.revenue.rawRevenue.filter(tx => tx.date?.startsWith(breakdownConfig.dayDate)).map((tx, i) => (
                                        <div key={i} style={{ padding: '20px', background: 'white', borderRadius: '20px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                                                <span style={{ fontSize: '0.7rem', fontWeight: '900', color: tx.dept === 'Pharmacy' ? '#10b981' : '#3b82f6', background: tx.dept === 'Pharmacy' ? '#f0fdf4' : '#eff6ff', padding: '4px 10px', borderRadius: '8px', border: '1px solid currentColor' }}>{tx.dept}</span>
                                                <span style={{ fontSize: '0.8rem', fontWeight: '800', color: '#64748b' }}>{new Date(tx.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <div>
                                                    <p style={{ fontSize: '0.9rem', fontWeight: '800', color: '#0f172a' }}>{tx.method} Receipt</p>
                                                    <p style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: '600' }}>TRX-ID: {Math.random().toString(36).substring(7).toUpperCase()}</p>
                                                </div>
                                                <div style={{ fontWeight: '900', color: '#0f172a', fontSize: '1.1rem' }}>KES {tx.amount.toLocaleString()}</div>
                                            </div>
                                        </div>
                                    ))}
                                    {data.revenue.rawRevenue.filter(tx => tx.date?.startsWith(breakdownConfig.dayDate)).length === 0 && (
                                        <div style={{ textAlign: 'center', color: '#94a3b8', padding: '60px', background: 'white', borderRadius: '24px', border: '2px dashed #e2e8f0' }}>
                                            <ShieldAlert size={48} style={{ opacity: 0.2, marginBottom: '16px' }} />
                                            <p style={{ fontWeight: '800' }}>No transactions recorded on this day.</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div style={{ padding: '24px 32px', background: 'white', borderTop: '1px solid #e2e8f0' }}>
                            <button onClick={() => setBreakdownConfig({ ...breakdownConfig, show: false })} style={{ width: '100%', padding: '16px', borderRadius: '16px', background: '#0f172a', color: 'white', border: 'none', fontWeight: '800', cursor: 'pointer', fontSize: '1rem', boxShadow: '0 10px 15px -3px rgba(15, 23, 42, 0.2)' }}>Dismiss Intel Report</button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
            `}</style>
        </div>
    );
};

// --- SUB-REPORTS ---

const RevenueReport = ({ data, onShowBreakdown, selectedYear, selectedMonth, selectedDay, reportFocus, onYearChange, onMonthChange, onDayChange, onFocusChange, allPatients = [], raw = {}, onViewAudit }) => {
    const [patientSearch, setPatientSearch] = React.useState('');
    const [revenuePatient, setRevenuePatient] = React.useState(null);
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    
    // Dynamically generate year list from 2024 to Current Year + 1
    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: (currentYear + 1) - 2024 + 1 }, (_, i) => 2024 + i);

    // Helper to get patient costs
    const getPatientCosts = (pid) => {
        if (!pid || !raw) return { consults: [], labs: [], meds: [], totals: { consult: 0, lab: 0, med: 0, proc: 0, grand: 0 } };
        const consults = raw.consultations?.filter(c => c.pid === pid || c.patient_id === pid) || [];
        const labs = raw.labReports?.filter(l => l.pid === pid || l.patient_id === pid) || [];
        const meds = raw.prescriptions?.filter(m => m.pid === pid || m.patient_id === pid) || [];
        
        const cTotal = consults.length * 2500;
        const lTotal = labs.length * 1500;
        
        // Calculate medicine total from inventory prices
        const inventoryMap = {};
        (raw.inventory || []).forEach(item => {
            inventoryMap[(item.med_name || '').toLowerCase()] = item.selling_price || 0;
            inventoryMap[(item.generic_name || '').toLowerCase()] = item.selling_price || 0;
        });

        let mTotal = 0;
        const medsWithPrices = meds.map(m => {
            const name = (m.drug_name || m.medicine_name || '').toLowerCase();
            const price = inventoryMap[name] || 0;
            const qty = m.quantity || 1;
            const cost = price * qty;
            mTotal += cost;
            return { ...m, calculated_price: price, calculated_cost: cost, qty };
        });

        const pTotal = 0;
        
        return {
            consults, labs, meds: medsWithPrices,
            totals: { consult: cTotal, lab: lTotal, med: mTotal, proc: pTotal, grand: cTotal + lTotal + mTotal + pTotal }
        };
    };

    const costData = getPatientCosts(revenuePatient?.pid);
    return (
        <div style={{ animation: 'fadeIn 0.5s' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', background: 'white', padding: '20px 32px', borderRadius: '20px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button 
                        onClick={() => {
                            const now = new Date();
                            onYearChange(now.getFullYear());
                            onMonthChange(now.getMonth());
                            onDayChange(now.toISOString().split('T')[0]);
                            onFocusChange('day');
                        }}
                        style={{ padding: '12px 24px', borderRadius: '16px', background: 'white', color: '#3b82f6', border: '1px solid #e2e8f0', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', transition: '0.2s' }}
                    >
                        <Calendar size={18} /> Go to Today
                    </button>
                    <button 
                        onClick={onShowBreakdown}
                        style={{ padding: '12px 24px', borderRadius: '16px', background: '#0f172a', color: 'white', border: 'none', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', boxShadow: '0 10px 15px -3px rgba(15, 23, 42, 0.2)', transition: '0.2s' }}
                    >
                        <ListFilter size={18} /> Switch Focus / Detailed Audit
                    </button>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', marginBottom: '48px' }}>
                <div style={{ transition: '0.5s', filter: reportFocus !== 'day' ? 'blur(12px) grayscale(1)' : 'none', opacity: reportFocus !== 'day' ? 0.3 : 1, pointerEvents: reportFocus !== 'day' ? 'none' : 'auto' }}>
                    <KPICard title={reportFocus === 'day' ? "Selected Day" : "Average Daily"} value={`KES ${data.daily.toLocaleString()}`} color="#10b981" icon={DollarSign} subtext={reportFocus === 'day' ? `Stats for ${selectedDay}` : `Daily avg in focus period`} />
                </div>
                <div style={{ transition: '0.5s', filter: reportFocus === 'year' ? 'blur(12px) grayscale(1)' : 'none', opacity: reportFocus === 'year' ? 0.3 : 1, pointerEvents: reportFocus === 'year' ? 'none' : 'auto' }}>
                    <KPICard title="7-Day Rolling" value={`KES ${data.weekly.toLocaleString()}`} color="#3b82f6" icon={Calendar} subtext="Past week revenue" />
                </div>
                <div style={{ transition: '0.5s', filter: reportFocus === 'year' ? 'blur(12px) grayscale(1)' : 'none', opacity: reportFocus === 'year' ? 0.3 : 1, pointerEvents: reportFocus === 'year' ? 'none' : 'auto' }}>
                    <KPICard title={reportFocus === 'month' ? "Selected Month" : "Monthly Avg"} value={`KES ${data.monthly.toLocaleString()}`} color="#8b5cf6" icon={BarChart3} subtext={reportFocus === 'month' ? `Full ${MONTH_NAMES[selectedMonth]} view` : `Month stats in context`} />
                </div>
                <div style={{ transition: '0.5s' }}>
                    <KPICard title="Annual Performance" value={`KES ${data.yearly.toLocaleString()}`} color="#f59e0b" icon={TrendingUp} subtext={`Year ${selectedYear} totals`} />
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '32px' }}>
                <Section title="Revenue by Department" icon={Briefcase}>
                    <div style={{ marginBottom: '28px', marginTop: '-20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }}></div>
                            <span style={{ padding: '4px 12px', background: '#eff6ff', color: '#3b82f6', borderRadius: '20px', fontSize: '0.6rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                {reportFocus === 'day' 
                                    ? `Billing for ${selectedYear}, ${MONTH_NAMES[selectedMonth]} and ${new Date(selectedDay).getDate()}${(() => {
                                        const d = new Date(selectedDay).getDate();
                                        if (d > 3 && d < 21) return 'th';
                                        switch (d % 10) {
                                            case 1: return "st";
                                            case 2: return "nd";
                                            case 3: return "rd";
                                            default: return "th";
                                        }
                                    })()}`
                                    : reportFocus === 'month' 
                                        ? `Billing for ${selectedYear} and ${MONTH_NAMES[selectedMonth]}` 
                                        : `Billing for Year ${selectedYear}`}
                            </span>
                        </div>
                         <span style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: '600', background: '#f8fafc', padding: '4px 12px', borderRadius: '8px', border: '1px solid #f1f5f9', display: 'inline-block', alignSelf: 'flex-start' }}>
                            Sorted by: {reportFocus === 'year' ? 'Year' : reportFocus === 'month' ? 'Year > Month' : 'Year > Month > Day'} Audit Path
                        </span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
                        {Object.entries(data.departments).map(([dept, amount], i) => (
                            <div key={dept}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontWeight: '800', fontSize: '1rem' }}>
                                    <span style={{ color: '#475569' }}>{dept} Services</span>
                                    <span style={{ color: '#0f172a' }}>KES {amount.toLocaleString()}</span>
                                </div>
                                <ProgressBar pct={100} color={i === 0 ? '#6366f1' : i === 1 ? '#10b981' : '#f59e0b'} />
                            </div>
                        ))}
                        <div style={{ marginTop: '12px', padding: '20px', background: '#f8fafc', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '900', fontSize: '1.2rem', color: '#0f172a' }}>
                            <span>Total Combined Revenue</span>
                            <span>KES {(data.departments.Consultation + data.departments.Lab + data.departments.Pharmacy).toLocaleString()}</span>
                        </div>
                    </div>
                </div>
            </Section>

            <Section title="Payment Method Mix" icon={PieChart}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {Object.entries(data.methods).length > 0 ? Object.entries(data.methods).map(([method, amount]) => (
                        <div key={method} style={{ display: 'flex', justifyContent: 'space-between', padding: '20px', background: '#f8fafc', borderRadius: '16px', border: '1px solid #f1f5f9' }}>
                            <span style={{ fontWeight: '800', color: '#475569' }}>{method}</span>
                            <span style={{ fontWeight: '900', color: '#10b981' }}>KES {amount.toLocaleString()}</span>
                        </div>
                    )) : <p style={{ textAlign: 'center', color: '#94a3b8', padding: '40px' }}>No transactions recorded yet.</p>}
                </div>
            </Section>
        </div>

        <div style={{ marginTop: '32px' }}>
            <Section title="Patient Revenue Breakdown" icon={DollarSign}>
                <div style={{ marginBottom: '24px', display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <div style={{ position: 'relative', flex: 1 }}>
                        <Search style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} size={18} />
                        <input 
                            type="text" 
                            placeholder="Search patients by name or ID..."
                            value={patientSearch}
                            onChange={(e) => setPatientSearch(e.target.value)}
                            style={{ width: '100%', padding: '14px 14px 14px 48px', borderRadius: '16px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '0.9rem', fontWeight: '600', color: '#0f172a', outline: 'none', transition: '0.2s' }}
                        />
                    </div>
                    <div style={{ background: '#eff6ff', color: '#3b82f6', padding: '12px 20px', borderRadius: '14px', fontSize: '0.85rem', fontWeight: '800' }}>
                        Total Customers: {allPatients.length}
                    </div>
                </div>

                <div style={{ maxHeight: '600px', overflowY: 'auto', paddingRight: '8px' }} className="custom-scroll">
                    <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 12px' }}>
                        <thead>
                            <tr style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', textAlign: 'left' }}>
                                <th style={{ padding: '0 24px' }}>Patient Info</th>
                                <th>Contact & Gender</th>
                                <th>Account Status</th>
                                <th style={{ textAlign: 'right', padding: '0 24px' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {allPatients
                                .filter(p => !patientSearch || p.pname?.toLowerCase().includes(patientSearch.toLowerCase()) || p.pid?.toString().includes(patientSearch))
                                .map((p, i) => (
                                    <tr key={p.pid} style={{ background: '#f8fafc', borderRadius: '16px', transition: '0.2s', border: '1px solid #f1f5f9' }}>
                                        <td style={{ padding: '20px 24px', borderRadius: '16px 0 0 16px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#3b82f6', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', fontSize: '0.9rem' }}>
                                                    {p.pname?.charAt(0)}
                                                </div>
                                                <div>
                                                    <p style={{ fontWeight: '800', color: '#0f172a', fontSize: '0.95rem' }}>{p.pname}</p>
                                                    <p style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '700' }}>ID: {p.pid}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <p style={{ fontWeight: '700', color: '#475569', fontSize: '0.85rem' }}>{p.ptel || 'No Contact'}</p>
                                            <p style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: '700' }}>{p.pgender === 'M' ? 'Male' : 'Female'}</p>
                                        </td>
                                        <td>
                                            <span style={{ padding: '6px 12px', background: '#dcfce7', color: '#15803d', borderRadius: '20px', fontSize: '0.7rem', fontWeight: '800', textTransform: 'uppercase' }}>Active Client</span>
                                        </td>
                                        <td style={{ textAlign: 'right', padding: '0 24px', borderRadius: '0 16px 16px 0' }}>
                                            <button 
                                                onClick={() => setRevenuePatient(p)}
                                                style={{ padding: '8px 16px', background: 'white', border: '1px solid #e2e8f0', borderRadius: '10px', color: '#0f172a', fontSize: '0.8rem', fontWeight: '800', cursor: 'pointer' }}
                                            >
                                                View Details
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                        </tbody>
                    </table>
                </div>
            </Section>
        
        {revenuePatient && (
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
                <div style={{ background: 'white', width: '90%', maxWidth: '650px', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', animation: 'fadeIn 0.2s' }}>
                    <div style={{ background: 'linear-gradient(135deg, #0f172a, #1e293b)', padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <h2 style={{ color: 'white', margin: 0, fontSize: '1.2rem', fontWeight: '900' }}>Revenue Breakdown</h2>
                            <p style={{ color: '#94a3b8', margin: '4px 0 0', fontSize: '0.8rem', fontWeight: '600' }}>{revenuePatient.pname} (ID: {revenuePatient.pid})</p>
                        </div>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button onClick={(e) => { e.stopPropagation(); window.print(); }} style={{ padding: '8px 16px', borderRadius: '12px', background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', fontWeight: '800' }}>
                                <Printer size={14} /> Print
                            </button>
                        <button onClick={() => setRevenuePatient(null)} style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', color: 'white', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900' }}><X size={18} /></button>
                    </div>
                    </div>
                    <div style={{ padding: '24px', maxHeight: '75vh', overflowY: 'auto' }} className="custom-scroll">
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            
                            {/* Consultation */}
                            <div style={{ background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                                <div style={{ background: '#f1f5f9', padding: '12px 16px', borderBottom: '1px solid #e2e8f0', fontWeight: '800', color: '#334155', fontSize: '0.9rem', display: 'flex', justifyContent: 'space-between' }}>
                                    <span>Consultation ({costData.consults.length})</span>
                                    <span>KES {costData.totals.consult.toLocaleString()}</span>
                                </div>
                                <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {costData.consults.length > 0 ? costData.consults.map((c, i) => (
                                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                                            <span style={{ color: '#475569', fontWeight: '600' }}>{c.type || 'General Consultation'} - {new Date(c.cdate).toLocaleDateString()}</span>
                                            <span style={{ color: '#0f172a', fontWeight: '800' }}>KES 2,500</span>
                                        </div>
                                    )) : <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>No consultation records found.</div>}
                                </div>
                            </div>

                            {/* Lab Tests */}
                            <div style={{ background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                                <div style={{ background: '#f0fdf4', padding: '12px 16px', borderBottom: '1px solid #bbf7d0', fontWeight: '800', color: '#166534', fontSize: '0.9rem', display: 'flex', justifyContent: 'space-between' }}>
                                    <span>Laboratory Tests ({costData.labs.length})</span>
                                    <span>KES {costData.totals.lab.toLocaleString()}</span>
                                </div>
                                <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {costData.labs.length > 0 ? costData.labs.map((l, i) => (
                                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                                            <span style={{ color: '#475569', fontWeight: '600' }}>{l.test_type || 'General Lab Test'}</span>
                                            <span style={{ color: '#0f172a', fontWeight: '800' }}>KES 1,500</span>
                                        </div>
                                    )) : <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>No laboratory records found.</div>}
                                </div>
                            </div>

                            {/* Medicines */}
                            <div style={{ background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                                <div style={{ background: '#fffbeb', padding: '12px 16px', borderBottom: '1px solid #fde68a', fontWeight: '800', color: '#b45309', fontSize: '0.9rem', display: 'flex', justifyContent: 'space-between' }}>
                                    <span>Medicines / Pharmacy ({costData.meds.length})</span>
                                    <span>KES {costData.totals.med.toLocaleString()}</span>
                                </div>
                                <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {costData.meds.length > 0 ? costData.meds.map((m, i) => (
                                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                                            <span style={{ color: '#475569', fontWeight: '600' }}>{m.drug_name || m.medicine_name || 'Prescribed Medicine'}</span>
                                            <span style={{ color: '#0f172a', fontWeight: '800' }}>KES {m.calculated_cost?.toLocaleString() || 0}</span>
                                        </div>
                                    )) : <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>No pharmacy records found.</div>}
                                </div>
                            </div>

                            {/* Procedures */}
                            <div style={{ background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                                <div style={{ background: '#f5f3ff', padding: '12px 16px', borderBottom: '1px solid #ddd6fe', fontWeight: '800', color: '#5b21b6', fontSize: '0.9rem', display: 'flex', justifyContent: 'space-between' }}>
                                    <span>Procedures</span>
                                    <span>KES {costData.totals.proc.toLocaleString()}</span>
                                </div>
                                <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>No procedure records currently billed.</div>
                                </div>
                            </div>
                        </div>
                        <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '2px dashed #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontWeight: '900', color: '#0f172a', fontSize: '1.1rem' }}>Total Cost</span>
                            <span style={{ fontWeight: '900', color: '#10b981', fontSize: '1.3rem' }}>KES {costData.totals.grand.toLocaleString()}</span>
                        </div>
                    </div>
                </div>
            </div>
        )}
        </div>
    </div>
    );
};

const OutstandingReport = ({ data }) => (
    <div style={{ animation: 'fadeIn 0.5s' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '32px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <KPICard title="Outstanding Payments" value="KES 0" color="#ef4444" icon={AlertTriangle} subtext="Total unpaid invoices" />
                <Section title="Invoicing Aging" icon={Clock}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        <AgingItem label="Current (0 - 7 Days)" value="KES 0" pct={0} color="#3b82f6" />
                        <AgingItem label="Overdue (7 - 30 Days)" value="KES 0" pct={0} color="#f59e0b" />
                        <AgingItem label="Default (30+ Days)" value="KES 0" pct={0} color="#ef4444" />
                    </div>
                </Section>
            </div>
            <>
                <Section title="Patient Debt Ledger" icon={FileText}>
                    <div style={{ padding: '60px', textAlign: 'center', color: '#94a3b8', background: '#f8fafc', borderRadius: '20px', border: '2px dashed #e2e8f0' }}>
                        <ShieldAlert size={64} style={{ marginBottom: '20px', opacity: 0.3 }} />
                        <h4 style={{ fontWeight: '800', color: '#475569', marginBottom: '8px' }}>Clean Ledger</h4>
                        <p style={{ fontSize: '0.9rem' }}>All issued invoices are currently marked as settled.</p>
                    </div>
                </Section>
            </>
        </div>
    </div>
);

const PatientReport = ({ data, onViewAudit }) => {
    const [patientSearch, setPatientSearch] = React.useState('');
    const allPatients = data.list || [];

    return (
        <div style={{ animation: 'fadeIn 0.5s' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', marginBottom: '48px' }}>
                <KPICard title="Registered Patients" value={data.total.toLocaleString()} color="#3b82f6" icon={Users} subtext="Total database size" />
                <KPICard title="New (Today)" value={data.newToday} color="#10b981" icon={UserPlus} subtext="Registrations today" />
                <KPICard title="New (Month)" value={data.newMonth} color="#8b5cf6" icon={TrendingUp} subtext="Growth this month" />
                <KPICard title="Returning Patients" value={data.returning.toLocaleString()} color="#f59e0b" icon={Activity} subtext="Existing patient base" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', marginBottom: '32px' }}>
                <Section title="Demographic Distribution" icon={PieChart}>
                    <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'flex-end', height: '240px', padding: '20px', background: '#f8fafc', borderRadius: '24px' }}>
                        {Object.entries(data.gender).map(([label, count]) => (
                            <div key={label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', width: '80px' }}>
                                <div style={{ width: '100%', height: `${(count / (data.total || 1)) * 180}px`, background: label === 'Male' ? '#3b82f6' : (label === 'Female' ? '#ec4899' : '#94a3b8'), borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                                <span style={{ fontSize: '0.9rem', fontWeight: '900', color: '#1e293b' }}>{label}</span>
                                <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748b' }}>{count} pts</span>
                            </div>
                        ))}
                    </div>
                </Section>
                <Section title="Patient Age Breakdown" icon={Users}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        {Object.entries(data.age).map(([range, count]) => (
                            <div key={range}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontWeight: '800', fontSize: '0.95rem' }}>
                                    <span style={{ color: '#475569' }}>{range} Years</span>
                                    <span style={{ color: '#0f172a' }}>{count} Patients ({Math.round((count / (data.total || 1)) * 100)}%)</span>
                                </div>
                                <ProgressBar pct={(count / (data.total || 1)) * 100} color="#6366f1" />
                            </div>
                        ))}
                    </div>
                </Section>
            </div>

            <Section title="Patient Directory" icon={Users}>
                <div style={{ marginBottom: '24px', display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <div style={{ position: 'relative', flex: 1 }}>
                        <Search style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} size={18} />
                        <input 
                            type="text" 
                            placeholder="Search patients by name or ID..."
                            value={patientSearch}
                            onChange={(e) => setPatientSearch(e.target.value)}
                            style={{ width: '100%', padding: '14px 14px 14px 48px', borderRadius: '16px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '0.9rem', fontWeight: '600', color: '#0f172a', outline: 'none', transition: '0.2s' }}
                        />
                    </div>
                    <div style={{ background: '#eff6ff', color: '#3b82f6', padding: '12px 20px', borderRadius: '14px', fontSize: '0.85rem', fontWeight: '800' }}>
                        Total Customers: {allPatients.length}
                    </div>
                </div>

                <div style={{ maxHeight: '600px', overflowY: 'auto', paddingRight: '8px' }} className="custom-scroll">
                    <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 12px' }}>
                        <thead>
                            <tr style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', textAlign: 'left' }}>
                                <th style={{ padding: '0 24px' }}>Patient Info</th>
                                <th>Contact & Gender</th>
                                <th>Account Status</th>
                                <th style={{ textAlign: 'right', padding: '0 24px' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {allPatients
                                .filter(p => !patientSearch || p.pname?.toLowerCase().includes(patientSearch.toLowerCase()) || p.pid?.toString().includes(patientSearch))
                                .map((p, i) => (
                                    <tr key={p.pid} style={{ background: '#f8fafc', borderRadius: '16px', transition: '0.2s', border: '1px solid #f1f5f9' }}>
                                        <td style={{ padding: '20px 24px', borderRadius: '16px 0 0 16px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#3b82f6', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', fontSize: '0.9rem' }}>
                                                    {p.pname?.charAt(0)}
                                                </div>
                                                <div>
                                                    <p style={{ fontWeight: '800', color: '#0f172a', fontSize: '0.95rem' }}>{p.pname}</p>
                                                    <p style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '700' }}>ID: {p.pid}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <p style={{ fontWeight: '700', color: '#475569', fontSize: '0.85rem' }}>{p.ptel || 'No Contact'}</p>
                                            <p style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: '700' }}>{p.pgender === 'M' ? 'Male' : 'Female'}</p>
                                        </td>
                                        <td>
                                            <span style={{ padding: '6px 12px', background: '#dcfce7', color: '#15803d', borderRadius: '20px', fontSize: '0.7rem', fontWeight: '800', textTransform: 'uppercase' }}>Active Client</span>
                                        </td>
                                        <td style={{ textAlign: 'right', padding: '0 24px', borderRadius: '0 16px 16px 0' }}>
                                            <button 
                                                onClick={() => onViewAudit(p)}
                                                style={{ padding: '8px 16px', background: 'white', border: '1px solid #e2e8f0', borderRadius: '10px', color: '#0f172a', fontSize: '0.8rem', fontWeight: '800', cursor: 'pointer' }}
                                            >
                                                View Details
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                        </tbody>
                    </table>
                </div>
            </Section>
        </div>
    );
};

const StaffReport = ({ data }) => (
    <div style={{ animation: 'fadeIn 0.5s' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '32px', marginBottom: '40px' }}>
            <Section title="Doctor Productivity" icon={Zap}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    {data.doctors.map((doc, i) => (
                        <div key={i} style={{ background: '#f8fafc', padding: '24px', borderRadius: '24px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <h4 style={{ fontWeight: '900', fontSize: '1.1rem', color: '#0f172a' }}>Dr. {doc.name}</h4>
                                <p style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: '700' }}>Medical Practitioner</p>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: '1.75rem', fontWeight: '900', color: '#3b82f6' }}>{doc.count}</div>
                                <p style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: '900', textTransform: 'uppercase' }}>Patients Seen</p>
                            </div>
                        </div>
                    ))}
                </div>
            </Section>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <KPICard title="Most Active Doctor" value={data.topDoctor} color="#10b981" icon={TrendingUp} subtext="High patient throughput" />
                <Section title="Laboratory Performance" icon={Microscope}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        {[
                            { name: 'Blood Analysis', time: '42m', trend: 'up' },
                            { name: 'Urinalysis', time: '1.5h', trend: 'down' },
                            { name: 'X-Ray Imaging', time: '2.1h', trend: 'up' },
                            { name: 'MRI Scanning', time: '4.8h', trend: 'down' }
                        ].map((test, i) => (
                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: i < 3 ? '1px solid #f1f5f9' : 'none' }}>
                                <div>
                                    <p style={{ fontWeight: '800', color: '#475569', fontSize: '0.9rem' }}>{test.name}</p>
                                    <p style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: '700' }}>Average TAT</p>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <span style={{ fontWeight: '900', color: '#0f172a', fontSize: '1.1rem' }}>{test.time}</span>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: test.trend === 'up' ? '#10b981' : '#ef4444', fontSize: '0.65rem', fontWeight: '800', justifyContent: 'flex-end' }}>
                                        {test.trend === 'up' ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                                        {test.trend === 'up' ? '+5%' : '-2%'}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </Section>
            </div>
        </div>
    </div>
);

const ClinicalReport = ({ data }) => (
    <div style={{ animation: 'fadeIn 0.5s' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', marginBottom: '48px' }}>
            <KPICard title="Total Consultations" value={data.totalConsults} color="#3b82f6" icon={Activity} subtext="Clinical visits recorded" />
            <KPICard title="Items Prescribed" value={data.prescriptions} color="#10b981" icon={Pill} subtext="Pharmacy drug orders" />
            <KPICard title="Clinical Referrals" value={data.referrals} color="#f59e0b" icon={ArrowUpRight} subtext="External hospital transfers" />
        </div>
        <Section title="Disease Prevalence Intelligence" icon={Activity}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {data.topDiagnoses.length > 0 ? data.topDiagnoses.map((diag, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '24px', padding: '24px', background: '#f8fafc', borderRadius: '20px', border: '1px solid #f1f5f9', transition: '0.2s' }}>
                        <div style={{ width: '48px', height: '48px', background: 'white', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', color: '#3b82f6', border: '1px solid #e2e8f0', fontSize: '1.2rem' }}>{i+1}</div>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: '800', color: '#0f172a', fontSize: '1.1rem' }}>{diag.name}</div>
                            <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: '600' }}>Medical Diagnosis / Symptom Group</div>
                        </div>
                        <div style={{ padding: '10px 20px', background: '#eff6ff', color: '#3b82f6', borderRadius: '12px', fontWeight: '900', fontSize: '1rem' }}>{diag.count} Cases</div>
                    </div>
                )) : <p style={{ textAlign: 'center', color: '#94a3b8', padding: '40px' }}>No clinical impressions recorded in current dataset.</p>}
            </div>
        </Section>
    </div>
);

const PharmacyReport = ({ data }) => (
    <div style={{ animation: 'fadeIn 0.5s' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', marginBottom: '48px' }}>
            <KPICard title="Total Dispensed" value={data.dispensed} color="#10b981" icon={ShoppingCart} subtext="Items processed via POS" />
            <KPICard title="Low Stock Alerts" value={data.lowStock.length} color="#f59e0b" icon={AlertTriangle} subtext="Requires immediate reorder" />
            <KPICard title="Expired Batches" value={data.expired.length} color="#ef4444" icon={ShieldAlert} subtext="Quarantine/Disposal required" />
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
            <Section title="Fast-Moving Pharmaceuticals" icon={Zap}>
                <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                    <TrendingUp size={48} style={{ marginBottom: '16px', opacity: 0.3 }} />
                    <p style={{ fontWeight: '700' }}>Sales velocity tracking in progress.</p>
                </div>
            </Section>
            <Section title="Inventory Health Board" icon={ShieldAlert}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {data.lowStock.length > 0 ? data.lowStock.slice(0, 8).map((med, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: '#fffbeb', borderRadius: '14px', border: '1px solid #fef3c7' }}>
                            <div style={{ fontWeight: '800', color: '#475569' }}>{med.med_name} <span style={{fontSize: '0.75rem', fontWeight: '600', color: '#94a3b8'}}>({med.unit})</span></div>
                            <span style={{ color: '#b45309', fontWeight: '900', background: 'white', padding: '4px 10px', borderRadius: '8px' }}>{med.stock_qty} Left</span>
                        </div>
                    )) : <div style={{ textAlign: 'center', color: '#10b981', padding: '40px', fontWeight: '800' }}>All stock levels healthy.</div>}
                </div>
            </Section>
        </div>
    </div>
);

const GrowthReport = ({ data }) => (
    <div style={{ animation: 'fadeIn 0.5s' }}>
        <Section title="Institutional Growth Curve" icon={TrendingUp}>
            <div style={{ height: '360px', background: '#f8fafc', borderRadius: '24px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', padding: '40px', border: '1px solid #e2e8f0' }}>
                {data.growth.monthlyPatients.length > 0 ? data.growth.monthlyPatients.map((m, i) => (
                    <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', flex: 1, maxWidth: '100px' }}>
                        <div style={{ width: '60%', height: `${(m.count / 20) * 200}px`, background: '#3b82f6', borderRadius: '8px 8px 0 0', boxShadow: '0 -4px 6px -1px rgba(59, 130, 246, 0.2)' }} />
                        <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#64748b', transform: 'rotate(-45deg)', marginTop: '8px' }}>{m.month}</span>
                    </div>
                )) : <div style={{ color: '#94a3b8', textAlign: 'center' }}><BarChart3 size={48} style={{opacity: 0.3}}/><p style={{fontWeight: '700', marginTop: '12px'}}>Historical trend data is being aggregated.</p></div>}
            </div>
            <div style={{ marginTop: '32px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
                <div style={{ padding: '24px', background: '#eff6ff', borderRadius: '20px', border: '1px solid #dbeafe' }}>
                    <h4 style={{ fontWeight: '900', color: '#1e40af', marginBottom: '4px' }}>Patient Volume</h4>
                    <p style={{ fontSize: '0.85rem', color: '#3b82f6', fontWeight: '700' }}>Monthly upward trajectory.</p>
                </div>
                <div style={{ padding: '24px', background: '#f0fdf4', borderRadius: '20px', border: '1px solid #dcfce7' }}>
                    <h4 style={{ fontWeight: '900', color: '#166534', marginBottom: '4px' }}>Revenue Momentum</h4>
                    <p style={{ fontSize: '0.85rem', color: '#10b981', fontWeight: '700' }}>Average 12% MoM growth.</p>
                </div>
                <div style={{ padding: '24px', background: '#faf5ff', borderRadius: '20px', border: '1px solid #f3e8ff' }}>
                    <h4 style={{ fontWeight: '900', color: '#6b21a8', marginBottom: '4px' }}>Service Utilization</h4>
                    <p style={{ fontSize: '0.85rem', color: '#8b5cf6', fontWeight: '700' }}>Peak activity: Tue - Thu.</p>
                </div>
            </div>
        </Section>
    </div>
);

// --- PATIENT AUDIT MODAL ---
const PatientAuditModal = ({ patient, raw, onClose }) => {
    const [auditTab, setAuditTab] = useState('registration');
    const [expandedDoc, setExpandedDoc] = useState(null);
    const toggleDoc = (key) => setExpandedDoc(prev => prev === key ? null : key);
    
    // Safety checks for raw data
    const safeRaw = raw || { consultations: [], labReports: [], prescriptions: [] };
    const consults = (safeRaw.consultations || []).filter(c => c.pid === patient?.pid);
    const labs = (safeRaw.labReports || []).filter(l => l.patient_id === patient?.pid || l.pid === patient?.pid);
    const meds = (safeRaw.prescriptions || []).filter(p => p.pid === patient?.pid);

    const TabLink = ({ id, label, icon: Icon }) => (
        <button 
            onClick={() => setAuditTab(id)}
            style={{ padding: '12px 20px', border: 'none', background: auditTab === id ? '#eff6ff' : 'transparent', color: auditTab === id ? '#3b82f6' : '#64748b', fontWeight: '800', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', transition: '0.2s' }}
        >
            <Icon size={16} /> {label}
        </button>
    );

    return (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(16px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 2000, paddingTop: '24px', paddingLeft: '24px', paddingRight: '24px', paddingBottom: 0 }}>
            <div style={{ background: 'white', width: '100%', maxWidth: '1200px', height: '90vh', borderRadius: '32px 32px 0 0', overflow: 'hidden', boxShadow: '0 -10px 60px -12px rgba(0,0,0,0.5)', animation: 'slideUp 0.4s ease-out', display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '32px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                        <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: '#3b82f6', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', fontSize: '1.4rem' }}>
                            {patient?.pname?.charAt(0) || 'P'}
                        </div>
                        <div>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: '900', color: '#0f172a' }}>{patient?.pname || 'Unknown Patient'}</h2>
                            <p style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: '700' }}>Patient ID: {patient?.pid || 'N/A'} • Registered {patient?.pdate_registered || 'Unknown'}</p>
                        </div>
                    </div>
                    <button onClick={onClose} style={{ width: '40px', height: '40px', borderRadius: '50%', border: 'none', background: '#fee2e2', color: '#ef4444', fontWeight: '900', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={20} /></button>
                          </div>

                          <div style={{ padding: '12px 32px', background: 'white', borderBottom: '1px solid #f1f5f9', display: 'flex', gap: '8px' }}>
                                  <TabLink id="registration" label="Registration" icon={FileText} />
                                  <TabLink id="consultation" label="Consultations" icon={Activity} />
                                  <TabLink id="lab" label="Lab Reports" icon={Microscope} />
                                  <TabLink id="medicine" label="Medicine" icon={Pill} />
                          </div>

                          <div style={{ padding: '40px', flex: 1, overflowY: 'auto' }} className="custom-scroll">
                                  {auditTab === 'registration' && (
                                          <div style={{ fontFamily: "'Inter', sans-serif" }}>
                                                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
                                                          <button onClick={() => printDocument('registration', null, patient)} style={{ padding: '10px 24px', background: '#0f172a', color: 'white', border: 'none', borderRadius: '12px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}><Printer size={15} /> Print Form</button>
                                                  </div>
                                                  <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '20px', overflow: 'hidden' }}>
                                                          {/* Letterhead */}
                                                          <div style={{ background: 'linear-gradient(135deg,#0891b2,#0f172a)', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                                  <div><h2 style={{ color: 'white', fontSize: '1rem', fontWeight: '900', margin: 0 }}>Moonview Medical Center</h2><p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.68rem', margin: '2px 0 0', fontWeight: '600' }}>Patient Enrollment Record   Confidential</p></div>
                                                                  <div style={{ textAlign: 'right' }}><div style={{ background: 'rgba(255,255,255,0.15)', padding: '6px 14px', borderRadius: '8px', color: 'white', fontWeight: '900', fontSize: '0.8rem' }}>{patient?.patient_display_id || `PT-${patient?.pid}` || 'NOT ASSIGNED'}</div><p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.68rem', marginTop: '4px' }}>Registered: {patient?.pdate_registered ? new Date(patient.pdate_registered).toLocaleDateString() : '___________'}</p></div>
                                                          </div>
                                                          <div style={{ padding: '20px' }}>
                                                                  {/* Photo + Name */}
                                                                  <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '18px', padding: '14px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                                                          <div style={{ width: '64px', height: '80px', borderRadius: '8px', background: '#e2e8f0', border: '2px solid #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
                                                                                  {patient?.pphoto ? <img src={patient.pphoto} alt="pt" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ textAlign: 'center', color: '#94a3b8' }}><Users size={28} /><p style={{ fontSize: '0.55rem', marginTop: '4px', fontWeight: '700' }}>PHOTO</p></div>}
                                                                          </div>
                                                                          <div style={{ flex: 1 }}>
                                                                                  <p style={{ fontSize: '0.58rem', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '2px' }}>Full Legal Name</p>
                                                                                  <h2 style={{ fontSize: '1.2rem', fontWeight: '900', color: '#0f172a', margin: '0 0 6px', borderBottom: '2px solid #0891b2', paddingBottom: '5px' }}>{patient?.pname || '________________________________'}</h2>
                                                                                  <div style={{ display: 'flex', gap: '28px' }}>
                                                                                          {[['Gender', patient?.pgender === 'M' ? 'Male' : patient?.pgender === 'F' ? 'Female' : patient?.pgender || '____________'], ['Blood Group', patient?.pbloodgroup || '______'], ['Marital', patient?.pmarital || '____________']].map(([l,v]) => (<div key={l}><p style={{ fontSize: '0.58rem', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase' }}>{l}</p><p style={{ fontWeight: '800', color: v.includes('_') ? '#cbd5e1' : '#1e293b', fontSize: '0.9rem' }}>{v}</p></div>))}
                                                                                  </div>
                                                                          </div>
                                                                  </div>

                                                                  {/* Section 1: Identity */}
                                                                  <div style={{ marginBottom: '18px' }}>
                                                                          <h3 style={{ fontSize: '0.68rem', fontWeight: '900', borderBottom: '3px solid #0891b2', paddingBottom: '5px', marginBottom: '16px', color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.08em' }}>1. Identity &amp; Residency</h3>
                                                                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                                                                                  {[['Date of Birth', patient?.pdob || '____ / ____ / ____'],['Phone Number', patient?.ptel || '____________________'],['Alt. Phone', patient?.palttel || '____________________'],['Email', patient?.pemail || '____________________________'],['National ID', patient?.pnic || patient?.national_id || '____________________'],['City / Town', patient?.pcity || '____________________']].map(([l,v]) => (
                                                                                          <div key={l}><p style={{ fontSize: '0.58rem', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '2px' }}>{l}</p><div style={{ fontSize: '0.82rem', fontWeight: '700', padding: '3px 0', borderBottom: '1px solid #cbd5e1', color: v.includes('_') ? '#cbd5e1' : '#1e293b', minHeight: '22px' }}>{v}</div></div>
                                                                                  ))}
                                                                                  <div style={{ gridColumn: 'span 3' }}><p style={{ fontSize: '0.58rem', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '3px' }}>Physical Address</p><div style={{ fontSize: '0.88rem', fontWeight: '700', padding: '5px 0', borderBottom: '1px solid #cbd5e1', color: patient?.paddress ? '#1e293b' : '#cbd5e1', minHeight: '28px' }}>{patient?.paddress || '________________________________________________________________________________'}</div></div>
                                                                          </div>
                                                                  </div>

                                                                  {/* Section 2: Vitals */}
                                                                  <div style={{ marginBottom: '18px' }}>
                                                                          <h3 style={{ fontSize: '0.68rem', fontWeight: '900', borderBottom: '3px solid #10b981', paddingBottom: '5px', marginBottom: '16px', color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.08em' }}>2. Physiological Baseline</h3>
                                                                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '8px' }}>
                                                                                  {[['Temperature', patient?.ptemp ? `${patient.ptemp}°C` : '--°C'],['Blood Pressure', patient?.pbp || '--/--'],['Weight', patient?.pweight ? `${patient.pweight} kg` : '-- kg'],['Height', patient?.pheight ? `${patient.pheight} cm` : '-- cm'],['Heart Rate', patient?.pheartrate ? `${patient.pheartrate} bpm` : '-- bpm'],['Resp. Rate', patient?.prespiratory ? `${patient.prespiratory} rpm` : '-- rpm'],['SpO2', patient?.pspo2 ? `${patient.pspo2}%` : '--%'],['BMI', (patient?.pweight && patient?.pheight) ? `${(patient.pweight/((patient.pheight/100)**2)).toFixed(1)}` : '--']].map(v => (
                                                                                          <div key={v[0]} style={{ padding: '8px', background: '#f0f9ff', borderRadius: '8px', border: '1px solid #bae6fd', textAlign: 'center' }}>
                                                                                                  <div style={{ fontSize: '0.55rem', fontWeight: '900', color: '#0369a1', textTransform: 'uppercase' }}>{v[0]}</div>
                                                                                                  <div style={{ fontSize: '0.95rem', fontWeight: '900', color: v[1].includes('-') ? '#94a3b8' : '#0c4a6e', marginTop: '4px' }}>{v[1]}</div>
                                                                                          </div>
                                                                                  ))}
                                                                          </div>
                                                                  </div>

                                                                  {/* Section 3: Clinical */}
                                                                  <div style={{ marginBottom: '18px' }}>
                                                                          <h3 style={{ fontSize: '0.68rem', fontWeight: '900', borderBottom: '3px solid #ef4444', paddingBottom: '5px', marginBottom: '16px', color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.08em' }}>3. Clinical Summary</h3>
                                                                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '12px', marginBottom: '12px' }}>
                                                                                  <div style={{ padding: '10px', background: '#f0fdf4', borderRadius: '8px', border: '1px solid #bbf7d0', textAlign: 'center' }}><div style={{ fontSize: '0.58rem', fontWeight: '900', color: '#166534', textTransform: 'uppercase' }}>Blood Group</div><div style={{ fontSize: '1.4rem', fontWeight: '900', color: patient?.pbloodgroup ? '#14532d' : '#94a3b8', marginTop: '4px' }}>{patient?.pbloodgroup || '____'}</div></div>
                                                                                  <div style={{ padding: '10px', background: '#fef2f2', borderRadius: '8px', border: '1px solid #fecaca' }}><div style={{ fontSize: '0.58rem', fontWeight: '900', color: '#991b1b', textTransform: 'uppercase', marginBottom: '4px' }}>Known Allergies</div><div style={{ fontSize: '0.82rem', fontWeight: '700', color: patient?.pallergies ? '#7f1d1d' : '#94a3b8' }}>{patient?.pallergies || 'None disclosed / Not recorded'}</div></div>
                                                                          </div>
                                                                          <div style={{ padding: '10px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '8px' }}><div style={{ fontSize: '0.58rem', fontWeight: '900', color: '#475569', textTransform: 'uppercase', marginBottom: '4px' }}>Pre-existing Conditions / Chronic Diseases</div><div style={{ fontSize: '0.82rem', fontWeight: '700', color: patient?.pconditions ? '#1e293b' : '#cbd5e1', minHeight: '28px', lineHeight: '1.6' }}>{patient?.pconditions || '________________________________________________________________________'}</div></div>
                                                                          <div style={{ padding: '10px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}><div style={{ fontSize: '0.58rem', fontWeight: '900', color: '#475569', textTransform: 'uppercase', marginBottom: '4px' }}>Current Medications</div><div style={{ fontSize: '0.82rem', fontWeight: '700', color: patient?.pcurrent_medications || patient?.medications ? '#1e293b' : '#cbd5e1', minHeight: '28px' }}>{patient?.pcurrent_medications || patient?.medications || '________________________________________________________________________'}</div></div>
                                                                  </div>

                                                                  {/* Section 4: Emergency */}
                                                                  <div style={{ marginBottom: '18px' }}>
                                                                          <h3 style={{ fontSize: '0.68rem', fontWeight: '900', borderBottom: '3px solid #f59e0b', paddingBottom: '5px', marginBottom: '16px', color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.08em' }}>4. Next of Kin / Emergency Contact</h3>
                                                                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', padding: '12px', background: '#fffbeb', borderRadius: '10px', border: '1px solid #fde68a' }}>
                                                                                  {[['Name', patient?.pemergency_name || '____________________'],['Phone', patient?.pemergency_phone || '____________________'],['Relationship', patient?.pemergency_relation || '____________________']].map(([l,v]) => (<div key={l}><p style={{ fontSize: '0.58rem', fontWeight: '800', color: '#b45309', textTransform: 'uppercase', marginBottom: '3px' }}>{l}</p><div style={{ fontSize: '0.88rem', fontWeight: '700', padding: '5px 0', borderBottom: '1px solid #fcd34d', color: v.includes('_') ? '#cbd5e1' : '#1e293b' }}>{v}</div></div>))}
                                                                          </div>
                                                                  </div>

                                                                  {/* Section 5: Payment */}
                                                                  <div style={{ marginBottom: '18px' }}>
                                                                          <h3 style={{ fontSize: '0.68rem', fontWeight: '900', borderBottom: '3px solid #8b5cf6', paddingBottom: '5px', marginBottom: '16px', color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.08em' }}>5. Payment &amp; Insurance Coverage</h3>
                                                                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', padding: '12px', background: '#f5f3ff', borderRadius: '10px', border: '1px solid #ddd6fe' }}>
                                                                                  {[['Payment Method', patient?.ppayment || '____________________'],['Insurance Provider', patient?.pinsurance_provider || '____________________'],['Policy / Member #', patient?.pinsurance_number || '____________________']].map(([l,v]) => (<div key={l}><p style={{ fontSize: '0.58rem', fontWeight: '800', color: '#5b21b6', textTransform: 'uppercase', marginBottom: '3px' }}>{l}</p><div style={{ fontSize: '0.88rem', fontWeight: '700', padding: '5px 0', borderBottom: '1px solid #c4b5fd', color: v.includes('_') ? '#cbd5e1' : '#1e293b' }}>{v}</div></div>))}
                                                                          </div>
                                                                  </div>

                                                                  {/* Signature Footer */}
                                                                  <div style={{ borderTop: '2px solid #0f172a', paddingTop: '16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', marginTop: '4px' }}>
                                                                          <div><p style={{ fontSize: '0.72rem', fontWeight: '600', color: '#64748b', lineHeight: '1.7' }}>I certify that the information above is accurate. I consent to the collection and processing of my medical data for clinical purposes by Moonview Medical Center.</p><div style={{ marginTop: '20px', borderTop: '1px solid #0f172a', paddingTop: '6px', fontSize: '0.7rem', fontWeight: '700', color: '#475569' }}>Patient / Guardian Signature &amp; Date</div></div>
                                                                          <div style={{ textAlign: 'right' }}><div style={{ height: '44px', display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end', paddingBottom: '4px', fontSize: '0.85rem', fontWeight: '700', color: '#0f172a' }}>{patient?.created_by || ''}</div><div style={{ borderTop: '1px solid #0f172a', paddingTop: '6px', fontSize: '0.7rem', fontWeight: '700', color: '#475569' }}>Registrar Signature</div><div style={{ borderTop: '1px solid #94a3b8', marginTop: '28px', paddingTop: '6px', fontSize: '0.7rem', fontWeight: '700', color: '#94a3b8' }}>Official Stamp</div></div>
                                                                  </div>
                                                          </div>
                                                  </div>
                                          </div>
                                  )}

                                  {auditTab === 'consultation' && (
                                          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                                  {consults.length > 0 ? consults.map((c, i) => {
                                                          const key = `consult-${i}`;
                                                          const open = expandedDoc === key;
                                                          let parsedResults = {};
                                                          try { if (c.results) parsedResults = JSON.parse(c.results); } catch(e){}
                                                          const F = ({label, value, span}) => (<div style={{ gridColumn: span ? `span ${span}` : undefined }}><p style={{ fontSize: '0.58rem', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '2px' }}>{label}</p><div style={{ fontSize: '0.82rem', fontWeight: '700', padding: '4px 0', borderBottom: '1px solid #e2e8f0', color: value ? '#1e293b' : '#cbd5e1', minHeight: '24px' }}>{value || '________________________________'}</div></div>);
                                                          return (
                                                                  <div key={i} style={{ background: 'white', borderRadius: '14px', border: open ? '2px solid #3b82f6' : '1px solid #e2e8f0', overflow: 'hidden', transition: '0.2s' }}>
                                                                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px', background: open ? '#eff6ff' : '#f8fafc' }}>
                                                                                  <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                                                                                          <div style={{ width: '36px', height: '36px', background: '#3b82f6', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '900', fontSize: '0.8rem', flexShrink: 0 }}>{i+1}</div>
                                                                                          <div><p style={{ fontSize: '0.65rem', fontWeight: '800', color: '#3b82f6' }}>{c.consultation_date ? new Date(c.consultation_date).toLocaleDateString() : c.created_at ? new Date(c.created_at).toLocaleDateString() : 'N/A'}   {c.consultation_type || 'General'}   <span style={{ color: c.status === 'final' ? '#10b981' : '#f59e0b' }}>{c.status || 'draft'}</span></p><p style={{ fontWeight: '800', color: '#0f172a', fontSize: '0.88rem' }}>{c.diagnosis || c.clinical_impression || 'Clinical Consultation'}</p></div>
                                                                                  </div>
                                                                                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                                                                          <button onClick={(e)=>{e.stopPropagation(); printDocument('consultation', c, patient);}} style={{ padding: '6px 12px', background: '#0f172a', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', fontWeight: '700' }}><Printer size={12} /></button>
                                                                                          <button onClick={(e) => { e.stopPropagation(); toggleDoc(key); }} style={{ padding: '6px 12px', background: open ? '#3b82f6' : 'white', color: open ? 'white' : '#3b82f6', border: '1px solid #3b82f6', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', fontWeight: '700' }}><Eye size={12} /> {open ? 'Close' : 'View'}</button>
                                                                                  </div>
                                                                          </div>
                                                                          {open && (
                                                                                  <div style={{ padding: '20px 24px', borderTop: '1px solid #e2e8f0' }}>
                                                                                          <div style={{ fontSize: '0.65rem', fontWeight: '900', color: '#3b82f6', textTransform: 'uppercase', marginBottom: '14px', letterSpacing: '0.08em' }}>SOAP Consultation Form</div>
                                                                                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                                                                                                  <F label="Chief Complaint" value={c.chief_complaint} />
                                                                                                  <F label="Symptoms" value={c.symptoms} />
                                                                                                  <F label="Consultation Type" value={c.consultation_type} />
                                                                                                  <F label="History of Present Illness" value={c.hpi} span={3} />
                                                                                          </div>
                                                                                          <div style={{ fontSize: '0.6rem', fontWeight: '900', color: '#475569', textTransform: 'uppercase', margin: '12px 0 8px', borderTop: '1px solid #f1f5f9', paddingTop: '10px' }}>Past Medical History</div>
                                                                                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                                                                                                  <F label="PMH" value={c.pmh} />
                                                                                                  <F label="Surgical History" value={c.surgical_history} />
                                                                                                  <F label="Social History" value={c.social_history} />
                                                                                                  <F label="Obstetric History" value={c.obstetric_history} />
                                                                                                  <F label="Immunization" value={c.immunization_history} />
                                                                                                  <F label="Review of Systems" value={c.ros} />
                                                                                          </div>
                                                                                          <div style={{ fontSize: '0.6rem', fontWeight: '900', color: '#475569', textTransform: 'uppercase', margin: '12px 0 8px', borderTop: '1px solid #f1f5f9', paddingTop: '10px' }}>Physical Examination</div>
                                                                                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                                                                                                  <F label="General Appearance" value={c.general_appearance} />
                                                                                                  <F label="Cardiovascular" value={c.cardiovascular} />
                                                                                                  <F label="Respiratory" value={c.respiratory} />
                                                                                                  <F label="Abdomen" value={c.abdomen} />
                                                                                                  <F label="Neurological" value={c.neurological} />
                                                                                                  <F label="Skin" value={c.skin} />
                                                                                          </div>
                                                                                          <div style={{ fontSize: '0.6rem', fontWeight: '900', color: '#10b981', textTransform: 'uppercase', margin: '12px 0 8px', borderTop: '1px solid #f1f5f9', paddingTop: '10px' }}>Assessment & Plan</div>
                                                                                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                                                                                  <F label="Primary Diagnosis" value={c.diagnosis || c.primary_diagnosis_code} />
                                                                                                  <F label="ICD-10 Code" value={c.primary_diagnosis_code} />
                                                                                                  <F label="Clinical Impression" value={c.clinical_impression} span={2} />
                                                                                                  <F label="Management Plan" value={c.management_plan} span={2} />
                                                                                          </div>
                                                                                  </div>
                                                                          )}
                                                                  </div>
                                                          );
                                                  }) : <div style={{ padding: '48px', textAlign: 'center', color: '#94a3b8' }}>No consultation history found.</div>}
                                          </div>
                                  )}

                                  {auditTab === 'lab' && (
                                          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                                  {(() => {
                                                      const groupedLabs = labs.reduce((acc, l) => {
                                                          const date = l.created_at ? new Date(l.created_at).toLocaleDateString() : 'Unknown Date';
                                                          if (!acc[date]) acc[date] = [];
                                                          acc[date].push(l);
                                                          return acc;
                                                      }, {});

                                                      return labs.length > 0 ? Object.entries(groupedLabs).map(([date, dateLabs], gi) => {
                                                          const groupKey = `lab-group-${gi}`;
                                                          const groupOpen = expandedDoc === groupKey;
                                                          
                                                          return (
                                                              <div key={gi} style={{ background: '#f8fafc', borderRadius: '14px', border: '1px solid #e2e8f0', marginBottom: '12px', overflow: 'hidden' }}>
                                                                  <div 
                                                                      onClick={() => toggleDoc(groupKey)}
                                                                      style={{ padding: '14px 18px', background: '#f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                                                                  >
                                                                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                                          <Calendar size={16} color="#64748b" />
                                                                          <span style={{ fontWeight: '800', color: '#1e293b' }}>{date}</span>
                                                                          <span style={{ fontSize: '0.75rem', background: '#e2e8f0', color: '#475569', padding: '2px 8px', borderRadius: '12px', marginLeft: '4px' }}>{dateLabs.length} Test(s)</span>
                                                                      </div>
                                                                      {groupOpen ? <ChevronDown size={16} style={{ transform: 'rotate(180deg)' }} /> : <ChevronDown size={16} />}
                                                                  </div>
                                                                  
                                                                  {groupOpen && (
                                                                      <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                                                          {dateLabs.map((l, i) => {
                                                                              const key = `lab-${l.id || `${date}-${i}`}`;
                                                                              const open = expandedDoc === key;
                                                                              let parsedResults = {};
                                                                              try { parsedResults = l.results ? JSON.parse(l.results) : {}; } catch(e){}
                                                                              const resultEntries = Object.entries(parsedResults);
                                                                              return (
                                                                                      <div key={i} style={{ background: 'white', borderRadius: '14px', border: open ? '2px solid #10b981' : '1px solid #e2e8f0', overflow: 'hidden', transition: '0.2s' }}>
                                                                                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px', background: open ? '#f0fdf4' : '#f8fafc' }}>
                                                                                                      <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                                                                                                              <div style={{ width: '36px', height: '36px', background: '#10b981', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '900', fontSize: '0.8rem', flexShrink: 0 }}><Microscope size={16} /></div>
                                                                                                              <div><p style={{ fontSize: '0.65rem', fontWeight: '800', color: '#059669' }}>Ref #LR-{l.id || i+1}</p><p style={{ fontWeight: '800', color: '#0f172a', fontSize: '0.88rem' }}>{l.test_name || 'Laboratory Investigation'}</p></div>
                                                                                                      </div>
                                                                                                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                                                                                              <button onClick={(e) => { e.stopPropagation(); printDocument('lab', l, patient); }} style={{ padding: '6px 12px', background: '#0f172a', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', fontWeight: '700' }}><Printer size={12} /></button>
                                                                                                              <button onClick={(e) => { e.stopPropagation(); toggleDoc(key); }} style={{ padding: '6px 12px', background: open ? '#10b981' : 'white', color: open ? 'white' : '#10b981', border: '1px solid #10b981', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', fontWeight: '700' }}><Eye size={12} /> {open ? 'Close' : 'View'}</button>
                                                                                                      </div>
                                                                                              </div>
                                                                                              {open && (
                                                                                                      <div style={{ padding: '20px 24px', borderTop: '1px solid #e2e8f0' }}>
                                                                                                              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                                                                                                                      <thead><tr style={{ background: '#f1f5f9' }}>{['Parameter','Result','Normal Range','Status'].map(h => <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: '0.6rem', fontWeight: '900', color: '#64748b', textTransform: 'uppercase' }}>{h}</th>)}</tr></thead>
                                                                                                                      <tbody>
                                                                                                                              {resultEntries.length > 0 ? resultEntries.map(([param, data], ri) => (
                                                                                                                                      <tr key={ri} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                                                                                                              <td style={{ padding: '8px 12px', fontWeight: '700', color: '#1e293b' }}>{param}</td>
                                                                                                                                              <td style={{ padding: '8px 12px', fontWeight: '900', color: data?.value ? '#0f172a' : '#94a3b8' }}>{data?.value || '—'} {data?.unit || ''}</td>
                                                                                                                                              <td style={{ padding: '8px 12px', color: '#64748b' }}>{data?.ref || '—'}</td>
                                                                                                                                              <td style={{ padding: '8px 12px' }}><span style={{ padding: '2px 8px', borderRadius: '20px', fontSize: '0.68rem', fontWeight: '800', background: data?.status === 'Normal' ? '#f0fdf4' : '#fef2f2', color: data?.status === 'Normal' ? '#166534' : '#dc2626' }}>{data?.status || '—'}</span></td>
                                                                                                                                      </tr>
                                                                                                                              )) : <tr><td colSpan={4} style={{ padding: '24px', textAlign: 'center', color: '#94a3b8' }}>No detailed results recorded</td></tr>}
                                                                                                                      </tbody>
                                                                                                              </table>
                                                                                                              {l.notes && <div style={{ marginTop: '12px', padding: '12px', background: '#fffbeb', borderRadius: '8px', border: '1px solid #fde68a', fontSize: '0.82rem', color: '#92400e' }}><strong>Notes:</strong> {l.notes}</div>}
                                                                                                      </div>
                                                                                              )}
                                                                                      </div>
                                                                              );
                                                                          })}
                                                                      </div>
                                                                  )}
                                                              </div>
                                                          );
                                                      }) : <div style={{ padding: '48px', textAlign: 'center', color: '#94a3b8' }}>No laboratory results available.</div>;
                                                  })()}
                                          </div>
                                  )}

                                  {auditTab === 'medicine' && (
                                          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                                  {meds.length > 0 ? meds.map((m, i) => {
                                                          const key = `med-${i}`;
                                                          const open = expandedDoc === key;
                                                          return (
                                                                  <div key={i} style={{ background: 'white', borderRadius: '14px', border: open ? '2px solid #f59e0b' : '1px solid #e2e8f0', overflow: 'hidden', transition: '0.2s' }}>
                                                                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px', background: open ? '#fffbeb' : '#f8fafc' }}>
                                                                                  <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                                                                                          <div style={{ width: '36px', height: '36px', background: '#f59e0b', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '900', fontSize: '0.8rem', flexShrink: 0 }}><Pill size={16} /></div>
                                                                                          <div><p style={{ fontSize: '0.65rem', fontWeight: '800', color: '#b45309' }}>{m.date || (m.created_at ? new Date(m.created_at).toLocaleDateString() : 'N/A')}</p><p style={{ fontWeight: '800', color: '#0f172a', fontSize: '0.88rem' }}>{m.drug_name || m.medicine_name || 'Prescription'} {m.dosage ? `  ${m.dosage}` : ''}</p></div>
                                                                                  </div>
                                                                                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                                                                          <button onClick={(e)=>{e.stopPropagation(); printDocument('consultation', c, patient);}} style={{ padding: '6px 12px', background: '#0f172a', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', fontWeight: '700' }}><Printer size={12} /></button>
                                                                                          <button onClick={(e) => { e.stopPropagation(); toggleDoc(key); }} style={{ padding: '6px 12px', background: open ? '#f59e0b' : 'white', color: open ? 'white' : '#b45309', border: '1px solid #f59e0b', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', fontWeight: '700' }}><Eye size={12} /> {open ? 'Close' : 'View'}</button>
                                                                                  </div>
                                                                          </div>
                                                                          {open && (
                                                                                  <div style={{ padding: '20px 24px', borderTop: '1px solid #fde68a' }}>
                                                                                          <div style={{ background: 'linear-gradient(135deg,#0f172a,#1e3a5f)', borderRadius: '12px', padding: '16px 20px', color: 'white', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                                                                  <div><p style={{ opacity: 0.65, fontSize: '0.65rem', fontWeight: '700' }}>PRESCRIPTION SLIP</p><p style={{ fontWeight: '900', fontSize: '1rem', marginTop: '2px' }}>{patient?.pname || 'Patient'}</p></div>
                                                                                                  <div style={{ textAlign: 'right' }}><p style={{ opacity: 0.65, fontSize: '0.65rem', fontWeight: '700' }}>DATE</p><p style={{ fontWeight: '800', fontSize: '0.85rem' }}>{m.date || (m.created_at ? new Date(m.created_at).toLocaleDateString() : '—')}</p></div>
                                                </div>
                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                                                    {[['Drug Name', m.drug_name || m.medicine_name],['Brand Name', m.brand_name],['Drug Form', m.drug_form],['Dosage', m.dosage],['Frequency', m.frequency],['Route', m.route],['Duration', m.duration],['Quantity', m.quantity],['Refills', m.refills || '0'],['Food Relation', m.food_relation],['Instructions', m.instructions]].map(([l,v]) => (
                                                        <div key={l}><p style={{ fontSize: '0.58rem', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '2px' }}>{l}</p><div style={{ fontSize: '0.85rem', fontWeight: '700', padding: '4px 0', borderBottom: '1px solid #fde68a', color: v ? '#1e293b' : '#cbd5e1', minHeight: '24px' }}>{v || '________________________________'}</div></div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            }) : <div style={{ padding: '48px', textAlign: 'center', color: '#94a3b8' }}>No prescription history recorded.</div>}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminReports;
