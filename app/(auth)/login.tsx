import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useAuthStore } from "@/src/store/useAuthStore";
import { AnimatedPressable } from "@/src/components/ui/AnimatedPressable";
import { PALETTE, RADIUS, FONT, FONT_FAMILY, SPACING } from "@/src/theme";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);

  const { signInWithEmail, signUpWithEmail, signInWithOAuth, isLoading, error, clearError } =
    useAuthStore();

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    clearError();
    if (isSignUp) {
      await signUpWithEmail(email.trim(), password);
    } else {
      await signInWithEmail(email.trim(), password);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
      {/* Decorative sarcelle blob */}
      <View
        style={{
          position: "absolute",
          top: -60,
          right: -40,
          width: 200,
          height: 200,
          borderRadius: 100,
          backgroundColor: PALETTE.sarcelle + "12",
        }}
      />
      <View
        style={{
          position: "absolute",
          bottom: 80,
          left: -60,
          width: 160,
          height: 160,
          borderRadius: 80,
          backgroundColor: PALETTE.fuchsia + "08",
        }}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <View style={{ flex: 1, justifyContent: "center", paddingHorizontal: SPACING["4xl"] }}>
          {/* Header */}
          <View style={{ marginBottom: SPACING["5xl"] + 16, alignItems: "center" }}>
            <Text
              style={{
                color: PALETTE.sarcelle,
                fontSize: FONT.sizes["5xl"] + 14,
                fontFamily: FONT_FAMILY.black,
                textAlign: "center",
                letterSpacing: -1.5,
              }}
            >
              Dumbys
            </Text>
            <Text
              style={{
                color: "#999",
                fontSize: FONT.sizes.sm,
                fontFamily: FONT_FAMILY.semibold,
                textAlign: "center",
                marginTop: SPACING.md,
                letterSpacing: 3,
                textTransform: "uppercase",
              }}
            >
              {"Vidéos  •  Défis  •  Potes"}
            </Text>
          </View>

          {/* OAuth Buttons */}
          <View style={{ gap: SPACING.base, marginBottom: SPACING["3xl"] }}>
            {Platform.OS === "ios" && (
              <AnimatedPressable
                onPress={() => signInWithOAuth("apple")}
                disabled={isLoading}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: SPACING.base,
                  backgroundColor: "#1A1A1A",
                  paddingVertical: SPACING.lg + 2,
                  borderRadius: RADIUS.md,
                }}
              >
                <Ionicons name="logo-apple" size={22} color="#FFFFFF" />
                <Text
                  style={{
                    color: "#FFFFFF",
                    fontSize: FONT.sizes.lg,
                    fontFamily: FONT_FAMILY.semibold,
                  }}
                >
                  Continuer avec Apple
                </Text>
              </AnimatedPressable>
            )}

            <AnimatedPressable
              onPress={() => signInWithOAuth("google")}
              disabled={isLoading}
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: SPACING.base,
                backgroundColor: "#FFFFFF",
                paddingVertical: SPACING.lg + 2,
                borderRadius: RADIUS.md,
                borderWidth: 1,
                borderColor: "rgba(0,0,0,0.10)",
              }}
            >
              <Ionicons name="logo-google" size={20} color="#EA4335" />
              <Text
                style={{
                  color: "#1A1A1A",
                  fontSize: FONT.sizes.lg,
                  fontFamily: FONT_FAMILY.semibold,
                }}
              >
                Continuer avec Google
              </Text>
            </AnimatedPressable>
          </View>

          {/* Divider */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: SPACING["3xl"],
            }}
          >
            <View style={{ flex: 1, height: 1, backgroundColor: "rgba(0,0,0,0.08)" }} />
            <Text
              style={{
                marginHorizontal: SPACING.lg,
                color: "#BBB",
                fontSize: FONT.sizes.md,
                fontFamily: FONT_FAMILY.medium,
              }}
            >
              ou
            </Text>
            <View style={{ flex: 1, height: 1, backgroundColor: "rgba(0,0,0,0.08)" }} />
          </View>

          {/* Email + Password */}
          <View style={{ gap: SPACING.base }}>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="Email"
              placeholderTextColor="#BBB"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              style={{
                backgroundColor: "rgba(0,0,0,0.04)",
                borderWidth: 1,
                borderColor: "rgba(0,0,0,0.06)",
                color: "#1A1A1A",
                paddingHorizontal: 18,
                paddingVertical: 15,
                borderRadius: RADIUS.md,
                fontSize: FONT.sizes.lg,
                fontFamily: FONT_FAMILY.regular,
              }}
            />
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="Mot de passe"
              placeholderTextColor="#BBB"
              secureTextEntry
              autoCapitalize="none"
              style={{
                backgroundColor: "rgba(0,0,0,0.04)",
                borderWidth: 1,
                borderColor: "rgba(0,0,0,0.06)",
                color: "#1A1A1A",
                paddingHorizontal: 18,
                paddingVertical: 15,
                borderRadius: RADIUS.md,
                fontSize: FONT.sizes.lg,
                fontFamily: FONT_FAMILY.regular,
              }}
            />
            <AnimatedPressable
              onPress={handleSubmit}
              disabled={isLoading || !email.trim() || !password.trim()}
              style={{
                borderRadius: RADIUS.md,
                overflow: "hidden",
                opacity: !email.trim() || !password.trim() ? 0.5 : 1,
                backgroundColor: PALETTE.sarcelle,
                paddingVertical: SPACING.lg + 2,
                alignItems: "center",
              }}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text
                  style={{
                    color: "#FFFFFF",
                    fontSize: FONT.sizes.lg,
                    fontFamily: FONT_FAMILY.bold,
                    letterSpacing: 0.3,
                  }}
                >
                  {isSignUp ? "S'inscrire" : "Se connecter"}
                </Text>
              )}
            </AnimatedPressable>
          </View>

          {/* Toggle */}
          <AnimatedPressable
            onPress={() => {
              clearError();
              setIsSignUp(!isSignUp);
            }}
            style={{ marginTop: SPACING["3xl"], alignItems: "center" }}
          >
            <Text style={{ color: "#999", fontSize: FONT.sizes.base, fontFamily: FONT_FAMILY.regular }}>
              {isSignUp ? "Déjà un compte ? " : "Pas encore de compte ? "}
              <Text style={{ color: PALETTE.sarcelle, fontFamily: FONT_FAMILY.semibold }}>
                {isSignUp ? "Se connecter" : "S'inscrire"}
              </Text>
            </Text>
          </AnimatedPressable>

          {/* Error */}
          {error && (
            <View
              style={{
                marginTop: SPACING.lg,
                backgroundColor: "rgba(244,63,94,0.06)",
                padding: SPACING.lg,
                borderRadius: RADIUS.sm,
                borderWidth: 1,
                borderColor: "rgba(244,63,94,0.15)",
              }}
            >
              <Text
                style={{
                  color: "#F43F5E",
                  fontSize: FONT.sizes.md,
                  textAlign: "center",
                  fontFamily: FONT_FAMILY.medium,
                }}
              >
                {error}
              </Text>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
