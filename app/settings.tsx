/**
 * settings.tsx — Dumbys Settings Screen
 * Layout: explicit padding instead of flexbox centering for icons,
 * no `gap`, every dimension is a named constant.
 */

import { useState } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  StyleSheet,
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
import { PALETTE, FONT_FAMILY } from "@/src/theme";

// ─── Layout constants (single source of truth) ───────────────────
// Tuned for an iOS-Settings / Telegram premium feel:
// compact icon box, generous tap target, perfect vertical rhythm.
const ROW_PH        = 16;   // horizontal padding inside each row
const ICON_BOX      = 30;   // icon container: width & height  (iOS-like)
const ICON_SIZE     = 16;   // Ionicons glyph size inside the box
const ICON_PAD      = (ICON_BOX - ICON_SIZE) / 2; // = 7 → explicit centering
const ICON_RADIUS   = 8;    // border-radius of icon box
const GAP           = 12;   // horizontal gap between icon box and text
const ROW_H         = 52;   // min-height of each row (safety floor)
const ROW_PV        = 10;   // vertical padding (real height driver)
const CARD_MH       = 16;   // card horizontal margin
const CARD_RADIUS   = 18;   // card border-radius
const SEP_INDENT    = ROW_PH + ICON_BOX + GAP; // = 58 → text-aligned separator

// ─── Types ───────────────────────────────────────────────────────
type Colors = ReturnType<typeof useTheme>["colors"];

type RowProps = {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  iconBg: string;
  label: string;
  sublabel?: string;
  value?: string;
  right?: React.ReactNode;
  onPress?: () => void;
  danger?: boolean;
  showSep?: boolean;
  colors: Colors;
  isDark: boolean;
};

// ─── SettingsRow ─────────────────────────────────────────────────
function SettingsRow({
  icon,
  iconColor,
  iconBg,
  label,
  sublabel,
  value,
  right,
  onPress,
  danger,
  showSep = false,
  colors,
  isDark,
}: RowProps) {
  const resolvedIconColor  = danger ? "#FF3B30" : iconColor;
  const resolvedIconBg     = danger ? "rgba(255,59,48,0.15)" : iconBg;
  const resolvedLabelColor = danger ? "#FF3B30" : colors.textPrimary;

  return (
    <>
      {/* Pressable handles ONLY tap + press feedback. */}
      {/* The flex-row layout lives on an inner <View> — this works around */}
      {/* a Pressable+style-function bug on iOS where the array style can */}
      {/* swallow flexDirection:"row", stacking children vertically. */}
      <Pressable
        onPress={onPress}
        disabled={!onPress}
        android_ripple={
          onPress
            ? { color: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)" }
            : undefined
        }
        style={({ pressed }) =>
          pressed && onPress
            ? {
                backgroundColor: isDark
                  ? "rgba(255,255,255,0.04)"
                  : "rgba(0,0,0,0.03)",
              }
            : null
        }
      >
        <View style={styles.row}>
          {/* ── Icon box ── */}
          <View
            style={[
              styles.iconBox,
              {
                backgroundColor: resolvedIconBg,
                borderRadius: ICON_RADIUS,
              },
            ]}
          >
            <Ionicons name={icon} size={ICON_SIZE} color={resolvedIconColor} />
          </View>

          {/* ── Text block ── */}
          <View style={styles.rowBody}>
            <Text
              style={[styles.rowLabel, { color: resolvedLabelColor }]}
              numberOfLines={1}
            >
              {label}
            </Text>
            {sublabel ? (
              <Text
                style={[styles.rowSub, { color: colors.textTertiary }]}
                numberOfLines={1}
              >
                {sublabel}
              </Text>
            ) : null}
          </View>

          {/* ── Right side ── */}
          <View style={styles.rowRight}>
            {right ? (
              right
            ) : value ? (
              <Text
                style={[styles.rowValue, { color: colors.textTertiary }]}
                numberOfLines={1}
              >
                {value}
              </Text>
            ) : null}
            {onPress && !right && !value ? (
              <Ionicons
                name="chevron-forward"
                size={16}
                color={isDark ? "#48484A" : "#C7C7CC"}
              />
            ) : null}
            {onPress && (value || right) ? (
              <Ionicons
                name="chevron-forward"
                size={14}
                color={isDark ? "#48484A" : "#C7C7CC"}
                style={styles.chevronAfter}
              />
            ) : null}
          </View>
        </View>
      </Pressable>

      {/* ── Intra-card separator ── */}
      {showSep && (
        <View
          style={[
            styles.sep,
            {
              backgroundColor: isDark
                ? "rgba(255,255,255,0.07)"
                : "rgba(0,0,0,0.07)",
              marginLeft: SEP_INDENT,
            },
          ]}
        />
      )}
    </>
  );
}

