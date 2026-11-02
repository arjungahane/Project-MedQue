import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, UserRole } from '../types';
import { INITIAL_PROFILES } from '../lib/mockData';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface AuthContextType {
  user: UserProfile | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string, role?: UserRole) => Promise<{ success: boolean; error?: string }>;
  register: (name: string, email: string, phone: string, gender: 'male' | 'female' | 'other' | 'prefer_not_to_say', bloodGroup: string, password: string) => Promise<{ success: boolean; error?: string; requiresEmailConfirmation?: boolean }>;
  logout: () => void;
  quickLoginAs: (role: UserRole) => void;
  updateProfile: (data: Partial<UserProfile>) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: null,
  isAuthenticated: false,
  isLoading: false,
  login: async () => ({ success: false }),
  register: async () => ({ success: false }),
  logout: () => {},
  quickLoginAs: () => {},
  updateProfile: () => {},
});

function toUserProfile(profile: Record<string, unknown>): UserProfile {
  return {
    id: String(profile.id),
    email: String(profile.email),
    full_name: String(profile.full_name),
    phone: typeof profile.phone === 'string' ? profile.phone : undefined,
    role: profile.role as UserRole,
    gender: profile.gender as UserProfile['gender'],
    blood_group: typeof profile.blood_group === 'string' ? profile.blood_group : undefined,
    avatar_url: typeof profile.avatar_url === 'string' ? profile.avatar_url : undefined,
    created_at: String(profile.created_at),
  };
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(() => {
    if (isSupabaseConfigured) return null;
    const saved = localStorage.getItem('medqueue_user');
    return saved ? JSON.parse(saved) : INITIAL_PROFILES.find(p => p.role === 'patient') || null;
  });
  const [isLoading, setIsLoading] = useState(isSupabaseConfigured);

  const [profiles, setProfiles] = useState<UserProfile[]>(() => {
    if (isSupabaseConfigured) return [];
    const saved = localStorage.getItem('medqueue_all_profiles');
    return saved ? JSON.parse(saved) : INITIAL_PROFILES;
  });

  useEffect(() => {
    if (isSupabaseConfigured) {
      localStorage.removeItem('medqueue_user');
    } else if (user) {
      localStorage.setItem('medqueue_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('medqueue_user');
    }
  }, [user]);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return undefined;
    const client = supabase;

    let active = true;
    let sessionVersion = 0;
    const syncSession = async (authUserId: string | null) => {
      const currentVersion = ++sessionVersion;
      if (!authUserId) {
        if (active) {
          setUser(null);
          setIsLoading(false);
        }
        return;
      }

      const { data, error } = await client
        .from('profiles')
        .select('*')
        .or(`auth_id.eq.${authUserId},id.eq.${authUserId}`)
        .maybeSingle();
      if (error) throw error;
      if (active && currentVersion === sessionVersion) {
        setUser(data ? toUserProfile(data) : null);
        setIsLoading(false);
      }
    };

    const { data: authListener } = client.auth.onAuthStateChange((_event, session) => {
      window.setTimeout(() => {
        void syncSession(session?.user.id || null).catch(error => {
          console.error('Could not load the signed-in patient profile:', error);
          if (active) {
            setUser(null);
            setIsLoading(false);
          }
        });
      }, 0);
    });

    client.auth.getSession()
      .then(({ data, error }) => {
        if (error) throw error;
        return syncSession(data.session?.user.id || null);
      })
      .catch(error => {
        console.error('Could not restore the Supabase session:', error);
        if (active) {
          setUser(null);
          setIsLoading(false);
        }
      });

    return () => {
      active = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      localStorage.setItem('medqueue_all_profiles', JSON.stringify(profiles));
    }
  }, [profiles]);

  // Attempt login
  const login = async (email: string, password: string, expectedRole?: UserRole): Promise<{ success: boolean; error?: string }> => {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password,
        });
        if (authError) return { success: false, error: authError.message };
        if (!authData.user) return { success: false, error: 'Supabase did not return a signed-in user.' };

        const { data: dbUser, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .or(`auth_id.eq.${authData.user.id},id.eq.${authData.user.id}`)
          .maybeSingle();
        if (profileError) {
          await supabase.auth.signOut();
          throw profileError;
        }
        if (!dbUser) {
          await supabase.auth.signOut();
          return {
            success: false,
            error: 'No patient profile is linked to this Supabase account. Ask an administrator to provision your profile.',
          };
        }

        const profile = toUserProfile(dbUser);
        if (expectedRole && profile.role !== expectedRole) {
          await supabase.auth.signOut();
          return { success: false, error: `This account does not have ${expectedRole} access.` };
        }
        setUser(profile);
        return { success: true };
      } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : 'Supabase sign in failed.' };
      }
    }

    // Local demo profile check
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
    bloodGroup: string,
    password: string
  ): Promise<{ success: boolean; error?: string; requiresEmailConfirmation?: boolean }> => {
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
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: normalizedEmail,
          password,
        });
        if (authError) return { success: false, error: authError.message };
        if (!authData.user) return { success: false, error: 'Supabase did not return the new account.' };

        const { error: profileError } = await supabase.from('profiles').insert({
          auth_id: authData.user.id,
          email: newProfile.email,
          full_name: newProfile.full_name,
          phone: newProfile.phone,
          role: 'patient',
          gender: newProfile.gender,
          blood_group: newProfile.blood_group,
        });
        if (profileError) {
          if (authData.session) await supabase.auth.signOut();
          return { success: false, error: profileError.message };
        }

        if (authData.session) {
          const { data: profile, error: loadError } = await supabase
            .from('profiles')
            .select('*')
            .or(`auth_id.eq.${authData.user.id},id.eq.${authData.user.id}`)
            .single();
          if (loadError) throw loadError;
          setUser(toUserProfile(profile));
        } else {
          setUser(null);
        }
        return { success: true, requiresEmailConfirmation: !authData.session };
      } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : 'Supabase registration failed.' };
      }
    }

    setProfiles(prev => [newProfile, ...prev]);
    setUser(newProfile);
    return { success: true };
  };

  const logout = () => {
    if (!isSupabaseConfigured) setUser(null);
    if (isSupabaseConfigured && supabase) {
      void supabase.auth.signOut().then(({ error }) => {
        if (error) console.error('Could not sign out from Supabase:', error);
        else setUser(null);
      });
    } else {
      setUser(null);
    }
  };

  // Instant switch for demo presentations
  const quickLoginAs = (targetRole: UserRole) => {
    if (isSupabaseConfigured) return;
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
        isLoading,
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
