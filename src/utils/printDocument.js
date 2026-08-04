/**
 * printDocument — opens a focused print popup for a specific clinical form.
 * @param {string} type  'registration' | 'consultation' | 'lab' | 'medicine'
 * @param {object} record  the specific record (consult/lab/med row) or null for registration
 * @param {object} patient  the patient object
 */
export function printDocument(type, record, patient) {
    const win = window.open('', '_blank', 'width=960,height=780');
    const p = patient || {};
    const m = record || {};

    const css = `<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Segoe UI',Arial,sans-serif;font-size:12px;color:#0f172a;padding:28px;max-width:860px;margin:0 auto}
h1{font-size:17px;font-weight:900;color:white}
h2{font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:.06em;border-bottom:2px solid #0891b2;padding-bottom:5px;margin:18px 0 12px;color:#0f172a}
h2.red{border-color:#ef4444}h2.green{border-color:#10b981}h2.amber{border-color:#f59e0b}h2.purple{border-color:#8b5cf6}
.hdr{background:linear-gradient(135deg,#0891b2,#0f172a);padding:18px 24px;border-radius:8px 8px 0 0;display:flex;justify-content:space-between;align-items:center}
.hdr p{color:rgba(255,255,255,.65);font-size:10px;margin-top:3px}
.hdr .id{background:rgba(255,255,255,.15);padding:4px 12px;border-radius:6px;color:white;font-weight:900;font-size:12px}
.body{padding:22px 28px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 8px 8px}
.g2{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.g3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px}
.g4{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}
.f{margin-bottom:8px}
.f label{font-size:9px;font-weight:800;color:#94a3b8;text-transform:uppercase;display:block;margin-bottom:2px}
.f .val{font-size:12px;font-weight:700;border-bottom:1px solid #cbd5e1;padding:3px 0;min-height:22px;color:#1e293b}
.f .val.empty{color:#d1d5db}
.vcard{background:#f0f9ff;border:1px solid #bae6fd;border-radius:8px;padding:10px;text-align:center}
.vcard .vl{font-size:9px;font-weight:900;color:#0369a1;text-transform:uppercase}
.vcard .vv{font-size:15px;font-weight:900;color:#0c4a6e;margin-top:4px}
.box{padding:12px;border-radius:8px;margin-bottom:10px}
.box-red{background:#fef2f2;border:1px solid #fecaca}
.box-gray{background:#f8fafc;border:1px solid #e2e8f0}
.box-amber{background:#fffbeb;border:1px solid #fde68a}
.box-purple{background:#f5f3ff;border:1px solid #ddd6fe}
.box label{font-size:9px;font-weight:900;text-transform:uppercase;display:block;margin-bottom:5px}
.box-red label{color:#991b1b}.box-gray label{color:#475569}.box-amber label{color:#b45309}.box-purple label{color:#5b21b6}
table{width:100%;border-collapse:collapse;margin-top:6px}
th{background:#f1f5f9;padding:7px 10px;text-align:left;font-size:9px;text-transform:uppercase;color:#64748b;font-weight:800}
td{padding:7px 10px;border-bottom:1px solid #f1f5f9;font-size:11px}
.pill{padding:2px 8px;border-radius:20px;font-size:10px;font-weight:700;display:inline-block}
.n{background:#f0fdf4;color:#166534}.ab{background:#fef2f2;color:#dc2626}
.sig{display:grid;grid-template-columns:1fr 1fr;gap:48px;margin-top:28px;border-top:2px solid #0f172a;padding-top:18px}
.sl{border-top:1px solid #0f172a;padding-top:5px;font-size:10px;color:#475569;margin-top:40px}
.sl.light{border-color:#94a3b8;color:#94a3b8;margin-top:24px}
@media print{body{padding:0}}
</style>`;

    const F = (label, value) =>
        `<div class="f"><label>${label}</label><div class="val${value ? '' : ' empty'}">${value || '________________________________'}</div></div>`;

    let body = '';

    if (type === 'registration') {
        const vitals = [
            ['Temperature', p.ptemp ? `${p.ptemp}°C` : '--°C'],
            ['Blood Pressure', p.pbp || '--/--'],
            ['Weight', p.pweight ? `${p.pweight} kg` : '-- kg'],
            ['Height', p.pheight ? `${p.pheight} cm` : '-- cm'],
            ['Heart Rate', p.pheartrate ? `${p.pheartrate} bpm` : '-- bpm'],
            ['Resp. Rate', p.prespiratory ? `${p.prespiratory} rpm` : '-- rpm'],
            ['SpO₂', p.pspo2 ? `${p.pspo2}%` : '--%'],
            ['BMI', (p.pweight && p.pheight) ? (p.pweight / ((p.pheight / 100) ** 2)).toFixed(1) : '--'],
        ];
        body = `
<div class="hdr">
  <div><h1>Moonview Medical Center</h1><p>Patient Enrollment Record — Confidential</p></div>
  <div style="text-align:right"><span class="id">PT-${p.pid || 'N/A'}</span><p style="color:rgba(255,255,255,.55);font-size:10px;margin-top:5px">Registered: ${p.pdate_registered ? new Date(p.pdate_registered).toLocaleDateString() : '—'}</p></div>
</div>
<div class="body">
  <h2>1. Identity &amp; Residency</h2>
  <div class="g3">${F('Full Name', p.pname)}${F('Gender', p.pgender === 'M' ? 'Male' : p.pgender === 'F' ? 'Female' : p.pgender)}${F('Date of Birth', p.pdob)}${F('Phone', p.ptel)}${F('Alt Phone', p.palttel)}${F('National ID', p.pnic || p.national_id)}${F('Email', p.pemail)}${F('City', p.pcity)}${F('Blood Group', p.pbloodgroup)}</div>
  ${F('Physical Address', p.paddress)}
  <h2 class="green">2. Physiological Baseline</h2>
  <div class="g4">${vitals.map(([l, v]) => `<div class="vcard"><div class="vl">${l}</div><div class="vv">${v}</div></div>`).join('')}</div>
  <h2 class="red">3. Clinical Summary</h2>
  <div class="g2" style="margin-bottom:10px">
    <div class="box box-red"><label>Known Allergies</label><div style="font-weight:700;min-height:24px">${p.pallergies || 'None disclosed'}</div></div>
    <div class="box box-gray"><label>Pre-existing Conditions</label><div style="font-weight:700;min-height:24px">${p.pconditions || '—'}</div></div>
  </div>
  <div class="box box-gray"><label>Current Medications</label><div style="font-weight:700;min-height:24px">${p.pcurrent_medications || p.medications || '—'}</div></div>
  <h2 class="amber">4. Emergency Contact</h2>
  <div class="g3 box box-amber">${F('Name', p.pemergency_name)}${F('Phone', p.pemergency_phone)}${F('Relationship', p.pemergency_relation)}</div>
  <h2 class="purple">5. Payment &amp; Insurance</h2>
  <div class="g3 box box-purple">${F('Payment Method', p.ppayment)}${F('Insurance Provider', p.pinsurance_provider)}${F('Policy / Member #', p.pinsurance_number)}</div>
  <div class="sig">
    <div><p style="font-size:10px;color:#64748b;line-height:1.7">I certify that the above information is accurate and consent to data processing by Moonview Medical Center.</p><div class="sl">Patient / Guardian Signature &amp; Date</div></div>
    <div style="text-align:right"><div style="font-size:11px;font-weight:700;color:#0f172a;">${p.created_by || 'Not Recorded'}</div><div class="sl" style="margin-top:40px">Registrar Signature</div><div class="sl light">Official Stamp</div></div>
  </div>
</div>`;
    } else if (type === 'consultation') {
        const c = m;
        body = `
<div class="hdr">
  <div><h1>SOAP Consultation Form</h1><p>Moonview Medical Center — Clinical Record</p></div>
  <div style="text-align:right"><strong style="color:white">${p.pname || 'Patient'}</strong><p style="color:rgba(255,255,255,.65);font-size:10px;margin-top:3px">${c.consultation_date ? new Date(c.consultation_date).toLocaleDateString() : c.created_at ? new Date(c.created_at).toLocaleDateString() : 'N/A'} · ${c.consultation_type || 'General'}</p></div>
</div>
<div class="body">
  <h2>Subjective</h2>
  <div class="g3">${F('Chief Complaint', c.chief_complaint)}${F('Symptoms', c.symptoms)}${F('Consultation Type', c.consultation_type)}</div>
  ${F('History of Present Illness (HPI)', c.hpi)}
  <h2>Past Medical &amp; Social History</h2>
  <div class="g3">${F('Past Medical History', c.pmh)}${F('Surgical History', c.surgical_history)}${F('Social History', c.social_history)}${F('Obstetric History', c.obstetric_history)}${F('Immunization History', c.immunization_history)}${F('Review of Systems', c.ros)}</div>
  <h2 class="green">Objective — Physical Examination</h2>
  <div class="g3">${F('General Appearance', c.general_appearance)}${F('Cardiovascular', c.cardiovascular)}${F('Respiratory', c.respiratory)}${F('Abdomen', c.abdomen)}${F('Neurological', c.neurological)}${F('Skin / Integumentary', c.skin)}</div>
  <h2 class="red">Assessment &amp; Plan</h2>
  <div class="g2">${F('Primary Diagnosis', c.diagnosis || c.primary_diagnosis_code)}${F('ICD-10 Code', c.primary_diagnosis_code)}</div>
  ${F('Clinical Impression', c.clinical_impression)}
  ${F('Management Plan', c.management_plan)}
  <div class="sig"><div class="sl">Physician Signature &amp; Date</div><div class="sl">Reviewed By</div></div>
</div>`;
    } else if (type === 'lab') {
        const l = m;
        let parsed = {};
        try { parsed = l.results ? JSON.parse(l.results) : {}; } catch (e) {}
        const rows = Object.entries(parsed);
        const plainResult = typeof l.results === 'string' && !l.results.startsWith('{') ? l.results : 'Pending';
        body = `
<div class="hdr">
  <div><h1>Laboratory Report</h1><p>Moonview Medical Center — Ref #LR-${l.id || 'N/A'}</p></div>
  <div style="text-align:right"><strong style="color:white">${p.pname || 'Patient'}</strong><p style="color:rgba(255,255,255,.65);font-size:10px;margin-top:3px">${l.created_at ? new Date(l.created_at).toLocaleDateString() : 'N/A'}</p></div>
</div>
<div class="body">
  <div class="g3 box box-gray" style="margin-bottom:16px">${F('Test Name', l.test_name)}${F('Category', l.category)}${F('Requesting Doctor', l.doctor_name || l.docid)}</div>
  <h2 class="green">Test Results</h2>
  <table>
    <thead><tr><th>Parameter</th><th>Result</th><th>Unit</th><th>Normal Range</th><th>Status</th></tr></thead>
    <tbody>${rows.length > 0 ? rows.map(([param, data]) =>
        `<tr><td>${param}</td><td style="font-weight:800">${data?.value || '—'}</td><td>${data?.unit || '—'}</td><td>${data?.ref || '—'}</td><td><span class="pill ${data?.status === 'Normal' ? 'n' : 'ab'}">${data?.status || '—'}</span></td></tr>`
    ).join('') : `<tr><td colspan="5" style="text-align:center;padding:20px;color:#94a3b8">Overall result: ${plainResult}</td></tr>`}
    </tbody>
  </table>
  ${l.notes ? `<div class="box box-amber" style="margin-top:12px"><label>Technician Notes</label><div>${l.notes}</div></div>` : ''}
  <div class="sig"><div class="sl">Lab Technician Signature</div><div class="sl">Authorized By</div></div>
</div>`;
    } else if (type === 'medicine') {
        const med = m;
        body = `
<div class="hdr">
  <div><h1>Medicine Prescription Slip</h1><p>Moonview Medical Center</p></div>
  <div style="text-align:right"><strong style="color:white">${p.pname || 'Patient'}</strong><p style="color:rgba(255,255,255,.65);font-size:10px;margin-top:3px">${med.date || (med.created_at ? new Date(med.created_at).toLocaleDateString() : 'N/A')}</p></div>
</div>
<div class="body">
  <h2 class="amber">Prescription Details</h2>
  <div class="g3">
    ${F('Drug Name', med.drug_name || med.medicine_name)}
    ${F('Brand Name', med.brand_name)}
    ${F('Drug Form', med.drug_form)}
    ${F('Dosage', med.dosage)}
    ${F('Frequency', med.frequency)}
    ${F('Route of Administration', med.route)}
    ${F('Duration', med.duration)}
    ${F('Quantity', med.quantity)}
    ${F('Refills', med.refills || '0')}
    ${F('Food Relation', med.food_relation)}
    ${F('Special Instructions', med.instructions)}
  </div>
  <div class="sig"><div class="sl">Prescribing Physician Signature</div><div class="sl">Pharmacist Signature &amp; Date</div></div>
</div>`;
    }

    win.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Moonview — Print</title>${css}</head><body>${body}</body></html>`);
    win.document.close();
    setTimeout(() => { win.focus(); win.print(); }, 400);
}