// ─── Card ────────────────────────────────────────────────────────
function SettingsCard({
  children,
  isDark,
}: {
  children: React.ReactNode;
  isDark: boolean;
}) {
  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: isDark ? "#1C1C1E" : "#FFFFFF",
          borderColor: isDark
            ? "rgba(255,255,255,0.09)"
            : "rgba(0,0,0,0.08)",
          shadowOpacity: isDark ? 0 : 0.07,
        },
      ]}
    >
      {children}
    </View>
  );
}

// ─── Section header ──────────────────────────────────────────────
function SectionHeader({
  label,
  isDark,
  first,
}: {
  label: string;
  isDark: boolean;
  first?: boolean;
}) {
  return (
    <Text
      style={[
        styles.sectionLabel,
        {
          color: isDark ? "#6E6E73" : "#8E8E93",
          marginTop: first ? 10 : 30,
        },
      ]}
    >
      {label.toUpperCase()}
    </Text>
  );
}

// ─── Theme options ───────────────────────────────────────────────
const THEME_OPTIONS: {
  key: ThemePreference;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}[] = [
  { key: "light",  label: "Clair",  icon: "sunny-outline",    color: PALETTE.jaune },
  { key: "dark",   label: "Sombre", icon: "moon-outline",     color: PALETTE.sarcelle },
  { key: "system", label: "Auto",   icon: "contrast-outline", color: PALETTE.fuchsia },
];

