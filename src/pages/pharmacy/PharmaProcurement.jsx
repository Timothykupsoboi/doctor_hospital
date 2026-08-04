// =============================================================
// FILE: PharmaProcurement.jsx
// PURPOSE: React component / entry point for the eDoc Hospital
//          frontend. Part of the Vite + React SPA.
// =============================================================
import React, { useState, useEffect } from 'react';
import { 
    Plus, FileText, X, 
    AlertCircle, Users, Search, 
    History, Calendar
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

const PharmaProcurement = () => {
    const [orders, setOrders] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [inventory, setInventory] = useState([]);
    const [activeTab, setActiveTab] = useState('PURCHASE ORDERS');
    const [showModal, setShowModal] = useState(false);
    const [showRestockModal, setShowRestockModal] = useState(false);
    const [selectedRestockItems, setSelectedRestockItems] = useState([]);
    const [newOrder, setNewOrder] = useState({ supplier_id: '', notes: '', items: [{ med_id: '', qty: 0, cost: 0 }] });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [{ data: oRes }, { data: sRes }, { data: iRes }] = await Promise.all([
                supabase.from('procurement_orders').select('*, suppliers:supplier_id(name)').order('created_at', { ascending: false }),
                supabase.from('suppliers').select('*'),
                supabase.from('medicine').select('*')
            ]);
            
            setOrders((oRes || []).map(o => ({ ...o, supplier_name: o.suppliers?.name || 'Unknown' })));
            setSuppliers(sRes || []);
            setInventory(iRes || []);
        } catch (e) {
            console.error(e);
        }
    };

    const handleReceive = async (id) => {
        if (!window.confirm("Mark this order as received?")) return;
        try {
            await supabase.from('procurement_orders').update({ status: 'received', received_at: new Date().toISOString() }).eq('id', id);
            
            const { data: items } = await supabase.from('procurement_items').select('*').eq('order_id', id);
            
            for (const item of (items || [])) {
                const med = inventory.find(i => i.id === item.med_id);
                if (med) {
                    await supabase.from('medicine').update({ stock_qty: (med.stock_qty || 0) + item.quantity }).eq('id', med.id);
                }
            }
            fetchData();
        } catch (e) {
            console.error(e);
        }
    };

    const handleSaveOrder = async () => {
        try {
            const total = newOrder.items.reduce((acc, i) => acc + (Number(i.qty) * Number(i.cost)), 0);
            const { data: orderData, error: orderError } = await supabase.from('procurement_orders').insert({
                supplier_id: newOrder.supplier_id || null,
                status: 'pending',
                total_cost: total
            }).select('id').single();

            if (orderError) throw orderError;

            if (orderData && orderData.id) {
                const itemsToInsert = newOrder.items.map(item => ({
                    order_id: orderData.id,
                    med_id: item.med_id,
                    quantity: item.qty,
                    unit_cost: item.cost
                }));
                await supabase.from('procurement_items').insert(itemsToInsert);
            }
            setShowModal(false);
            setNewOrder({ supplier_id: '', notes: '', items: [{ med_id: '', qty: 0, cost: 0 }] });
            fetchData();
        } catch (e) {
            console.error(e);
            alert("Error creating order.");
        }
    };

    const handleRestock = () => {
        // Auto-generate purchase order from selected restock items
        const items = selectedRestockItems.map(id => {
            const med = inventory.find(i => i.id === id);
            return {
                med_id: med.id,
                qty: Math.max(10, (med.reorder_level || 10) * 2 - (med.stock_qty || 0)), // suggest order qty
                cost: med.buying_price || 0
            };
        });
        
        // Auto-assign supplier if all items have same supplier, else blank
        const medSuppliers = [...new Set(selectedRestockItems.map(id => inventory.find(i => i.id === id)?.supplier_id).filter(Boolean))];
        const supplier_id = medSuppliers.length === 1 ? medSuppliers[0] : '';

        setNewOrder({ supplier_id, notes: 'Auto-generated restock order', items });
        setShowRestockModal(false);
        setShowModal(true);
    };

    const metrics = [
        { label: 'Active Orders', count: orders.filter(o => o.status === 'pending').length, icon: FileText, color: '#007bff' },
        { label: 'Intake Logs', count: orders.filter(o => o.status === 'received').length, icon: History, color: '#28a745' },
        { label: 'Depleted Nodes', count: inventory.filter(i => (i.stock_qty || 0) <= (i.reorder_level || 10)).length, icon: AlertCircle, color: '#dc3545' },
        { label: 'Partner Network', count: suppliers.length, icon: Users, color: '#6c757d' },
    ];

    const tabs = ['PURCHASE ORDERS', 'INTAKE (GRN)', 'RESTOCK LIST'];
    const todayDate = new Date().toISOString().split('T')[0];

    return (
        <div style={{ padding: '24px 40px', maxWidth: '1600px', margin: '0 auto', background: '#ffffff', minHeight: '100vh' }}>
                {/* Edoc Style Header Search & Date */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                    <div style={{ display: 'flex', gap: '10px', flex: 1, maxWidth: '800px' }}>
                        <div style={{ position: 'relative', flex: 1 }}>
                            <Search size={18} style={{ position: 'absolute', left: '15px', top: '12px', color: '#adb5bd' }} />
                            <input 
                                type="text" 
                                placeholder="Search procurement ledger..." 
                                style={{ width: '100%', padding: '10px 15px 10px 45px', border: '1px solid #dee2e6', borderRadius: '4px', fontSize: '0.9rem', background: '#f8f9fa' }} 
                            />
                        </div>
                        <button style={{ padding: '10px 25px', background: '#e7f2ff', color: '#007bff', border: 'none', borderRadius: '4px', fontWeight: '600', cursor: 'pointer' }}>Search</button>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px', textAlign: 'right' }}>
                        <div>
                            <div style={{ fontSize: '0.75rem', color: '#adb5bd', fontWeight: '700' }}>Logistics Date</div>
                            <div style={{ fontSize: '1.1rem', fontWeight: '700', color: '#343a40' }}>{todayDate}</div>
                        </div>
                        <div style={{ padding: '10px', background: '#f8f9fa', border: '1px solid #dee2e6', borderRadius: '4px', color: '#343a40' }}>
                            <Calendar size={20} />
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#343a40' }}>Procurement & Logistics</h2>
                    <button onClick={() => setShowModal(true)} style={{ padding: '10px 20px', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Plus size={18} /> Generate Purchase Order
                    </button>
                </div>

                {/* Edoc Status Row */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '40px' }}>
                    {metrics.map((stat, idx) => (
                        <div key={idx} style={{ background: 'white', padding: '20px 25px', borderRadius: '4px', border: '1px solid #dee2e6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <div style={{ fontSize: '1.5rem', fontWeight: '700', color: stat.color }}>{stat.count}</div>
                                <div style={{ fontSize: '0.85rem', fontWeight: '600', color: '#6c757d', textTransform: 'uppercase' }}>{stat.label}</div>
                            </div>
                            <div style={{ padding: '10px', background: '#f8f9fa', border: '1px solid #dee2e6', borderRadius: '4px', color: stat.color }}>
                                <stat.icon size={20} />
                            </div>
                        </div>
                    ))}
                </div>

                {/* Edoc Tabs */}
                <div style={{ display: 'flex', borderBottom: '1px solid #dee2e6', marginBottom: '30px' }}>
                    {tabs.map(tab => (
                        <button 
                            key={tab} 
                            onClick={() => setActiveTab(tab)}
                            style={{ 
                                padding: '12px 25px', 
                                border: 'none', 
                                background: 'transparent',
                                color: activeTab === tab ? '#007bff' : '#6c757d',
                                borderBottom: activeTab === tab ? '3px solid #007bff' : '3px solid transparent',
                                fontWeight: '700',
                                cursor: 'pointer',
                                fontSize: '0.9rem'
                            }}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                <div style={{ background: 'white', borderRadius: '4px', border: '1px solid #dee2e6', overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead style={{ background: '#f8f9fa', borderBottom: '2px solid #007bff' }}>
                            <tr>
                                <th style={{ textAlign: 'left', padding: '15px 25px', fontSize: '0.85rem', fontWeight: '700', color: '#343a40' }}>IDENTIFIER</th>
                                <th style={{ textAlign: 'left', padding: '15px 25px', fontSize: '0.85rem', fontWeight: '700', color: '#343a40' }}>VENDOR</th>
                                <th style={{ textAlign: 'left', padding: '15px 25px', fontSize: '0.85rem', fontWeight: '700', color: '#343a40' }}>DATE</th>
                                <th style={{ textAlign: 'left', padding: '15px 25px', fontSize: '0.85rem', fontWeight: '700', color: '#343a40' }}>VALUE</th>
                                <th style={{ textAlign: 'right', padding: '15px 25px', fontSize: '0.85rem', fontWeight: '700', color: '#343a40' }}>STATUS</th>
                            </tr>
                        </thead>
                        <tbody>
                            {activeTab === 'PURCHASE ORDERS' ? (
                                orders.filter(o => o.status !== 'received').map(o => (
                                    <tr key={o.id} style={{ borderBottom: '1px solid #dee2e6' }}>
                                        <td style={{ padding: '15px 25px', fontWeight: '700' }}>#PO-{String(o.id).padStart(5, '0')}</td>
                                        <td style={{ padding: '15px 25px' }}>{o.supplier_name}</td>
                                        <td style={{ padding: '15px 25px' }}>{new Date(o.created_at).toLocaleDateString()}</td>
                                        <td style={{ padding: '15px 25px' }}>KSh {Number(o.total_cost).toLocaleString()}</td>
                                        <td style={{ padding: '15px 25px', textAlign: 'right' }}>
                                            <button onClick={() => handleReceive(o.id)} style={{ padding: '6px 12px', background: '#e7f2ff', color: '#007bff', border: 'none', borderRadius: '4px', fontWeight: '700', cursor: 'pointer' }}>Receive</button>
                                        </td>
                                    </tr>
                                ))
                            ) : activeTab === 'INTAKE (GRN)' ? (
                                orders.filter(o => o.status === 'received').map(o => (
                                    <tr key={o.id} style={{ borderBottom: '1px solid #dee2e6' }}>
                                        <td style={{ padding: '15px 25px', fontWeight: '700' }}>#GRN-{String(o.id).padStart(5, '0')}</td>
                                        <td style={{ padding: '15px 25px' }}>{o.supplier_name}</td>
                                        <td style={{ padding: '15px 25px' }}>{new Date(o.updated_at).toLocaleDateString()}</td>
                                        <td style={{ padding: '15px 25px' }}>KSh {Number(o.total_cost).toLocaleString()}</td>
                                        <td style={{ padding: '15px 25px', textAlign: 'right' }}>
                                            <span style={{ color: '#28a745', fontWeight: '700', fontSize: '0.8rem' }}>RECEIVED</span>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                inventory.filter(i => (i.stock_qty || 0) <= (i.reorder_level || 10)).map(item => (
                                    <tr key={item.id} style={{ borderBottom: '1px solid #dee2e6' }}>
                                        <td style={{ padding: '15px 25px', fontWeight: '700' }}>{item.med_name}</td>
                                        <td style={{ padding: '15px 25px' }}>{item.category}</td>
                                        <td style={{ padding: '15px 25px', color: '#dc3545', fontWeight: '700' }}>{item.stock_qty || 0} {item.unit}</td>
                                        <td style={{ padding: '15px 25px' }}>TH: {item.reorder_level || 10}</td>
                                        <td style={{ padding: '15px 25px', textAlign: 'right' }}>
                                            <button onClick={() => { setSelectedRestockItems([item.id]); setShowRestockModal(true); }} style={{ padding: '6px 12px', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px', fontWeight: '700', cursor: 'pointer' }}>Restock</button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Edoc Style Modals */}
                {showModal && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                        <div style={{ background: 'white', width: '100%', maxWidth: '700px', borderRadius: '4px', padding: '30px', boxShadow: '0 1rem 3rem rgba(0,0,0,.175)', maxHeight: '90vh', overflowY: 'auto' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '25px', borderBottom: '1px solid #dee2e6', paddingBottom: '15px' }}>
                                <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#343a40' }}>Generate Purchase Order</h3>
                                <button onClick={() => setShowModal(false)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#adb5bd' }}><X size={24} /></button>
                            </div>
                            
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                    <div style={{ position: 'relative' }}>
                                        <div style={{ position: 'absolute', top: '-18px', left: '2px', fontSize: '0.65rem', color: '#adb5bd', fontWeight: '700' }}>VENDOR / SUPPLIER</div>
                                        <select className="input-field" value={newOrder.supplier_id} onChange={e => setNewOrder({...newOrder, supplier_id: e.target.value})} style={{ width: '100%', padding: '10px', border: '1px solid #dee2e6', borderRadius: '4px' }}>
                                            <option value="">Select Vendor...</option>
                                            {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                        </select>
                                    </div>
                                    <div style={{ position: 'relative' }}>
                                        <div style={{ position: 'absolute', top: '-18px', left: '2px', fontSize: '0.65rem', color: '#adb5bd', fontWeight: '700' }}>NOTES</div>
                                        <input type="text" placeholder="Optional notes..." className="input-field" value={newOrder.notes} onChange={e => setNewOrder({...newOrder, notes: e.target.value})} style={{ width: '100%', padding: '10px', border: '1px solid #dee2e6', borderRadius: '4px' }} />
                                    </div>
                                </div>
                                
                                <div style={{ marginTop: '10px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                        <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#343a40' }}>ORDER ITEMS</div>
                                        <button onClick={() => setNewOrder({...newOrder, items: [...newOrder.items, { med_id: '', qty: 0, cost: 0 }]})} style={{ fontSize: '0.75rem', padding: '4px 8px', background: '#e7f2ff', color: '#007bff', border: 'none', borderRadius: '4px', fontWeight: '700', cursor: 'pointer' }}>+ Add Item</button>
                                    </div>
                                    
                                    {newOrder.items.map((item, idx) => (
                                        <div key={idx} style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                                            <select 
                                                value={item.med_id} 
                                                onChange={e => {
                                                    const selectedMed = inventory.find(inv => inv.id === parseInt(e.target.value));
                                                    const newItems = [...newOrder.items];
                                                    newItems[idx].med_id = parseInt(e.target.value);
                                                    if (selectedMed) {
                                                        newItems[idx].cost = selectedMed.buying_price || 0;
                                                    }
                                                    setNewOrder({...newOrder, items: newItems});
                                                }} 
                                                style={{ flex: 2, padding: '8px', border: '1px solid #dee2e6', borderRadius: '4px' }}
                                            >
                                                <option value="">Select Medicine...</option>
                                                {inventory.map(m => (
                                                    <option key={m.id} value={m.id}>{m.med_name}</option>
                                                ))}
                                            </select>
                                            
                                            <input type="number" placeholder="Qty" value={item.qty || ''} onChange={e => {
                                                const newItems = [...newOrder.items];
                                                newItems[idx].qty = parseInt(e.target.value) || 0;
                                                setNewOrder({...newOrder, items: newItems});
                                            }} style={{ flex: 1, padding: '8px', border: '1px solid #dee2e6', borderRadius: '4px' }} />
                                            
                                            <input type="number" placeholder="Unit Cost" value={item.cost || ''} onChange={e => {
                                                const newItems = [...newOrder.items];
                                                newItems[idx].cost = parseFloat(e.target.value) || 0;
                                                setNewOrder({...newOrder, items: newItems});
                                            }} style={{ flex: 1, padding: '8px', border: '1px solid #dee2e6', borderRadius: '4px' }} />
                                            
                                            <button onClick={() => {
                                                const newItems = newOrder.items.filter((_, i) => i !== idx);
                                                setNewOrder({...newOrder, items: newItems});
                                            }} style={{ background: '#f8d7da', color: '#dc3545', border: 'none', borderRadius: '4px', width: '35px', cursor: 'pointer' }}><X size={16} /></button>
                                        </div>
                                    ))}
                                    
                                    <div style={{ textAlign: 'right', marginTop: '15px', fontSize: '1.1rem', fontWeight: '700', color: '#007bff' }}>
                                        Total: KSh {newOrder.items.reduce((acc, i) => acc + (Number(i.qty) * Number(i.cost)), 0).toLocaleString()}
                                    </div>
                                </div>

                                <button onClick={handleSaveOrder} style={{ padding: '15px', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px', fontWeight: '700', cursor: 'pointer', marginTop: '10px' }}>SUBMIT PURCHASE ORDER</button>
                            </div>
                        </div>
                    </div>
                )}
                
                {showRestockModal && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                        <div style={{ background: 'white', width: '100%', maxWidth: '400px', borderRadius: '4px', padding: '30px', boxShadow: '0 1rem 3rem rgba(0,0,0,.175)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                                <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#343a40' }}>Restock Item</h3>
                                <button onClick={() => setShowRestockModal(false)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#adb5bd' }}><X size={24} /></button>
                            </div>
                            <p style={{ fontSize: '0.9rem', color: '#6c757d', marginBottom: '20px' }}>
                                Do you want to generate a Purchase Order to restock {selectedRestockItems.length} selected item(s)?
                            </p>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button onClick={handleRestock} style={{ flex: 1, padding: '10px', background: '#28a745', color: 'white', border: 'none', borderRadius: '4px', fontWeight: '700', cursor: 'pointer' }}>Generate PO</button>
                                <button onClick={() => setShowRestockModal(false)} style={{ flex: 1, padding: '10px', background: '#f8f9fa', color: '#343a40', border: '1px solid #dee2e6', borderRadius: '4px', fontWeight: '700', cursor: 'pointer' }}>Cancel</button>
                            </div>
                        </div>
                    </div>
                )}
        </div>
    );
};

export default PharmaProcurement;
