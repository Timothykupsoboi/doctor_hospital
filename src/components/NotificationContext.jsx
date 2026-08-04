// =============================================================
// FILE: NotificationContext.jsx
// PURPOSE: Provides two distinct systems in one context:
//
//  1. TOAST notifications (in-app pop-up alerts)
//     → showNotification(message, type, duration)
//     → Used by all pages for success/error/warning toasts
//
//  2. BELL notifications (persistent, stored in Supabase)
//     → Fetched from the `notifications` table on mount
//     → Auto-refreshes every 60 seconds
//     → markAllRead() marks them all as read in Supabase
// =============================================================

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { X, AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

const NotificationContext = createContext();

export const useNotification = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
    // -------------------------------------------------------
    // Toast state: ephemeral in-app pop-up messages
    // -------------------------------------------------------
    const [toasts, setToasts] = useState([]);

    /** Show a toast. type: 'info' | 'success' | 'error' | 'warning' */
    const showNotification = useCallback((message, type = 'info', duration = 5000) => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);
        // Auto-dismiss after `duration` ms
        setTimeout(() => {
            setToasts(prev => prev.filter(n => n.id !== id));
        }, duration);
    }, []);

    const removeToast = (id) => setToasts(prev => prev.filter(n => n.id !== id));

    // -------------------------------------------------------
    // Bell notifications: persistent rows in Supabase
    // -------------------------------------------------------
    const [bellNotifications, setBellNotifications] = useState([]);
    const { user } = useAuth() ?? {};  // safe call in case context is unavailable

    /** Fetch bell notifications for the logged-in user */
    const fetchBellNotifications = useCallback(async () => {
        if (!user?.email) return;
        const { data } = await supabase
            .from('notifications')
            .select('*')
            .eq('recipient_email', user.email)
            .order('created_at', { ascending: false })
            .limit(20);
        if (data) setBellNotifications(data);
    }, [user?.email]);

    /** Mark all bell notifications as read in Supabase */
    const markAllRead = useCallback(async () => {
        if (!user?.email) return;
        await supabase
            .from('notifications')
            .update({ status: 'read' })
            .eq('recipient_email', user.email);
        // Update local state immediately for responsiveness
        setBellNotifications(prev => prev.map(n => ({ ...n, status: 'read' })));
    }, [user?.email]);

    // Fetch once on login, then every 60 seconds
    useEffect(() => {
        fetchBellNotifications();
        const interval = setInterval(fetchBellNotifications, 60_000);
        return () => clearInterval(interval);
    }, [fetchBellNotifications]);

    // Count of unread bell notifications (shown as badge on bell icon)
    const unreadCount = bellNotifications.filter(n => n.status === 'unread').length;

    // -------------------------------------------------------
    // Render
    // -------------------------------------------------------
    return (
        <NotificationContext.Provider value={{
            showNotification,           // toast trigger
            bellNotifications,          // array of DB notification rows
            unreadCount,                // badge count
            markAllRead,                // mark all as read
            refreshNotifications: fetchBellNotifications  // manual refresh
        }}>
            {children}

            {/* Toast container — fixed bottom-right */}
            <div style={{
                position: 'fixed', bottom: '24px', right: '24px',
                zIndex: 9999, display: 'flex', flexDirection: 'column',
                gap: '12px', pointerEvents: 'none'
            }}>
                {toasts.map(n => (
                    <div
                        key={n.id}
                        style={{
                            background: n.type === 'error' ? '#fef2f2' : n.type === 'success' ? '#f0fdf4' : '#f0f9ff',
                            color: n.type === 'error' ? '#dc2626' : n.type === 'success' ? '#16a34a' : '#0369a1',
                            border: `1px solid ${n.type === 'error' ? '#fee2e2' : n.type === 'success' ? '#bbf7d0' : '#bae6fd'}`,
                            padding: '16px 20px', borderRadius: '12px',
                            boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                            display: 'flex', alignItems: 'center', gap: '12px',
                            minWidth: '320px', maxWidth: '450px',
                            pointerEvents: 'auto', animation: 'slideIn 0.3s ease-out'
                        }}
                    >
                        {n.type === 'error'   && <AlertCircle size={20} />}
                        {n.type === 'success' && <CheckCircle size={20} />}
                        {n.type === 'info'    && <Info size={20} />}
                        {n.type === 'warning' && <AlertTriangle size={20} />}

                        <div style={{ flex: 1, fontSize: '0.875rem', fontWeight: '600' }}>
                            {n.message}
                        </div>

                        <button
                            onClick={() => removeToast(n.id)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', opacity: 0.6 }}
                        >
                            <X size={16} />
                        </button>
                    </div>
                ))}
            </div>

            <style>{`
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to   { transform: translateX(0);   opacity: 1; }
                }
            `}</style>
        </NotificationContext.Provider>
    );
};
