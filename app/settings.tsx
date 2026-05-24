import { useState } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  Switch,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/src/providers/ThemeProvider";
import { useThemeStore, type ThemePreference } from "@/src/store/useThemeStore";
import { useOnboardingStore } from "@/src/store/useOnboardingStore";
import { useAuthStore } from "@/src/store/useAuthStore";
import { useUserProfile } from "@/src/features/profile/useUserProfile";
import { useUpdateAvatar } from "@/src/features/profile/useUpdateAvatar";
import { supabase } from "@/src/lib/supabase";
import { Avatar } from "@/src/components/ui/Avatar";
import { AnimatedPressable } from "@/src/components/ui/AnimatedPressable";
import { PALETTE, FONT, FONT_FAMILY, RADIUS, SPACING } from "@/src/theme";

// ─── Types ────────────────────────────────────────────────────────
type RowProps = {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  iconBg: string;
  label: string;
  sublabel?: string;
  value?: string;
  onPress?: () => void;
  danger?: boolean;
  last?: boolean;
  colors: any;
  isDark: boolean;
  right?: React.ReactNode;
};

// ─── Row ──────────────────────────────────────────────────────────
function Row({ icon, iconColor, iconBg, label, sublabel, value, onPress, danger, last, colors, isDark, right }: RowProps) {
  return (
    <>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => ({
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: SPACING.lg,
          paddingVertical: SPACING.base,
          minHeight: 54,
          backgroundColor: pressed && onPress
            ? isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)"
            : "transparent",
        })}
      >
        {/* Icône colorée */}
        <View style={{
          width: 36,
          height: 36,
          borderRadius: 9,
          backgroundColor: danger ? "rgba(244,63,94,0.15)" : iconBg,
          alignItems: "center",
          justifyContent: "center",
          marginRight: SPACING.base,
          flexShrink: 0,
        }}>
          <Ionicons name={icon} size={18} color={danger ? "#F43F5E" : iconColor} />
        </View>

        {/* Texte */}
        <View style={{ flex: 1 }}>
          <Text style={{
            fontSize: FONT.sizes.base,
            fontFamily: FONT_FAMILY.medium,
            color: danger ? "#F43F5E" : colors.textPrimary,
          }} numberOfLines={1}>
            {label}
          </Text>
          {sublabel ? (
            <Text style={{
              fontSize: FONT.sizes.xs,
              fontFamily: FONT_FAMILY.regular,
              color: colors.textTertiary,
              marginTop: 1,
            }} numberOfLines={1}>
              {sublabel}
            </Text>
          ) : null}
        </View>

        {/* Droite */}
        {right ? right : value ? (
          <Text style={{
            fontSize: FONT.sizes.sm,
            fontFamily: FONT_FAMILY.regular,
            color: colors.textTertiary,
            marginLeft: SPACING.base,
            flexShrink: 0,
          }} numberOfLines={1}>
            {value}
          </Text>
        ) : onPress ? (
          <Ionicons name="chevron-forward" size={16} color={colors.textMuted} style={{ marginLeft: SPACING.base }} />
        ) : null}
      </Pressable>

      {/* Séparateur indenté (sauf sur la dernière row) */}
      {!last && (
        <View style={{
          height: 1,
          backgroundColor: colors.border,
          marginLeft: 36 + SPACING.base + SPACING.lg, // align after icon
        }} />
      )}
    </>
  );
}

// ─── Carte ────────────────────────────────────────────────────────
function Card({ children, colors, isDark }: { children: React.ReactNode; colors: any; isDark: boolean }) {
  return (
    <View style={{
      marginHorizontal: SPACING.lg,
      borderRadius: RADIUS.xl,
      backgroundColor: isDark ? "#1C1C1E" : "#FFFFFF",
      borderWidth: 1,
      borderColor: colors.border,
      overflow: "hidden",
    }}>
      {children}
    </View>
  );
}

// ─── Titre de section ─────────────────────────────────────────────
function SectionTitle({ label, isDark }: { label: string; isDark: boolean }) {
  return (
    <Text style={{
      fontSize: FONT.sizes.xs,
      fontFamily: FONT_FAMILY.semibold,
      color: isDark ? "#666" : "#999",
      textTransform: "uppercase",
      letterSpacing: 1.2,
      paddingHorizontal: SPACING.lg,   // aligné avec marginHorizontal des Cards
      marginTop: SPACING["3xl"],
      marginBottom: SPACING.sm,
    }}>
      {label}
    </Text>
  );
}

// ─── Constantes thème ─────────────────────────────────────────────
const THEME_OPTIONS: { key: ThemePreference; label: string; icon: keyof typeof Ionicons.glyphMap; color: string }[] = [
  { key: "light",  label: "Clair",   icon: "sunny-outline",         color: PALETTE.jaune },
  { key: "dark",   label: "Sombre",  icon: "moon-outline",          color: PALETTE.sarcelle },
  { key: "system", label: "Auto",    icon: "contrast-outline",      color: PALETTE.fuchsia },
];

