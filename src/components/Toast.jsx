import React, { useState, useEffect, createContext, useContext } from 'react';
import { CheckCircle, AlertCircle, X, Info } from 'lucide-react';

const ToastContext = createContext();

export const useToast = () => useContext(ToastContext);

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const showToast = (message, type = 'success', duration = 3000) => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type, duration }]);
    };

    const removeToast = (id) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    };

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 99999, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {toasts.map(toast => (
                    <ToastItem key={toast.id} toast={toast} onRemove={() => removeToast(toast.id)} />
                ))}
            </div>
        </ToastContext.Provider>
    );
};

const ToastItem = ({ toast, onRemove }) => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        setIsVisible(true);
        const timer = setTimeout(() => {
            setIsVisible(false);
            setTimeout(onRemove, 300); // Wait for exit animation
        }, toast.duration);

        return () => clearTimeout(timer);
    }, [toast.duration, onRemove]);

    const getColors = () => {
        switch (toast.type) {
            case 'success': return { bg: '#ecfdf5', border: '#10b981', text: '#065f46', icon: <CheckCircle size={18} color="#10b981" /> };
            case 'error': return { bg: '#fef2f2', border: '#ef4444', text: '#991b1b', icon: <AlertCircle size={18} color="#ef4444" /> };
            case 'warning': return { bg: '#fffbeb', border: '#f59e0b', text: '#92400e', icon: <AlertCircle size={18} color="#f59e0b" /> };
            default: return { bg: '#f0f9ff', border: '#0ea5e9', text: '#075985', icon: <Info size={18} color="#0ea5e9" /> };
        }
    };

    const colors = getColors();

    return (
        <div style={{
            background: colors.bg,
            border: `1px solid ${colors.border}`,
            padding: '16px 20px',
            borderRadius: '12px',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            minWidth: '300px',
            maxWidth: '450px',
            transform: isVisible ? 'translateX(0)' : 'translateX(120%)',
            opacity: isVisible ? 1 : 0,
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            cursor: 'default'
        }}>
            {colors.icon}
            <div style={{ flex: 1, fontSize: '0.875rem', fontWeight: '600', color: colors.text }}>{toast.message}</div>
            <button onClick={() => setIsVisible(false)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#94a3b8', padding: '4px' }}>
                <X size={16} />
            </button>
        </div>
    );
};
