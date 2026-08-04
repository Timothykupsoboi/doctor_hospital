// =============================================================
// FILE: AdminMasterCatalog.jsx
// PURPOSE: React component / entry point for the eDoc Hospital
//          frontend. Part of the Vite + React SPA.
// =============================================================
import React, { useState, useEffect } from 'react';
import { getLabCatalog, getPharmacyInventory, updateLabCatalogItem, updateMedicineInventory } from '../../lib/api';
import { 
    Search, Tag, Package, Microscope, Pill, 
    Edit2, Plus, Filter, ArrowUpRight, DollarSign, 
    AlertCircle, CheckCircle, ChevronDown, Trash2
} from 'lucide-react';

const AdminMasterCatalog = () => {
    const [activeTab, setActiveTab] = useState('all');
    const [items, setItems] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [toast, setToast] = useState(null);

    const fetchAll = async () => {
        setLoading(true);
        try {
            const [labRes, pharRes] = await Promise.all([
                getLabCatalog(),
                getPharmacyInventory()
            ]);

            const labData = labRes.data || [];
            const pharData = pharRes.data || [];

            const combined = [
                ...labData.map(t => ({ ...t, type: 'lab', id: t.id, name: t.test_name || 'Unnamed Test', price: t.price || 0, category: t.category })),
                ...pharData.map(m => ({ ...m, type: 'medicine', id: m.id, name: m.med_name || m.name || 'Unnamed Medicine', price: m.sell_price || m.selling_price || 0, category: 'Pharmacy' }))
            ];
            
            setItems(combined);
        } catch (err) {
            console.error("Fetch failed", err);
        }
        setLoading(false);
    };

    useEffect(() => { fetchAll(); }, []);

    const filtered = items.filter(item => {
        const matchesSearch = (item.name || '').toLowerCase().includes((searchTerm || '').toLowerCase());
        if (activeTab === 'all') return matchesSearch;
        return matchesSearch && item.type === activeTab;
    });

    const handleUpdatePrice = async (item, newPrice) => {
        try {
            const res = item.type === 'lab'
                ? await updateLabCatalogItem(item.id, { price: newPrice })
                : await updateMedicineInventory(item.id, { sell_price: newPrice });

            if (!res.error) {
                setToast({ msg: 'Price updated successfully', type: 'success' });
                fetchAll();
                setTimeout(() => setToast(null), 3000);
            } else {
                throw res.error;
            }
        } catch (e) {
            console.error('Update failed', e);
            setToast({ msg: 'Update failed', type: 'error' });
        }
    };

    return (
        <div style={{ padding: '48px 64px', maxWidth: '1600px', margin: '0 auto', background: '#f8fafc', minHeight: '100vh' }}>
                <header style={{ marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <div>
                        <h1 style={{ fontSize: '2.5rem', fontWeight: '900', color: '#0f172a', letterSpacing: '-0.04em' }}>Master Service Catalog</h1>
                        <p style={{ color: '#64748b', fontSize: '1.1rem' }}>Centralized control for all billable hospital assets.</p>
                    </div>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <div style={{ position: 'relative' }}>
                            <Search size={20} style={{ position: 'absolute', left: '16px', top: '14px', color: '#94a3b8' }} />
                            <input 
                                type="text" 
                                placeholder="Search everything..." 
                                style={{ padding: '12px 16px 12px 48px', borderRadius: '14px', border: '1px solid #e2e8f0', width: '300px' }}
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </header>

                {toast && (
                    <div style={{ position: 'fixed', top: 32, right: 32, zIndex: 1000, background: toast.type === 'success' ? '#10b981' : '#ef4444', color: 'white', padding: '16px 24px', borderRadius: '12px', fontWeight: '700', display: 'flex', gap: '10px' }}>
                        {toast.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                        {toast.msg}
                    </div>
                )}

                <div style={{ display: 'flex', gap: '8px', background: 'white', padding: '6px', borderRadius: '16px', marginBottom: '32px', width: 'fit-content', border: '1px solid #e2e8f0' }}>
                    {['all', 'lab', 'medicine'].map(t => (
                        <button 
                            key={t}
                            onClick={() => setActiveTab(t)}
                            style={{ 
                                padding: '10px 20px', borderRadius: '12px', border: 'none', 
                                background: activeTab === t ? 'var(--primary)' : 'transparent',
                                color: activeTab === t ? 'white' : '#64748b',
                                fontWeight: '700', textTransform: 'capitalize', cursor: 'pointer'
                            }}
                        >
                            {t} Services
                        </button>
                    ))}
                </div>

                <div style={{ background: 'white', borderRadius: '24px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                                <th style={{ textAlign: 'left', padding: '16px 24px', fontSize: '0.85rem', fontWeight: '800', color: '#475569' }}>SERVICE / PRODUCT</th>
                                <th style={{ textAlign: 'left', padding: '16px 24px', fontSize: '0.85rem', fontWeight: '800', color: '#475569' }}>CATEGORY</th>
                                <th style={{ textAlign: 'left', padding: '16px 24px', fontSize: '0.85rem', fontWeight: '800', color: '#475569' }}>SOURCE</th>
                                <th style={{ textAlign: 'right', padding: '16px 24px', fontSize: '0.85rem', fontWeight: '800', color: '#475569' }}>BILLING PRICE</th>
                                <th style={{ textAlign: 'right', padding: '16px 24px', fontSize: '0.85rem', fontWeight: '800', color: '#475569' }}>ACTION</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="5" style={{ padding: '60px', textAlign: 'center', color: '#94a3b8' }}>Analyzing catalog...</td></tr>
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan="5" style={{ padding: '60px', textAlign: 'center', color: '#94a3b8' }}>No items found in this section.</td></tr>
                            ) : filtered.map(item => (
                                <tr key={`${item.type}-${item.id}`} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                    <td style={{ padding: '20px 24px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: item.type === 'lab' ? '#f0f9ff' : '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                {item.type === 'lab' ? <Microscope size={18} color="#0ea5e9" /> : <Pill size={18} color="#10b981" />}
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: '700', color: '#1e293b' }}>{item.name}</div>
                                                <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>ID: {item.id}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td style={{ padding: '20px 24px' }}>
                                        <span style={{ padding: '4px 12px', background: '#f1f5f9', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '700', color: '#475569' }}>{item.category || 'Standard'}</span>
                                    </td>
                                    <td style={{ padding: '20px 24px' }}>
                                        <div style={{ fontSize: '0.85rem', fontWeight: '600', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            {item.type === 'lab' ? 'Laboratory' : 'Pharmacy'}
                                        </div>
                                    </td>
                                    <td style={{ padding: '20px 24px', textAlign: 'right' }}>
                                        <div style={{ fontWeight: '800', color: '#0f172a', fontSize: '1.1rem' }}>
                                            {item.price.toLocaleString()} <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>KSh</span>
                                        </div>
                                    </td>
                                    <td style={{ padding: '20px 24px', textAlign: 'right' }}>
                                        <button 
                                            onClick={() => {
                                                const p = prompt(`Enter new price for ${item.name}:`, item.price);
                                                if (p !== null) handleUpdatePrice(item, parseFloat(p));
                                            }}
                                            style={{ padding: '8px 16px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', fontSize: '0.85rem', fontWeight: '700', cursor: 'pointer' }}
                                        >
                                            Adjust Price
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
        </div>
    );
};

export default AdminMasterCatalog;
