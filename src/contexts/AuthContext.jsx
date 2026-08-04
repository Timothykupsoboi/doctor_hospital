// =============================================================
// FILE: AuthContext.jsx
// PURPOSE: Provides global authentication state using Supabase Auth.
//          Replaces the old localStorage token + JWT system.
//          Wraps the entire app so every component can access:
//            - user       → current Supabase auth user
//            - userType   → 'a' | 'd' | 'r' | 'l' | 'ph'
//            - profile    → the staff row from the relevant table
//            - signOut()  → logs user out and redirects to /login
// =============================================================

import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

// Create the context object
const AuthContext = createContext(null);

// AuthProvider wraps the whole app in main.jsx (via App.jsx)
export function AuthProvider({ children }) {
  // Supabase auth user object (has .id, .email, .user_metadata, etc.)
  const [user, setUser] = useState(null);

  // The role code: 'a'=admin, 'd'=doctor, 'r'=registrar, 'l'=lab, 'ph'=pharmacy
  const [userType, setUserType] = useState(null);

  // The full staff profile row from the relevant Supabase table
  const [profile, setProfile] = useState(null);

  // True while we are fetching the session/profile on first load
  const [loading, setLoading] = useState(true);

  // ----------------------------------------------------------
  // fetchProfile: given a Supabase user object, load the
  // matching staff profile row (doctor, registrar, etc.)
  // ----------------------------------------------------------
  const fetchProfile = async (authUser) => {
    if (!authUser) {
      setProfile(null);
      setUserType(null);
      return;
    }

    // Fetch the centralized profile record (by ID or Email)
    let { data: profileList, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authUser.id);

    let data = profileList?.[0];

    if (!data && authUser.email) {
      const { data: pByEmailList } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', authUser.email);
      data = pByEmailList?.[0];
    }

    const isAdminEmail = authUser.email && authUser.email.toLowerCase().includes('admin');

    if (error && !data && !isAdminEmail) {
      console.error('[AuthContext] Profile fetch error:', error?.message || 'No profile found');
      const fallbackRole = authUser.user_metadata?.usertype || authUser.user_metadata?.role || (isAdminEmail ? 'a' : null);
      const normalizedFallback = fallbackRole ? (
        { 'admin': 'a', 'Admin': 'a', 'administrator': 'a', 'doctor': 'd', 'Doctor': 'd', 'receptionist': 'r', 'Receptionist': 'r', 'lab': 'l', 'Lab': 'l', 'pharmacy': 'ph', 'Pharmacy': 'ph' }[fallbackRole] || fallbackRole
      ) : (isAdminEmail ? 'a' : null);
      setUserType(normalizedFallback);
      setProfile(null);
    } else {
      const rawRole = data?.role || data?.usertype || authUser.user_metadata?.usertype || authUser.user_metadata?.role || (isAdminEmail ? 'a' : 'a');
      const normalizedRole = (
        { 'a': 'a', 'admin': 'a', 'Admin': 'a', 'administrator': 'a', 'superadmin': 'a', 'd': 'd', 'doctor': 'd', 'Doctor': 'd', 'r': 'r', 'receptionist': 'r', 'Receptionist': 'r', 'registrar': 'r', 'l': 'l', 'lab': 'l', 'Lab': 'l', 'ph': 'ph', 'pharmacy': 'ph', 'Pharmacy': 'ph', 'pharmacist': 'ph' }[rawRole] || rawRole || (isAdminEmail ? 'a' : 'a')
      );

      let finalProfile = data ? { ...data, role: normalizedRole } : { id: authUser.id, email: authUser.email, role: normalizedRole, full_name: authUser.user_metadata?.full_name || authUser.email };
      
      // Fetch role-specific ID from legacy tables to ensure dashboard visibility
      const roleTableMap = {
        d: { table: 'doctor', idName: 'docid' },
        r: { table: 'registrar', idName: 'regid' },
        l: { table: 'lab_technician', idName: 'labid' },
        ph: { table: 'pharmacist', idName: 'phid' }
      };
 
      const mapping = roleTableMap[normalizedRole] || roleTableMap[data.role];
      if (mapping) {
        const emailFieldMap = { doctor: 'docemail', registrar: 'regemail', lab_technician: 'labemail', pharmacist: 'phemail' };
        const emailField = emailFieldMap[mapping.table];
        
        const { data: legacyList } = await supabase
          .from(mapping.table)
          .select('*')
          .or(`user_id.eq.${authUser.id}${emailField && authUser.email ? `,${emailField}.eq.${authUser.email}` : ''}`);
        
        const legacyData = legacyList?.[0];
        
        if (legacyData) {
          finalProfile = { ...finalProfile, ...legacyData };
        }
      }

      setUserType(normalizedRole);
      setProfile(finalProfile);
    }
  };

  // ----------------------------------------------------------
  // On mount: restore existing session, then listen for changes
  // ----------------------------------------------------------
  useEffect(() => {
    // 1. Restore existing session (e.g., page refresh)
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      fetchProfile(session?.user ?? null).finally(() => setLoading(false));
    });

    // 2. Listen for login / logout events
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      fetchProfile(session?.user ?? null);
    });

    // Cleanup the listener on unmount
    return () => listener.subscription.unsubscribe();
  }, []);

  // ----------------------------------------------------------
  // signOut: logs out from Supabase and clears local state
  // ----------------------------------------------------------
  const signOut = async () => {
    localStorage.removeItem('hms_bypass');
    await supabase.auth.signOut();
    setUser(null);
    setUserType(null);
    setProfile(null);
    // Redirect to login page
    window.location.href = '/login';
  };

  const refreshProfile = () => fetchProfile(user);

  return (
    <AuthContext.Provider value={{ user, userType, profile, loading, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook for easy access anywhere: const { user, userType } = useAuth();
export function useAuth() {
  return useContext(AuthContext);
}
