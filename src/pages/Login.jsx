// =============================================================
// FILE: Login.jsx
// PURPOSE: Login page using Supabase Auth.
//          Replaces old fetch('/api/login') with supabase.auth.signInWithPassword().
//          After login, reads usertype from user_metadata and redirects
//          to the correct role dashboard (/admin, /doctor, /registrar, /lab, /pharmacy).
// =============================================================

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { LogIn, Eye, EyeOff, AlertCircle, LockKeyhole, HeartPulse, Microscope, KeyRound, ShieldCheck, UserCheck, Activity, ArrowLeft } from 'lucide-react';

// Route map: usertype code → dashboard path
const ROLE_ROUTES = {
  'a': '/admin',
  'd': '/doctor',
  'r': '/registrar',
  'l': '/lab',
  'ph': '/pharmacy',
};

const Login = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // ----------------------------------------------------------
  // handleLogin: called when the form is submitted
  // ----------------------------------------------------------
  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // 1. Authenticate with Supabase Auth
    let emailToUse = email;
    
    if (!email.includes('@')) {
      // It's likely a username!
      const { data: profileData } = await supabase
        .from('profiles')
        .select('email')
        .ilike('username', email)
        .single();
      if (profileData) {
        emailToUse = profileData.email;
      } else {
        setError('Username not found.');
        setLoading(false);
        return;
      }
    }

    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email: emailToUse,
      password,
    });

    if (authError) {
      setError(authError.message || 'Invalid email or password.');
      setLoading(false);
      return;
    }

    // 2. Fetch the role from the centralized profiles table
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .single();

    const usertype = profile?.role || data.user?.user_metadata?.usertype;

    if (!usertype || !ROLE_ROUTES[usertype]) {
      setError('Account profile not found. Please contact the administrator.');
      await supabase.auth.signOut();
      setLoading(false);
      return;
    }

    // 3. Redirect to the correct dashboard
    navigate(ROLE_ROUTES[usertype]);
    setLoading(false);
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#fff7ed',
      fontFamily: "'Inter', sans-serif",
      padding: '24px',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Top Left Back Button */}
      <Link to="/" style={{
          position: 'absolute',
          top: '32px',
          left: '32px',
          display: 'flex', 
          alignItems: 'center', 
          gap: '8px', 
          color: '#f97316', 
          textDecoration: 'none', 
          fontWeight: '800',
          fontSize: '0.9rem',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          padding: '12px 20px',
          background: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(10px)',
          borderRadius: '100px',
          border: '1px solid rgba(249, 115, 22, 0.2)',
          boxShadow: '0 4px 15px rgba(249, 115, 22, 0.15)',
          zIndex: 50,
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
      }}
      onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 10px 25px rgba(249, 115, 22, 0.25)';
      }}
      onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 4px 15px rgba(249, 115, 22, 0.15)';
      }}
      >
          <ArrowLeft size={18} /> Back to Home
      </Link>

      {/* Dynamic Background Elements */}
      <div style={{ position: 'absolute', top: '-10%', right: '-5%', width: '500px', height: '500px', background: 'radial-gradient(circle, rgba(251, 146, 60, 0.1) 0%, transparent 70%)', borderRadius: '50%' }}></div>
      <div style={{ position: 'absolute', bottom: '-10%', left: '-5%', width: '400px', height: '400px', background: 'radial-gradient(circle, rgba(249, 115, 22, 0.08) 0%, transparent 70%)', borderRadius: '50%' }}></div>

      <div style={{
        width: '100%',
        maxWidth: 1100,
        background: 'rgba(255, 255, 255, 0.6)',
        backdropFilter: 'blur(30px)',
        border: '1px solid rgba(255, 255, 255, 0.7)',
        borderRadius: 56,
        display: 'flex',
        overflow: 'hidden',
        boxShadow: '0 50px 100px -20px rgba(249, 115, 22, 0.12), 0 30px 60px -30px rgba(0,0,0,0.1)',
        position: 'relative',
        zIndex: 1,
      }}>
        {/* Left: Login Form (Unchanged layout, refined style) */}
        <div style={{
          flex: 1,
          padding: '80px 70px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          background: 'rgba(255, 255, 255, 0.2)',
          borderRight: '1px solid rgba(249, 115, 22, 0.05)'
        }}>
          <div style={{ marginBottom: 48 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f97316', fontWeight: '800', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '12px' }}>
                <div style={{ width: '20px', height: '2px', background: '#f97316' }}></div> MOONVIEW MEDICAL
            </div>
            <h1 style={{ color: '#0f172a', fontSize: '3.5rem', fontWeight: 900, marginBottom: 8, letterSpacing: '-2px', lineHeight: '1' }}>
              Portal <span style={{ color: '#f97316' }}>Login</span>
            </h1>
            <p style={{ color: '#64748b', fontSize: '1rem', fontWeight: '500' }}>Enter your clinical credentials to proceed.</p>
          </div>

          {error && (
            <div style={{ background: '#fee2e2', padding: '14px', borderRadius: '16px', color: '#991b1b', marginBottom: '32px', fontSize: '0.9rem', fontWeight: '600', border: '1px solid #fecaca', display: 'flex', alignItems: 'center', gap: 10 }}>
              <AlertCircle size={18} />
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div>
              <label style={{ display: 'block', color: '#475569', fontSize: '0.85rem', fontWeight: 800, marginBottom: 10, paddingLeft: '4px' }}>EMAIL OR USERNAME</label>
              <input
                type="text"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="doctor@moonview.med or username"
                style={{
                  width: '100%', boxSizing: 'border-box', padding: '16px 20px',
                  background: 'white', border: '2px solid #f1f5f9', borderRadius: '18px',
                  outline: 'none', transition: '0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  fontSize: '1rem'
                }}
                className="login-input"
              />
            </div>

            <div>
              <label style={{ display: 'block', color: '#475569', fontSize: '0.85rem', fontWeight: 800, marginBottom: 10, paddingLeft: '4px' }}>PASSWORD</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  style={{
                    width: '100%', boxSizing: 'border-box', padding: '16px 20px',
                    background: 'white', border: '2px solid #f1f5f9', borderRadius: '18px',
                    outline: 'none', fontSize: '1rem'
                  }}
                  className="login-input"
                />
                <button type="button" onClick={() => setShowPwd(!showPwd)} style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '8px' }}>
                  {showPwd ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                background: '#f97316', color: 'white', padding: '18px', borderRadius: '18px',
                border: 'none', fontSize: '1.1rem', fontWeight: '900', cursor: 'pointer',
                boxShadow: '0 20px 40px -10px rgba(249, 115, 22, 0.4)', transition: '0.3s all',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px'
              }}
              className="login-btn"
            >
              {loading ? 'Authenticating...' : <><KeyRound size={20} /> Sign In</>}
            </button>
          </form>
        </div>

        {/* Right: Design-Polished Hero Section */}
        <div style={{
          flex: 1.2,
          background: 'linear-gradient(135deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.1) 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Hero Image with Design Polish */}
          <div style={{ position: 'relative', width: '90%', maxWidth: '500px', animation: 'bob 6s infinite ease-in-out' }}>
            {/* Glow behind image */}
            <div style={{ position: 'absolute', top: '10%', left: '10%', right: '10%', bottom: '10%', background: '#f97316', filter: 'blur(100px)', opacity: 0.15, borderRadius: '50%' }}></div>
            
            {/* The Image with custom mask/clip */}
            <div style={{ 
                borderRadius: '40px', 
                overflow: 'hidden', 
                border: '8px solid rgba(255,255,255,0.8)',
                boxShadow: '0 30px 60px -15px rgba(0,0,0,0.3)',
                position: 'relative',
                zIndex: 2
            }}>
                <img 
                    src="/media__1778189859634.jpg" 
                    alt="Clinical Team" 
                    style={{ width: '100%', height: 'auto', display: 'block', transform: 'scale(1.05)' }} 
                />
            </div>

            {/* Floating Design Elements (Badges) */}
            <div style={{ 
                position: 'absolute', 
                top: '20px', 
                right: '-30px', 
                background: 'rgba(255,255,255,0.9)', 
                backdropFilter: 'blur(10px)',
                padding: '12px 20px', 
                borderRadius: '20px', 
                boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                zIndex: 3,
                animation: 'float 4s infinite ease-in-out'
            }}>
                <LockKeyhole style={{ color: '#10b981' }} size={20} />
                <span style={{ fontWeight: '800', fontSize: '0.8rem', color: '#1e293b' }}>SECURE ACCESS</span>
            </div>

            <div style={{ 
                position: 'absolute', 
                bottom: '40px', 
                left: '-30px', 
                background: 'rgba(255,255,255,0.9)', 
                backdropFilter: 'blur(10px)',
                padding: '12px 20px', 
                borderRadius: '20px', 
                boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                zIndex: 3,
                animation: 'float 5s infinite ease-in-out'
            }}>
                <HeartPulse style={{ color: '#3b82f6' }} size={20} />
                <span style={{ fontWeight: '800', fontSize: '0.8rem', color: '#1e293b' }}>VERIFIED STAFF</span>
            </div>

            <div style={{ 
                position: 'absolute', 
                top: '50%', 
                left: '-20px', 
                background: 'rgba(255,255,255,0.9)', 
                backdropFilter: 'blur(10px)',
                width: '44px',
                height: '44px',
                borderRadius: '12px', 
                boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 3,
                animation: 'float 7s infinite ease-in-out'
            }}>
                <Microscope style={{ color: '#f97316' }} size={24} />
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes bob {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-20px); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0) translateX(0); }
          50% { transform: translateY(-10px) translateX(5px); }
        }
        .login-input:focus {
            border-color: #f97316 !important;
            box-shadow: 0 0 0 4px rgba(249, 115, 22, 0.1);
        }
        .login-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 25px 50px -12px rgba(249, 115, 22, 0.5);
        }
        .login-btn:active {
            transform: translateY(0);
        }
      `}</style>
    </div>
  );
};

export default Login;
