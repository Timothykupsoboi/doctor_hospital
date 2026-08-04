import React from 'react';
import { X, AlertTriangle, CheckCircle, Info, HelpCircle } from 'lucide-react';

const ClinicalModal = ({ isOpen, onClose, title, message, type = 'info', onConfirm, confirmText = 'Confirm', cancelText = 'Cancel' }) => {
    if (!isOpen) return null;

    const icons = {
        info: <Info size={40} color="#3b82f6" />,
        success: <CheckCircle size={40} color="#10b981" />,
        warning: <AlertTriangle size={40} color="#f59e0b" />,
        danger: <AlertTriangle size={40} color="#ef4444" />,
        confirm: <HelpCircle size={40} color="#6366f1" />
    };

    const colors = {
        info: '#3b82f6',
        success: '#10b981',
        warning: '#f59e0b',
        danger: '#ef4444',
        confirm: '#6366f1'
    };

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
            <div style={{ 
                background: 'white', 
                width: '100%', 
                maxWidth: '400px', 
                borderRadius: '24px', 
                overflow: 'hidden', 
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                animation: 'modalSlideUp 0.3s ease-out'
            }}>
                <div style={{ padding: '32px', textAlign: 'center' }}>
                    <div style={{ 
                        width: '80px', 
                        height: '80px', 
                        background: `${colors[type]}15`, 
                        borderRadius: '24px', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        margin: '0 auto 24px auto' 
                    }}>
                        {icons[type]}
                    </div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#1e293b', marginBottom: '12px' }}>{title}</h3>
                    <p style={{ color: '#64748b', lineHeight: '1.6', fontSize: '0.95rem' }}>{message}</p>
                </div>

                <div style={{ padding: '24px', background: '#f8fafc', borderTop: '1px solid #f1f5f9', display: 'flex', gap: '12px' }}>
                    {onConfirm ? (
                        <>
                            <button 
                                onClick={onClose}
                                style={{ flex: 1, padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0', background: 'white', color: '#64748b', fontWeight: '700', cursor: 'pointer' }}
                            >
                                {cancelText}
                            </button>
                            <button 
                                onClick={() => { onConfirm(); onClose(); }}
                                style={{ flex: 1, padding: '14px', borderRadius: '12px', border: 'none', background: colors[type], color: 'white', fontWeight: '700', cursor: 'pointer' }}
                            >
                                {confirmText}
                            </button>
                        </>
                    ) : (
                        <button 
                            onClick={onClose}
                            style={{ width: '100%', padding: '14px', borderRadius: '12px', border: 'none', background: colors[type], color: 'white', fontWeight: '700', cursor: 'pointer' }}
                        >
                            Understood
                        </button>
                    )}
                </div>
            </div>
            <style>{`
                @keyframes modalSlideUp {
                    from { transform: translateY(20px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
            `}</style>
        </div>
    );
};

export default ClinicalModal;
