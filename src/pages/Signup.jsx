// =============================================================
// FILE: Signup.jsx
// PURPOSE: React component / entry point for the eDoc Hospital
//          frontend. Part of the Vite + React SPA.
// =============================================================
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const Signup = () => {
  const [formData, setFormData] = useState({
    fname: '',
    lname: '',
    address: '',
    nic: '',
    dob: '',
    email: '',
    tele: '',
    password: '',
    cpassword: ''
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.cpassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      const fullName = [formData.fname, formData.lname].filter(Boolean).join(' ').trim();

      const { data: authData, error: authError } = await supabase.auth.signUp(
        {
          email: formData.email,
          password: formData.password,
        },
        {
          data: {
            usertype: 'patient',
            full_name: fullName,
            nic: formData.nic,
          },
        }
      );

      if (authError) {
        setError(authError.message || 'Signup failed');
        return;
      }

      const { data: patientData, error: patientError } = await supabase.from('patient').insert([
        {
          pname: fullName || `${formData.fname} ${formData.lname}`,
          pgender: 'Unknown',
          pdob: formData.dob || null,
          ptel: formData.tele || null,
          pemail: formData.email,
          paddress: formData.address || null,
          patient_display_id: formData.nic || null,
          pdate_registered: new Date().toISOString(),
          pstatus: 'active',
        },
      ]).select().single();

      if (patientError) {
        setError(patientError.message || 'Unable to save patient record');
        return;
      }

      navigate('/login');
    } catch (err) {
      setError(err.message || 'Network error');
    }
  };

  return (
    <center>
      <div className="container">
        <table border="0" style={{ width: '69%', margin: 0 }}>
          <tbody>
            <tr>
              <td colSpan="2">
                <p className="header-text">Let's Get Started</p>
                <p className="sub-text">Add Your Personal Details to Continue</p>
              </td>
            </tr>
            <tr>
              <td className="label-td" colSpan="2">
                <label htmlFor="fname" className="form-label">Name: </label>
              </td>
            </tr>
            <tr>
              <td className="label-td">
                <input type="text" name="fname" className="input-text" placeholder="First Name" required value={formData.fname} onChange={handleChange} />
              </td>
              <td className="label-td">
                <input type="text" name="lname" className="input-text" placeholder="Last Name" required value={formData.lname} onChange={handleChange} />
              </td>
            </tr>
            <tr>
              <td className="label-td" colSpan="2">
                <label htmlFor="address" className="form-label">Address: </label>
              </td>
            </tr>
            <tr>
              <td className="label-td" colSpan="2">
                <input type="text" name="address" className="input-text" placeholder="Address" required value={formData.address} onChange={handleChange} />
              </td>
            </tr>
            <tr>
              <td className="label-td" colSpan="2">
                <label htmlFor="nic" className="form-label">NIC: </label>
              </td>
            </tr>
            <tr>
              <td className="label-td" colSpan="2">
                <input type="text" name="nic" className="input-text" placeholder="NIC Number" required value={formData.nic} onChange={handleChange} />
              </td>
            </tr>
            <tr>
              <td className="label-td" colSpan="2">
                <label htmlFor="dob" className="form-label">Date of Birth: </label>
              </td>
            </tr>
            <tr>
              <td className="label-td" colSpan="2">
                <input type="date" name="dob" className="input-text" required value={formData.dob} onChange={handleChange} />
              </td>
            </tr>
            <tr>
              <td className="label-td" colSpan="2">
                <label htmlFor="email" className="form-label">Email: </label>
              </td>
            </tr>
            <tr>
              <td className="label-td" colSpan="2">
                <input type="email" name="email" className="input-text" placeholder="Email Address" required value={formData.email} onChange={handleChange} />
              </td>
            </tr>
            <tr>
              <td className="label-td" colSpan="2">
                <label htmlFor="tele" className="form-label">Mobile Number: </label>
              </td>
            </tr>
            <tr>
              <td className="label-td" colSpan="2">
                <input type="tel" name="tele" className="input-text" placeholder="ex: 0712345678" pattern="[0-9]{10}" required value={formData.tele} onChange={handleChange} />
              </td>
            </tr>
            <tr>
              <td className="label-td" colSpan="2">
                <label htmlFor="password" className="form-label">Create New Password: </label>
              </td>
            </tr>
            <tr>
              <td className="label-td" colSpan="2">
                <input type="password" name="password" className="input-text" placeholder="New Password" required value={formData.password} onChange={handleChange} />
              </td>
            </tr>
            <tr>
              <td className="label-td" colSpan="2">
                <label htmlFor="cpassword" className="form-label">Confirm Password: </label>
              </td>
            </tr>
            <tr>
              <td className="label-td" colSpan="2">
                <input type="password" name="cpassword" className="input-text" placeholder="Confirm Password" required value={formData.cpassword} onChange={handleChange} />
              </td>
            </tr>
            {error && (
              <tr>
                <td colSpan="2" style={{ color: 'red', textAlign: 'center', paddingTop: '10px' }}>
                  {error}
                </td>
              </tr>
            )}
            <tr>
              <td colSpan="2">
                <br />
                <input type="button" value="Sign Up" className="login-btn btn-primary btn" onClick={handleSignup} />
              </td>
            </tr>
            <tr>
              <td colSpan="2">
                <br />
                <label htmlFor="" className="sub-text" style={{ fontWeight: 280 }}>Already have an account? </label>
                <Link to="/login" className="hover-link1 non-style-link">Login</Link>
                <br /><br /><br />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </center>
  );
};

export default Signup;
