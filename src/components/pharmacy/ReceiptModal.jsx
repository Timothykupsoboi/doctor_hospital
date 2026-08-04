import React from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Printer, Download, CheckCircle, Share2, ClipboardList } from 'lucide-react';

const ReceiptModal = ({ isOpen, onClose, saleData, onFinalize, loading }) => {
    const navigate = useNavigate();
    if (!isOpen || !saleData) {
        if (isOpen) console.warn("[ReceiptModal] isOpen is true but saleData is missing!");
        return null;
    }
    
    console.log("[ReceiptModal] Rendering with data:", saleData);

    const { items, receiptNo, total, taxAmount, subtotal, date, time, customerName, paymentMethod, isDraft } = saleData;

    return (
        <div style={{ 
            position: 'fixed', 
            inset: 0, 
            background: 'rgba(15, 23, 42, 0.8)', 
            backdropFilter: 'blur(8px)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            zIndex: 999999 
        }}>
            <style>
                {`
                @media print {
                    body * { visibility: hidden; }
                    #receipt-content, #receipt-content * { visibility: visible; }
                    #receipt-content { position: absolute; left: 0; top: 0; width: 100%; }
                }
                `}
            </style>
            <div style={{ background: 'white', width: '100%', maxWidth: '450px', borderRadius: '24px', overflow: 'hidden', boxShadow: 'var(--shadow-premium)', animation: 'fadeIn 0.3s ease-out' }}>
                
                <div style={{ padding: '24px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <CheckCircle size={20} color={isDraft ? "#f59e0b" : "#10b981"} />
                        <span style={{ fontWeight: '700', fontSize: '0.875rem', color: '#1e293b' }}>
                            {isDraft ? 'Review Transaction' : 'Sale Successful'}
                        </span>
                        {isDraft && <span style={{ background: '#fef3c7', color: '#92400e', fontSize: '0.65rem', padding: '2px 8px', borderRadius: '4px', fontWeight: '800' }}>PREVIEW MODE</span>}
                    </div>
                    <button onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#64748b' }}><X size={20} /></button>
                </div>

                <div id="receipt-content" style={{ padding: '32px', fontFamily: '"Courier New", Courier, monospace' }}>
                    <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: '800', margin: '0 0 4px 0', fontFamily: 'Inter' }}>MOONVIEW MEDICAL CENTER</h2>
                        <p style={{ fontSize: '0.75rem', color: '#64748b', margin: 0 }}>Pharmacy Department</p>
                        <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '4px 0' }}>Tel: +254 700 000 000</p>
                    </div>

                    <div style={{ borderTop: '1px dashed #e2e8f0', borderBottom: '1px dashed #e2e8f0', padding: '12px 0', marginBottom: '20px', fontSize: '0.75rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>Receipt #:</span>
                            <span style={{ fontWeight: '700' }}>{receiptNo}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>Date:</span>
                            <span>{date} {time}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>Patient:</span>
                            <span>{customerName || 'Walk-in'}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>Payment:</span>
                            <span style={{ textTransform: 'uppercase' }}>{paymentMethod}</span>
                        </div>
                    </div>

                    <table style={{ width: '100%', fontSize: '0.75rem', borderCollapse: 'collapse', marginBottom: '20px' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                                <th style={{ textAlign: 'left', paddingBottom: '8px' }}>ITEM</th>
                                <th style={{ textAlign: 'center', paddingBottom: '8px' }}>QTY</th>
                                <th style={{ textAlign: 'right', paddingBottom: '8px' }}>PRICE</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((item, idx) => (
                                <tr key={idx}>
                                    <td style={{ paddingTop: '8px' }}>{item.name}</td>
                                    <td style={{ paddingTop: '8px', textAlign: 'center' }}>{item.qty}</td>
                                    <td style={{ paddingTop: '8px', textAlign: 'right' }}>{(item.price * item.qty).toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '12px', fontSize: '0.85rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                            <span>Subtotal</span>
                            <span>KSh {subtotal?.toLocaleString()}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                            <span>Tax (16%)</span>
                            <span>KSh {taxAmount?.toLocaleString()}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '1.1rem', fontWeight: '800' }}>
                            <span>TOTAL</span>
                            <span>KSh {total?.toLocaleString()}</span>
                        </div>
                    </div>

                    <div style={{ textAlign: 'center', marginTop: '32px' }}>
                        <p style={{ fontSize: '0.7rem', color: '#94a3b8', margin: 0 }}>Thank you for visiting Moonview Medical Center.</p>
                        <p style={{ fontSize: '0.7rem', color: '#94a3b8', margin: '4px 0' }}>Quick Recovery!</p>
                    </div>
                </div>

                <div style={{ padding: '24px', background: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
                    {isDraft ? (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                            <button 
                                onClick={() => onFinalize('save')}
                                disabled={loading}
                                style={{ padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0', background: 'white', color: '#1e293b', fontWeight: '700', fontSize: '0.85rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer' }}
                            >
                                <CheckCircle size={20} color="#10b981" /> Save Only
                            </button>
                            <button 
                                onClick={() => onFinalize('print')}
                                disabled={loading}
                                style={{ padding: '14px', borderRadius: '12px', border: 'none', background: '#007bff', color: 'white', fontWeight: '700', fontSize: '0.85rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', boxShadow: '0 4px 6px -1px rgba(0, 123, 255, 0.2)' }}
                            >
                                <Printer size={20} /> Print & Save
                            </button>
                            <button 
                                onClick={() => onFinalize('share')}
                                disabled={loading}
                                style={{ padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0', background: 'white', color: '#1e293b', fontWeight: '700', fontSize: '0.85rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer' }}
                            >
                                <Share2 size={20} color="#6366f1" /> Share & Save
                            </button>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                <button 
                                    onClick={() => window.print()} 
                                    style={{ padding: '12px', borderRadius: '12px', border: 'none', background: '#10b981', color: 'white', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer' }}
                                >
                                    <Printer size={18} /> Print
                                </button>
                                <button style={{ padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0', background: 'white', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer' }}>
                                    <Share2 size={18} /> Share
                                </button>
                            </div>
                            <button 
                                onClick={() => { onClose(); navigate('/pharmacy/sales'); }}
                                style={{ padding: '12px', borderRadius: '12px', border: 'none', background: '#f1f5f9', color: '#475569', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer' }}
                            >
                                <ClipboardList size={18} /> Go to Sales History
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ReceiptModal;
