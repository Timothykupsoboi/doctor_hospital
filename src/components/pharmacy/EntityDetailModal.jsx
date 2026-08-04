import React, { useState, useEffect } from 'react';
import { X, Pill, History, AlertTriangle, TrendingUp, User, ShoppingBag, Shield, FlaskConical, CheckCircle2, Clock } from 'lucide-react';
import { supabase } from '../../lib/supabase';

const EntityDetailModal = ({ isOpen, onClose, data, type = 'drug' }) => {
    const [labHistory, setLabHistory] = useState([]);
    const [loadingLabs, setLoadingLabs] = useState(false);

    useEffect(() => {
        if (isOpen && type === 'prescription' && data?.appointment?.patient?.pid) {
            fetchLabHistory(data.appointment.patient.pid);
        }
    }, [isOpen, type, data]);

    const fetchLabHistory = async (patientId) => {
        setLoadingLabs(true);
        try {
            const { data: labs, error } = await supabase
                .from('lab_requests')
                .select(`
                    id, test_type, status, order_timestamp,
                    lab_reports(results, notes, created_at)
                `)
                .eq('appointment.patient.pid', patientId)
                .order('order_timestamp', { ascending: false });

            if (!error) setLabHistory(labs || []);
        } catch (err) {
            console.error("Lab history fetch error:", err);
        } finally {
            setLoadingLabs(false);
        }
    };

    if (!isOpen || !data) return null;

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
            <div style={{ background: 'white', width: '100%', maxWidth: '800px', maxHeight: '90vh', borderRadius: '32px', overflow: 'hidden', boxShadow: 'var(--shadow-premium)', display: 'flex', flexDirection: 'column' }}>
                
                {/* Header */}
                <div style={{ padding: '32px', background: type === 'drug' ? 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)' : (type === 'prescription' ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)'), color: 'white', position: 'relative' }}>
                    <button onClick={onClose} style={{ position: 'absolute', top: '24px', right: '24px', background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '50%', padding: '8px', cursor: 'pointer', color: 'white' }}>
                        <X size={20} />
                    </button>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                        <div style={{ width: '64px', height: '64px', background: 'rgba(255,255,255,0.2)', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {type === 'drug' ? <Pill size={32} /> : (type === 'prescription' ? <Shield size={32} /> : <User size={32} />)}
                        </div>
                        <div>
                            <h2 style={{ fontSize: '1.75rem', fontWeight: '800', tracking: '-0.02em' }}>{data.name || data.pname || 'Entity Details'}</h2>
                            <p style={{ opacity: 0.8, fontSize: '0.875rem', fontWeight: '500' }}>
                                {type === 'drug' ? `Batch: ${data.batch_no || 'N/A'} • ${data.category}` : (type === 'prescription' ? `Dr. ${data.docname} • #${data.id}` : 'Loyalty Member • Patient')}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '40px' }}>
                    {type === 'drug' ? (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
                            <section>
                                <h3 style={{ fontSize: '0.75rem', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', tracking: '0.1em', marginBottom: '16px' }}>Stock Intelligence</h3>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                    <div style={{ padding: '20px', background: '#f8fafc', borderRadius: '20px', border: '1px solid #e2e8f0' }}>
                                        <p style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '600' }}>In Stock</p>
                                        <p style={{ fontSize: '1.5rem', fontWeight: '800', color: '#1e293b' }}>{data.quantity} <span style={{ fontSize: '0.875rem', color: '#94a3b8' }}>Units</span></p>
                                    </div>
                                    <div style={{ padding: '20px', background: '#f8fafc', borderRadius: '20px', border: '1px solid #e2e8f0' }}>
                                        <p style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '600' }}>Pricing</p>
                                        <p style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--primary)' }}>KSh {data.sell_price}</p>
                                    </div>
                                </div>
                                <div style={{ marginTop: '24px', padding: '20px', background: '#fff7ed', borderRadius: '20px', border: '1px solid #fed7aa', display: 'flex', gap: '12px' }}>
                                    <AlertTriangle color="#f59e0b" size={24} />
                                    <div>
                                        <p style={{ fontSize: '0.875rem', fontWeight: '700', color: '#9a3412' }}>Clinical Advisory</p>
                                        <p style={{ fontSize: '0.75rem', color: '#c2410c' }}>This medication {data.prescription_required ? 'requires a prescription' : 'is available OTC'}. Ensure dosage instructions are explained.</p>
                                    </div>
                                </div>
                            </section>

                            <section>
                                <h3 style={{ fontSize: '0.75rem', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', tracking: '0.1em', marginBottom: '16px' }}>Movement History</h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    {[1, 2, 3].map(i => (
                                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: '#f8fafc', borderRadius: '12px' }}>
                                            <TrendingUp size={16} color="#10b981" />
                                            <div style={{ flex: 1 }}>
                                                <p style={{ fontSize: '0.85rem', fontWeight: '600' }}>Sale Transaction #{1000 + i}</p>
                                                <p style={{ fontSize: '0.7rem', color: '#94a3b8' }}>2 hours ago • Dispensed 2 units</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        </div>
                    ) : type === 'prescription' ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                            <section>
                                <h3 style={{ fontSize: '0.75rem', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', tracking: '0.1em', marginBottom: '16px' }}>Doctor's Prescribed Items</h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    {data.drug_list?.split('|||').map((drug, idx) => {
                                        const [name, dosage, qty, instructions, frequency, route, duration, refills, food_relation] = drug.split('::');
                                        const drugError = data.errors?.[name.toLowerCase()];
                                        
                                        return (
                                            <div key={idx} style={{ 
                                                padding: '24px', 
                                                background: drugError ? '#fff1f2' : '#f8fafc', 
                                                borderRadius: '20px', 
                                                border: drugError ? '2px solid #ef4444' : '1px solid #e2e8f0', 
                                                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)',
                                                position: 'relative'
                                            }}>
                                                {drugError && (
                                                    <div style={{ position: 'absolute', top: '-10px', right: '20px', background: '#ef4444', color: 'white', padding: '4px 12px', borderRadius: '100px', fontSize: '0.7rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                        <AlertTriangle size={12} /> {drugError.type.toUpperCase()} BLOCK
                                                    </div>
                                                )}
                                                
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                                                    <div>
                                                        <div style={{ fontWeight: '800', color: drugError ? '#991b1b' : '#0f172a', fontSize: '1.25rem', marginBottom: '4px' }}>{name}</div>
                                                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                                            <span style={{ background: drugError ? '#fee2e2' : '#e0f2fe', color: drugError ? '#b91c1c' : '#0284c7', padding: '4px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '700' }}>{dosage}</span>
                                                            {route && <span style={{ background: '#f1f5f9', color: '#475569', padding: '4px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '600' }}>{route}</span>}
                                                        </div>
                                                    </div>
                                                    <div style={{ background: drugError ? '#94a3b8' : '#059669', color: 'white', padding: '6px 16px', borderRadius: '12px', fontSize: '0.875rem', fontWeight: '800', boxShadow: drugError ? 'none' : '0 4px 6px -1px rgba(16, 185, 129, 0.2)' }}>
                                                        QTY: {qty}
                                                    </div>
                                                </div>

                                                {drugError && (
                                                    <div style={{ marginBottom: '16px', padding: '12px', background: '#fee2e2', borderRadius: '12px', color: '#991b1b', fontSize: '0.8rem', fontWeight: '700', border: '1px solid #fecaca' }}>
                                                        DISPENSING ERROR: {drugError.message}
                                                    </div>
                                                )}
                                                
                                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px', marginBottom: '16px' }}>
                                                    {frequency && (
                                                        <div style={{ background: 'white', padding: '12px', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
                                                            <div style={{ fontSize: '0.65rem', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '4px' }}>Frequency</div>
                                                            <div style={{ fontSize: '0.875rem', color: '#334155', fontWeight: '600' }}>{frequency}</div>
                                                        </div>
                                                    )}
                                                    {duration && (
                                                        <div style={{ background: 'white', padding: '12px', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
                                                            <div style={{ fontSize: '0.65rem', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '4px' }}>Duration</div>
                                                            <div style={{ fontSize: '0.875rem', color: '#334155', fontWeight: '600' }}>{duration}</div>
                                                        </div>
                                                    )}
                                                    {food_relation && (
                                                        <div style={{ background: 'white', padding: '12px', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
                                                            <div style={{ fontSize: '0.65rem', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '4px' }}>Food Relation</div>
                                                            <div style={{ fontSize: '0.875rem', color: '#334155', fontWeight: '600' }}>{food_relation}</div>
                                                        </div>
                                                    )}
                                                    {refills && refills !== '0' && (
                                                        <div style={{ background: 'white', padding: '12px', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
                                                            <div style={{ fontSize: '0.65rem', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '4px' }}>Refills</div>
                                                            <div style={{ fontSize: '0.875rem', color: '#334155', fontWeight: '600' }}>{refills}</div>
                                                        </div>
                                                    )}
                                                </div>

                                                {instructions && instructions !== 'undefined' && instructions !== 'null' && (
                                                    <div style={{ padding: '16px', background: '#fffbeb', borderRadius: '12px', border: '1px solid #fde68a' }}>
                                                        <div style={{ fontSize: '0.75rem', fontWeight: '800', color: '#d97706', textTransform: 'uppercase', marginBottom: '4px' }}>Clinical Instructions</div>
                                                        <div style={{ fontSize: '0.875rem', color: '#92400e', fontStyle: 'italic', fontWeight: '500' }}>"{instructions}"</div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </section>
                            <section style={{ padding: '20px', background: '#f8fafc', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#64748b', fontSize: '0.85rem' }}>
                                    <ShoppingBag size={16} />
                                    <span>Prescribed on {new Date(data.created_at).toLocaleString()}</span>
                                </div>
                            </section>

                            <section>
                                <h3 style={{ fontSize: '0.75rem', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', tracking: '0.1em', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <FlaskConical size={14} /> Laboratory Insights
                                </h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    {loadingLabs ? (
                                        <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>Analyzing lab records...</div>
                                    ) : labHistory.length === 0 ? (
                                        <div style={{ padding: '20px', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #e2e8f0', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>
                                            No lab records found for this patient.
                                        </div>
                                    ) : (
                                        labHistory.map((lab, i) => (
                                            <div key={i} style={{ padding: '16px', background: 'white', border: '1px solid #e2e8f0', borderRadius: '16px' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                                                    <div>
                                                        <div style={{ fontWeight: '700', color: '#1e293b', fontSize: '0.9rem' }}>{lab.test_type}</div>
                                                        <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{new Date(lab.order_timestamp).toLocaleDateString()}</div>
                                                    </div>
                                                    <span style={{ 
                                                        padding: '4px 10px', 
                                                        borderRadius: '20px', 
                                                        fontSize: '0.65rem', 
                                                        fontWeight: '800',
                                                        background: lab.status === 'completed' ? '#ecfdf5' : '#fff7ed',
                                                        color: lab.status === 'completed' ? '#10b981' : '#f59e0b'
                                                    }}>
                                                        {lab.status.toUpperCase()}
                                                    </span>
                                                </div>

                                                {lab.lab_reports?.[0] && (
                                                    <div style={{ marginTop: '10px', padding: '12px', background: '#f8fafc', borderRadius: '12px', fontSize: '0.8rem' }}>
                                                        <div style={{ fontWeight: '700', color: '#475569', marginBottom: '8px' }}>Findings:</div>
                                                        {Object.entries(JSON.parse(lab.lab_reports[0].results || '{}')).map(([field, res], idx) => (
                                                            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid #f1f5f9' }}>
                                                                <span style={{ color: '#64748b' }}>{field}</span>
                                                                <span style={{ fontWeight: '700', color: res.status !== 'Normal' ? '#ef4444' : '#1e293b' }}>
                                                                    {res.value} {res.unit}
                                                                </span>
                                                            </div>
                                                        ))}
                                                        {lab.lab_reports[0].notes && (
                                                            <div style={{ marginTop: '8px', fontStyle: 'italic', color: '#64748b', fontSize: '0.75rem' }}>
                                                                Note: {lab.lab_reports[0].notes}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        ))
                                    )}
                                </div>
                            </section>
                        </div>
                    ) : (
                        <div style={{ textAlign: 'center', padding: '60px 0' }}>
                            <History size={48} color="#e2e8f0" style={{ marginBottom: '16px' }} />
                            <p style={{ color: '#94a3b8' }}>Loading customer transaction history...</p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div style={{ padding: '24px 40px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                    <button onClick={onClose} style={{ padding: '12px 24px', borderRadius: '12px', border: '1px solid #e2e8f0', background: 'white', fontWeight: '600', cursor: 'pointer' }}>Close</button>
                    <button style={{ padding: '12px 24px', borderRadius: '12px', border: 'none', background: 'var(--primary)', color: 'white', fontWeight: '700', cursor: 'pointer' }}>Print Statement</button>
                </div>
            </div>
        </div>
    );
};

export default EntityDetailModal;
