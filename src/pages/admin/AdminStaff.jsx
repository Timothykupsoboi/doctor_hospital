// =============================================================
// FILE: AdminStaff.jsx
// PURPOSE: React component / entry point for the eDoc Hospital
//          frontend. Part of the Vite + React SPA.
// =============================================================
import React, { useState, useEffect } from 'react';
import { getAllStaff, createStaffAccount, updateStaffStatus, deleteStaffAccount, updateStaffAccount } from '../../lib/api';
import { UserPlus, Search, Shield, Stethoscope, Pill, FlaskConical, UserCheck, MoreVertical, X, Phone, Mail, Key } from 'lucide-react';
import { useNotification } from '../../components/NotificationContext';

const AdminStaff = () => {
    const { showNotification } = useNotification();
    const [staff, setStaff] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [formData, setFormData] = useState({ name: '', email: '', password: '', phone: '', role: 'Doctor', username: '' });
    const [isEditing, setIsEditing] = useState(false);
    const [selectedStaff, setSelectedStaff] = useState(null);

    const formatPhone = (val) => {
        const digits = val.replace(/\D/g, '').slice(0, 10);
        return digits;
    };

    useEffect(() => {
        fetchStaff();
    }, []);

    const fetchStaff = async () => {
        const { staff, errors } = await getAllStaff();
        if (errors.length === 0) setStaff(staff || []);
    };

    const handleAddStaff = async (e) => {
        e.preventDefault();
        const { error } = await createStaffAccount(formData);
        if (!error) {
            showNotification("Staff account provisioned successfully!", "success");
            setShowModal(false);
            fetchStaff();
            setFormData({ name: '', email: '', password: '', phone: '', role: 'Doctor', username: '' });
        } else {
            showNotification(`Error adding staff: ${error.message || "Unknown error"}`, "error");
        }
    };

    const handleEditStaff = async (e) => {
        e.preventDefault();
        const { error } = await updateStaffAccount(formData.email, formData);
        if (!error) {
            showNotification("Staff account updated successfully!", "success");
            setShowModal(false);
            setIsEditing(false);
            setSelectedStaff(null);
            fetchStaff();
            setFormData({ name: '', email: '', password: '', phone: '', role: 'Doctor', username: '' });
        } else {
            showNotification(`Error updating staff: ${error.message || "Unknown error"}`, "error");
        }
    };

    const getRoleIcon = (role) => {
        switch(role) {
            case 'Doctor': return <Stethoscope size={18} color="#10b981" />;
            case 'Pharmacy': return <Pill size={18} color="#0ea5e9" />;
            case 'Lab': return <FlaskConical size={18} color="#8b5cf6" />;
            case 'Receptionist': return <UserCheck size={18} color="#f59e0b" />;
            default: return <Shield size={18} color="#64748b" />;
        }
    };

    const filtered = staff.filter(s => 
        (s.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.role || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div style={{ padding: '48px 64px', maxWidth: '1600px', margin: '0 auto', background: '#f8fafc', minHeight: '100vh' }}>
                <header style={{ marginBottom: '48px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <div>
                        <h1 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '8px' }}>Staff Management</h1>
                        <p style={{ color: 'var(--text-muted)' }}>Manage hospital personnel, roles, and access credentials.</p>
                    </div>
                    <button onClick={() => { setIsEditing(false); setFormData({ name: '', email: '', password: '', phone: '', role: 'Doctor', username: '' }); setShowModal(true); }} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <UserPlus size={18} /> Add New Staff
                    </button>
                </header>

                <div style={{ marginBottom: '24px', position: 'relative' }}>
                    <Search size={18} style={{ position: 'absolute', left: '16px', top: '14px', color: 'var(--text-muted)' }} />
                    <input 
                        type="text" 
                        placeholder="Search staff by name or department..." 
                        className="input-field" 
                        style={{ paddingLeft: '48px' }} 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div style={{ background: 'white', borderRadius: '24px', border: '1px solid var(--border)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead style={{ background: '#f8fafc', borderBottom: '1px solid var(--border)' }}>
                            <tr>
                                <th style={{ textAlign: 'left', padding: '16px 24px', fontSize: '0.875rem', fontWeight: '700', color: '#64748b' }}>EMPLOYEE</th>
                                <th style={{ textAlign: 'left', padding: '16px 24px', fontSize: '0.875rem', fontWeight: '700', color: '#64748b' }}>DEPARTMENT</th>
                                <th style={{ textAlign: 'left', padding: '16px 24px', fontSize: '0.875rem', fontWeight: '700', color: '#64748b' }}>CONTACT</th>
                                <th style={{ textAlign: 'right', padding: '16px 24px', fontSize: '0.875rem', fontWeight: '700', color: '#64748b' }}>STATUS</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(s => (
                                <tr key={`${s.role}-${s.id}`} style={{ borderBottom: '1px solid var(--border)', background: s.status === 'suspended' ? '#fff1f2' : 'transparent' }}>
                                    <td style={{ padding: '16px 24px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: s.status === 'suspended' ? '#fda4af' : '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', color: 'var(--primary)' }}>
                                                {(s.name || 'U').charAt(0)}
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: '700', color: s.status === 'suspended' ? '#be123c' : 'inherit' }}>{s.name}</div>
                                                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>ID: {s.role.slice(0,1).toUpperCase()}-{s.id}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td style={{ padding: '16px 24px' }}>
                                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 12px', background: 'white', borderRadius: '10px', fontSize: '0.875rem', fontWeight: '600', border: '1px solid #e2e8f0' }}>
                                            {getRoleIcon(s.role)}
                                            {s.role}
                                        </div>
                                    </td>
                                    <td style={{ padding: '16px 24px' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                            <div style={{ fontSize: '0.875rem', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <Mail size={12} /> {s.email}
                                            </div>
                                        </div>
                                    </td>
                                    <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                            <button 
                                                onClick={() => {
                                                    setIsEditing(true);
                                                    setSelectedStaff(s);
                                                    setFormData({ name: s.name, email: s.email, phone: s.phone || '', role: s.role, username: s.username || '' });
                                                    setShowModal(true);
                                                }}
                                                style={{ padding: '6px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#0ea5e9', color: 'white', fontSize: '0.75rem', fontWeight: '700', cursor: 'pointer' }}
                                            >
                                                EDIT
                                            </button>
                                            <button 
                                                onClick={async () => {
                                                    const newStatus = s.status === 'suspended' ? 'active' : 'suspended';
                                                    await updateStaffStatus(s.email, newStatus);
                                                    fetchStaff();
                                                }}
                                                style={{ 
                                                    padding: '6px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', 
                                                    background: s.status === 'suspended' ? '#10b981' : '#f59e0b', 
                                                    color: 'white', fontSize: '0.75rem', fontWeight: '700', cursor: 'pointer' 
                                                }}
                                            >
                                                {s.status === 'suspended' ? 'ACTIVATE' : 'SUSPEND'}
                                            </button>
                                            <button 
                                                onClick={async () => {
                                                    if(confirm(`Permanently delete ${s.name}?`)) {
                                                        await deleteStaffAccount(s.email);
                                                        fetchStaff();
                                                    }
                                                }}
                                                style={{ padding: '6px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#ef4444', color: 'white', fontSize: '0.75rem', fontWeight: '700', cursor: 'pointer' }}
                                            >
                                                DELETE
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Add Staff Modal */}
                {showModal && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                        <div style={{ background: 'white', width: '100%', maxWidth: '500px', borderRadius: '32px', padding: '40px', boxShadow: 'var(--shadow-lg)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '32px' }}>
                                <h3 style={{ fontSize: '1.5rem', fontWeight: '800' }}>{isEditing ? 'Edit Hospital Staff' : 'Add Hospital Staff'}</h3>
                                <button onClick={() => setShowModal(false)} style={{ border: 'none', background: 'none', cursor: 'pointer' }}><X size={24} /></button>
                            </div>
                            <form onSubmit={isEditing ? handleEditStaff : handleAddStaff} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '700', marginBottom: '8px' }}>Full Name</label>
                                    <input type="text" className="input-field" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '700', marginBottom: '8px' }}>Username</label>
                                    <input type="text" className="input-field" required value={formData.username || ''} onChange={e => setFormData({...formData, username: e.target.value})} />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '16px' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '700', marginBottom: '8px' }}>Email Address</label>
                                        <input type="email" className="input-field" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} disabled={isEditing} style={{ background: isEditing ? '#f1f5f9' : 'white' }} />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '700', marginBottom: '8px' }}>Department</label>
                                        <select className="input-field" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} disabled={isEditing} style={{ background: isEditing ? '#f1f5f9' : 'white' }}>
                                            <option>Doctor</option>
                                            <option>Pharmacy</option>
                                            <option>Lab</option>
                                            <option>Receptionist</option>
                                        </select>
                                    </div>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '16px' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '700', marginBottom: '8px' }}>Temporary Password</label>
                                        <div style={{ position: 'relative' }}>
                                            <Key size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: '#94a3b8' }} />
                                            <input type="text" className="input-field" required={!isEditing} value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} disabled={isEditing} style={{ background: isEditing ? '#f1f5f9' : 'white', paddingLeft: '36px' }} />
                                        </div>
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '700', marginBottom: '8px' }}>Phone Number</label>
                                        <input type="text" className="input-field" required maxLength="10" value={formData.phone} onChange={e => setFormData({...formData, phone: formatPhone(e.target.value)})} />
                                    </div>
                                </div>
                                <button type="submit" className="btn-primary" style={{ marginTop: '12px', padding: '16px' }}>{isEditing ? 'Save Changes' : 'Provision Staff Account'}</button>
                            </form>
                        </div>
                    </div>
                )}
        </div>
    );
};

export default AdminStaff;
