import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '../Sidebar';

const MainLayout = () => {
    const location = useLocation();
    
    // Determine the userType based on the current path
    // e.g., /doctor/appointments -> 'd'
    // /registrar/patients -> 'r'
    // /admin/staff -> 'a'
    const getPathType = () => {
        const path = location.pathname;
        if (path.startsWith('/admin')) return 'a';
        if (path.startsWith('/doctor')) return 'd';
        if (path.startsWith('/registrar')) return 'r';
        if (path.startsWith('/lab')) return 'l';
        if (path.startsWith('/pharmacy')) return 'ph';
        return 'd'; // Default fallback
    };

    const userType = getPathType();

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc' }}>
            <Sidebar userType={userType} />
            <main style={{ flex: 1, position: 'relative', minWidth: 0, overflowX: 'hidden' }}>
                <div key={location.pathname} className="page-transition">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default MainLayout;
