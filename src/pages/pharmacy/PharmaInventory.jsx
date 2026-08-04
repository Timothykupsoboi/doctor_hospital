// =============================================================
// FILE: PharmaInventory.jsx
// PURPOSE: React component / entry point for the eDoc Hospital
//          frontend. Part of the Vite + React SPA.
// =============================================================
import React, { useState, useEffect } from 'react';
import { 
    Package, Plus, Search, X, ShieldAlert, 
    Briefcase, Zap, Calendar
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

const PharmaInventory = () => {
    const [inventory, setInventory] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    
    const [newMed, setNewMed] = useState({
        med_name: '', 
        generic_name: '',
        strength: '',
        med_form: 'Tablet', // Form (Tablet, Syrup, etc)
        category: 'Analgesic', // Clinical Category
        barcode: '',
        prescription_required: false,
        batch_no: '', 
        stock_qty: 0, 
        expiry_date: '', 
        reorder_level: 20,
        unit: 'Pack of 30',
        buying_price: 0, 
        selling_price: 0, 
        tax_rate: 16,
        supplier_id: '',
        is_active: true
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [invRes, supRes] = await Promise.all([
                supabase.from('medicine')
                    .select('*, suppliers:supplier_id(name)')
                    .order('med_name'),
                supabase.from('suppliers').select('id, name')
            ]);
            
            setInventory(invRes.data || []);
            setSuppliers(supRes.data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = async (e) => {
        e.preventDefault();
        try {
            const { error } = await supabase.from('medicine').insert({
                med_name: newMed.med_name,
                generic_name: newMed.generic_name,
                strength: newMed.strength,
                med_type: newMed.med_form,
                category: newMed.category,
                barcode: newMed.barcode,
                batch_no: newMed.batch_no,
                expiry_date: newMed.expiry_date,
                stock_qty: newMed.stock_qty,
                reorder_level: newMed.reorder_level,
                unit: newMed.unit,
                buying_price: newMed.buying_price,
                selling_price: newMed.selling_price,
                tax_rate: newMed.tax_rate,
                supplier_id: newMed.supplier_id || null,
                prescription_required: newMed.prescription_required,
                is_active: true
            });
            
            if (!error) {
                setShowAddModal(false);
                fetchData();
                setNewMed({
                    med_name: '', generic_name: '', strength: '', med_form: 'Tablet', category: 'Analgesic', 
                    barcode: '', prescription_required: false, batch_no: '', stock_qty: 0, expiry_date: '', 
                    reorder_level: 20, unit: 'Pack of 30', buying_price: 0, selling_price: 0, tax_rate: 16, 
                    supplier_id: '', is_active: true
                });
            } else {
                alert(`Database Error: ${error.message}`);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const toggleStatus = async (id, currentStatus) => {
        try {
            const { error } = await supabase.from('medicine').update({ is_active: !currentStatus }).eq('id', id);
            if (!error) {
                fetchData();
            } else {
                alert(`Error updating status: ${error.message}`);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const updatePrice = async (id, currentPrice) => {
        const newPrice = prompt(`Enter new selling price for this item:`, currentPrice);
        if (newPrice !== null && !isNaN(newPrice)) {
            try {
                const { error } = await supabase.from('medicine').update({ selling_price: Number(newPrice) }).eq('id', id);
                if (!error) {
                    fetchData();
                } else {
                    alert(`Error updating price: ${error.message}`);
                }
            } catch (err) {
                console.error(err);
            }
        }
    };

    const filtered = (inventory || []).filter(i => {
        if (!i) return false;
        const search = (searchTerm || '').toLowerCase();
        return (
            (i.med_name || '').toLowerCase().includes(search) || 
            (i.generic_name || '').toLowerCase().includes(search) ||
            (i.category || '').toLowerCase().includes(search) ||
            (i.barcode || '').toLowerCase().includes(search)
        );
    });

    const metrics = [
        { label: 'Active Catalog', count: inventory.length, icon: Package },
        { label: 'Depleting Stock', count: inventory.filter(i => (i.stock_qty || 0) <= (i.reorder_level || 10)).length, icon: Zap },
        { label: 'Inventory Value', count: inventory.reduce((acc, i) => acc + ((i.stock_qty || 0) * (i.selling_price || 0)), 0).toLocaleString(), icon: Briefcase },
        { label: 'Valid Batches', count: inventory.filter(i => new Date(i.expiry_date) > new Date()).length, icon: ShieldAlert },
    ];

    const todayDate = new Date().toISOString().split('T')[0];

    return (
        <div style={{ padding: '24px 40px', maxWidth: '1600px', margin: '0 auto', background: '#ffffff', minHeight: '100vh' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                    <div style={{ display: 'flex', gap: '10px', flex: 1, maxWidth: '800px' }}>
                        <div style={{ position: 'relative', flex: 1 }}>
                            <Search size={18} style={{ position: 'absolute', left: '15px', top: '12px', color: '#adb5bd' }} />
                            <input 
                                type="text" 
                                placeholder="Search ledger by name, formula or barcode..." 
                                style={{ width: '100%', padding: '10px 15px 10px 45px', border: '1px solid #dee2e6', borderRadius: '4px', fontSize: '0.9rem', background: '#f8f9fa' }} 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px', textAlign: 'right' }}>
                        <div>
                            <div style={{ fontSize: '0.75rem', color: '#adb5bd', fontWeight: '700' }}>System Date</div>
                            <div style={{ fontSize: '1.1rem', fontWeight: '700', color: '#343a40' }}>{todayDate}</div>
                        </div>
                        <div style={{ padding: '10px', background: '#f8f9fa', border: '1px solid #dee2e6', borderRadius: '4px', color: '#343a40' }}>
                            <Calendar size={20} />
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#343a40' }}>Pharmaceutical Inventory Ledger</h2>
                    <button onClick={() => setShowAddModal(true)} style={{ padding: '12px 24px', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Plus size={18} /> Add New Medication
                    </button>
                </div>

                <div className="responsive-grid grid-4" style={{ marginBottom: '40px' }}>
                    {metrics.map((stat, idx) => (
                        <div key={idx} style={{ background: 'white', padding: '20px 25px', borderRadius: '4px', border: '1px solid #dee2e6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#007bff' }}>{stat.count}</div>
                                <div style={{ fontSize: '0.85rem', fontWeight: '600', color: '#6c757d', textTransform: 'uppercase' }}>{stat.label}</div>
                            </div>
                            <div style={{ padding: '10px', background: '#f8f9fa', border: '1px solid #dee2e6', borderRadius: '4px', color: '#007bff' }}>
                                <stat.icon size={20} />
                            </div>
                        </div>
                    ))}
                </div>

                <div style={{ background: 'white', borderRadius: '4px', border: '1px solid #dee2e6', overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '1000px' }}>
                        <thead style={{ background: '#f8f9fa', borderBottom: '2px solid #007bff' }}>
                            <tr>
                                <th style={{ textAlign: 'left', padding: '15px 25px', fontSize: '0.85rem', fontWeight: '700', color: '#343a40' }}>MEDICINE & STRENGTH</th>
                                <th style={{ textAlign: 'left', padding: '15px 25px', fontSize: '0.85rem', fontWeight: '700', color: '#343a40' }}>GENERIC FORMULA</th>
                                <th style={{ textAlign: 'left', padding: '15px 25px', fontSize: '0.85rem', fontWeight: '700', color: '#343a40' }}>STOCK LEVEL</th>
                                <th style={{ textAlign: 'left', padding: '15px 25px', fontSize: '0.85rem', fontWeight: '700', color: '#343a40' }}>CLINICAL SAFETY</th>
                                <th style={{ textAlign: 'right', padding: '15px 25px', fontSize: '0.85rem', fontWeight: '700', color: '#343a40' }}>SELLING PRICE</th>
                                <th style={{ textAlign: 'right', padding: '15px 25px', fontSize: '0.85rem', fontWeight: '700', color: '#343a40' }}>STATUS / ACTIONS</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={5} style={{ textAlign: 'center', padding: '40px', color: '#adb5bd' }}>Loading inventory records...</td></tr>
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan={5} style={{ textAlign: 'center', padding: '40px', color: '#adb5bd' }}>No medicine records found.</td></tr>
                            ) : filtered.map(item => {
                                const expiryDate = new Date(item.expiry_date);
                                const today = new Date();
                                const isExpired = expiryDate < today;
                                const isNearingExpiry = !isExpired && expiryDate < new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
                                const stock = item.stock_qty || 0;
                                const reorder = item.reorder_level || 20;
                                
                                return (
                                    <tr key={item.id} style={{ 
                                        borderBottom: '1px solid #dee2e6',
                                        background: isExpired ? '#fee2e2' : (stock <= 0 ? '#f1f5f9' : (isNearingExpiry ? '#fffaf0' : 'transparent')),
                                        borderLeft: isExpired ? '4px solid #ef4444' : (stock <= 0 ? '4px solid #94a3b8' : 'none')
                                    }}>
                                        <td style={{ padding: '15px 25px' }}>
                                            <div style={{ fontWeight: '700', color: isExpired ? '#dc3545' : (isNearingExpiry ? '#fd7e14' : '#343a40') }}>
                                                {item.med_name} {item.strength}
                                                {isExpired && <span style={{ marginLeft: '8px', fontSize: '0.65rem', background: '#dc3545', color: 'white', padding: '2px 6px', borderRadius: '4px' }}>EXPIRED</span>}
                                            </div>
                                            <div style={{ fontSize: '0.7rem', color: '#6c757d' }}>{item.med_type} • {item.unit} • Batch: {item.batch_no}</div>
                                        </td>
                                        <td style={{ padding: '15px 25px', fontSize: '0.85rem', color: '#495057' }}>{item.generic_name}</td>
                                        <td style={{ padding: '15px 25px' }}>
                                            <div style={{ fontWeight: '700', color: stock <= reorder ? '#dc3545' : '#212529' }}>{stock} Units</div>
                                            {stock <= reorder && <div style={{ fontSize: '0.65rem', color: '#dc3545', fontWeight: '700' }}>REORDER ALERT</div>}
                                        </td>
                                        <td style={{ padding: '15px 25px' }}>
                                            <div style={{ fontSize: '0.85rem', fontWeight: '600', color: isExpired ? '#dc3545' : (isNearingExpiry ? '#fd7e14' : '#28a745') }}>
                                                Exp: {item.expiry_date}
                                            </div>
                                            <div style={{ fontSize: '0.7rem' }}>
                                                {item.prescription_required ? (
                                                    <span style={{ color: '#ffc107', fontWeight: '700' }}>PRESCRIPTION MANDATORY</span>
                                                ) : (
                                                    <span style={{ color: '#28a745', fontWeight: '700' }}>OTC (General Sale)</span>
                                                )}
                                            </div>
                                        </td>
                                        <td style={{ padding: '15px 25px', textAlign: 'right', fontWeight: '700', color: '#007bff' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '10px' }}>
                                                <span>KES {Number(item.selling_price || 0).toLocaleString()}</span>
                                                <button 
                                                    onClick={() => updatePrice(item.id, item.selling_price)}
                                                    style={{ background: 'transparent', border: '1px solid #007bff', color: '#007bff', borderRadius: '4px', cursor: 'pointer', padding: '4px 8px', fontSize: '0.7rem', fontWeight: '700' }}
                                                >
                                                    EDIT
                                                </button>
                                            </div>
                                        </td>
                                        <td style={{ padding: '15px 25px', textAlign: 'right' }}>
                                            <button 
                                                onClick={() => toggleStatus(item.id, item.is_active)}
                                                style={{
                                                    padding: '6px 12px',
                                                    border: 'none',
                                                    borderRadius: '4px',
                                                    fontWeight: '700',
                                                    fontSize: '0.75rem',
                                                    cursor: 'pointer',
                                                    background: item.is_active ? '#28a745' : '#dc3545',
                                                    color: 'white'
                                                }}
                                            >
                                                {item.is_active ? 'IN SERVICE' : 'HALTED'}
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {showAddModal && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
                        <div style={{ background: 'white', width: '100%', maxWidth: '900px', maxHeight: '90vh', borderRadius: '8px', overflowY: 'auto', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
                            <div style={{ position: 'sticky', top: 0, background: 'white', padding: '25px 40px', borderBottom: '1px solid #dee2e6', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 10 }}>
                                <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#1e293b' }}>Comprehensive Medicine Registration</h3>
                                <button onClick={() => setShowAddModal(false)} style={{ border: 'none', background: '#f1f5f9', color: '#64748b', padding: '8px', borderRadius: '50%', cursor: 'pointer' }}><X size={20} /></button>
                            </div>
                            
                            <form onSubmit={handleAdd} style={{ padding: '40px' }}>
                                {/* Section 1: Basic Identification */}
                                <div style={{ marginBottom: '40px' }}>
                                    <h4 style={{ fontSize: '0.9rem', fontWeight: '800', color: '#007bff', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '20px', borderLeft: '4px solid #007bff', paddingLeft: '12px' }}>1. Basic Identification (The Label)</h4>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1.5fr 1fr', gap: '20px', marginBottom: '20px' }}>
                                        <div className="form-group">
                                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#64748b', marginBottom: '8px' }}>MEDICINE NAME (BRAND)</label>
                                            <input type="text" placeholder="e.g. Augmentin" className="input-field" required value={newMed.med_name} onChange={e => setNewMed({...newMed, med_name: e.target.value})} />
                                        </div>
                                        <div className="form-group">
                                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#64748b', marginBottom: '8px' }}>GENERIC NAME (INGREDIENT)</label>
                                            <input type="text" placeholder="e.g. Amoxicillin + Clavulanic Acid" className="input-field" required value={newMed.generic_name} onChange={e => setNewMed({...newMed, generic_name: e.target.value})} />
                                        </div>
                                        <div className="form-group">
                                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#64748b', marginBottom: '8px' }}>STRENGTH</label>
                                            <input type="text" placeholder="e.g. 500mg, 10mg/ml" className="input-field" required value={newMed.strength} onChange={e => setNewMed({...newMed, strength: e.target.value})} />
                                        </div>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                        <div className="form-group">
                                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#64748b', marginBottom: '8px' }}>MEDICINE TYPE / FORM</label>
                                            <select className="input-field" value={newMed.med_form} onChange={e => setNewMed({...newMed, med_form: e.target.value})}>
                                                <option>Tablet</option><option>Syrup</option><option>Injection</option><option>Ointment</option><option>Inhaler</option><option>Drops</option>
                                            </select>
                                        </div>
                                        <div className="form-group">
                                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#64748b', marginBottom: '8px' }}>BARCODE (SKU/SCAN)</label>
                                            <input type="text" placeholder="Scan or type barcode" className="input-field" value={newMed.barcode} onChange={e => setNewMed({...newMed, barcode: e.target.value})} />
                                        </div>
                                    </div>
                                </div>

                                {/* Section 2: Inventory & Logistics */}
                                <div style={{ marginBottom: '40px' }}>
                                    <h4 style={{ fontSize: '0.9rem', fontWeight: '800', color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '20px', borderLeft: '4px solid #10b981', paddingLeft: '12px' }}>2. Inventory & Logistics (The Store)</h4>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                                        <div className="form-group">
                                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#64748b', marginBottom: '8px' }}>BATCH NUMBER</label>
                                            <input type="text" placeholder="Batch ID" className="input-field" required value={newMed.batch_no} onChange={e => setNewMed({...newMed, batch_no: e.target.value})} />
                                        </div>
                                        <div className="form-group">
                                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#64748b', marginBottom: '8px' }}>EXPIRY DATE</label>
                                            <input type="date" className="input-field" required value={newMed.expiry_date} onChange={e => setNewMed({...newMed, expiry_date: e.target.value})} />
                                        </div>
                                        <div className="form-group">
                                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#64748b', marginBottom: '8px' }}>STOCK QUANTITY</label>
                                            <input type="number" className="input-field" required value={newMed.stock_qty || ''} onChange={e => setNewMed({...newMed, stock_qty: parseInt(e.target.value) || 0})} />
                                        </div>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                        <div className="form-group">
                                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#64748b', marginBottom: '8px' }}>REORDER LEVEL (THRESHOLD)</label>
                                            <input type="number" className="input-field" required value={newMed.reorder_level || ''} onChange={e => setNewMed({...newMed, reorder_level: parseInt(e.target.value) || 0})} />
                                        </div>
                                        <div className="form-group">
                                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#64748b', marginBottom: '8px' }}>UNIT OF MEASURE</label>
                                            <input type="text" placeholder="e.g. Pack of 30, Bottle 100ml" className="input-field" required value={newMed.unit} onChange={e => setNewMed({...newMed, unit: e.target.value})} />
                                        </div>
                                    </div>
                                </div>

                                {/* Section 3: Financials */}
                                <div style={{ marginBottom: '40px' }}>
                                    <h4 style={{ fontSize: '0.9rem', fontWeight: '800', color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '20px', borderLeft: '4px solid #f59e0b', paddingLeft: '12px' }}>3. Financials (The Business)</h4>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                                        <div className="form-group">
                                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#64748b', marginBottom: '8px' }}>BUYING PRICE (KES)</label>
                                            <input type="number" step="0.01" className="input-field" required value={newMed.buying_price || ''} onChange={e => setNewMed({...newMed, buying_price: parseFloat(e.target.value) || 0})} />
                                        </div>
                                        <div className="form-group">
                                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#64748b', marginBottom: '8px' }}>SELLING PRICE (KES)</label>
                                            <input type="number" step="0.01" className="input-field" required value={newMed.selling_price || ''} onChange={e => setNewMed({...newMed, selling_price: parseFloat(e.target.value) || 0})} />
                                        </div>
                                        <div className="form-group">
                                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#64748b', marginBottom: '8px' }}>TAX / VAT %</label>
                                            <input type="number" className="input-field" required value={newMed.tax_rate} onChange={e => setNewMed({...newMed, tax_rate: parseInt(e.target.value) || 0})} />
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#64748b', marginBottom: '8px' }}>SUPPLIER SOURCE</label>
                                        <select className="input-field" value={newMed.supplier_id} onChange={e => setNewMed({...newMed, supplier_id: e.target.value})}>
                                            <option value="">No Supplier Selected</option>
                                            {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                        </select>
                                    </div>
                                </div>

                                {/* Section 4: Clinical Safety */}
                                <div style={{ marginBottom: '40px' }}>
                                    <h4 style={{ fontSize: '0.9rem', fontWeight: '800', color: '#ef4444', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '20px', borderLeft: '4px solid #ef4444', paddingLeft: '12px' }}>4. Clinical Safety (The Doctor's View)</h4>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px' }}>
                                        <div className="form-group">
                                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#64748b', marginBottom: '8px' }}>CLINICAL CATEGORY</label>
                                            <select className="input-field" value={newMed.category} onChange={e => setNewMed({...newMed, category: e.target.value})}>
                                                <option>Antibiotic</option><option>Antimalarial</option><option>Analgesic</option><option>Narcotic/Controlled</option><option>Supplement</option>
                                            </select>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', height: '100%', paddingTop: '20px' }}>
                                            <label style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.9rem', fontWeight: '700', color: '#334155', cursor: 'pointer' }}>
                                                <input type="checkbox" style={{ width: '20px', height: '20px' }} checked={newMed.prescription_required} onChange={e => setNewMed({...newMed, prescription_required: e.target.checked})} /> 
                                                PRESCRIPTION REQUIRED?
                                            </label>
                                        </div>
                                    </div>
                                    <div style={{ padding: '15px', background: '#fff1f2', borderRadius: '8px', border: '1px solid #fecaca', fontSize: '0.8rem', color: '#be123c', fontWeight: '600' }}>
                                        Note: If "Prescription Required" is checked, the POS Workbench will strictly require a Doctor's ID to dispense this medication.
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '15px', marginTop: '20px' }}>
                                    <button type="submit" style={{ flex: 1, padding: '18px', background: '#007bff', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '800', fontSize: '1rem', cursor: 'pointer', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>INITIALIZE MEDICATION INTO SYSTEM</button>
                                    <button type="button" onClick={() => setShowAddModal(false)} style={{ padding: '18px 30px', background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }}>CANCEL</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
        </div>
    );
};

export default PharmaInventory;
