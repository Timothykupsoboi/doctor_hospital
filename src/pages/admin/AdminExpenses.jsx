// =============================================================
// FILE: AdminExpenses.jsx
// PURPOSE: React component / entry point for the eDoc Hospital
//          frontend. Part of the Vite + React SPA.
// =============================================================
import React, { useState, useEffect } from 'react';
import { getAdminExpenses, createExpense } from '../../lib/api';
import { Plus, Calendar, X } from 'lucide-react';

const AdminExpenses = () => {
    const [expenses, setExpenses] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({ category: 'Utilities', amount: '', description: '' });

    useEffect(() => {
        fetchExpenses();
    }, []);

    const fetchExpenses = async () => {
        const { data, error } = await getAdminExpenses();
        if (!error) setExpenses(data || []);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const { error } = await createExpense(formData);
        if (!error) {
            setShowModal(false);
            fetchExpenses();
            setFormData({ category: 'Utilities', amount: '', description: '' });
        }
    };

    return (
        <div style={{ padding: '40px 56px', maxWidth: '1600px', margin: '0 auto', background: '#f8fafc', minHeight: '100vh' }}>
                <header style={{ marginBottom: '48px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <div>
                        <h1 style={{ fontSize: '2.25rem', fontWeight: '800', letterSpacing: '-0.02em', marginBottom: '8px' }}>Operational Expenses</h1>
                        <p style={{ color: '#64748b' }}>Track hospital OPEX, salaries, and utility overheads.</p>
                    </div>
                    <button onClick={() => setShowModal(true)} style={{ padding: '12px 24px', background: '#007bff', color: 'white', border: 'none', borderRadius: '12px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Plus size={18} /> Log New Expense
                    </button>
                </header>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
                    {expenses.map(e => (
                        <div key={e.id} style={{ background: 'white', padding: '24px', borderRadius: '24px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                                <div style={{ padding: '8px 12px', background: '#fef2f2', color: '#ef4444', borderRadius: '12px', fontSize: '0.75rem', fontWeight: '800' }}>
                                    {(e.category || 'General').toUpperCase()}
                                </div>
                                <div style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <Calendar size={14} /> {new Date(e.expense_date).toLocaleDateString()}
                                </div>
                            </div>
                            <h3 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '8px' }}>KSh {Number(e.amount).toLocaleString()}</h3>
                            <p style={{ color: '#64748b', fontSize: '0.875rem', lineHeight: '1.5' }}>{e.description}</p>
                        </div>
                    ))}
                </div>

                {showModal && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                        <div style={{ background: 'white', width: '100%', maxWidth: '500px', borderRadius: '32px', padding: '40px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '32px' }}>
                                <h3 style={{ fontSize: '1.5rem', fontWeight: '800' }}>Log OPEX Expense</h3>
                                <button onClick={() => setShowModal(false)} style={{ border: 'none', background: 'none', cursor: 'pointer' }}><X size={24} /></button>
                            </div>
                            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '700', marginBottom: '8px' }}>Expense Category</label>
                                    <select style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0' }} value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                                        <option>Utilities (Power/Water)</option>
                                        <option>Staff Salaries</option>
                                        <option>Facility Rent</option>
                                        <option>Medical Supplies</option>
                                        <option>Maintenance</option>
                                        <option>Other</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '700', marginBottom: '8px' }}>Amount (KSh)</label>
                                    <input type="number" style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0' }} required value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '700', marginBottom: '8px' }}>Description / Memo</label>
                                    <textarea style={{ width: '100%', height: '100px', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', resize: 'none' }} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                                </div>
                                <button type="submit" style={{ padding: '16px', background: '#007bff', color: 'white', border: 'none', borderRadius: '12px', fontWeight: '800', cursor: 'pointer', marginTop: '12px' }}>Record Expense</button>
                            </form>
                        </div>
                    </div>
                )}
        </div>
    );
};

export default AdminExpenses;
