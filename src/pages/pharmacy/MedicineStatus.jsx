// =============================================================
// FILE: MedicineStatus.jsx
// PURPOSE: React component / entry point for the eDoc Hospital
//          frontend. Part of the Vite + React SPA.
// =============================================================
import React, { useState, useEffect } from 'react';
import { 
    AlertCircle, CheckCircle, Clock, XCircle, ShieldAlert, Activity, 
    Search, Calendar, Filter, Download
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

const MedicineStatus = () => {
    const [inventory, setInventory] = useState([]);
    const [activeStatus, setActiveStatus] = useState('EXPIRED');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            const { data, error } = await supabase.from('medicine').select('*');
            if (!error) {
                setInventory(data || []);
            }
            setLoading(false);
        };
        load();
    }, []);

    const today = new Date();
    const categories = {
        EXPIRED: inventory.filter(i => new Date(i.expiry_date) <= today),
        STOCK_OUT: inventory.filter(i => (i.stock_qty || 0) <= 0),
        CRITICAL: inventory.filter(i => {
            const exp = new Date(i.expiry_date);
            const diff = (exp - today) / (1000 * 60 * 60 * 24);
            return diff > 0 && diff <= 30;
        }),
        LOW_STOCK: inventory.filter(i => (i.stock_qty || 0) > 0 && (i.stock_qty || 0) <= (i.reorder_level || 10)),
        SOON: inventory.filter(i => {
            const exp = new Date(i.expiry_date);
            const diff = (exp - today) / (1000 * 60 * 60 * 24);
            return diff > 30 && diff <= 90;
        }),
        HEALTHY: inventory.filter(i => {
            const exp = new Date(i.expiry_date);
            const diff = (exp - today) / (1000 * 60 * 60 * 24);
            return (i.stock_qty || 0) > (i.reorder_level || 10) && diff > 90;
        })
    };

    const statusMetrics = [
        { id: 'EXPIRED', label: 'Expired', count: categories.EXPIRED.length, icon: XCircle, color: '#dc3545' },
        { id: 'STOCK_OUT', label: 'Stock Out', count: categories.STOCK_OUT.length, icon: AlertCircle, color: '#f59e0b' },
        { id: 'CRITICAL', label: 'Critical Expiry', count: categories.CRITICAL.length, icon: ShieldAlert, color: '#dc3545' },
        { id: 'LOW_STOCK', label: 'Low Stock', count: categories.LOW_STOCK.length, icon: Activity, color: '#007bff' },
        { id: 'HEALTHY', label: 'Healthy Nodes', count: categories.HEALTHY.length, icon: CheckCircle, color: '#10b981' }
    ];

    const currentList = categories[activeStatus] || [];
    const todayDate = today.toISOString().split('T')[0];

    return (
        <div style={{ padding: '24px 40px', maxWidth: '1600px', margin: '0 auto', background: '#ffffff', minHeight: '100vh' }}>
                {/* Edoc Style Header Search & Date */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                    <div style={{ display: 'flex', gap: '10px', flex: 1, maxWidth: '800px' }}>
                        <div style={{ position: 'relative', flex: 1 }}>
                            <Search size={18} style={{ position: 'absolute', left: '15px', top: '12px', color: '#adb5bd' }} />
                            <input 
                                type="text" 
                                placeholder="Filter health ledger..." 
                                style={{ width: '100%', padding: '10px 15px 10px 45px', border: '1px solid #dee2e6', borderRadius: '4px', fontSize: '0.9rem', background: '#f8f9fa' }} 
                            />
                        </div>
                        <button style={{ padding: '10px 25px', background: '#e7f2ff', color: '#007bff', border: 'none', borderRadius: '4px', fontWeight: '600', cursor: 'pointer' }}>Search</button>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px', textAlign: 'right' }}>
                        <div>
                            <div style={{ fontSize: '0.75rem', color: '#adb5bd', fontWeight: '700' }}>Report Date</div>
                            <div style={{ fontSize: '1.1rem', fontWeight: '700', color: '#343a40' }}>{todayDate}</div>
                        </div>
                        <div style={{ padding: '10px', background: '#f8f9fa', border: '1px solid #dee2e6', borderRadius: '4px', color: '#343a40' }}>
                            <Calendar size={20} />
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#343a40' }}>Clinical Health Monitor</h2>
                    <button style={{ padding: '10px 20px', background: '#28a745', color: 'white', border: 'none', borderRadius: '4px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Download size={18} /> Export Health Report
                    </button>
                </div>

                {/* Edoc Status Row */}
                <div className="responsive-grid grid-5" style={{ marginBottom: '40px' }}>
                    {statusMetrics.map((stat, idx) => (
                        <div 
                            key={idx} 
                            onClick={() => setActiveStatus(stat.id)}
                            style={{ 
                                background: 'white', 
                                padding: '20px 25px', 
                                borderRadius: '4px', 
                                border: activeStatus === stat.id ? `2px solid ${stat.color}` : '1px solid #dee2e6', 
                                display: 'flex', 
                                justifyContent: 'space-between', 
                                alignItems: 'center',
                                cursor: 'pointer',
                                transition: '0.2s'
                            }}
                        >
                            <div>
                                <div style={{ fontSize: '1.5rem', fontWeight: '700', color: stat.color }}>{stat.count}</div>
                                <div style={{ fontSize: '0.85rem', fontWeight: '600', color: '#6c757d', textTransform: 'uppercase' }}>{stat.label}</div>
                            </div>
                            <div style={{ padding: '10px', background: '#f8f9fa', border: '1px solid #dee2e6', borderRadius: '4px', color: stat.color }}>
                                <stat.icon size={20} />
                            </div>
                        </div>
                    ))}
                </div>

                {/* Health Ledger Table */}
                <div style={{ background: 'white', borderRadius: '4px', border: '1px solid #dee2e6', overflowX: 'auto' }}>
                    <div style={{ padding: '15px 25px', background: '#f8f9fa', borderBottom: '1px solid #dee2e6', display: 'flex', justifyContent: 'space-between', alignItems: 'center', minWidth: '800px' }}>
                        <div style={{ fontWeight: '700', color: '#343a40' }}>Showing: {activeStatus.replace('_', ' ')}</div>
                        <div style={{ fontSize: '0.8rem', color: '#6c757d' }}>{currentList.length} Items found</div>
                    </div>
                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
                        <thead style={{ background: '#ffffff', borderBottom: '2px solid #007bff' }}>
                            <tr>
                                <th style={{ textAlign: 'left', padding: '15px 25px', fontSize: '0.85rem', fontWeight: '700', color: '#343a40' }}>MEDICINE NAME</th>
                                <th style={{ textAlign: 'left', padding: '15px 25px', fontSize: '0.85rem', fontWeight: '700', color: '#343a40' }}>BATCH</th>
                                <th style={{ textAlign: 'left', padding: '15px 25px', fontSize: '0.85rem', fontWeight: '700', color: '#343a40' }}>EXPIRY DATE</th>
                                <th style={{ textAlign: 'left', padding: '15px 25px', fontSize: '0.85rem', fontWeight: '700', color: '#343a40' }}>STOCK</th>
                                <th style={{ textAlign: 'right', padding: '15px 25px', fontSize: '0.85rem', fontWeight: '700', color: '#343a40' }}>STATUS</th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentList.length === 0 ? (
                                <tr><td colSpan="5" style={{ padding: '40px', textAlign: 'center', color: '#adb5bd' }}>No nodes found in this category.</td></tr>
                            ) : currentList.map(item => (
                                <tr key={item.id} style={{ borderBottom: '1px solid #dee2e6' }}>
                                    <td style={{ padding: '15px 25px' }}>
                                        <div style={{ fontWeight: '700', color: '#343a40' }}>{item.med_name}</div>
                                        <div style={{ fontSize: '0.7rem', color: '#6c757d' }}>{item.category}</div>
                                    </td>
                                    <td style={{ padding: '15px 25px', fontSize: '0.85rem', color: '#495057' }}>{item.batch_no || item.batch_number}</td>
                                    <td style={{ padding: '15px 25px', fontSize: '0.85rem', color: '#495057' }}>{new Date(item.expiry_date).toLocaleDateString()}</td>
                                    <td style={{ padding: '15px 25px', fontWeight: '700', color: (item.stock_qty || 0) <= (item.reorder_level || 10) ? '#dc3545' : '#212529' }}>{item.stock_qty || 0}</td>
                                    <td style={{ padding: '15px 25px', textAlign: 'right' }}>
                                        <span style={{ 
                                            fontSize: '0.75rem', 
                                            padding: '4px 8px', 
                                            background: activeStatus === 'EXPIRED' ? '#f8d7da' : '#e2e3e5',
                                            color: activeStatus === 'EXPIRED' ? '#721c24' : '#383d41',
                                            borderRadius: '4px',
                                            fontWeight: '700'
                                        }}>
                                            {activeStatus}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
        </div>
    );
};

export default MedicineStatus;
