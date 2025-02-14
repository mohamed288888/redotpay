import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import type { User, Session } from '@supabase/supabase-js'
import type { Profile } from '@/lib/supabase'

interface AuthState {
  user: User | null
  profile: Profile | null
  loading: boolean
  error: string | null
  signUp: (email: string, password: string) => Promise<{ user: User | null; session: Session | null; }>
  signIn: (email: string, password: string) => Promise<{ user: User; session: Session }>
  signOut: () => Promise<void>
  loadUser: () => Promise<void>
  updateProfile: (data: Partial<Profile>) => Promise<void>
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  loading: true,
  error: null,

  signUp: async (email: string, password: string) => {
    try {
      set({ error: null, loading: true })
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/signin`
        }
      })

      if (error) throw error

      // Wait for database triggers to complete
      await new Promise(resolve => setTimeout(resolve, 2000))

      return data
    } catch (error: any) {
      set({ error: error.message || 'Failed to sign up' })
      throw error
    } finally {
      set({ loading: false })
    }
  },

  signIn: async (email: string, password: string) => {
    try {
      set({ error: null, loading: true })
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      // Wait for session to be fully established
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      set({ user: data.user })
      await get().loadUser()
      return data
    } catch (error: any) {
      set({ error: error.message || 'Failed to sign in' })
      throw error
    } finally {
      set({ loading: false })
    }
  },

  signOut: async () => {
    try {
      set({ error: null, loading: true })
      
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      
      set({ user: null, profile: null })
    } catch (error: any) {
      set({ error: error.message || 'Failed to sign out' })
      throw error
    } finally {
      set({ loading: false })
    }
  },

  loadUser: async () => {
    try {
      set({ loading: true, error: null });
  
      // جلب الجلسة
      let { data, error } = await supabase.auth.getSession();
      
      if (error || !data.session) {
        console.log("No session found, refreshing...");
        await supabase.auth.refreshSession();
        ({ data, error } = await supabase.auth.getSession());
      }
  
      if (!data.session?.user) {
        set({ user: null, profile: null });
        return;
      }
  
      set({ user: data.session.user });
  
      // جلب الملف الشخصي
      let { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", data.session.user.id)
        .maybeSingle(); // ✅ يمنع الخطأ عندما لا يوجد سجل
  
      if (profileError) {
        console.error("Profile fetch error:", profileError);
        set({ profile: null });
      } else {
        set({ profile });
      }
  
    } catch (error: unknown) {
      console.error("Load user error:", error);
      set({ 
        error: error instanceof Error ? error.message : "Failed to load user",
        user: null,
        profile: null
      });
    } finally {
      set({ loading: false });
    }
  },
  

  updateProfile: async (data: Partial<Profile>) => {
    try {
      set({ error: null, loading: true })
      
      const { user } = get()
      if (!user) throw new Error('No user logged in')

      const { error } = await supabase
        .from('profiles')
        .update(data)
        .eq('id', user.id)

      if (error) throw error
      
      await get().loadUser()
    } catch (error: any) {
      set({ error: error.message || 'Failed to update profile' })
      throw error
    } finally {
      set({ loading: false })
    }
  },
}))