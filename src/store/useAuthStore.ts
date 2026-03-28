import { create } from "zustand";
import { supabase } from "@/src/lib/supabase";
import type { Session, User } from "@supabase/supabase-js";
import * as AuthSession from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";

type AuthState = {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;

  initialize: () => () => void;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<void>;
  signInWithOAuth: (provider: "apple" | "google") => Promise<void>;
  signInWithMagicLink: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
};

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  user: null,
  isLoading: false,
  isInitialized: false,
  error: null,

  initialize: () => {
    // Get the initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      set({
        session,
        user: session?.user ?? null,
        isInitialized: true,
      });
    });

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      set({
        session,
        user: session?.user ?? null,
      });
    });

    // Return cleanup function
    return () => subscription.unsubscribe();
  },

  signInWithEmail: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Sign in failed";
      set({ error: message });
    } finally {
      set({ isLoading: false });
    }
  },

  signUpWithEmail: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: undefined },
      });
      if (error) throw error;
      // If email confirmation is required, session will be null
      if (!data.session) {
        set({ error: "Vérifie ta boîte mail pour confirmer ton compte." });
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Sign up failed";
      set({ error: message });
    } finally {
      set({ isLoading: false });
    }
  },

  signInWithOAuth: async (provider) => {
    set({ isLoading: true, error: null });
    try {
      const redirectUrl = AuthSession.makeRedirectUri();

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: true,
        },
      });

      if (error) throw error;
      if (!data.url) throw new Error("No OAuth URL returned");

      const result = await WebBrowser.openAuthSessionAsync(
        data.url,
        redirectUrl,
      );

      if (result.type === "success") {
        const url = new URL(result.url);
        const params = new URLSearchParams(url.hash.substring(1));
        const accessToken = params.get("access_token");
        const refreshToken = params.get("refresh_token");

        if (accessToken && refreshToken) {
          await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
        }
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "OAuth sign-in failed";
      set({ error: message });
    } finally {
      set({ isLoading: false });
    }
  },

  signInWithMagicLink: async (email) => {
    set({ isLoading: true, error: null });
    try {
      const redirectUrl = AuthSession.makeRedirectUri();

      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: redirectUrl,
        },
      });

      if (error) throw error;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Magic link failed";
      set({ error: message });
    } finally {
      set({ isLoading: false });
    }
  },

  signOut: async () => {
    set({ isLoading: true, error: null });
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Sign out failed";
      set({ error: message });
    } finally {
      set({ isLoading: false });
    }
  },

  clearError: () => set({ error: null }),
}));
