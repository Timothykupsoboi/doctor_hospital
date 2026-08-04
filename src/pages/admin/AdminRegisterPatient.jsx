// =============================================================
// FILE: AdminRegisterPatient.jsx
// PURPOSE: React component / entry point for the eDoc Hospital
//          frontend. Part of the Vite + React SPA.
// =============================================================
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signUpPatient } from '../../lib/api';

const AdminRegisterPatient = () => {
    const [formData, setFormData] = useState({
        fname: '', lname: '', address: '', nic: '', dob: '',
        email: '', tele: '', password: '', cpassword: ''
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSignup = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (formData.password !== formData.cpassword) {
            setError('Passwords do not match');
            return;
        }

        try {
            const result = await signUpPatient(formData);

            if (result.error) {
                setError(result.error.message || 'Registration failed');
            } else {
                setSuccess('Patient registered successfully!');
                setFormData({
                    fname: '', lname: '', address: '', nic: '', dob: '',
                    email: '', tele: '', password: '', cpassword: ''
                });
            }
        } catch (err) {
            console.error('Signup failed', err);
            setError('Network error');
        }
    };

    return (
        <div style={{ padding: '48px 64px', maxWidth: '1600px', margin: '0 auto', background: '#f8fafc', minHeight: '100vh' }}>
                <header style={{ marginBottom: '48px' }}>
                    <h1 style={{ fontSize: '1.875rem', marginBottom: '8px' }}>Patient Registration</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Register a new patient into the offline healthcare system.</p>
                </header>

                <div className="glass-card" style={{ padding: '40px', maxWidth: '800px', background: 'white', borderRadius: '24px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
                    <form onSubmit={handleSignup} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                        <div>
                            <label className="form-label">First Name</label>
                            <input type="text" name="fname" className="input-field" required value={formData.fname} onChange={handleChange} />
                        </div>
                        <div>
                            <label className="form-label">Last Name</label>
                            <input type="text" name="lname" className="input-field" required value={formData.lname} onChange={handleChange} />
                        </div>

                        <div style={{ gridColumn: 'span 2' }}>
                            <label className="form-label">Residential Address</label>
                            <input type="text" name="address" className="input-field" required value={formData.address} onChange={handleChange} />
                        </div>

                        <div>
                            <label className="form-label">NIC Number</label>
                            <input type="text" name="nic" className="input-field" required value={formData.nic} onChange={handleChange} />
                        </div>
                        <div>
                            <label className="form-label">Date of Birth</label>
                            <input type="date" name="dob" className="input-field" required value={formData.dob} onChange={handleChange} />
                        </div>

                        <div>
                            <label className="form-label">Email Address</label>
                            <input type="email" name="email" className="input-field" required value={formData.email} onChange={handleChange} />
                        </div>
                        <div>
                            <label className="form-label">Mobile Number</label>
                            <input type="tel" name="tele" className="input-field" pattern="[0-9]{10}" required value={formData.tele} onChange={handleChange} />
                        </div>

                        <div>
                            <label className="form-label">Temp Password</label>
                            <input type="password" name="password" className="input-field" required value={formData.password} onChange={handleChange} />
                        </div>
                        <div>
                            <label className="form-label">Confirm Password</label>
                            <input type="password" name="cpassword" className="input-field" required value={formData.cpassword} onChange={handleChange} />
                        </div>

                        <div style={{ gridColumn: 'span 2', marginTop: '12px' }}>
                            {error && <div style={{ padding: '12px', background: '#fef2f2', border: '1px solid #fee2e2', borderRadius: '8px', color: '#dc2626', marginBottom: '16px' }}>{error}</div>}
                            {success && <div style={{ padding: '12px', background: '#ecfdf5', border: '1px solid #d1fae5', borderRadius: '8px', color: '#059669', marginBottom: '16px' }}>{success}</div>}
                            
                            <button type="submit" className="btn-primary" style={{ width: '100%', padding: '16px' }}>
                                Register Patient Profile
                            </button>
                        </div>
                    </form>
                </div>
        </div>
    );
};

export default AdminRegisterPatient;
