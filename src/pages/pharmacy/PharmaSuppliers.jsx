// =============================================================
// FILE: PharmaSuppliers.jsx
// PURPOSE: React component / entry point for the eDoc Hospital
//          frontend. Part of the Vite + React SPA.
// =============================================================
import React, { useState, useEffect } from 'react';
import { 
    Users, Plus, Search, X, 
    Activity, Calendar, ShieldCheck, Truck, Edit2, Trash2, ShieldOff, Check
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useNotification } from '../../components/NotificationContext';

const PharmaSuppliers = () => {
    const { showNotification } = useNotification();
    const [suppliers, setSuppliers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedSupplier, setSelectedSupplier] = useState(null);
    
    const [formData, setFormData] = useState({ 
        name: '', 
        contact_person: '', 
        phone: '', 
        email: '', 
        address: ''
    });

    const [editFormData, setEditFormData] = useState({
        name: '', 
        contact_person: '', 
        phone: '', 
        email: '', 
        address: ''
    });

    useEffect(() => {
        fetchSuppliers();
    }, []);

    const formatPhone = (val) => {
        const digits = val.replace(/\D/g, '').slice(0, 10);
        return digits;
    };

    const fetchSuppliers = async () => {
        try {
            const { data, error } = await supabase.from('suppliers').select('*');
            if (error) throw error;
            setSuppliers(data || []);
        } catch (e) {
            console.error(e);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const { error } = await supabase.from('suppliers').insert(formData);
            if (!error) {
                showNotification("Supplier added successfully!", "success");
                setShowModal(false);
                fetchSuppliers();
                setFormData({ name: '', contact_person: '', phone: '', email: '', address: '' });
            } else {
                console.error(error);
                showNotification(`Error adding supplier: ${error.message}`, "error");
            }
        } catch (e) {
            console.error(e);
            showNotification("An unexpected error occurred while adding the supplier.", "error");
        }
    };

    const handleEdit = (supplier) => {
        setSelectedSupplier(supplier);
        setEditFormData({
            name: supplier.name,
            contact_person: supplier.contact_person,
            phone: supplier.phone,
            email: supplier.email,
            address: supplier.address
        });
        setShowEditModal(true);
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        try {
            const { error } = await supabase
                .from('suppliers')
                .update(editFormData)
                .eq('id', selectedSupplier.id);

            if (!error) {
                showNotification("Supplier updated successfully!", "success");
                setShowEditModal(false);
                fetchSuppliers();
            } else {
                showNotification(`Error updating supplier: ${error.message}`, "error");
            }
        } catch (err) {
            showNotification("Update failed.", "error");
        }
    };

    const handleSuspend = async (supplier) => {
        const newStatus = !supplier.is_active;
        try {
            const { error } = await supabase
                .from('suppliers')
                .update({ is_active: newStatus })
                .eq('id', supplier.id);

            if (!error) {
                showNotification(`Supplier ${newStatus ? 'activated' : 'suspended'} successfully!`, "success");
                fetchSuppliers();
            } else {
                showNotification("Status update failed.", "error");
            }
        } catch (err) {
            showNotification("Error toggling status.", "error");
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to permanently delete this supplier?")) return;
        try {
            const { error } = await supabase
                .from('suppliers')
                .delete()
                .eq('id', id);

            if (!error) {
                showNotification("Supplier deleted permanently.", "success");
                fetchSuppliers();
            } else {
                showNotification("Delete failed.", "error");
            }
        } catch (err) {
            showNotification("Error deleting supplier.", "error");
        }
    };

    const filteredSuppliers = suppliers.filter(s => 
        (s.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.contact_person || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const metrics = [
        { label: 'Total Partners', count: suppliers.length, icon: Users, color: '#007bff' },
        { label: 'Active Contracts', count: suppliers.filter(s => s.is_active).length, icon: ShieldCheck, color: '#28a745' },
        { label: 'Logistics Nodes', count: 2, icon: Truck, color: '#f59e0b' },
        { label: 'System Health', count: '100%', icon: Activity, color: '#007bff' }
    ];

    const todayDate = new Date().toISOString().split('T')[0];

    return (
        <div style={{ padding: '24px 40px', maxWidth: '1600px', margin: '0 auto', background: '#ffffff', minHeight: '100vh' }}>
                {/* Edoc Style Header Search & Date */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', flexWrap: 'wrap', gap: '20px' }}>
                    <div style={{ display: 'flex', gap: '10px', flex: 1, minWidth: '300px' }}>
                        <div style={{ position: 'relative', flex: 1 }}>
                            <Search size={18} style={{ position: 'absolute', left: '15px', top: '12px', color: '#adb5bd' }} />
                            <input 
                                type="text" 
                                placeholder="Search supplier network..." 
                                style={{ width: '100%', padding: '10px 15px 10px 45px', border: '1px solid #dee2e6', borderRadius: '4px', fontSize: '0.9rem', background: '#f8f9fa' }} 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <button style={{ padding: '10px 25px', background: '#e7f2ff', color: '#007bff', border: 'none', borderRadius: '4px', fontWeight: '600', cursor: 'pointer' }}>Search</button>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px', textAlign: 'right' }}>
                        <div>
                            <div style={{ fontSize: '0.75rem', color: '#adb5bd', fontWeight: '700' }}>Directory Date</div>
                            <div style={{ fontSize: '1.1rem', fontWeight: '700', color: '#343a40' }}>{todayDate}</div>
                        </div>
                        <div style={{ padding: '10px', background: '#f8f9fa', border: '1px solid #dee2e6', borderRadius: '4px', color: '#343a40' }}>
                            <Calendar size={20} />
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#343a40' }}>Supplier Directory</h2>
                    <button onClick={() => setShowModal(true)} style={{ padding: '10px 20px', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Plus size={18} /> Add New Supplier
                    </button>
                </div>

                {/* Edoc Status Row */}
                <div className="responsive-grid grid-4" style={{ marginBottom: '40px' }}>
                    {metrics.map((stat, idx) => (
                        <div key={idx} style={{ background: 'white', padding: '20px 25px', borderRadius: '4px', border: '1px solid #dee2e6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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

                <div style={{ background: 'white', borderRadius: '4px', border: '1px solid #dee2e6', overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
                        <thead style={{ background: '#f8f9fa', borderBottom: '2px solid #007bff' }}>
                            <tr>
                                <th style={{ textAlign: 'left', padding: '15px 25px', fontSize: '0.85rem', fontWeight: '700', color: '#343a40' }}>SUPPLIER IDENTITY</th>
                                <th style={{ textAlign: 'left', padding: '15px 25px', fontSize: '0.85rem', fontWeight: '700', color: '#343a40' }}>CONTACT PERSON</th>
                                <th style={{ textAlign: 'left', padding: '15px 25px', fontSize: '0.85rem', fontWeight: '700', color: '#64748b' }}>CONTACT INFO</th>
                                <th style={{ textAlign: 'left', padding: '15px 25px', fontSize: '0.85rem', fontWeight: '700', color: '#64748b' }}>STATUS</th>
                                <th style={{ textAlign: 'right', padding: '15px 25px', fontSize: '0.85rem', fontWeight: '700', color: '#64748b' }}>ACTIONS</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredSuppliers.length === 0 ? (
                                <tr><td colSpan="5" style={{ padding: '80px', textAlign: 'center', color: '#adb5bd' }}>No partners found in directory.</td></tr>
                            ) : filteredSuppliers.map(s => (
                                <tr key={s.id} style={{ borderBottom: '1px solid #dee2e6' }}>
                                    <td style={{ padding: '15px 25px' }}>
                                        <div style={{ fontWeight: '700', color: '#343a40' }}>{s.name}</div>
                                        <div style={{ fontSize: '0.75rem', color: '#6c757d' }}>ID: #SUP-{String(s.id).padStart(4, '0')}</div>
                                    </td>
                                    <td style={{ padding: '15px 25px', fontSize: '0.85rem', color: '#495057' }}>{s.contact_person || 'N/A'}</td>
                                    <td style={{ padding: '15px 25px' }}>
                                        <div style={{ fontSize: '0.8rem', color: '#495057' }}>{s.email}</div>
                                        <div style={{ fontSize: '0.8rem', color: '#495057' }}>{s.phone}</div>
                                    </td>
                                    <td style={{ padding: '15px 25px' }}>
                                        <span style={{ 
                                            fontSize: '0.7rem', 
                                            padding: '4px 10px', 
                                            background: s.is_active ? '#ecfdf5' : '#fef2f2', 
                                            color: s.is_active ? '#10b981' : '#ef4444', 
                                            borderRadius: '20px', 
                                            fontWeight: '800',
                                            border: `1px solid ${s.is_active ? '#bbf7d0' : '#fee2e2'}`
                                        }}>
                                            {s.is_active ? 'ACTIVE' : 'SUSPENDED'}
                                        </span>
                                    </td>
                                    <td style={{ padding: '15px 25px', textAlign: 'right' }}>
                                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                            <button 
                                                onClick={() => handleEdit(s)}
                                                style={{ padding: '6px', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '6px', cursor: 'pointer', color: '#64748b' }}
                                                title="Edit"
                                            >
                                                <Edit2 size={14} />
                                            </button>
                                            <button 
                                                onClick={() => handleSuspend(s)}
                                                style={{ 
                                                    padding: '6px', 
                                                    background: s.is_active ? '#fffbeb' : '#ecfdf5', 
                                                    border: `1px solid ${s.is_active ? '#fde68a' : '#bbf7d0'}`, 
                                                    borderRadius: '6px', 
                                                    cursor: 'pointer', 
                                                    color: s.is_active ? '#f59e0b' : '#10b981' 
                                                }}
                                                title={s.is_active ? "Suspend" : "Activate"}
                                            >
                                                {s.is_active ? <ShieldOff size={14} /> : <Check size={14} />}
                                            </button>
                                            <button 
                                                onClick={() => handleDelete(s.id)}
                                                style={{ padding: '6px', background: '#fef2f2', border: '1px solid #fee2e2', borderRadius: '6px', cursor: 'pointer', color: '#ef4444' }}
                                                title="Delete"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Edit Supplier Modal */}
                {showEditModal && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                        <div style={{ background: 'white', width: '100%', maxWidth: '500px', borderRadius: '24px', padding: '40px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '32px' }}>
                                <h3 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#1e293b' }}>Edit Partner Details</h3>
                                <button onClick={() => setShowEditModal(false)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#94a3b8' }}><X size={24} /></button>
                            </div>
                            <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                <input type="text" placeholder="Company Name" style={{ width: '100%', padding: '12px', border: '1px solid #e2e8f0', borderRadius: '8px' }} required value={editFormData.name} onChange={e => setEditFormData({...editFormData, name: e.target.value})} />
                                <input type="text" placeholder="Contact Person" style={{ width: '100%', padding: '12px', border: '1px solid #e2e8f0', borderRadius: '8px' }} value={editFormData.contact_person} onChange={e => setEditFormData({...editFormData, contact_person: e.target.value})} />
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                    <input type="email" placeholder="Email Address" style={{ width: '100%', padding: '12px', border: '1px solid #e2e8f0', borderRadius: '8px' }} required value={editFormData.email} onChange={e => setEditFormData({...editFormData, email: e.target.value})} />
                                    <input type="text" placeholder="Phone Number" style={{ width: '100%', padding: '12px', border: '1px solid #e2e8f0', borderRadius: '8px' }} required maxLength="10" value={editFormData.phone} onChange={e => setEditFormData({...editFormData, phone: formatPhone(e.target.value)})} />
                                </div>
                                <textarea placeholder="Physical Address" style={{ width: '100%', padding: '12px', border: '1px solid #e2e8f0', borderRadius: '8px' }} rows="3" value={editFormData.address} onChange={e => setEditFormData({...editFormData, address: e.target.value})} />
                                <button type="submit" style={{ padding: '16px', background: '#007bff', color: 'white', border: 'none', borderRadius: '12px', fontWeight: '800', cursor: 'pointer', marginTop: '10px' }}>UPDATE PARTNER</button>
                            </form>
                        </div>
                    </div>
                )}

                {/* Edoc Style Add Supplier Modal */}
                {showModal && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                        <div style={{ background: 'white', width: '100%', maxWidth: '500px', borderRadius: '4px', padding: '30px', boxShadow: '0 1rem 3rem rgba(0,0,0,.175)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '25px', borderBottom: '1px solid #dee2e6', paddingBottom: '15px' }}>
                                <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#343a40' }}>Register New Supplier</h3>
                                <button onClick={() => setShowModal(false)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#adb5bd' }}><X size={24} /></button>
                            </div>
                            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                <input type="text" placeholder="Company Name" style={{ width: '100%', padding: '12px', border: '1px solid #dee2e6', borderRadius: '4px' }} required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                                <input type="text" placeholder="Contact Person" style={{ width: '100%', padding: '12px', border: '1px solid #dee2e6', borderRadius: '4px' }} value={formData.contact_person} onChange={e => setFormData({...formData, contact_person: e.target.value})} />
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                    <input type="email" placeholder="Email Address" style={{ width: '100%', padding: '12px', border: '1px solid #dee2e6', borderRadius: '4px' }} required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                                    <input type="text" placeholder="Phone Number" style={{ width: '100%', padding: '12px', border: '1px solid #dee2e6', borderRadius: '4px' }} required maxLength="10" value={formData.phone} onChange={e => setFormData({...formData, phone: formatPhone(e.target.value)})} />
                                </div>
                                <button type="submit" style={{ padding: '15px', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px', fontWeight: '700', cursor: 'pointer', marginTop: '10px' }}>ADD PARTNER</button>
                            </form>
                        </div>
                    </div>
                )}
        </div>
    );
};

export default PharmaSuppliers;