// ─── Screen ──────────────────────────────────────────────────────
export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { preference, setPreference } = useThemeStore();
  const { reset: resetOnboarding } = useOnboardingStore();
  const signOut     = useAuthStore((s) => s.signOut);
  const authLoading = useAuthStore((s) => s.isLoading);
  const { data: profile } = useUserProfile();
  const updateAvatar = useUpdateAvatar();

  const [editingUsername, setEditingUsername] = useState(false);
  const [newUsername,     setNewUsername]     = useState("");
  const [savingUsername,  setSavingUsername]  = useState(false);

  const openEdit = () => {
    setNewUsername(profile?.username ?? "");
    setEditingUsername(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const saveUsername = async () => {
    const trimmed = newUsername.trim();
    if (!trimmed || trimmed === profile?.username) {
      setEditingUsername(false);
      return;
    }
    setSavingUsername(true);
    const { error } = await supabase
      .from("users")
      .update({ username: trimmed })
      .eq("id", profile!.id);
    setSavingUsername(false);
    if (error) Alert.alert("Erreur", error.message);
    else setEditingUsername(false);
  };

  const pageBg = isDark ? "#000000" : "#F2F2F7";

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={[styles.root, { backgroundColor: pageBg }]}>

        {/* ── Header ──────────────────────────────────────────── */}
        <View
          style={[
            styles.header,
            {
              paddingTop: insets.top + 8,
              backgroundColor: pageBg,
              borderBottomColor: isDark
                ? "rgba(255,255,255,0.06)"
                : "rgba(0,0,0,0.06)",
            },
          ]}
        >
          <AnimatedPressable
            onPress={() => router.back()}
            style={[
              styles.backBtn,
              {
                backgroundColor: isDark
                  ? "rgba(255,255,255,0.1)"
                  : "rgba(0,0,0,0.07)",
              },
            ]}
          >
            <Ionicons name="chevron-back" size={20} color={colors.textPrimary} />
          </AnimatedPressable>

          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
            Réglages
          </Text>
        </View>

        {/* ── Scrollable content ──────────────────────────────── */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + 48 },
          ]}
        >
          {/* ── PROFIL ───────────────────────────────────────── */}
          {profile && (
            <>
              <SectionHeader label="Profil" isDark={isDark} first />

              <SettingsCard isDark={isDark}>

                {/* Avatar — same Pressable/inner-View split as SettingsRow */}
                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    updateAvatar.mutate();
                  }}
                  disabled={updateAvatar.isPending}
                  android_ripple={{ color: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)" }}
                  style={({ pressed }) =>
                    pressed
                      ? {
                          backgroundColor: isDark
                            ? "rgba(255,255,255,0.04)"
                            : "rgba(0,0,0,0.03)",
                        }
                      : null
                  }
                >
                  <View style={styles.avatarRow}>
                    <View style={styles.avatarWrap}>
                      <Avatar url={profile.avatar_url} username={profile.username} size={52} />
                      <View
                        style={[
                          styles.cameraBadge,
                          {
                            backgroundColor: PALETTE.sarcelle,
                            borderColor: isDark ? "#1C1C1E" : "#FFFFFF",
                          },
                        ]}
                      >
                        {updateAvatar.isPending ? (
                          <ActivityIndicator size="small" color="#FFF" />
                        ) : (
                          <Ionicons name="camera" size={10} color="#FFF" />
                        )}
                      </View>
                    </View>

                    <View style={styles.avatarBody}>
                      <Text
                        style={[styles.avatarName, { color: colors.textPrimary }]}
                        numberOfLines={1}
                      >
                        {profile.username}
                      </Text>
                      <Text
                        style={[styles.avatarSub, { color: colors.textTertiary }]}
                        numberOfLines={1}
                      >
                        {profile.role ?? "user"} · Appuie pour changer la photo
                      </Text>
                    </View>

                    <View style={styles.rowRight}>
                      <Ionicons
                        name="chevron-forward"
                        size={16}
                        color={isDark ? "#48484A" : "#C7C7CC"}
                      />
                    </View>
                  </View>
                </Pressable>

                {/* Divider after avatar row */}
                <View
                  style={[
                    styles.fullSep,
                    {
                      backgroundColor: isDark
                        ? "rgba(255,255,255,0.07)"
                        : "rgba(0,0,0,0.07)",
                      marginLeft: ROW_PH,
                    },
                  ]}
                />

                {/* Modifier le pseudo — editing state */}
                {editingUsername ? (
                  <View style={styles.editRow}>
                    {/* Icon box — same dimensions as SettingsRow */}
                    <View
                      style={[
                        styles.iconBox,
                        {
                          backgroundColor: "rgba(63,208,201,0.15)",
                          borderRadius: ICON_RADIUS,
                        },
                      ]}
                    >
                      <Ionicons name="pencil" size={ICON_SIZE} color={PALETTE.sarcelle} />
                    </View>

                    {/* Text input */}
                    <TextInput
                      value={newUsername}
                      onChangeText={setNewUsername}
                      autoFocus
                      autoCapitalize="none"
                      returnKeyType="done"
                      onSubmitEditing={saveUsername}
                      placeholder="Nouveau pseudo…"
                      placeholderTextColor={colors.textTertiary}
                      style={[
                        styles.usernameInput,
                        {
                          color: colors.textPrimary,
                          borderBottomColor: PALETTE.sarcelle,
                        },
                      ]}
                    />

                    {/* Confirm / cancel */}
                    {savingUsername ? (
                      <ActivityIndicator
                        size="small"
                        color={PALETTE.sarcelle}
                        style={{ marginLeft: 10 }}
                      />
                    ) : (
                      <View style={styles.editActions}>
                        <Pressable
                          onPress={() => setEditingUsername(false)}
                          hitSlop={10}
                        >
                          <Ionicons
                            name="close-circle"
                            size={26}
                            color={isDark ? "#48484A" : "#C7C7CC"}
                          />
                        </Pressable>
                        <Pressable onPress={saveUsername} hitSlop={10}>
                          <Ionicons
                            name="checkmark-circle"
                            size={26}
                            color={PALETTE.sarcelle}
                          />
                        </Pressable>
                      </View>
                    )}
                  </View>
                ) : (
                  <SettingsRow
                    icon="at-outline"
                    iconColor={PALETTE.sarcelle}
                    iconBg="rgba(63,208,201,0.15)"
                    label="Modifier le pseudo"
                    sublabel={`@${profile.username}`}
                    onPress={openEdit}
                    colors={colors}
                    isDark={isDark}
                  />
                )}
              </SettingsCard>
            </>
          )}

          {/* ── APPARENCE ────────────────────────────────────── */}
          <SectionHeader label="Apparence" isDark={isDark} />
          <SettingsCard isDark={isDark}>
            <View style={styles.themeBlock}>
              <Text style={[styles.themeTitle, { color: colors.textSecondary }]}>
                Thème de l'application
              </Text>
              <View style={styles.themeRow}>
                {THEME_OPTIONS.map((opt) => {
                  const active = preference === opt.key;
                  return (
                    <AnimatedPressable
                      key={opt.key}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setPreference(opt.key);
                      }}
                      style={[
                        styles.themeChip,
                        {
                          backgroundColor: active
                            ? `${opt.color}1A`
                            : isDark
                            ? "rgba(255,255,255,0.05)"
                            : "rgba(0,0,0,0.04)",
                          borderWidth: active ? 1.5 : StyleSheet.hairlineWidth,
                          borderColor: active
                            ? opt.color
                            : isDark
                            ? "rgba(255,255,255,0.1)"
                            : "rgba(0,0,0,0.08)",
                        },
                      ]}
                    >
                      <Ionicons
                        name={opt.icon}
                        size={22}
                        color={active ? opt.color : colors.textTertiary}
                      />
                      <Text
                        style={[
                          styles.themeChipLabel,
                          {
                            color: active ? opt.color : colors.textTertiary,
                            fontFamily: active
                              ? FONT_FAMILY.bold
                              : FONT_FAMILY.regular,
                          },
                        ]}
                      >
                        {opt.label}
                      </Text>
                    </AnimatedPressable>
                  );
                })}
              </View>
            </View>
          </SettingsCard>

          {/* ── APPLICATION ──────────────────────────────────── */}
          <SectionHeader label="Application" isDark={isDark} />
          <SettingsCard isDark={isDark}>
            <SettingsRow
              icon="compass-outline"
              iconColor="#34C759"
              iconBg="rgba(52,199,89,0.15)"
              label="Revoir le guide"
              sublabel="Redécouvrir l'onboarding"
              showSep
              onPress={async () => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                await resetOnboarding();
                router.push("/onboarding");
              }}
              colors={colors}
              isDark={isDark}
            />
            <SettingsRow
              icon="code-slash-outline"
              iconColor="#5856D6"
              iconBg="rgba(88,86,214,0.15)"
              label="Version"
              value="1.2.0"
              colors={colors}
              isDark={isDark}
            />
          </SettingsCard>

          {/* ── COMPTE ───────────────────────────────────────── */}
          <SectionHeader label="Compte" isDark={isDark} />
          <SettingsCard isDark={isDark}>
            <SettingsRow
              icon="log-out-outline"
              iconColor="#FF3B30"
              iconBg="rgba(255,59,48,0.15)"
              label={authLoading ? "Déconnexion en cours…" : "Se déconnecter"}
              danger
              onPress={() => {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                Alert.alert(
                  "Se déconnecter",
                  "Tu veux vraiment te déconnecter ?",
                  [
                    { text: "Annuler", style: "cancel" },
                    {
                      text: "Déconnecter",
                      style: "destructive",
                      onPress: signOut,
                    },
                  ]
                );
              }}
              colors={colors}
              isDark={isDark}
            />
          </SettingsCard>

        </ScrollView>
      </View>
    </>
  );
}

