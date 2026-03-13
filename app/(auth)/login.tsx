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
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { useAuthStore } from "@/src/store/useAuthStore";
import { AnimatedPressable } from "@/src/components/ui/AnimatedPressable";
import { COLORS, GRADIENTS, RADIUS, FONT, FONT_FAMILY, SPACING, INPUT_STYLE } from "@/src/theme";
import { useTheme } from "@/src/providers/ThemeProvider";

export default function LoginScreen() {
  const { colors } = useTheme();
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
    <LinearGradient
      colors={[COLORS.brandDark, colors.bg, colors.bg]}
      locations={[0, 0.45, 1]}
      style={{ flex: 1 }}
    >
      {/* Subtle brand overlay glow at top */}
      <LinearGradient
        colors={["rgba(255,45,125,0.15)", "transparent"]}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 300,
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
                color: COLORS.accent,
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
                color: colors.textSecondary,
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
                  backgroundColor: colors.textPrimary,
                  paddingVertical: SPACING.lg + 2,
                  borderRadius: RADIUS.md,
                }}
              >
                <Ionicons name="logo-apple" size={22} color={colors.bg} />
                <Text
                  style={{
                    color: colors.bg,
                    fontSize: FONT.sizes.lg,
                    fontFamily: FONT_FAMILY.semibold,
                  }}
                >
                  Continue with Apple
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
                backgroundColor: colors.glass,
                paddingVertical: SPACING.lg + 2,
                borderRadius: RADIUS.md,
                borderWidth: 1,
                borderColor: colors.borderLight,
              }}
            >
              <Ionicons name="logo-google" size={20} color="#EA4335" />
              <Text
                style={{
                  color: colors.textPrimary,
                  fontSize: FONT.sizes.lg,
                  fontFamily: FONT_FAMILY.semibold,
                }}
              >
                Continue with Google
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
            <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
            <Text
              style={{
                marginHorizontal: SPACING.lg,
                color: colors.textMuted,
                fontSize: FONT.sizes.md,
                fontFamily: FONT_FAMILY.medium,
              }}
            >
              or
            </Text>
            <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
          </View>

          {/* Email + Password */}
          <View style={{ gap: SPACING.base }}>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="Email"
              placeholderTextColor={colors.textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              style={INPUT_STYLE}
            />
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="Password"
              placeholderTextColor={colors.textMuted}
              secureTextEntry
              autoCapitalize="none"
              style={INPUT_STYLE}
            />
            <AnimatedPressable
              onPress={handleSubmit}
              disabled={isLoading || !email.trim() || !password.trim()}
              style={{
                borderRadius: RADIUS.md,
                overflow: "hidden",
                opacity: !email.trim() || !password.trim() ? 0.5 : 1,
              }}
            >
              <LinearGradient
                colors={[...GRADIENTS.brand]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{
                  paddingVertical: SPACING.lg + 2,
                  alignItems: "center",
                  borderRadius: RADIUS.md,
                }}
              >
                {isLoading ? (
                  <ActivityIndicator color={colors.textPrimary} />
                ) : (
                  <Text
                    style={{
                      color: colors.textPrimary,
                      fontSize: FONT.sizes.lg,
                      fontFamily: FONT_FAMILY.bold,
                      letterSpacing: 0.3,
                    }}
                  >
                    {isSignUp ? "Sign Up" : "Sign In"}
                  </Text>
                )}
              </LinearGradient>
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
            <Text style={{ color: colors.textTertiary, fontSize: FONT.sizes.base }}>
              {isSignUp ? "Already have an account? " : "Don't have an account? "}
              <Text style={{ color: COLORS.accent, fontWeight: FONT.weights.semibold }}>
                {isSignUp ? "Sign In" : "Sign Up"}
              </Text>
            </Text>
          </AnimatedPressable>

          {/* Error */}
          {error && (
            <View
              style={{
                marginTop: SPACING.lg,
                backgroundColor: colors.glass,
                padding: SPACING.lg,
                borderRadius: RADIUS.sm,
                borderWidth: 1,
                borderColor: "rgba(244,63,94,0.2)",
              }}
            >
              <Text
                style={{
                  color: COLORS.error,
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
    </LinearGradient>
  );
}
