import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, UserRole } from '../types';
import { INITIAL_PROFILES } from '../lib/mockData';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface AuthContextType {
  user: UserProfile | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  login: (email: string, role?: UserRole) => Promise<{ success: boolean; error?: string }>;
  register: (name: string, email: string, phone: string, gender: 'male' | 'female' | 'other' | 'prefer_not_to_say', bloodGroup: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  quickLoginAs: (role: UserRole) => void;
  updateProfile: (data: Partial<UserProfile>) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: null,
  isAuthenticated: false,
  login: async () => ({ success: false }),
  register: async () => ({ success: false }),
  logout: () => {},
  quickLoginAs: () => {},
  updateProfile: () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('medqueue_user');
    return saved ? JSON.parse(saved) : INITIAL_PROFILES.find(p => p.role === 'patient') || null;
  });

  const [profiles, setProfiles] = useState<UserProfile[]>(() => {
    const saved = localStorage.getItem('medqueue_all_profiles');
    return saved ? JSON.parse(saved) : INITIAL_PROFILES;
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem('medqueue_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('medqueue_user');
    }
  }, [user]);

  useEffect(() => {
    localStorage.setItem('medqueue_all_profiles', JSON.stringify(profiles));
  }, [profiles]);

  // Attempt login
  const login = async (email: string, expectedRole?: UserRole): Promise<{ success: boolean; error?: string }> => {
    // If Supabase is configured and online, attempt Supabase Auth
    if (isSupabaseConfigured && supabase) {
      try {
        const { data: dbUser } = await supabase
          .from('profiles')
          .select('*')
          .eq('email', email.trim().toLowerCase())
          .single();

        if (dbUser) {
          const profile: UserProfile = {
            id: dbUser.id,
            email: dbUser.email,
            full_name: dbUser.full_name,
            phone: dbUser.phone,
            role: dbUser.role as UserRole,
            gender: dbUser.gender,
            blood_group: dbUser.blood_group,
            avatar_url: dbUser.avatar_url,
            created_at: dbUser.created_at,
          };
          setUser(profile);
          return { success: true };
        }
      } catch (err) {
        console.warn('Supabase fetch user error, falling back to local profiles:', err);
      }
    }

    // Local profile check
    const normalized = email.trim().toLowerCase();
    let found = profiles.find(p => p.email.toLowerCase() === normalized);

    if (!found && expectedRole) {
      found = profiles.find(p => p.role === expectedRole);
    }

    if (found) {
      setUser(found);
      return { success: true };
    }

    return { success: false, error: 'Account not found with this email. Please check your credentials or register.' };
  };

  // Public registration: strictly allows 'patient' role ONLY
  const register = async (
    name: string,
    email: string,
    phone: string,
    gender: 'male' | 'female' | 'other' | 'prefer_not_to_say',
    bloodGroup: string
  ): Promise<{ success: boolean; error?: string }> => {
    const normalizedEmail = email.trim().toLowerCase();

    // Check if email already registered
    if (profiles.some(p => p.email.toLowerCase() === normalizedEmail)) {
      return { success: false, error: 'A user with this email address already exists.' };
    }

    const newProfile: UserProfile = {
      id: `usr-patient-${Date.now()}`,
      email: normalizedEmail,
      full_name: name.trim(),
      phone: phone.trim(),
      role: 'patient', // Enforce patient role! Public users CANNOT register as admin
      gender,
      blood_group: bloodGroup,
      avatar_url: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`,
      created_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('profiles').insert([{
          email: newProfile.email,
          full_name: newProfile.full_name,
          phone: newProfile.phone,
          role: 'patient',
          gender: newProfile.gender,
          blood_group: newProfile.blood_group,
        }]);
      } catch (err) {
        console.warn('Supabase profile insertion error:', err);
      }
    }

    setProfiles(prev => [newProfile, ...prev]);
    setUser(newProfile);
    return { success: true };
  };

  const logout = () => {
    setUser(null);
    if (isSupabaseConfigured && supabase) {
      supabase.auth.signOut().catch(() => {});
    }
  };

  // Instant switch for demo presentations
  const quickLoginAs = (targetRole: UserRole) => {
    const profile = profiles.find(p => p.role === targetRole) || INITIAL_PROFILES.find(p => p.role === targetRole);
    if (profile) {
      setUser(profile);
    }
  };

  const updateProfile = (data: Partial<UserProfile>) => {
    if (!user) return;
    const updated = { ...user, ...data };
    setUser(updated);
    setProfiles(prev => prev.map(p => p.id === user.id ? updated : p));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user ? user.role : null,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        quickLoginAs,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