// ─── StyleSheet ──────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1 },

  // ── Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: FONT_FAMILY.bold,
    flex: 1,
    includeFontPadding: false,
  },

  // ── Scroll
  scrollContent: {
    paddingHorizontal: CARD_MH,
  },

  // ── Section label
  sectionLabel: {
    fontSize: 11,
    fontFamily: FONT_FAMILY.semibold,
    letterSpacing: 0.7,
    marginBottom: 6,
    paddingHorizontal: 4,
    includeFontPadding: false,
  },

  // ── Card container — must stretch to fill the scroll content width
  card: {
    width: "100%",
    alignSelf: "stretch",
    borderRadius: CARD_RADIUS,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 6,
    elevation: 2,
  },

  // ── Settings row — fixed iOS-style geometry
  // CRITICAL: width:"100%" + alignSelf:"stretch" forces the Pressable
  // to fill its parent card. Without this, on iOS the Pressable can
  // hug its content, leaving the chevron with no room on the right.
  row: {
    width: "100%",
    alignSelf: "stretch",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: ROW_PH,
    paddingVertical: ROW_PV,
    minHeight: ROW_H,
  },

  // ── Icon box (30×30)
  // Explicit padding + alignItems/justifyContent = belt-and-suspenders
  // centering for the font-icon glyph (Ionicons renders as <Text>).
  iconBox: {
    width: ICON_BOX,
    height: ICON_BOX,
    padding: ICON_PAD,
    alignItems: "center",
    justifyContent: "center",
    flexGrow: 0,
    flexShrink: 0,
  },

  // ── Text block (label + optional sublabel)
  rowBody: {
    flex: 1,
    flexShrink: 1,
    flexDirection: "column",
    marginLeft: GAP,
  },
  rowLabel: {
    fontSize: 15,
    fontFamily: FONT_FAMILY.medium,
    includeFontPadding: false,
    lineHeight: 19,
  },
  rowSub: {
    fontSize: 12,
    fontFamily: FONT_FAMILY.regular,
    marginTop: 2,
    includeFontPadding: false,
    lineHeight: 15,
  },

  // ── Right-side wrapper — always present, holds value + chevron in a row
  rowRight: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 8,
    flexGrow: 0,
    flexShrink: 0,
  },
  rowValue: {
    fontSize: 14,
    fontFamily: FONT_FAMILY.regular,
    maxWidth: 160,
    textAlign: "right",
    includeFontPadding: false,
    lineHeight: 18,
  },
  chevronAfter: {
    marginLeft: 4,
  },

  // ── Separators
  sep: {
    height: StyleSheet.hairlineWidth,
  },
  fullSep: {
    height: StyleSheet.hairlineWidth,
  },

  // ── Avatar row — taller than a normal row to fit the 52px avatar
  avatarRow: {
    width: "100%",
    alignSelf: "stretch",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: ROW_PH,
    paddingVertical: 12,
  },
  avatarWrap: {
    position: "relative",
    flexGrow: 0,
    flexShrink: 0,
  },
  cameraBadge: {
    position: "absolute",
    bottom: -1,
    right: -1,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
  },
  avatarBody: {
    flex: 1,
    flexShrink: 1,
    flexDirection: "column",
    marginLeft: GAP,
  },
  avatarName: {
    fontSize: 16,
    fontFamily: FONT_FAMILY.bold,
    includeFontPadding: false,
    lineHeight: 21,
  },
  avatarSub: {
    fontSize: 12,
    fontFamily: FONT_FAMILY.regular,
    marginTop: 2,
    includeFontPadding: false,
    lineHeight: 16,
  },

  // ── Username edit row (mirrors the normal row layout)
  editRow: {
    width: "100%",
    alignSelf: "stretch",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: ROW_PH,
    paddingVertical: ROW_PV,
    minHeight: ROW_H,
  },
  usernameInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: FONT_FAMILY.semibold,
    paddingVertical: 4,
    marginLeft: GAP,
    borderBottomWidth: 1.5,
    includeFontPadding: false,
  },
  editActions: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 10,
    gap: 6,
  },

  // ── Theme picker
  themeBlock: {
    padding: 14,
  },
  themeTitle: {
    fontSize: 13,
    fontFamily: FONT_FAMILY.medium,
    marginBottom: 10,
    includeFontPadding: false,
  },
  themeRow: {
    flexDirection: "row",
    gap: 10,
  },
  themeChip: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 14,
    gap: 6,
  },
  themeChipLabel: {
    fontSize: 12,
    includeFontPadding: false,
  },
});
