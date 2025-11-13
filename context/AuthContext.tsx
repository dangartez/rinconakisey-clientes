
import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Session, User } from '@supabase/supabase-js';
import { Client } from '../types';

interface AuthContextType {
  isLoggedIn: boolean;
  user: Client | null;
  session: Session | null;
  login: (password: string, email: string) => Promise<any>;
  logout: () => Promise<void>;
  register: (password: string, email: string, fullName: string, phone: string) => Promise<any>;
  updateUser: (details: Partial<Client>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<Client | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setIsLoggedIn(!!session);
      if (session?.user) {
        fetchUserProfile(session.user);
      } else {
        setUser(null);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const fetchUserProfile = async (supabaseUser: User) => {
    console.log('Fetching profile for user ID:', supabaseUser.id);

    try {
      const { data, error } = await supabase
        .from('clients')
        .select('id, user_id, full_name, phone, email, nickname, created_at, claim_code')
        .eq('user_id', supabaseUser.id);

      console.log('Supabase response:', { data, error });

      if (error) {
        console.error('Error fetching user profile:', error);
        setUser(null);
      } else {
        if (data && data.length > 0) {
          console.log('Profile found:', data[0]);
          setUser(data[0] as Client);
        } else {
          console.log('No profile found for this user ID. Creating a new client profile...');
          // Crear automáticamente un perfil de cliente si no existe
          const { data: newClientData, error: insertError } = await supabase
            .from('clients')
            .insert({
              user_id: supabaseUser.id,
              full_name: supabaseUser.user_metadata?.full_name || supabaseUser.email?.split('@')[0] || 'Usuario',
              email: supabaseUser.email,
              phone: supabaseUser.phone || null
            })
            .select()
            .single();

          if (insertError) {
            console.error('Error creating client profile:', insertError);
            setUser(null);
          } else {
            console.log('New client profile created:', newClientData);
            setUser(newClientData as Client);
          }
        }
      }
    } catch (error) {
      console.error('Unexpected error in fetchUserProfile:', error);
      setUser(null);
    }
  };

  const login = async (password: string, email: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  };

  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const register = async (password: string, email: string, fullName: string, phone: string) => {
    // 1. Sign up the user in the auth schema
    const { data: authData, error: authError } = await supabase.auth.signUp({ email, password });
    if (authError) throw authError;

    const user = authData.user;
    if (!user) throw new Error("No se pudo crear la cuenta de usuario.");

    // 2. Check if an unclaimed client profile already exists with this email
    const { data: existingProfile, error: selectError } = await supabase
      .from('clients')
      .select('id, user_id')
      .eq('email', user.email)
      .is('user_id', null)
      .single();

    if (selectError && selectError.code !== 'PGRST116') { // Ignore "row not found" error
        throw selectError;
    }

    if (existingProfile) {
        // 3a. If it exists, link it to the new auth user
        const { error: updateError } = await supabase
            .from('clients')
            .update({ user_id: user.id })
            .eq('id', existingProfile.id);
        
        if (updateError) throw updateError;

    } else {
        // 3b. If not, create a new client profile
        const { error: insertError } = await supabase.from('clients').insert({
            user_id: user.id, // Link to the auth user
            full_name: fullName,
            email,
            phone
        });

        if (insertError) throw insertError;
    }

    // 4. Manually fetch the complete profile to update the context state
    await fetchUserProfile(user);
    return authData;
  };

  const updateUser = async (details: Partial<Client>) => {
    if (!user?.id) return;

    // Map frontend 'full_name' to backend 'full_name' (they're the same now)
    const updateData: { [key: string]: any } = { ...details };

    const { error } = await supabase
      .from('clients')
      .update(updateData)
      .eq('id', user.id);

    if (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }

    // Refresh user profile from DB
    if (session?.user) {
        try {
            await fetchUserProfile(session.user);
        } catch (error) {
            console.error('Error refreshing user profile:', error);
        }
    }
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, user, session, login, logout, register, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};