// =============================================================
// FILE: Home.jsx
// PURPOSE: React component / entry point for the eDoc Hospital
//          frontend. Part of the Vite + React SPA.
// =============================================================
import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Stethoscope, User, Activity } from 'lucide-react';

const Home = () => {
    return (
        <div style={{
            height: '100vh',
            width: '100%',
            position: 'relative',
            overflow: 'hidden',
            fontFamily: "'Inter', sans-serif"
        }}>
            {/* Full Screen Background Hero */}
            <div style={{
                position: 'absolute',
                inset: 0,
                backgroundImage: 'url("/img/bg01.jpg")',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                zIndex: 0
            }}>
                {/* Overlay for better contrast if needed, but kept minimal */}
                <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'linear-gradient(rgba(0,0,0,0.2), rgba(0,0,0,0.1))',
                }}></div>
            </div>

            {/* Minimal Top Header */}
            <header style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                padding: '30px 50px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                zIndex: 10
            }}>
                <div style={{
                    color: 'white',
                    fontSize: '1.5rem',
                    fontWeight: '900',
                    letterSpacing: '-1px',
                    textShadow: '0 2px 4px rgba(0,0,0,0.3)'
                }}>
                    MOONVIEW <span style={{ fontWeight: '400', opacity: 0.9 }}>MEDICAL</span>
                </div>

                <Link
                    to="/login"
                    style={{
                        color: 'white',
                        background: 'rgba(255,255,255,0.2)',
                        backdropFilter: 'blur(10px)',
                        padding: '12px',
                        borderRadius: '14px',
                        border: '1px solid rgba(255,255,255,0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        textDecoration: 'none',
                        transition: '0.3s all',
                        boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(255,255,255,0.3)';
                        e.currentTarget.style.transform = 'scale(1.05)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(255,255,255,0.2)';
                        e.currentTarget.style.transform = 'scale(1)';
                    }}
                >
                    <User size={24} />
                </Link>
            </header>

            {/* Praise Content with Zoom Animation */}
            <div style={{
                position: 'absolute',
                top: '45%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                zIndex: 5,
                textAlign: 'center',
                color: 'white',
                width: '100%'
            }}>
                {/* Main Badge */}
                <div style={{
                    background: 'rgba(255,255,255,0.1)',
                    backdropFilter: 'blur(15px)',
                    padding: '20px 40px',
                    borderRadius: '30px',
                    border: '1px solid rgba(255,255,255,0.2)',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
                    display: 'inline-block',
                    animation: 'zoomIn 1.2s cubic-bezier(0.34, 1.56, 0.64, 1) both',
                    marginBottom: '30px'
                }}>
                    <h1 style={{
                        fontSize: '2.5rem',
                        fontWeight: '900',
                        margin: 0,
                        letterSpacing: '-1px',
                        textShadow: '0 2px 10px rgba(0,0,0,0.3)'
                    }}>
                        Excellence in <span style={{ color: '#fb923c' }}>Patient Care</span>
                    </h1>
                    <p style={{
                        fontSize: '1rem',
                        fontWeight: '500',
                        marginTop: '10px',
                        opacity: 0.9,
                        letterSpacing: '2px'
                    }}>
                        MOONVIEW MEDICAL CENTER
                    </p>
                </div>

                {/* Staggered Feature Pills (The "Stack") */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    gap: '15px',
                    flexWrap: 'wrap',
                    padding: '0 20px'
                }}>
                    {[
                        { icon: <Activity size={16} />, text: 'Real-time Monitoring' },
                        { icon: <Shield size={16} />, text: 'Secured Records' },
                        { icon: <Stethoscope size={16} />, text: 'Expert Consultations' }
                    ].map((pill, idx) => (
                        <div
                            key={idx}
                            style={{
                                background: 'rgba(255,255,255,0.15)',
                                backdropFilter: 'blur(10px)',
                                padding: '10px 20px',
                                borderRadius: '100px',
                                border: '1px solid rgba(255,255,255,0.1)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                fontSize: '0.85rem',
                                fontWeight: '700',
                                animation: `zoomIn 1s cubic-bezier(0.34, 1.56, 0.64, 1) both`,
                                animationDelay: `${0.8 + (idx * 0.2)}s`,
                                boxShadow: '0 10px 20px rgba(0,0,0,0.1)'
                            }}
                        >
                            <span style={{ color: '#fb923c' }}>{pill.icon}</span>
                            <span>{pill.text}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Minimal Bottom Message */}
            <div style={{
                position: 'absolute',
                bottom: '10%',
                left: '50px',
                zIndex: 5,
                color: 'white',
                maxWidth: '500px'
            }}>
                <h2 style={{ fontSize: '1rem', fontWeight: '800', letterSpacing: '4px', marginBottom: '10px', opacity: 0.8 }}>PREMIER HEALTHCARE</h2>
                <p style={{ fontSize: '0.9rem', fontWeight: '500', opacity: 0.7, lineHeight: '1.6' }}>
                    Providing world-class medical intelligence <br />and compassionate clinical services.
                </p>
            </div>

            {/* Staggered Feature Cards (The "Slide & Scale" Stack) */}
            <div style={{
                position: 'absolute',
                bottom: '15%',
                right: '100px',
                zIndex: 10,
                display: 'flex',
                alignItems: 'flex-end',
                gap: '30px',
                animation: 'slideInRight 1.5s cubic-bezier(0.22, 1, 0.36, 1) both'
            }}>
                {/* Left Card */}
                <div style={{
                    width: '180px',
                    height: '240px',
                    background: 'rgba(255,255,255,0.1)',
                    backdropFilter: 'blur(10px)',
                    borderRadius: '24px',
                    border: '1px solid rgba(255,255,255,0.15)',
                    padding: '24px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: '15px',
                    color: 'white',
                    transform: 'rotate(-5deg) translateY(20px)',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
                }}>
                    <div style={{ color: '#0ea5e9' }}><Shield size={32} /></div>
                    <span style={{ fontWeight: '800', fontSize: '0.8rem', letterSpacing: '1px' }}>ADMIN</span>
                </div>

                {/* Middle Card (The one that increases in size) */}
                <Link to="/login" style={{ textDecoration: 'none' }}>
                    <div style={{
                        width: '240px',
                        height: '320px',
                        background: 'rgba(255,255,255,0.25)',
                        backdropFilter: 'blur(20px)',
                        borderRadius: '32px',
                        border: '1px solid rgba(255,255,255,0.3)',
                        padding: '32px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center',
                        gap: '20px',
                        color: 'white',
                        transform: 'scale(1.15) translateY(-20px)',
                        boxShadow: '0 30px 60px -12px rgba(0,0,0,0.5), 0 18px 36px -18px rgba(251,146,60,0.3)',
                        cursor: 'pointer',
                        transition: '0.3s all'
                    }} className="center-card">
                        <div style={{
                            width: '64px',
                            height: '64px',
                            background: '#fb923c',
                            borderRadius: '20px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 10px 20px rgba(251,146,60,0.4)'
                        }}>
                            <Stethoscope size={36} color="white" />
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <h3 style={{ fontWeight: '900', fontSize: '1.2rem', marginBottom: '8px' }}>DOCTOR PORTAL</h3>
                            <p style={{ fontSize: '0.75rem', opacity: 0.8, lineHeight: '1.5' }}>Access clinical records & patient history</p>
                        </div>
                    </div>
                </Link>

                {/* Right Card */}
                <div style={{
                    width: '180px',
                    height: '240px',
                    background: 'rgba(255,255,255,0.1)',
                    backdropFilter: 'blur(10px)',
                    borderRadius: '24px',
                    border: '1px solid rgba(255,255,255,0.15)',
                    padding: '24px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: '15px',
                    color: 'white',
                    transform: 'rotate(5deg) translateY(20px)',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
                }}>
                    <div style={{ color: '#8b5cf6' }}><Activity size={32} /></div>
                    <span style={{ fontWeight: '800', fontSize: '0.8rem', letterSpacing: '1px' }}>LABORATORY</span>
                </div>
            </div>

            <style>{`
                @keyframes zoomIn {
                    from { opacity: 0; transform: scale(0.8); }
                    to { opacity: 1; transform: scale(1); }
                }
                @keyframes slideInRight {
                    from { opacity: 0; transform: translateX(100px); }
                    to { opacity: 1; transform: translateX(0); }
                }
                .center-card:hover {
                    transform: scale(1.2) translateY(-30px) !important;
                    background: rgba(255,255,255,0.3) !important;
                }
            `}</style>
        </div>
    );
};

export default Home;
