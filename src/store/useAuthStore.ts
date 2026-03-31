import { create } from "zustand";
import { supabase } from "@/src/lib/supabase";
import type { Session, User } from "@supabase/supabase-js";
import * as AuthSession from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import * as AppleAuthentication from "expo-apple-authentication";
import * as Crypto from "expo-crypto";

// Required for iOS to dismiss the OAuth browser after redirect
WebBrowser.maybeCompleteAuthSession();

function translateAuthError(message: string): string {
  const map: Record<string, string> = {
    "Invalid login credentials":
      "Email ou mot de passe incorrect.",
    "Email not confirmed":
      "Ton adresse email n'a pas encore été confirmée. Vérifie ta boîte mail.",
    "User already registered":
      "Un compte existe déjà avec cette adresse email.",
    "Signup requires a valid password":
      "Le mot de passe est invalide.",
    "Password should be at least 6 characters":
      "Le mot de passe doit contenir au moins 6 caractères.",
    "Password should be at least 8 characters":
      "Le mot de passe doit contenir au moins 8 caractères.",
    "Unable to validate email address: invalid format":
      "Le format de l'adresse email est invalide.",
    "Email rate limit exceeded":
      "Trop de tentatives. Réessaie dans quelques minutes.",
    "For security purposes, you can only request this after 60 seconds.":
      "Pour des raisons de sécurité, patiente 60 secondes avant de réessayer.",
    "Auth session missing!":
      "Ta session a expiré. Reconnecte-toi.",
    "New password should be different from the old password.":
      "Le nouveau mot de passe doit être différent de l'ancien.",
    "User not found":
      "Aucun compte trouvé avec cette adresse email.",
    "Email link is invalid or has expired":
      "Le lien de connexion est invalide ou a expiré.",
    "Token has expired or is invalid":
      "Le lien a expiré. Demande-en un nouveau.",
    "Network request failed":
      "Problème de connexion. Vérifie ta connexion internet.",
  };

  for (const [key, value] of Object.entries(map)) {
    if (message.toLowerCase().includes(key.toLowerCase())) {
      return value;
    }
  }

  if (message.toLowerCase().includes("rate limit"))
    return "Trop de tentatives. Réessaie dans quelques minutes.";
  if (message.toLowerCase().includes("network"))
    return "Problème de connexion. Vérifie ta connexion internet.";
  if (message.toLowerCase().includes("timeout"))
    return "La requête a pris trop de temps. Réessaie.";

  return "Une erreur est survenue. Réessaie.";
}

type AuthState = {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;

  initialize: () => () => void;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  signInWithMagicLink: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  user: null,
  isLoading: false,
  isInitialized: false,
  error: null,

  initialize: () => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      set({ session, user: session?.user ?? null, isInitialized: true });
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      set({ session, user: session?.user ?? null });
    });

    return () => subscription.unsubscribe();
  },

  signInWithEmail: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
    } catch (error) {
      set({ error: translateAuthError(error instanceof Error ? error.message : "") });
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
      if (!data.session) {
        set({ error: "Vérifie ta boîte mail pour confirmer ton compte." });
      }
    } catch (error) {
      set({ error: translateAuthError(error instanceof Error ? error.message : "") });
    } finally {
      set({ isLoading: false });
    }
  },

  // ── Google — web OAuth via expo-auth-session ──────────────────
  signInWithGoogle: async () => {
    set({ isLoading: true, error: null });
    try {
      const redirectUrl = AuthSession.makeRedirectUri({ scheme: "dumbys" });

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: true,
        },
      });

      if (error) throw error;
      if (!data.url) throw new Error("No OAuth URL returned");

      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);

      if (result.type !== "success") return;

      const url = new URL(result.url);

      // PKCE flow: exchange code for session
      const code = url.searchParams.get("code");
      if (code) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        if (exchangeError) throw exchangeError;
        return;
      }

      // Implicit flow: tokens in URL hash
      const params = new URLSearchParams(url.hash.substring(1));
      const accessToken = params.get("access_token");
      const refreshToken = params.get("refresh_token");
      if (accessToken && refreshToken) {
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        if (sessionError) throw sessionError;
      }
    } catch (error) {
      set({ error: translateAuthError(error instanceof Error ? error.message : "") });
    } finally {
      set({ isLoading: false });
    }
  },

  // ── Apple — SDK natif iOS ──────────────────────────────────────
  signInWithApple: async () => {
    set({ isLoading: true, error: null });
    try {
      // Nonce for security: raw sent to Apple, hashed sent to Supabase
      const rawNonce = Crypto.randomUUID();
      const hashedNonce = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        rawNonce,
      );

      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
        nonce: hashedNonce,
      });

      if (!credential.identityToken) throw new Error("No identity token from Apple");

      const { error } = await supabase.auth.signInWithIdToken({
        provider: "apple",
        token: credential.identityToken,
        nonce: rawNonce,
      });

      if (error) throw error;
    } catch (error: any) {
      // User cancelled — don't show error
      if (error?.code === "ERR_REQUEST_CANCELED") {
        set({ isLoading: false });
        return;
      }
      set({ error: translateAuthError(error instanceof Error ? error.message : "") });
    } finally {
      set({ isLoading: false });
    }
  },

  signInWithMagicLink: async (email) => {
    set({ isLoading: true, error: null });
    try {
      const redirectUrl = AuthSession.makeRedirectUri({ scheme: "dumbys" });
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: redirectUrl },
      });
      if (error) throw error;
    } catch (error) {
      set({ error: translateAuthError(error instanceof Error ? error.message : "") });
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
      set({ error: translateAuthError(error instanceof Error ? error.message : "") });
    } finally {
      set({ isLoading: false });
    }
  },

  clearError: () => set({ error: null }),
}));
