// =============================================================
// FILE: NotificationCenter.jsx
// PURPOSE: React component / entry point for the eDoc Hospital
//          frontend. Uses Supabase notifications and AuthContext.
// =============================================================
import React, { useState, useEffect } from 'react';
import { Bell, FlaskConical, CheckCircle, AlertTriangle, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

const NotificationCenter = () => {
    const [notifications, setNotifications] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const { user } = useAuth();

    const fetchNotifications = async () => {
        if (!user?.email) return;
        const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .eq('recipient_email', user.email)
            .order('created_at', { ascending: false })
            .limit(20);

        if (!error) setNotifications(data || []);
        else console.error('Failed to fetch notifications', error.message);
    };

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 10000);
        return () => clearInterval(interval);
    }, [user]);

    const markAllRead = async () => {
        if (!user?.email) return;
        const { error } = await supabase
            .from('notifications')
            .update({ status: 'read' })
            .eq('recipient_email', user.email);

        if (error) {
            console.error('Unable to mark notifications as read', error.message);
            return;
        }

        fetchNotifications();
    };

    const unreadCount = notifications.filter(n => n.status === 'unread').length;

    const getIcon = (type) => {
        if (type === 'lab_request') return <FlaskConical size={16} color="#0ea5e9" />;
        if (type === 'result_ready') return <CheckCircle size={16} color="#10b981" />;
        return <AlertTriangle size={16} color="#f59e0b" />;
    };

    return (
        <div style={{ position: 'relative' }}>
            <button 
                onClick={() => setIsOpen(!isOpen)}
                style={{ background: 'white', border: '1px solid #e2e8f0', width: '44px', height: '44px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', position: 'relative' }}
            >
                <Bell size={20} color="#64748b" />
                {unreadCount > 0 && (
                    <span style={{ position: 'absolute', top: '-4px', right: '-4px', background: '#ef4444', color: 'white', fontSize: '10px', fontWeight: '800', width: '20px', height: '20px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '3px solid white' }}>
                        {unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div style={{ position: 'absolute', top: '56px', right: 0, width: '360px', background: 'white', borderRadius: '20px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0', zIndex: 2000, overflow: 'hidden' }}>
                    <div style={{ padding: '20px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
                        <h4 style={{ fontWeight: '700', fontSize: '1rem' }}>Notifications</h4>
                        <button onClick={markAllRead} style={{ fontSize: '0.75rem', fontWeight: '600', color: '#0ea5e9', border: 'none', background: 'none', cursor: 'pointer' }}>Mark all as read</button>
                    </div>

                    <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                        {notifications.length === 0 ? (
                            <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8', fontSize: '0.875rem' }}>
                                No notifications yet.
                            </div>
                        ) : (
                            notifications.map((n) => (
                                <div key={n.id} style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', gap: '16px', background: n.status === 'unread' ? '#f0f9ff' : 'white', transition: '0.2s' }}>
                                    <div style={{ marginTop: '4px' }}>{getIcon(n.type)}</div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: '0.875rem', fontWeight: '700', marginBottom: '2px' }}>{n.title}</div>
                                        <div style={{ fontSize: '0.8125rem', color: '#64748b', lineHeight: '1.4' }}>{n.message}</div>
                                        <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '6px' }}>{new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {n.sender_name}</div>
                                    </div>
                                    {n.status === 'unread' && <div style={{ width: '8px', height: '8px', background: '#0ea5e9', borderRadius: '50%', marginTop: '6px' }}></div>}
                                </div>
                            ))
                        )}
                    </div>

                    <div style={{ padding: '12px', textAlign: 'center', background: '#f8fafc', borderTop: '1px solid #f1f5f9' }}>
                        <button style={{ fontSize: '0.8125rem', fontWeight: '600', color: '#64748b', border: 'none', background: 'none', cursor: 'pointer' }}>View All Alerts</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationCenter;