// ─── Écran ────────────────────────────────────────────────────────
export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { preference, setPreference } = useThemeStore();
  const { reset: resetOnboarding } = useOnboardingStore();
  const signOut = useAuthStore((s) => s.signOut);
  const authLoading = useAuthStore((s) => s.isLoading);
  const { data: profile } = useUserProfile();
  const updateAvatar = useUpdateAvatar();

  const [editingUsername, setEditingUsername] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [savingUsername, setSavingUsername] = useState(false);

  const openEdit = () => {
    setNewUsername(profile?.username ?? "");
    setEditingUsername(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const saveUsername = async () => {
    const trimmed = newUsername.trim();
    if (!trimmed || trimmed === profile?.username) { setEditingUsername(false); return; }
    setSavingUsername(true);
    const { error } = await supabase.from("users").update({ username: trimmed }).eq("id", profile!.id);
    setSavingUsername(false);
    if (error) Alert.alert("Erreur", error.message);
    else setEditingUsername(false);
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={{ flex: 1, backgroundColor: isDark ? "#000000" : "#F2F2F7" }}>

        {/* ── Header ─────────────────────────────────────────────── */}
        <View style={{
          paddingTop: insets.top,
          paddingHorizontal: SPACING.lg,
          paddingBottom: SPACING.base,
          flexDirection: "row",
          alignItems: "center",
          gap: SPACING.base,
          backgroundColor: isDark ? "#000000" : "#F2F2F7",
        }}>
          <AnimatedPressable
            onPress={() => router.back()}
            style={{
              width: 38,
              height: 38,
              borderRadius: RADIUS.lg,
              backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.07)",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
          </AnimatedPressable>
          <Text style={{
            fontSize: FONT.sizes["2xl"],
            fontFamily: FONT_FAMILY.bold,
            color: colors.textPrimary,
            flex: 1,
          }}>
            Réglages
          </Text>
        </View>

        <ScrollView
          contentContainerStyle={{ paddingBottom: insets.bottom + 40, paddingTop: SPACING.sm }}
          showsVerticalScrollIndicator={false}
        >

          {/* ── Profil ──────────────────────────────────────────── */}
          {profile && (
            <>
              <SectionTitle label="Profil" isDark={isDark} />
              <Card colors={colors} isDark={isDark}>

                {/* Avatar */}
                <Pressable
                  onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); updateAvatar.mutate(); }}
                  disabled={updateAvatar.isPending}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingHorizontal: SPACING.lg,
                    paddingVertical: SPACING.lg,
                    gap: SPACING.base,
                    minHeight: 80,
                  }}
                >
                  <View>
                    <Avatar url={profile.avatar_url} username={profile.username} size={56} />
                    <View style={{
                      position: "absolute",
                      bottom: -2,
                      right: -2,
                      width: 22,
                      height: 22,
                      borderRadius: 11,
                      backgroundColor: PALETTE.sarcelle,
                      alignItems: "center",
                      justifyContent: "center",
                      borderWidth: 2,
                      borderColor: isDark ? "#1C1C1E" : "#FFFFFF",
                    }}>
                      {updateAvatar.isPending
                        ? <ActivityIndicator size="small" color="#FFF" />
                        : <Ionicons name="camera" size={11} color="#FFF" />}
                    </View>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{
                      fontSize: FONT.sizes.lg,
                      fontFamily: FONT_FAMILY.bold,
                      color: colors.textPrimary,
                    }}>
                      {profile.username}
                    </Text>
                    <Text style={{
                      fontSize: FONT.sizes.sm,
                      fontFamily: FONT_FAMILY.regular,
                      color: colors.textTertiary,
                      marginTop: 2,
                    }}>
                      {profile.role ?? "Membre"} · Appuie pour changer la photo
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
                </Pressable>

                {/* Séparateur */}
                <View style={{ height: 1, backgroundColor: colors.border, marginLeft: SPACING.lg }} />

                {/* Modifier le pseudo */}
                {editingUsername ? (
                  <View style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingHorizontal: SPACING.lg,
                    paddingVertical: SPACING.base,
                    gap: SPACING.base,
                    minHeight: 54,
                  }}>
                    <View style={{
                      width: 36, height: 36, borderRadius: 9,
                      backgroundColor: `${PALETTE.sarcelle}20`,
                      alignItems: "center", justifyContent: "center",
                      marginRight: SPACING.sm, flexShrink: 0,
                    }}>
                      <Ionicons name="pencil" size={16} color={PALETTE.sarcelle} />
                    </View>
                    <TextInput
                      value={newUsername}
                      onChangeText={setNewUsername}
                      autoFocus
                      autoCapitalize="none"
                      returnKeyType="done"
                      onSubmitEditing={saveUsername}
                      placeholder="Nouveau pseudo..."
                      placeholderTextColor={colors.textMuted}
                      style={{
                        flex: 1,
                        fontSize: FONT.sizes.base,
                        fontFamily: FONT_FAMILY.semibold,
                        color: colors.textPrimary,
                        paddingVertical: SPACING.xs,
                        borderBottomWidth: 1.5,
                        borderBottomColor: PALETTE.sarcelle,
                      }}
                    />
                    {savingUsername ? (
                      <ActivityIndicator size="small" color={PALETTE.sarcelle} style={{ marginLeft: SPACING.sm }} />
                    ) : (
                      <View style={{ flexDirection: "row", gap: SPACING.base, marginLeft: SPACING.sm }}>
                        <Pressable onPress={() => setEditingUsername(false)} hitSlop={10}>
                          <Ionicons name="close-circle" size={26} color={colors.textMuted} />
                        </Pressable>
                        <Pressable onPress={saveUsername} hitSlop={10}>
                          <Ionicons name="checkmark-circle" size={26} color={PALETTE.sarcelle} />
                        </Pressable>
                      </View>
                    )}
                  </View>
                ) : (
                  <Row
                    icon="at-outline"
                    iconColor={PALETTE.sarcelle}
                    iconBg={`${PALETTE.sarcelle}18`}
                    label="Modifier le pseudo"
                    value={`@${profile.username}`}
                    onPress={openEdit}
                    last
                    colors={colors}
                    isDark={isDark}
                  />
                )}
              </Card>
            </>
          )}

          {/* ── Apparence ───────────────────────────────────────── */}
          <SectionTitle label="Apparence" isDark={isDark} />
          <Card colors={colors} isDark={isDark}>
            <View style={{ padding: SPACING.lg }}>
              <Text style={{
                fontSize: FONT.sizes.sm,
                fontFamily: FONT_FAMILY.medium,
                color: colors.textSecondary,
                marginBottom: SPACING.base,
              }}>
                Thème de l'application
              </Text>
              <View style={{ flexDirection: "row", gap: SPACING.base }}>
                {THEME_OPTIONS.map((opt) => {
                  const active = preference === opt.key;
                  return (
                    <AnimatedPressable
                      key={opt.key}
                      onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setPreference(opt.key); }}
                      style={{
                        flex: 1,
                        alignItems: "center",
                        paddingVertical: SPACING.base,
                        paddingHorizontal: SPACING.xs,
                        borderRadius: RADIUS.lg,
                        backgroundColor: active
                          ? `${opt.color}18`
                          : isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)",
                        borderWidth: active ? 1.5 : 1,
                        borderColor: active ? opt.color : colors.border,
                        gap: SPACING.sm,
                      }}
                    >
                      <Ionicons name={opt.icon} size={22} color={active ? opt.color : colors.textTertiary} />
                      <Text style={{
                        fontSize: FONT.sizes.xs,
                        fontFamily: active ? FONT_FAMILY.bold : FONT_FAMILY.regular,
                        color: active ? opt.color : colors.textTertiary,
                      }}>
                        {opt.label}
                      </Text>
                    </AnimatedPressable>
                  );
                })}
              </View>
            </View>
          </Card>

          {/* ── Application ─────────────────────────────────────── */}
          <SectionTitle label="Application" isDark={isDark} />
          <Card colors={colors} isDark={isDark}>
            <Row
              icon="compass-outline"
              iconColor="#34C759"
              iconBg="rgba(52,199,89,0.15)"
              label="Revoir le guide"
              sublabel="Redécouvrir l'onboarding"
              onPress={async () => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                await resetOnboarding();
                router.push("/onboarding");
              }}
              colors={colors}
              isDark={isDark}
            />
            <Row
              icon="code-slash-outline"
              iconColor="#5856D6"
              iconBg="rgba(88,86,214,0.15)"
              label="Version"
              value="1.2.0"
              last
              colors={colors}
              isDark={isDark}
            />
          </Card>

          {/* ── Compte ──────────────────────────────────────────── */}
          <SectionTitle label="Compte" isDark={isDark} />
          <Card colors={colors} isDark={isDark}>
            <Row
              icon="log-out-outline"
              iconColor="#F43F5E"
              iconBg="rgba(244,63,94,0.15)"
              label={authLoading ? "Déconnexion en cours…" : "Se déconnecter"}
              danger
              last
              onPress={() => {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                Alert.alert("Se déconnecter", "Tu veux vraiment te déconnecter ?", [
                  { text: "Annuler", style: "cancel" },
                  { text: "Déconnecter", style: "destructive", onPress: signOut },
                ]);
              }}
              colors={colors}
              isDark={isDark}
            />
          </Card>

        </ScrollView>
      </View>
    </>
  );
}
