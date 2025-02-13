import { create } from "zustand";
import { supabase } from "@/lib/supabase";
import type { User, Session } from "@supabase/supabase-js";
import type { Profile } from "@/lib/supabase";

interface AuthState {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  error: string | null;
  signUp: (
    email: string,
    password: string
  ) => Promise<{ user: User | null; session: Session | null }>;
  signIn: (
    email: string,
    password: string
  ) => Promise<{ user: User; session: Session }>;
  signOut: () => Promise<void>;
  loadUser: () => Promise<void>;
  updateProfile: (data: Partial<Profile>) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  loading: true,
  error: null,

  signUp: async (email: string, password: string) => {
    try {
      set({ error: null, loading: true });

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/signin`,
        },
      });

      if (error) throw error;

      // Wait for database triggers to complete
      await new Promise((resolve) => setTimeout(resolve, 2000));

      return data;
    } catch (error: any) {
      set({ error: error.message || "Failed to sign up" });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  signIn: async (email: string, password: string) => {
    try {
      set({ error: null, loading: true });

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Wait for session to be fully established
      await new Promise((resolve) => setTimeout(resolve, 1000));

      set({ user: data.user });
      await get().loadUser();
      return data;
    } catch (error: any) {
      set({ error: error.message || "Failed to sign in" });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  signOut: async () => {
    try {
      set({ error: null, loading: true });

      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      set({ user: null, profile: null });
    } catch (error: any) {
      set({ error: error.message || "Failed to sign out" });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  loadUser: async () => {
    try {
      set({ loading: true, error: null });

      // Get the current session with retries
      let session;
      let retries = 3;

      while (retries > 0) {
        try {
          const { data, error } = await supabase.auth.getSession();
          if (error) throw error;
          session = data.session;
          break;
        } catch (err) {
          retries--;
          if (retries === 0) throw err;
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }

      if (!session?.user) {
        set({ user: null, profile: null });
        return;
      }

      // Set user immediately
      set({ user: session.user });

      // Try to get the profile with retries
      let profile;
      retries = 3;
      const userEmail = session.user.email;

      while (retries > 0) {
        try {
          const { data, error } = await supabase
            .from("users")
            .select("*")
            .eq("email", userEmail)
            .maybeSingle();
          if (error) throw error;
          profile = data;
          break;
        } catch (err) {
          retries--;
          if (retries === 0) throw err;
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }

      if (!profile) {
        // Try to create profile with retries
        retries = 3;
        while (retries > 0) {
          try {
            const { data, error } = await supabase
              .from("users")
              .select("*")
              .eq("email", userEmail)
              .maybeSingle();

            if (error) throw error;
            profile = data;
            break;
          } catch (err) {
            retries--;
            if (retries === 0) throw err;
            await new Promise((resolve) => setTimeout(resolve, 1000));
          }
        }
      }

      set({ profile });
    } catch (error: any) {
      console.error("Load user error:", error);
      set({
        error: error.message || "Failed to load user",
        user: null,
        profile: null,
      });
    } finally {
      set({ loading: false });
    }
  },

  updateProfile: async (data: Partial<Profile>) => {
    try {
      set({ error: null, loading: true });

      const { user } = get();
      if (!user) throw new Error("No user logged in");

      const { error } = await supabase
        .from("profiles")
        .update(data)
        .eq("id", user.id);

      if (error) throw error;

      await get().loadUser();
    } catch (error: any) {
      set({ error: error.message || "Failed to update profile" });
      throw error;
    } finally {
      set({ loading: false });
    }
  },
}));
