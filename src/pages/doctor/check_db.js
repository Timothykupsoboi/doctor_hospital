import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkTables() {
  console.log('--- Checking Supabase Tables ---');
  
  const tables = ['patient', 'patients', 'consultations', 'prescriptions', 'vitals_records', 'lab_reports', 'doctor', 'appointment'];
  
  for (const table of tables) {
    try {
      const { data, error, status } = await supabase
        .from(table)
        .select('*', { count: 'exact' })
        .limit(1);
      
      if (error) {
        console.log(`[${table}] ❌ Error ${status || error.status}: ${error.message}`);
      } else {
        console.log(`[${table}] ✅ OK (${data?.length || 0} rows, count: ${status})`);
      }
    } catch (e) {
      console.log(`[${table}] 💥 Exception: ${e.message}`);
    }
  }
  
  // Test specific query from PatientProfile
  console.log('\n--- Testing PatientProfile Queries ---');
  try {
    const pidInt = 1;
    const { data: patientData, error: patientError } = await supabase
      .from('patient')
      .select('*')
      .eq('pid', pidInt)
      .single();
    console.log('patient table query:', patientData ? '✅ Found' : '❌ No data', patientError ? patientError.message : '');
  } catch (e) {
    console.log('patient query exception:', e.message);
  }
  
  try {
    const { data: patientsData, error: patientsError } = await supabase
      .from('patients')
      .select('*')
      .eq('pid', 1)
      .single();
    console.log('patients table query:', patientsData ? '✅ Found' : '❌ No data', patientsError ? patientsError.message : '');
  } catch (e) {
    console.log('patients query exception:', e.message);
  }
}

checkTables();
