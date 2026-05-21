import { useState } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/src/providers/ThemeProvider";
import { useThemeStore, type ThemePreference } from "@/src/store/useThemeStore";
import { useOnboardingStore } from "@/src/store/useOnboardingStore";
import { useAuthStore } from "@/src/store/useAuthStore";
import { useUserProfile } from "@/src/features/profile/useUserProfile";
import { supabase } from "@/src/lib/supabase";
import { Avatar } from "@/src/components/ui/Avatar";
import { AnimatedPressable } from "@/src/components/ui/AnimatedPressable";
import { PALETTE, FONT, FONT_FAMILY, RADIUS } from "@/src/theme";

function SectionTitle({ label, isDark }: { label: string; isDark: boolean }) {
  return (
    <Text
      style={{
        fontSize: FONT.sizes.xs,
        fontFamily: FONT_FAMILY.bold,
        color: isDark ? "#505050" : "#AAAAAA",
        textTransform: "uppercase",
        letterSpacing: 1.4,
        paddingHorizontal: 20,
        marginBottom: 8,
        marginTop: 28,
      }}
    >
      {label}
    </Text>
  );
}

function SettingRow({
  icon,
  label,
  value,
  onPress,
  danger,
  isDark,
  colors,
  right,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value?: string;
  onPress?: () => void;
  danger?: boolean;
  isDark: boolean;
  colors: any;
  right?: React.ReactNode;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 20,
        paddingVertical: 15,
        backgroundColor: pressed ? (isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)") : "transparent",
        gap: 14,
      })}
    >
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          backgroundColor: danger ? "rgba(244,63,94,0.12)" : (isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)"),
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Ionicons name={icon} size={18} color={danger ? "#F43F5E" : (isDark ? "#A0A0A0" : "#666")} />
      </View>
      <Text
        style={{
          flex: 1,
          fontSize: FONT.sizes.base,
          fontFamily: FONT_FAMILY.medium,
          color: danger ? "#F43F5E" : colors.textPrimary,
        }}
      >
        {label}
      </Text>
      {value ? (
        <Text style={{ fontSize: FONT.sizes.sm, fontFamily: FONT_FAMILY.regular, color: colors.textTertiary }}>
          {value}
        </Text>
      ) : right ? right : (
        onPress && <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
      )}
    </Pressable>
  );
}

