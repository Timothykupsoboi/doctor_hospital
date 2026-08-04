import React, { useState, useEffect, useCallback } from 'react';
import { 
    Pill, Package, TrendingUp, AlertTriangle, 
    ArrowUpRight, ArrowDownRight, RefreshCw, 
    ShoppingCart, Truck, Download, Calendar
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

const PharmaReports = () => {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState({
        dispensedToday: 0,
        totalSales: 0,
        inventoryValue: 0,
        expiringSoon: 0,
        fastMoving: [],
        slowMoving: [],
        categorySplit: []
    });

    const fetchPharmaData = useCallback(async () => {
        setLoading(true);
        try {
            const today = new Date().toISOString().split('T')[0];
            const nextMonth = new Date();
            nextMonth.setMonth(nextMonth.getMonth() + 3);
            const nextMonthStr = nextMonth.toISOString().split('T')[0];

            // 1. Inventory & Expiry
            const { data: inventory } = await supabase.from('medicine').select('*');
            const inventoryValue = inventory?.reduce((acc, m) => acc + (Number(m.buying_price || 0) * Number(m.stock_qty || 0)), 0) || 0;
            const expiringSoon = inventory?.filter(m => m.expiry_date && m.expiry_date <= nextMonthStr).length || 0;

            // 2. Sales & Movement
            const { data: sales } = await supabase.from('pharmacy_sale').select('total_amount, created_at');
            const { data: saleItems } = await supabase.from('pharmacy_sale_item').select('*, medicine:medicine_id(med_name, category)');
            
            const dispensedToday = saleItems?.filter(i => i.created_at?.startsWith(today)).reduce((acc, i) => acc + Number(i.quantity), 0) || 0;
            const totalSales = sales?.reduce((acc, s) => acc + Number(s.total_amount), 0) || 0;

            // Movement Analysis
            const movementMap = {};
            saleItems?.forEach(i => {
                const name = i.medicine?.med_name || 'Unknown';
                movementMap[name] = (movementMap[name] || 0) + Number(i.quantity);
            });
            const fastMoving = Object.entries(movementMap)
                .map(([name, qty]) => ({ name, qty }))
                .sort((a, b) => b.qty - a.qty)
                .slice(0, 5);

            const slowMoving = inventory
                ?.filter(m => !movementMap[m.med_name])
                .slice(0, 5)
                .map(m => ({ name: m.med_name, qty: 0 }));

            // Category Analysis
            const catMap = {};
            inventory?.forEach(m => {
                const c = m.category || 'General';
                catMap[c] = (catMap[c] || 0) + 1;
            });
            const categorySplit = Object.entries(catMap)
                .map(([name, count]) => ({ name, count }))
                .sort((a, b) => b.count - a.count);

            setData({
                dispensedToday,
                totalSales,
                inventoryValue,
                expiringSoon,
                fastMoving,
                slowMoving,
                categorySplit
            });

        } catch (e) {
            console.error('Pharma Reports Error:', e);
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchPharmaData();
    }, [fetchPharmaData]);

    if (loading) return <div style={{ padding: 80, textAlign: 'center', color: '#64748b' }}>Calculating pharmacy metrics...</div>;

    return (
        <div style={{ padding: '40px 56px', maxWidth: '1600px', margin: '0 auto', background: '#f8fafc', minHeight: '100vh' }}>
            <header style={{ marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                    <h1 style={{ fontSize: '2.25rem', fontWeight: '900', letterSpacing: '-0.02em', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <Pill size={40} color="#10b981" /> Pharmacy Intelligence
                    </h1>
                    <p style={{ color: '#64748b', fontSize: '1.1rem', marginTop: '4px' }}>Dispensing velocity, inventory value, and stock movement trends.</p>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button onClick={fetchPharmaData} style={{ padding: '12px 20px', borderRadius: '14px', border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', fontWeight: '700' }}>
                        <RefreshCw size={18} /> Sync
                    </button>
                </div>
            </header>

            {/* KPI Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', marginBottom: '40px' }}>
                <div style={{ background: 'white', padding: '28px', borderRadius: '24px', border: '1px solid #e2e8f0', boxShadow: 'var(--shadow-sm)' }}>
                    <p style={{ fontSize: '0.7rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', marginBottom: '12px' }}>Dispensed Today</p>
                    <h2 style={{ fontSize: '2rem', fontWeight: '900', color: '#0f172a' }}>{data.dispensedToday} <span style={{ fontSize: '0.9rem', color: '#94a3b8' }}>Units</span></h2>
                    <div style={{ marginTop: '12px', color: '#10b981', fontWeight: '700', fontSize: '0.85rem' }}>Active dispensing</div>
                </div>

                <div style={{ background: 'white', padding: '28px', borderRadius: '24px', border: '1px solid #e2e8f0', boxShadow: 'var(--shadow-sm)' }}>
                    <p style={{ fontSize: '0.7rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', marginBottom: '12px' }}>Total Sale Revenue</p>
                    <h2 style={{ fontSize: '2rem', fontWeight: '900', color: '#0f172a' }}>KES {data.totalSales.toLocaleString()}</h2>
                    <div style={{ marginTop: '12px', color: '#3b82f6', fontWeight: '700', fontSize: '0.85rem' }}>Cumulative revenue</div>
                </div>

                <div style={{ background: 'white', padding: '28px', borderRadius: '24px', border: '1px solid #e2e8f0', boxShadow: 'var(--shadow-sm)' }}>
                    <p style={{ fontSize: '0.7rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', marginBottom: '12px' }}>Inventory Value</p>
                    <h2 style={{ fontSize: '2rem', fontWeight: '900', color: '#0f172a' }}>KES {data.inventoryValue.toLocaleString()}</h2>
                    <div style={{ marginTop: '12px', color: '#6366f1', fontWeight: '700', fontSize: '0.85rem' }}>Asset worth on shelf</div>
                </div>

                <div style={{ background: data.expiringSoon > 0 ? '#fff1f2' : 'white', padding: '28px', borderRadius: '24px', border: '1px solid' + (data.expiringSoon > 0 ? '#fecdd3' : '#e2e8f0'), boxShadow: 'var(--shadow-sm)' }}>
                    <p style={{ fontSize: '0.7rem', fontWeight: '800', color: data.expiringSoon > 0 ? '#e11d48' : '#64748b', textTransform: 'uppercase', marginBottom: '12px' }}>Expiration Alerts</p>
                    <h2 style={{ fontSize: '2rem', fontWeight: '900', color: data.expiringSoon > 0 ? '#e11d48' : '#0f172a' }}>{data.expiringSoon} <span style={{ fontSize: '0.9rem', color: '#94a3b8' }}>Items</span></h2>
                    <div style={{ marginTop: '12px', color: data.expiringSoon > 0 ? '#e11d48' : '#64748b', fontWeight: '700', fontSize: '0.85rem' }}>Expiring within 90 days</div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
                {/* Fast Moving */}
                <div style={{ background: 'white', borderRadius: '24px', border: '1px solid #e2e8f0', padding: '32px' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: '900', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <TrendingUp size={24} color="#10b981" /> High-Velocity Medicines
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {data.fastMoving.map((drug, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', background: '#f8fafc', borderRadius: '16px', border: '1px solid #f1f5f9' }}>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: '800', color: '#0f172a' }}>{drug.name}</div>
                                    <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '600' }}>Fastest moving this period</div>
                                </div>
                                <div style={{ fontWeight: '900', color: '#10b981', fontSize: '1.1rem' }}>{drug.qty} sold</div>
                            </div>
                        ))}
                        {data.fastMoving.length === 0 && <p style={{ textAlign: 'center', color: '#94a3b8', padding: '20px' }}>No sales movement tracked yet.</p>}
                    </div>
                </div>

                {/* Inventory Snapshot */}
                <div style={{ background: 'white', borderRadius: '24px', border: '1px solid #e2e8f0', padding: '32px' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: '900', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Package size={24} color="#6366f1" /> Stagnant / Slow Moving Stock
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {data.slowMoving.map((drug, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', background: '#f8fafc', borderRadius: '16px', border: '1px solid #f1f5f9' }}>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: '800', color: '#0f172a' }}>{drug.name}</div>
                                    <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '600' }}>No sales recorded recently</div>
                                </div>
                                <div style={{ fontWeight: '900', color: '#94a3b8', fontSize: '1.1rem' }}>Zero Movement</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PharmaReports;
