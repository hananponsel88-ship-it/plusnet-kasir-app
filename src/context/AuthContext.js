import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../utils/supabase';

const AuthContext = createContext({ user: null, session: null, loading: true });

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    // Pengaman: kalau getSession menggantung (offline / env placeholder),
    // paksa loading mati setelah 8 detik supaya tidak spinner selamanya.
    const timeout = setTimeout(() => {
      if (mounted) setLoading(false);
    }, 8000);

    (async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (!mounted) return;
        const s = data?.session ?? null;
        setSession(s);
        setUser(s?.user ?? null);
      } catch (e) {
        console.warn('[Auth] getSession gagal:', e?.message || e);
      } finally {
        if (mounted) {
          setLoading(false);
          clearTimeout(timeout);
        }
      }
    })();

    let subscription;
    try {
      const { data: listener } = supabase.auth.onAuthStateChange((_event, s) => {
        if (!mounted) return;
        setSession(s);
        setUser(s?.user ?? null);
        setLoading(false);
      });
      subscription = listener?.subscription;
    } catch (e) {
      console.warn('[Auth] onAuthStateChange gagal:', e?.message || e);
      if (mounted) setLoading(false);
    }

    return () => {
      mounted = false;
      clearTimeout(timeout);
      try {
        subscription?.unsubscribe();
      } catch (e) {}
    };
  }, []);

  const value = { user, session, loading };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);