const THEME_OPTIONS: { key: ThemePreference; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: "light",  label: "Clair",   icon: "sunny" },
  { key: "dark",   label: "Sombre",  icon: "moon" },
  { key: "system", label: "Système", icon: "phone-portrait" },
];

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { preference, setPreference } = useThemeStore();
  const { reset: resetOnboarding } = useOnboardingStore();
  const signOut = useAuthStore((s) => s.signOut);
  const authLoading = useAuthStore((s) => s.isLoading);
  const { data: profile } = useUserProfile();

  const [editingUsername, setEditingUsername] = useState(false);
  const [newUsername, setNewUsername] = useState(profile?.username ?? "");
  const [savingUsername, setSavingUsername] = useState(false);

  const saveUsername = async () => {
    const trimmed = newUsername.trim();
    if (!trimmed || trimmed === profile?.username) { setEditingUsername(false); return; }
    setSavingUsername(true);
    const { error } = await supabase.from("users").update({ username: trimmed }).eq("id", profile!.id);
    setSavingUsername(false);
    if (error) Alert.alert("Erreur", error.message);
    else setEditingUsername(false);
  };

  const divider = (
    <View style={{ height: 1, backgroundColor: colors.border, marginHorizontal: 20 }} />
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      {/* Header */}
      <View
        style={{
          paddingTop: insets.top + 8,
          paddingBottom: 16,
          paddingHorizontal: 20,
          flexDirection: "row",
          alignItems: "center",
          gap: 14,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }}
      >
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <Text style={{ fontSize: FONT.sizes.xl, fontFamily: FONT_FAMILY.bold, color: colors.textPrimary }}>
          Réglages
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 40 }} showsVerticalScrollIndicator={false}>

        {/* ── Compte ─────────────────────────────────────────────── */}
        {profile && (
          <>
            <SectionTitle label="Compte" isDark={isDark} />
            <View
              style={{
                marginHorizontal: 16,
                borderRadius: RADIUS.xl,
                backgroundColor: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)",
                borderWidth: 1,
                borderColor: colors.border,
                overflow: "hidden",
              }}
            >
              {/* Avatar + username */}
              <View style={{ flexDirection: "row", alignItems: "center", padding: 16, gap: 14 }}>
                <Avatar url={profile.avatar_url} username={profile.username} size={52} />
                <View style={{ flex: 1 }}>
                  {editingUsername ? (
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                      <TextInput
                        value={newUsername}
                        onChangeText={setNewUsername}
                        autoFocus
                        style={{
                          flex: 1,
                          fontSize: FONT.sizes.base,
                          fontFamily: FONT_FAMILY.semibold,
                          color: colors.textPrimary,
                          borderBottomWidth: 1.5,
                          borderBottomColor: PALETTE.sarcelle,
                          paddingBottom: 4,
                        }}
                        onSubmitEditing={saveUsername}
                        returnKeyType="done"
                      />
                      {savingUsername ? (
                        <ActivityIndicator size="small" color={PALETTE.sarcelle} />
                      ) : (
                        <Pressable onPress={saveUsername} hitSlop={8}>
                          <Ionicons name="checkmark-circle" size={24} color={PALETTE.sarcelle} />
                        </Pressable>
                      )}
                    </View>
                  ) : (
                    <Text style={{ fontSize: FONT.sizes.base, fontFamily: FONT_FAMILY.semibold, color: colors.textPrimary }}>
                      {profile.username}
                    </Text>
                  )}
                  <Text style={{ fontSize: FONT.sizes.sm, fontFamily: FONT_FAMILY.regular, color: colors.textTertiary, marginTop: 2 }}>
                    {profile.role ?? "Membre"}
                  </Text>
                </View>
                {!editingUsername && (
                  <Pressable
                    onPress={() => { setNewUsername(profile.username); setEditingUsername(true); }}
                    hitSlop={8}
                  >
                    <Ionicons name="pencil-outline" size={18} color={colors.textTertiary} />
                  </Pressable>
                )}
              </View>
            </View>
          </>
        )}

        {/* ── Apparence ──────────────────────────────────────────── */}
        <SectionTitle label="Apparence" isDark={isDark} />
        <View
          style={{
            marginHorizontal: 16,
            borderRadius: RADIUS.xl,
            backgroundColor: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)",
            borderWidth: 1,
            borderColor: colors.border,
            overflow: "hidden",
          }}
        >
          <View style={{ padding: 16, gap: 10 }}>
            <Text style={{ fontSize: FONT.sizes.sm, fontFamily: FONT_FAMILY.medium, color: colors.textSecondary, marginBottom: 4 }}>
              Thème de l'application
            </Text>
            <View style={{ flexDirection: "row", gap: 10 }}>
              {THEME_OPTIONS.map((opt) => {
                const active = preference === opt.key;
                return (
                  <AnimatedPressable
                    key={opt.key}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setPreference(opt.key);
                    }}
                    style={{
                      flex: 1,
                      alignItems: "center",
                      paddingVertical: 14,
                      borderRadius: RADIUS.lg,
                      backgroundColor: active
                        ? `${PALETTE.sarcelle}18`
                        : (isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)"),
                      borderWidth: active ? 1.5 : 1,
                      borderColor: active ? PALETTE.sarcelle : colors.border,
                      gap: 6,
                    }}
                  >
                    <Ionicons name={opt.icon} size={20} color={active ? PALETTE.sarcelle : colors.textTertiary} />
                    <Text
                      style={{
                        fontSize: FONT.sizes.xs,
                        fontFamily: active ? FONT_FAMILY.semibold : FONT_FAMILY.regular,
                        color: active ? PALETTE.sarcelle : colors.textTertiary,
                      }}
                    >
                      {opt.label}
                    </Text>
                  </AnimatedPressable>
                );
              })}
            </View>
          </View>
        </View>

        {/* ── Application ────────────────────────────────────────── */}
        <SectionTitle label="Application" isDark={isDark} />
        <View
          style={{
            marginHorizontal: 16,
            borderRadius: RADIUS.xl,
            backgroundColor: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)",
            borderWidth: 1,
            borderColor: colors.border,
            overflow: "hidden",
          }}
        >
          <SettingRow
            icon="book-outline"
            label="Revoir le guide"
            isDark={isDark}
            colors={colors}
            onPress={async () => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              await resetOnboarding();
              router.push("/onboarding");
            }}
          />
          {divider}
          <SettingRow
            icon="information-circle-outline"
            label="Version"
            value="1.0.0"
            isDark={isDark}
            colors={colors}
          />
        </View>

        {/* ── Danger zone ────────────────────────────────────────── */}
        <SectionTitle label="Compte" isDark={isDark} />
        <View
          style={{
            marginHorizontal: 16,
            borderRadius: RADIUS.xl,
            backgroundColor: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)",
            borderWidth: 1,
            borderColor: colors.border,
            overflow: "hidden",
          }}
        >
          <SettingRow
            icon="log-out-outline"
            label={authLoading ? "Déconnexion…" : "Se déconnecter"}
            danger
            isDark={isDark}
            colors={colors}
            onPress={() => {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
              Alert.alert("Se déconnecter", "Tu veux vraiment te déconnecter ?", [
                { text: "Annuler", style: "cancel" },
                { text: "Déconnecter", style: "destructive", onPress: signOut },
              ]);
            }}
          />
        </View>
      </ScrollView>
    </View>
  );
}
