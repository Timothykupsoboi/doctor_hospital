// =============================================================
// FILE: AdminBundles.jsx
// PURPOSE: React component / entry point for the eDoc Hospital
//          frontend. Part of the Vite + React SPA.
// =============================================================
import React, { useState, useEffect } from 'react';
import { getTreatmentBundles, getLabCatalog, getPharmacyInventory, createTreatmentBundle, deleteTreatmentBundle } from '../../lib/api';
import { 
    Plus, Search, X, Pill, Microscope, 
    Save, Trash2, Package
} from 'lucide-react';

const AdminBundles = () => {
    const [bundles, setBundles] = useState([]);
    const [items, setItems] = useState([]); // All available tests/medicines
    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({ name: '', description: '', category: 'General', items: [] });
    const [searchItem, setSearchItem] = useState('');

    const fetchData = async () => {
        setLoading(true);
        try {
            const [bundleRes, labRes, pharRes] = await Promise.all([
                getTreatmentBundles(),
                getLabCatalog(),
                getPharmacyInventory()
            ]);

            setBundles(bundleRes.data || []);
            setItems([
                ...(labRes.data || []).map(l => ({ type: 'lab', id: l.id, name: l.test_name || 'Unnamed Test' })),
                ...(pharRes.data || []).map(p => ({ type: 'medicine', id: p.id, name: p.med_name || p.name || 'Unnamed Medicine' }))
            ]);
        } catch (err) { console.error(err); }
        setLoading(false);
    };

    useEffect(() => { fetchData(); }, []);

    const handleAddItemToBundle = (item) => {
        if (!formData.items.find(i => i.id === item.id && i.type === item.type)) {
            setFormData({ ...formData, items: [...formData.items, { ...item, instructions: '' }] });
        }
        setSearchItem('');
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            const { error } = await createTreatmentBundle(formData);
            if (!error) {
                setShowModal(false);
                fetchData();
                setFormData({ name: '', description: '', category: 'General', items: [] });
            }
        } catch (err) { console.error(err); }
    };

    const handleDelete = async (id) => {
        if (!confirm("Are you sure?")) return;
        await deleteTreatmentBundle(id);
        fetchData();
    };

    const filteredCatalog = items.filter(i => (i.name || '').toLowerCase().includes((searchItem || '').toLowerCase())).slice(0, 5);

    return (
        <div style={{ padding: '40px 56px', maxWidth: '1600px', margin: '0 auto', background: '#f8fafc', minHeight: '100vh' }}>
                <header style={{ marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <div>
                        <h1 style={{ fontSize: '2.5rem', fontWeight: '900', color: '#0f172a', letterSpacing: '-0.04em' }}>Treatment Protocols</h1>
                        <p style={{ color: '#64748b', fontSize: '1.1rem' }}>Create standardized clinical bundles for rapid ordering.</p>
                    </div>
                    <button onClick={() => setShowModal(true)} style={{ padding: '14px 28px', background: '#007bff', color: 'white', border: 'none', borderRadius: '14px', fontWeight: '800', display: 'flex', gap: '10px', cursor: 'pointer' }}>
                        <Plus size={20} /> Create New Protocol
                    </button>
                </header>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '24px' }}>
                    {bundles.map(b => (
                        <div key={b.id} style={{ background: 'white', padding: '32px', borderRadius: '24px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                                <div>
                                    <span style={{ padding: '4px 10px', background: '#f1f5f9', color: '#475569', borderRadius: '20px', fontSize: '0.65rem', fontWeight: '800', textTransform: 'uppercase' }}>{b.category}</span>
                                    <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#1e293b', marginTop: '8px' }}>{b.name}</h3>
                                </div>
                                <button onClick={() => handleDelete(b.id)} style={{ padding: '8px', borderRadius: '10px', border: 'none', background: '#fee2e2', color: '#ef4444', cursor: 'pointer' }}><Trash2 size={16} /></button>
                            </div>
                            <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '24px' }}>{b.description}</p>
                            
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {b.items.map((item, idx) => (
                                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.85rem', color: '#475569', background: '#f8fafc', padding: '10px 16px', borderRadius: '12px' }}>
                                        {item.type === 'lab' ? <Microscope size={14} color="#0ea5e9" /> : <Pill size={14} color="#10b981" />}
                                        <span style={{ fontWeight: '600' }}>{item.name}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                {showModal && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                        <div style={{ background: 'white', width: '100%', maxWidth: '800px', borderRadius: '32px', padding: '40px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '32px' }}>
                                <h2 style={{ fontSize: '1.75rem', fontWeight: '900' }}>Design Treatment Protocol</h2>
                                <button onClick={() => setShowModal(false)} style={{ border: 'none', background: 'none', cursor: 'pointer' }}><X size={24} /></button>
                            </div>

                            <form onSubmit={handleSave} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '700', marginBottom: '8px' }}>Protocol Name</label>
                                        <input type="text" required placeholder="e.g. Adult Malaria Protocol" style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0' }} value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '700', marginBottom: '8px' }}>Category</label>
                                        <select style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0' }} value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                                            <option>General</option>
                                            <option>Internal Medicine</option>
                                            <option>Pediatrics</option>
                                            <option>Emergency</option>
                                            <option>Surgical</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '700', marginBottom: '8px' }}>Workflow Description</label>
                                        <textarea rows={3} style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0', resize: 'none' }} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                                    </div>
                                </div>

                                <div style={{ background: '#f8fafc', padding: '24px', borderRadius: '24px', border: '1px solid #e2e8f0' }}>
                                    <h3 style={{ fontSize: '1rem', fontWeight: '800', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}><Package size={18} /> Protocol Contents</h3>
                                    
                                    <div style={{ position: 'relative', marginBottom: '20px' }}>
                                        <Search size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: '#94a3b8' }} />
                                        <input 
                                            type="text" 
                                            placeholder="Add lab or medicine..." 
                                            style={{ width: '100%', padding: '10px 10px 10px 36px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '0.85rem' }} 
                                            value={searchItem}
                                            onChange={e => setSearchItem(e.target.value)}
                                        />
                                        {searchItem && (
                                            <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'white', border: '1px solid #e2e8f0', borderRadius: '10px', marginTop: '4px', zIndex: 10, boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}>
                                                {filteredCatalog.map(item => (
                                                    <div key={`${item.type}-${item.id}`} onClick={() => handleAddItemToBundle(item)} style={{ padding: '10px 16px', cursor: 'pointer', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid #f1f5f9' }}>
                                                        {item.type === 'lab' ? <Microscope size={14} color="#0ea5e9" /> : <Pill size={14} color="#10b981" />}
                                                        {item.name}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '250px', overflowY: 'auto' }}>
                                        {formData.items.map((item, idx) => (
                                            <div key={idx} style={{ background: 'white', padding: '16px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        {item.type === 'lab' ? <Microscope size={14} color="#0ea5e9" /> : <Pill size={14} color="#10b981" />}
                                                        <span style={{ fontSize: '0.8rem', fontWeight: '800' }}>{item.name}</span>
                                                    </div>
                                                    <button type="button" onClick={() => setFormData({...formData, items: formData.items.filter((_, i) => i !== idx)})} style={{ border: 'none', background: 'none', color: '#ef4444', cursor: 'pointer' }}><Trash2 size={14} /></button>
                                                </div>
                                                <input 
                                                    type="text" 
                                                    placeholder={item.type === 'lab' ? "Order instructions..." : "Dosage & Frequency (e.g. 500mg 1x3)"}
                                                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #f1f5f9', fontSize: '0.75rem' }}
                                                    value={item.instructions || ''}
                                                    onChange={e => {
                                                        const newItems = [...formData.items];
                                                        newItems[idx].instructions = e.target.value;
                                                        setFormData({...formData, items: newItems});
                                                    }}
                                                />
                                            </div>
                                        ))}
                                        {formData.items.length === 0 && <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8', fontSize: '0.85rem' }}>No items added yet.</div>}
                                    </div>

                                    <button type="submit" style={{ width: '100%', marginTop: '24px', padding: '14px', background: '#0f172a', color: 'white', border: 'none', borderRadius: '14px', fontWeight: '800', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px' }}>
                                        <Save size={20} /> Authorize & Save Protocol
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
        </div>
    );
};

export default AdminBundles;
