import React from 'react';

const Maintenance = () => {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#f8fafc', fontFamily: "'Inter', sans-serif" }}>
            <div style={{ background: 'white', padding: '40px', borderRadius: '24px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', textAlign: 'center', maxWidth: '500px' }}>
                <h1 style={{ fontSize: '2rem', fontWeight: '800', color: '#0f172a', marginBottom: '16px' }}>System Under Maintenance</h1>
                <p style={{ color: '#64748b', fontSize: '1rem', lineHeight: '1.6' }}>Sorry, the system is currently down for maintenance. Please check back later.</p>
            </div>
        </div>
    );
};

export default Maintenance;
