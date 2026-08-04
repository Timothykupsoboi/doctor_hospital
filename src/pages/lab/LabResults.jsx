// =============================================================
// FILE: LabResults.jsx
// PURPOSE: Central hub for viewing and delivering laboratory results.
//          Handles patient-centric grouping of finalized reports.
//          Distinguishes between partially and fully complete panels.
// =============================================================
import React, { useState, useEffect, useCallback } from 'react';
import { CheckCircle, Search, Download, Eye, X, FileText, Calendar, User, Microscope, AlertCircle, Clock, Activity, Loader, Printer } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export default function LabResults() {
    const [requests, setRequests] = useState([]);
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [currentTab, setCurrentTab] = useState('Incomplete'); // 'Incomplete', 'Complete'
    const [selectedReport, setSelectedReport] = useState(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            // 1. Fetch all lab requests that have at least one completed test
            const { data: reqData, error: reqError } = await supabase
                .from('lab_requests')
                .select('*')
                .order('created_at', { ascending: false });
            if (reqError) throw reqError;

            // 2. Fetch all reports
            const { data: repData, error: repError } = await supabase
                .from('lab_reports')
                .select('*');
            if (repError) throw repError;

            // 3. Fetch patient & doctor details for grouping
            const appoids = [...new Set((reqData || []).map(r => r.appointment_id).filter(Boolean))];
            let appos = [];
            if (appoids.length > 0) {
                const { data: appoData } = await supabase
                    .from('appointment')
                    .select('appoid, patient:pid(pname, pgender), doctor:docid(docname)')
                    .in('appoid', appoids);
                appos = appoData || [];
            }

            // 4. Map requests with details
            const mapped = (reqData || []).map(r => {
                const appo = appos.find(a => a.appoid === r.appointment_id);
                return {
                    ...r,
                    pname: appo?.patient?.pname || 'Unknown',
                    pgender: appo?.patient?.pgender || 'Unknown',
                    docname: appo?.doctor?.docname || 'Staff'
                };
            });

            setRequests(mapped);
            setReports(repData || []);
        } catch (e) {
            console.error("Fetch failed", e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    // Grouping & Tab Filtering
    const grouped = requests.reduce((acc, req) => {
        if (!acc[req.appointment_id]) acc[req.appointment_id] = [];
        acc[req.appointment_id].push(req);
        return acc;
    }, {});

    const tabData = Object.entries(grouped).reduce((acc, [appoid, group]) => {
        const anyCompleted = group.some(r => r.status === 'completed');
        const allCompleted = group.every(r => r.status === 'completed');

        if (allCompleted) acc.Complete[appoid] = group;
        else if (anyCompleted) acc.Incomplete[appoid] = group;

        return acc;
    }, { Incomplete: {}, Complete: {} });

    const displayedGroups = tabData[currentTab];

    const handlePrint = (report, patInfo) => {
        const resultData = (() => { try { return JSON.parse(report.results || '{}'); } catch { return {}; } })();
        const win = window.open('', '_blank');
        win.document.write(`
            <!DOCTYPE html><html><head><title>Lab Report — ${patInfo.pname}</title>
            <style>
                body { font-family: 'Inter', 'Arial', sans-serif; margin: 40px; color: #1e293b; line-height: 1.5; }
                .header { border-bottom: 2px solid #0f172a; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: center; }
                .logo { font-size: 1.5rem; font-weight: 900; color: #2563eb; letter-spacing: -0.5px; }
                .hospital { color: #0f172a; font-size: 1rem; font-weight: 800; }
                .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; background: #f8fafc; padding: 24px; border-radius: 12px; margin-bottom: 30px; border: 1px solid #e2e8f0; }
                .info-item label { display: block; font-size: 0.65rem; text-transform: uppercase; color: #64748b; font-weight: 700; margin-bottom: 4px; letter-spacing: 0.05em; }
                .info-item span { font-weight: 700; font-size: 1rem; color: #1e293b; }
                table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
                th { background: #f8fafc; color: #64748b; padding: 12px 16px; text-align: left; font-size: 0.75rem; text-transform: uppercase; font-weight: 700; border-bottom: 2px solid #e2e8f0; }
                td { padding: 14px 16px; border-bottom: 1px solid #f1f5f9; font-size: 0.95rem; }
                .results-row:nth-child(even) { background: #fcfdfe; }
                .notes { background: #fffbeb; border: 1px solid #fef3c7; padding: 20px; border-radius: 12px; margin-bottom: 30px; }
                .footer { margin-top: 50px; border-top: 1px solid #e2e8f0; padding-top: 20px; display: flex; justify-content: space-between; font-size: 0.8rem; color: #94a3b8; }
                .status-badge { background: #ecfdf5; color: #059669; padding: 4px 12px; border-radius: 20px; font-weight: 800; font-size: 0.7rem; border: 1px solid #86efac; }
                .test-section { margin-bottom: 40px; }
                .test-header { font-size: 1.1rem; font-weight: 800; color: #2563eb; margin-bottom: 15px; border-left: 4px solid #2563eb; padding-left: 15px; }
            </style></head><body>
            <div class="header">
                <div>
                    <div class="logo">MOONVIEW MEDICAL CENTER</div>
                    <div class="hospital">Diagnostic Excellence Center</div>
                </div>
                <div style="text-align:right">
                    <span class="status-badge">✓ FINALIZED REPORT</span>
                </div>
            </div>
            <div class="info-grid">
                <div>
                    <div class="info-item" style="margin-bottom:16px;"><label>Patient Name</label><span>${patInfo.pname}</span></div>
                    <div class="info-item"><label>Gender / Age</label><span>${patInfo.pgender}</span></div>
                </div>
                <div style="text-align:right">
                    <div class="info-item" style="margin-bottom:16px;"><label>Investigation</label><span>${report.test_name}</span></div>
                    <div class="info-item"><label>Date Processed</label><span>${new Date(report.created_at).toLocaleString()}</span></div>
                </div>
            </div>
            <table>
                <thead><tr><th>Diagnostic Parameter</th><th>Result Value</th></tr></thead>
                <tbody>
                    ${Object.entries(resultData).map(([k, v]) => {
                        const valStr = typeof v === 'object' && v !== null ? `${v.value} ${v.unit || ''}` : String(v);
                        return `<tr class="results-row"><td>${k}</td><td><strong style="color:#0f172a">${valStr}</strong></td></tr>`;
                    }).join('')}
                </tbody>
            </table>
            ${report.notes ? `<div class="notes"><label style="display:block;font-size:0.7rem;font-weight:800;color:#92400e;margin-bottom:8px;text-transform:uppercase;">Clinical Remarks</label>${report.notes}</div>` : ''}
            <div class="footer">
                <div>Document Hash: ${Math.random().toString(36).substring(7).toUpperCase()}</div>
                <div>Printed on: ${new Date().toLocaleString()} • Ref: ${report.id}</div>
            </div>
            </body></html>
        `);
        win.document.close();
        win.print();
    };

    const handlePrintAll = (group, patInfo) => {
        const completedTests = group.filter(r => r.status === 'completed');
        if (completedTests.length === 0) return alert("No completed tests to print.");

        const win = window.open('', '_blank');
        let html = `
            <!DOCTYPE html><html><head><title>Full Diagnostic Panel — ${patInfo.pname}</title>
            <style>
                body { font-family: 'Inter', 'Arial', sans-serif; margin: 40px; color: #1e293b; line-height: 1.5; }
                .header { border-bottom: 2px solid #0f172a; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: center; }
                .logo { font-size: 1.5rem; font-weight: 900; color: #2563eb; letter-spacing: -0.5px; }
                .hospital { color: #0f172a; font-size: 1rem; font-weight: 800; }
                .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; background: #f8fafc; padding: 24px; border-radius: 12px; margin-bottom: 40px; border: 1px solid #e2e8f0; }
                .info-item label { display: block; font-size: 0.65rem; text-transform: uppercase; color: #64748b; font-weight: 700; margin-bottom: 4px; letter-spacing: 0.05em; }
                .info-item span { font-weight: 700; font-size: 1rem; color: #1e293b; }
                table { width: 100%; border-collapse: collapse; margin-bottom: 25px; }
                th { background: #f8fafc; color: #64748b; padding: 12px 16px; text-align: left; font-size: 0.7rem; text-transform: uppercase; font-weight: 700; border-bottom: 2px solid #e2e8f0; }
                td { padding: 12px 16px; border-bottom: 1px solid #f1f5f9; font-size: 0.9rem; }
                .test-section { margin-bottom: 50px; page-break-inside: avoid; }
                .test-header { font-size: 1.15rem; font-weight: 900; color: #0f172a; margin-bottom: 15px; border-left: 5px solid #2563eb; padding-left: 15px; text-transform: uppercase; }
                .notes { background: #fefce8; border: 1px solid #fef3c7; padding: 16px; border-radius: 10px; margin-top: 10px; font-size: 0.85rem; }
                .footer { margin-top: 50px; border-top: 1px solid #e2e8f0; padding-top: 20px; display: flex; justify-content: space-between; font-size: 0.75rem; color: #94a3b8; }
                .status-badge { background: #ecfdf5; color: #059669; padding: 4px 12px; border-radius: 20px; font-weight: 800; font-size: 0.7rem; border: 1px solid #86efac; }
            </style></head><body>
            <div class="header">
                <div>
                    <div class="logo">MOONVIEW MEDICAL CENTER</div>
                    <div class="hospital">Diagnostic Excellence Center</div>
                </div>
                <div style="text-align:right">
                    <span class="status-badge">✓ CONSOLIDATED DIAGNOSTIC SUMMARY</span>
                </div>
            </div>
            <div class="info-grid">
                <div>
                    <div class="info-item" style="margin-bottom:16px;"><label>Patient Name</label><span>${patInfo.pname}</span></div>
                    <div class="info-item"><label>Gender / Age</label><span>${patInfo.pgender}</span></div>
                </div>
                <div style="text-align:right">
                    <div class="info-item" style="margin-bottom:16px;"><label>Requesting Physician</label><span>Dr. ${patInfo.docname}</span></div>
                    <div class="info-item"><label>Visit Reference</label><span>REF-${patInfo.appointment_id}</span></div>
                </div>
            </div>
        `;

        completedTests.forEach(req => {
            const report = reports.find(r => r.request_id === req.id);
            if (!report) return;
            const resultData = (() => { try { return JSON.parse(report.results || '{}'); } catch { return {}; } })();

            html += `
                <div class="test-section">
                    <div class="test-header">${req.test_name}</div>
                    <table>
                        <thead><tr><th>Parameter</th><th>Result</th></tr></thead>
                        <tbody>
                            ${Object.entries(resultData).map(([k, v]) => {
                                const valStr = typeof v === 'object' && v !== null ? `${v.value} ${v.unit || ''}` : String(v);
                                return `<tr><td>${k}</td><td><strong style="color:#1e293b">${valStr}</strong></td></tr>`;
                            }).join('')}
                        </tbody>
                    </table>
                    ${report.notes ? `<div class="notes"><strong>Remarks:</strong> ${report.notes}</div>` : ''}
                </div>
            `;
        });

        html += `
            <div class="footer">
                <div>Consolidated Report Hash: ${Math.random().toString(36).substring(7).toUpperCase()}</div>
                <div>Generated: ${new Date().toLocaleString()}</div>
            </div>
            </body></html>
        `;

        win.document.write(html);
        win.document.close();
        win.print();
    };

    return (
        <div style={{ padding: '32px 48px', maxWidth: '1600px', margin: '0 auto', background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
            <header style={{ marginBottom: 40 }}>
                <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 12 }}>
                    <CheckCircle size={28} color="#10b981" /> Laboratory Results
                </h1>
                <p style={{ color: '#64748b', marginTop: 4 }}>Archive of finalized diagnostic panels and patient reports.</p>
            </header>

            {/* Tab Navigation */}
            <div style={{ display: 'flex', gap: '32px', marginBottom: '32px', borderBottom: '2px solid #f1f5f9' }}>
                {[
                    { id: 'Incomplete', label: 'Incomplete Panels', icon: Activity, count: Object.keys(tabData.Incomplete).length, color: '#f59e0b' },
                    { id: 'Complete', label: 'Full Reports', icon: CheckCircle, count: Object.keys(tabData.Complete).length, color: '#10b981' }
                ].map(t => (
                    <button 
                        key={t.id}
                        onClick={() => setCurrentTab(t.id)}
                        style={{
                            padding: '12px 16px',
                            background: 'none',
                            border: 'none',
                            borderBottom: currentTab === t.id ? `4px solid ${t.color}` : '4px solid transparent',
                            color: currentTab === t.id ? t.color : '#64748b',
                            fontSize: '0.95rem',
                            fontWeight: '800',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            transition: '0.2s'
                        }}
                    >
                        <t.icon size={18} /> {t.label}
                        <span style={{ fontSize: '0.7rem', background: currentTab === t.id ? t.color : '#e2e8f0', color: currentTab === t.id ? 'white' : '#64748b', padding: '2px 8px', borderRadius: '12px', marginLeft: '4px' }}>{t.count}</span>
                    </button>
                ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                {loading ? (
                    <div style={{ textAlign: 'center', padding: 64 }}><Loader size={24} className="animate-spin" /></div>
                ) : Object.entries(displayedGroups).length === 0 ? (
                    <div style={{ padding: '80px', textAlign: 'center', background: 'white', borderRadius: '24px', border: '2px dashed #e2e8f0' }}>
                        <h3 style={{ color: '#64748b', fontSize: '1.2rem', fontWeight: '700' }}>No {currentTab} Reports</h3>
                        <p style={{ color: '#94a3b8' }}>Finalized results will appear here automatically.</p>
                    </div>
                ) : Object.entries(displayedGroups).map(([appoid, group]) => {
                    const patient = group[0];
                    return (
                        <div key={appoid} style={{ background: 'white', borderRadius: '24px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
                            <div style={{ padding: '20px 32px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                    <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'white', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <User size={20} color="#64748b" />
                                    </div>
                                    <div>
                                        <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#0f172a', margin: 0 }}>{patient.pname}</h3>
                                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Ordered by Dr. {patient.docname} · {group.length} Investigation(s)</div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                    {currentTab === 'Complete' && (
                                        <button 
                                            onClick={() => handlePrintAll(group, patient)}
                                            style={{
                                                padding: '8px 16px',
                                                borderRadius: '10px',
                                                background: '#0f172a',
                                                color: 'white',
                                                border: 'none',
                                                fontSize: '0.75rem',
                                                fontWeight: '700',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '8px',
                                                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
                                            }}
                                        >
                                            <Printer size={16} /> Print Full Panel
                                        </button>
                                    )}
                                    {currentTab === 'Incomplete' && (
                                        <div style={{ background: '#fffbeb', border: '1px solid #fef3c7', color: '#92400e', padding: '6px 12px', borderRadius: '10px', fontSize: '0.7rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <Clock size={14} /> PENDING {group.filter(r => r.status !== 'completed').length} TESTS
                                        </div>
                                    )}
                                </div>
                            </div>

                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <tbody>
                                    {group.map((req, i) => {
                                        const report = reports.find(r => r.request_id === req.id);
                                        return (
                                            <tr key={req.id} style={{ borderBottom: i === group.length - 1 ? 'none' : '1px solid #f1f5f9' }}>
                                                <td style={{ padding: '16px 32px' }}>
                                                    <div style={{ fontWeight: '700', color: '#1e293b' }}>{req.test_name}</div>
                                                    <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Status: <span style={{ color: req.status === 'completed' ? '#10b981' : '#f59e0b', fontWeight: '700' }}>{req.status.toUpperCase()}</span></div>
                                                </td>
                                                <td style={{ padding: '16px 32px', textAlign: 'right' }}>
                                                    {report ? (
                                                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                                            <button onClick={() => setSelectedReport({ report, patient })} style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', background: 'white', color: '#475569', fontSize: '0.75rem', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                                <Eye size={14} /> View
                                                            </button>
                                                            <button onClick={() => handlePrint(report, patient)} style={{ padding: '6px 12px', borderRadius: '8px', border: 'none', background: '#f0fdf4', color: '#166534', fontSize: '0.75rem', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                                <Printer size={14} /> Print
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontStyle: 'italic' }}>Report Pending</span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    );
                })}
            </div>

            {/* Detailed Result Modal */}
            {selectedReport && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)' }}>
                    <div style={{ background: 'white', borderRadius: '32px', width: '600px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', padding: '40px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '32px' }}>
                            <div>
                                <h2 style={{ fontSize: '1.5rem', fontWeight: '900', color: '#0f172a' }}>Investigation Result</h2>
                                <p style={{ color: '#64748b' }}>{selectedReport.report.test_name} for {selectedReport.patient.pname}</p>
                            </div>
                            <button onClick={() => setSelectedReport(null)} style={{ background: '#f1f5f9', border: 'none', padding: '10px', borderRadius: '12px', cursor: 'pointer' }}><X size={20} /></button>
                        </div>

                        <div style={{ background: '#f8fafc', borderRadius: '20px', padding: '24px', border: '1px solid #e2e8f0', marginBottom: '32px' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                                        <th style={{ textAlign: 'left', padding: '12px 0', fontSize: '0.7rem', color: '#94a3b8' }}>PARAMETER</th>
                                        <th style={{ textAlign: 'right', padding: '12px 0', fontSize: '0.7rem', color: '#94a3b8' }}>VALUE</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {Object.entries(JSON.parse(selectedReport.report.results || '{}')).map(([k, v], i) => (
                                        <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                            <td style={{ padding: '14px 0', fontWeight: '700', color: '#1e293b' }}>{k}</td>
                                            <td style={{ padding: '14px 0', textAlign: 'right', fontWeight: '800', fontSize: '1.1rem', color: '#2563eb' }}>
                                                {typeof v === 'object' && v !== null ? `${v.value} ${v.unit || ''}` : String(v)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {selectedReport.report.notes && (
                            <div style={{ background: '#fffbeb', border: '1px solid #fef3c7', padding: '20px', borderRadius: '16px', marginBottom: '32px' }}>
                                <div style={{ fontWeight: '800', fontSize: '0.7rem', color: '#92400e', textTransform: 'uppercase', marginBottom: '8px' }}>Clinical Notes</div>
                                <div style={{ color: '#78350f' }}>{selectedReport.report.notes}</div>
                            </div>
                        )}

                        <button 
                            onClick={() => handlePrint(selectedReport.report, selectedReport.patient)}
                            style={{ width: '100%', padding: '16px', borderRadius: '16px', background: '#0f172a', color: 'white', border: 'none', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
                        >
                            <Printer size={20} /> Print Formal Report
                        </button>
                    </div>
                </div>
            )}

            <style>{`
                .animate-spin { animation: spin 1s linear infinite; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
}
