import React, { useState, useEffect } from 'react';
import { DollarSign, Plus, Edit2, Search, Activity, Stethoscope, Microscope, Pill, FileText, CheckCircle, Save, Trash } from 'lucide-react';
import { getLabCatalog, updateLabCatalogItem, createLabCatalogItem, getPricingMatrix, updatePricingMatrix, createPricingMatrix } from '../../lib/api';
import { supabase } from '../../lib/supabase';

const AdminFinancials = () => {
    const [activeTab, setActiveTab] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    
    const [pricingData, setPricingData] = useState([]);
    const [loading, setLoading] = useState(true);

    const [newItem, setNewItem] = useState({ category: 'Consultation', name: '', price: 0 });
    const [editingId, setEditingId] = useState(null);
    const [editingSource, setEditingSource] = useState(null);
    
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);

    const loadData = async () => {
        setLoading(true);
        try {
            const { data: matrix } = await getPricingMatrix();
            const { data: labs } = await getLabCatalog();

            const formattedMatrix = (matrix || []).map(m => ({
                id: m.id,
                source: 'matrix',
                category: m.category,
                name: m.item_name,
                price: Number(m.price || 0),
                status: 'Active'
            }));

            const formattedLabs = (labs || []).map(l => ({
                id: l.id,
                source: 'lab',
                category: 'Laboratory',
                name: l.test_name,
                price: Number(l.price || 0),
                status: l.is_enabled ? 'Active' : 'Inactive'
            }));

            setPricingData([...formattedMatrix, ...formattedLabs]);
        } catch (error) {
            console.error("Failed to load pricing catalog", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const getIconForCategory = (cat) => {
        switch(cat) {
            case 'Consultation': return <Stethoscope size={18} />;
            case 'Laboratory': return <Microscope size={18} />;
            case 'Pharmacy': return <Pill size={18} />;
            case 'Procedure': return <Activity size={18} />;
            default: return <FileText size={18} />;
        }
    };

    const getColorForCategory = (cat) => {
        switch(cat) {
            case 'Consultation': return { bg: '#eff6ff', text: '#3b82f6', border: '#bfdbfe' };
            case 'Laboratory': return { bg: '#f0fdf4', text: '#166534', border: '#bbf7d0' };
            case 'Pharmacy': return { bg: '#fffbeb', text: '#b45309', border: '#fde68a' };
            case 'Procedure': return { bg: '#f5f3ff', text: '#5b21b6', border: '#ddd6fe' };
            default: return { bg: '#f1f5f9', text: '#475569', border: '#cbd5e1' };
        }
    };

    const handleSaveItem = async () => {
        if (!newItem.name || newItem.price <= 0) return;
        
        if (editingId) {
            if (editingSource === 'lab') {
                await updateLabCatalogItem(editingId, { test_name: newItem.name, price: newItem.price });
            } else {
                await updatePricingMatrix(editingId, { category: newItem.category, item_name: newItem.name, price: newItem.price });
            }
        } else {
            if (newItem.category === 'Laboratory') {
                await createLabCatalogItem({ test_name: newItem.name, price: newItem.price, category: 'General', is_enabled: true });
            } else {
                await createPricingMatrix({ category: newItem.category, item_name: newItem.name, price: newItem.price });
            }
        }
        loadData();
        setShowModal(false);
        setEditingId(null);
        setEditingSource(null);
        setNewItem({ category: 'Consultation', name: '', price: 0 });
    };

    const handleEditItem = (item) => {
        setNewItem({ category: item.category, name: item.name, price: item.price });
        setEditingId(item.id);
        setEditingSource(item.source);
        setShowModal(true);
    };

    const handleDeleteItemClick = (item) => {
        setItemToDelete(item);
        setShowConfirmModal(true);
    };

    const handleConfirmDelete = async () => {
        if (!itemToDelete) return;
        
        try {
            if (itemToDelete.source === 'lab') {
                await updateLabCatalogItem(itemToDelete.id, { is_enabled: false });
            } else {
                await updatePricingMatrix(itemToDelete.id, { is_active: false });
            }
            loadData();
            setShowConfirmModal(false);
            setItemToDelete(null);
        } catch (error) {
            console.error("Failed to delete item", error);
        }
    };

    const filteredData = pricingData.filter(item => 
        (activeTab === 'all' || item.category.toLowerCase() === activeTab) &&
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div style={{ padding: '48px 64px', maxWidth: '1600px', margin: '0 auto', background: '#f8fafc', minHeight: '100vh', animation: 'fadeIn 0.5s' }}>
            {/* Header */}
            <header style={{ marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{ fontSize: '2.5rem', fontWeight: '900', color: '#0f172a', letterSpacing: '-0.03em', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{ background: '#3b82f6', color: 'white', padding: '12px', borderRadius: '16px', boxShadow: '0 10px 15px -3px rgba(59, 130, 246, 0.3)' }}>
                            <DollarSign size={28} strokeWidth={2.5} />
                        </div>
                        Financial Fee & Pricing Matrix
                    </h1>
                    <p style={{ color: '#64748b', fontSize: '1.1rem', fontWeight: '500', maxWidth: '600px' }}>
                        Centralized management for consultation rates, registration fees, lab tests, and clinical procedures.
                        </p>
                        </div>
                        <button
                        onClick={() => { setEditingId(null); setNewItem({ category: 'Consultation', name: '', price: 0 }); setShowModal(true); }}
                        style={{ background: '#0f172a', color: 'white', border: 'none', padding: '16px 28px', borderRadius: '16px', fontWeight: '800', fontSize: '1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', boxShadow: '0 20px 25px -5px rgba(15, 23, 42, 0.2)', transition: '0.2s', transform: 'translateY(0)' }}
                        onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                        onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
                        >
                        <Plus size={20} /> Add New Price Entry
                        </button>
                        </header>

                        {/* Main Content Area */}
                        <div style={{ background: 'white', borderRadius: '24px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)', overflow: 'hidden' }}>

                        {/* Toolbar */}
                        <div style={{ padding: '24px 32px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
                        <div style={{ display: 'flex', gap: '12px' }}>
                        {['all', 'administration', 'consultation', 'laboratory', 'procedure'].map(tab => (                            <button 
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                style={{ 
                                    padding: '10px 20px', borderRadius: '12px', fontWeight: '800', fontSize: '0.9rem', textTransform: 'capitalize', cursor: 'pointer', transition: '0.2s',
                                    background: activeTab === tab ? '#3b82f6' : 'white',
                                    color: activeTab === tab ? 'white' : '#64748b',
                                    border: activeTab === tab ? '1px solid #2563eb' : '1px solid #cbd5e1',
                                    boxShadow: activeTab === tab ? '0 4px 6px -1px rgba(59, 130, 246, 0.3)' : 'none'
                                }}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                    <div style={{ position: 'relative', width: '300px' }}>
                        <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                        <input 
                            type="text" 
                            placeholder="Search prices or procedures..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ width: '100%', padding: '12px 16px 12px 44px', borderRadius: '12px', border: '2px solid #e2e8f0', background: 'white', fontSize: '0.95rem', fontWeight: '600', color: '#0f172a', outline: 'none', transition: 'border-color 0.2s' }}
                            onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                            onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                        />
                    </div>
                </div>

                {/* Data Table */}
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ background: '#f1f5f9', borderBottom: '2px solid #cbd5e1' }}>
                        <tr>
                            <th style={{ padding: '20px 32px', textAlign: 'left', fontSize: '0.8rem', fontWeight: '800', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Item / Action</th>
                            <th style={{ padding: '20px 32px', textAlign: 'left', fontSize: '0.8rem', fontWeight: '800', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Category</th>
                            <th style={{ padding: '20px 32px', textAlign: 'right', fontSize: '0.8rem', fontWeight: '800', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Standard Fee (KES)</th>
                            <th style={{ padding: '20px 32px', textAlign: 'center', fontSize: '0.8rem', fontWeight: '800', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</th>
                            <th style={{ padding: '20px 32px', textAlign: 'right', fontSize: '0.8rem', fontWeight: '800', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredData.map(item => {
                            const colors = getColorForCategory(item.category);
                            return (
                                <tr key={item.id} style={{ borderBottom: '1px solid #e2e8f0', transition: 'background 0.2s' }} onMouseOver={e => e.currentTarget.style.background = '#f8fafc'} onMouseOut={e => e.currentTarget.style.background = 'white'}>
                                    <td style={{ padding: '20px 32px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: colors.bg, color: colors.text, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                {getIconForCategory(item.category)}
                                            </div>
                                            <span style={{ fontWeight: '800', color: '#0f172a', fontSize: '1.05rem' }}>{item.name}</span>
                                        </div>
                                    </td>
                                    <td style={{ padding: '20px 32px' }}>
                                        <span style={{ padding: '6px 14px', borderRadius: '8px', background: colors.bg, color: colors.text, border: '1px solid ' + colors.border, fontSize: '0.8rem', fontWeight: '800', display: 'inline-block' }}>
                                            {item.category.toUpperCase()}
                                        </span>
                                    </td>
                                    <td style={{ padding: '20px 32px', textAlign: 'right' }}>
                                        <span style={{ fontWeight: '900', color: '#10b981', fontSize: '1.1rem', background: '#f0fdf4', padding: '8px 16px', borderRadius: '10px', border: '1px solid #bbf7d0', display: 'inline-block' }}>
                                            {Number(item.price).toLocaleString()}
                                        </span>
                                    </td>
                                    <td style={{ padding: '20px 32px', textAlign: 'center' }}>
                                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#10b981', background: '#f0fdf4', padding: '6px 12px', borderRadius: '20px', fontWeight: '800', fontSize: '0.8rem' }}>
                                            <CheckCircle size={14} /> {item.status}
                                        </div>
                                    </td>
                                    <td style={{ padding: '20px 32px', textAlign: 'right' }}>
                                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                            <button onClick={() => handleEditItem(item)} style={{ width: '40px', height: '40px', borderRadius: '12px', border: '1px solid #e2e8f0', background: 'white', color: '#64748b', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', transition: '0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }} onMouseOver={e => { e.currentTarget.style.color = '#3b82f6'; e.currentTarget.style.borderColor = '#bfdbfe'; }} onMouseOut={e => { e.currentTarget.style.color = '#64748b'; e.currentTarget.style.borderColor = '#e2e8f0'; }}>
                                                <Edit2 size={16} />
                                            </button>
                                            <button onClick={() => handleDeleteItemClick(item)} style={{ width: '40px', height: '40px', borderRadius: '12px', border: '1px solid #e2e8f0', background: 'white', color: '#ef4444', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', transition: '0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }} onMouseOver={e => { e.currentTarget.style.background = '#fee2e2'; e.currentTarget.style.borderColor = '#fecaca'; }} onMouseOut={e => { e.currentTarget.style.background = 'white'; e.currentTarget.style.borderColor = '#e2e8f0'; }}>
                                                <Trash size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
                {filteredData.length === 0 && (
                    <div style={{ padding: '64px', textAlign: 'center', color: '#94a3b8' }}>
                        <Activity size={48} style={{ opacity: 0.3, marginBottom: '16px' }} />
                        <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#475569' }}>No pricing records found.</h3>
                        <p>Adjust your search filters or add a new entry.</p>
                    </div>
                )}
            </div>

            {/* Add Price Entry Modal */}
            {showModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '24px' }}>
                    <div style={{ background: 'white', width: '100%', maxWidth: '500px', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.3)', animation: 'slideUp 0.3s ease-out' }}>
                        <div style={{ background: 'linear-gradient(135deg, #0f172a, #1e293b)', padding: '24px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ color: 'white', margin: 0, fontSize: '1.25rem', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                {editingId ? <Edit2 size={20} color="#10b981" /> : <Plus size={20} color="#3b82f6" />} 
                                {editingId ? 'Edit Price Entry' : 'Add Price Entry'}
                            </h3>
                            <button onClick={() => setShowModal(false)} style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'rgba(255,255,255,0.1)', color: 'white', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900' }}>×</button>
                        </div>
                        <div style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                            
                            <div>
                                <label style={{ display: 'block', fontWeight: '800', color: '#475569', marginBottom: '8px', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Category / Type of Action</label>
                                <select 
                                    value={newItem.category} 
                                    onChange={e => setNewItem({...newItem, category: e.target.value})}
                                    style={{ width: '100%', padding: '16px', borderRadius: '12px', border: '2px solid #e2e8f0', background: '#f8fafc', fontSize: '1rem', fontWeight: '700', color: '#0f172a', outline: 'none' }}
                                >
                                    <option value="Administration">Administration (Reg Fee, etc.)</option>
                                    <option value="Consultation">Consultation</option>
                                    <option value="Laboratory">Laboratory Test</option>
                                    <option value="Procedure">Procedure</option>
                                </select>
                            </div>

                            <div>
                                <label style={{ display: 'block', fontWeight: '800', color: '#475569', marginBottom: '8px', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Item / Action Name</label>
                                <input 
                                    type="text" 
                                    placeholder="e.g. Complete Blood Count (CBC)"
                                    value={newItem.name} 
                                    onChange={e => setNewItem({...newItem, name: e.target.value})}
                                    style={{ width: '100%', padding: '16px', borderRadius: '12px', border: '2px solid #e2e8f0', background: '#f8fafc', fontSize: '1rem', fontWeight: '700', color: '#0f172a', outline: 'none' }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', fontWeight: '800', color: '#475569', marginBottom: '8px', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Standard Fee (KES)</label>
                                <div style={{ position: 'relative' }}>
                                    <div style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', fontWeight: '900', color: '#10b981' }}>KES</div>
                                    <input 
                                        type="number" 
                                        placeholder="0"
                                        value={newItem.price || ''} 
                                        onChange={e => setNewItem({...newItem, price: Number(e.target.value)})}
                                        style={{ width: '100%', padding: '16px 16px 16px 60px', borderRadius: '12px', border: '2px solid #e2e8f0', background: '#f8fafc', fontSize: '1.1rem', fontWeight: '900', color: '#0f172a', outline: 'none' }}
                                    />
                                </div>
                            </div>

                            <button onClick={handleSaveItem} style={{ width: '100%', background: '#3b82f6', color: 'white', padding: '16px', borderRadius: '16px', border: 'none', fontWeight: '900', fontSize: '1.1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '8px', boxShadow: '0 10px 15px -3px rgba(59, 130, 246, 0.3)' }}>
                                <Save size={20} /> Save Pricing Entry
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Custom Confirm Modal */}
            {showConfirmModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '24px' }}>
                    <div style={{ background: 'white', width: '100%', maxWidth: '400px', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.3)', animation: 'slideUp 0.3s ease-out' }}>
                        <div style={{ padding: '32px', textAlign: 'center' }}>
                            <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#fee2e2', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                                <Trash size={24} />
                            </div>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: '900', color: '#0f172a', marginBottom: '8px' }}>Are you sure?</h3>
                            <p style={{ color: '#64748b', fontSize: '0.95rem', fontWeight: '500', marginBottom: '24px' }}>
                                You are about to delete <strong style={{ color: '#0f172a' }}>{itemToDelete?.name}</strong>. This action cannot be undone.
                            </p>
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <button onClick={() => setShowConfirmModal(false)} style={{ flex: 1, padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0', background: 'white', color: '#475569', fontWeight: '700', cursor: 'pointer' }}>Cancel</button>
                                <button onClick={handleConfirmDelete} style={{ flex: 1, padding: '12px', borderRadius: '12px', border: 'none', background: '#ef4444', color: 'white', fontWeight: '700', cursor: 'pointer', boxShadow: '0 4px 6px -1px rgba(239, 68, 68, 0.3)' }}>Yes, Delete</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
            `}</style>
        </div>
    );
};

export default AdminFinancials;
