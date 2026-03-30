import { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { router, Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useUserProfile } from "@/src/features/profile/useUserProfile";
import { useUpdateUsername } from "@/src/features/profile/useUpdateUsername";
import { useUpdateAvatar } from "@/src/features/profile/useUpdateAvatar";
import { useAuthStore } from "@/src/store/useAuthStore";
import { Avatar } from "@/src/components/ui/Avatar";
import { AnimatedPressable } from "@/src/components/ui/AnimatedPressable";
import { COLORS, PALETTE, RADIUS, FONT, FONT_FAMILY, SPACING } from "@/src/theme";

type SettingsItemProps = {
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  label: string;
  value?: string;
  onPress: () => void;
  chevron?: boolean;
};

function SettingsItem({ icon, color, label, value, onPress, chevron = true }: SettingsItemProps) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        flexDirection: "row",
        alignItems: "center",
        padding: SPACING.lg,
        gap: 12,
      }}
    >
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: RADIUS.sm,
          backgroundColor: `${color}15`,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Ionicons name={icon} size={18} color={color} />
      </View>
      <Text
        numberOfLines={1}
        style={{
          flex: 1,
          fontSize: FONT.sizes.base,
          fontFamily: FONT_FAMILY.semibold,
          color: "#1A1A1A",
        }}
      >
        {label}
      </Text>
      {value ? (
        <Text
          numberOfLines={1}
          style={{
            fontSize: FONT.sizes.sm,
            fontFamily: FONT_FAMILY.regular,
            color: "#999",
            maxWidth: 140,
          }}
        >
          {value}
        </Text>
      ) : null}
      {chevron && <Ionicons name="chevron-forward" size={16} color="#CCC" />}
    </Pressable>
  );
}

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { data: profile } = useUserProfile();
  const updateUsername = useUpdateUsername();
  const updateAvatar = useUpdateAvatar();
  const signOut = useAuthStore((s) => s.signOut);
  const authLoading = useAuthStore((s) => s.isLoading);
  const user = useAuthStore((s) => s.user);

  const [editingUsername, setEditingUsername] = useState(false);
  const [usernameInput, setUsernameInput] = useState("");

  useEffect(() => {
    if (profile?.username) {
      setUsernameInput(profile.username);
    }
  }, [profile?.username]);

  const handleSaveUsername = () => {
    if (!usernameInput.trim() || usernameInput.trim() === profile?.username) {
      setEditingUsername(false);
      return;
    }
    updateUsername.mutate(usernameInput.trim(), {
      onSuccess: () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setEditingUsername(false);
      },
      onError: (err) => {
        Alert.alert("Erreur", err.message);
      },
    });
  };

  const handleSignOut = () => {
    Alert.alert(
      "Se deconnecter",
      "Tu es sur de vouloir te deconnecter ?",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Deconnexion",
          style: "destructive",
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            signOut();
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Supprimer le compte",
      "Cette action est irreversible. Toutes tes donnees seront supprimees.",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: () => {
            Alert.alert("Contact", "Envoie un mail a support@dumbys.app pour supprimer ton compte.");
          },
        },
      ]
    );
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={{ flex: 1, backgroundColor: "#F8F8FA" }}>
        {/* Header */}
        <View
          style={{
            paddingTop: insets.top + SPACING.base,
            paddingBottom: SPACING.base,
            paddingHorizontal: SPACING.lg,
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
            backgroundColor: "#FFFFFF",
            borderBottomWidth: 1,
            borderBottomColor: "rgba(0,0,0,0.05)",
          }}
        >
          <Pressable
            onPress={() => router.back()}
            style={{
              width: 38,
              height: 38,
              borderRadius: RADIUS.sm,
              backgroundColor: "rgba(0,0,0,0.04)",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name="arrow-back" size={22} color="#1A1A1A" />
          </Pressable>
          <Text
            style={{
              flex: 1,
              fontSize: FONT.sizes.xl,
              fontFamily: FONT_FAMILY.bold,
              color: "#1A1A1A",
            }}
          >
            Reglages
          </Text>
        </View>

        <ScrollView
          contentContainerStyle={{ paddingBottom: insets.bottom + SPACING["2xl"] }}
          showsVerticalScrollIndicator={false}
        >
          {/* ─── Profile section ─── */}
          <View style={{ alignItems: "center", paddingVertical: 28 }}>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                updateAvatar.mutate();
              }}
              disabled={updateAvatar.isPending}
            >
              <Avatar
                url={profile?.avatar_url}
                username={profile?.username ?? ""}
                size={88}
              />
              <View
                style={{
                  position: "absolute",
                  bottom: 0,
                  right: 0,
                  width: 28,
                  height: 28,
                  borderRadius: 14,
                  backgroundColor: PALETTE.sarcelle,
                  alignItems: "center",
                  justifyContent: "center",
                  borderWidth: 2.5,
                  borderColor: "#F8F8FA",
                }}
              >
                {updateAvatar.isPending ? (
                  <ActivityIndicator color="#FFF" size={12} />
                ) : (
                  <Ionicons name="camera" size={13} color="#FFF" />
                )}
              </View>
            </Pressable>
            <Text
              style={{
                marginTop: 12,
                fontSize: FONT.sizes.xl,
                fontFamily: FONT_FAMILY.bold,
                color: "#1A1A1A",
              }}
            >
              {profile?.username ?? ""}
            </Text>
            <Text
              style={{
                fontSize: FONT.sizes.sm,
                fontFamily: FONT_FAMILY.regular,
                color: "#999",
                marginTop: 2,
              }}
            >
              {user?.email ?? ""}
            </Text>
          </View>

          {/* ─── Account section ─── */}
          <Text
            style={{
              paddingHorizontal: SPACING["2xl"],
              marginBottom: SPACING.base,
              fontSize: FONT.sizes.xs,
              fontFamily: FONT_FAMILY.bold,
              color: "#999",
              textTransform: "uppercase",
              letterSpacing: 1.5,
            }}
          >
            Compte
          </Text>

          <View
            style={{
              marginHorizontal: SPACING["2xl"],
              backgroundColor: "#FFFFFF",
              borderRadius: RADIUS.xl,
              borderWidth: 1,
              borderColor: "rgba(0,0,0,0.06)",
              overflow: "hidden",
            }}
          >
            {/* Username edit */}
            {editingUsername ? (
              <View style={{ padding: SPACING.lg, gap: 10 }}>
                <Text
                  style={{
                    fontSize: FONT.sizes.sm,
                    fontFamily: FONT_FAMILY.semibold,
                    color: "#1A1A1A",
                  }}
                >
                  Nom d'utilisateur
                </Text>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    backgroundColor: "#F2F2F2",
                    borderRadius: 14,
                    paddingHorizontal: 14,
                    gap: 8,
                  }}
                >
                  <Ionicons name="at" size={18} color="#BBB" />
                  <TextInput
                    value={usernameInput}
                    onChangeText={setUsernameInput}
                    autoFocus
                    autoCapitalize="none"
                    autoCorrect={false}
                    maxLength={24}
                    placeholder="Ton pseudo"
                    placeholderTextColor="#CCC"
                    style={{
                      flex: 1,
                      color: "#1A1A1A",
                      fontSize: FONT.sizes.base,
                      fontFamily: FONT_FAMILY.regular,
                      paddingVertical: 12,
                    }}
                  />
                  <Text
                    style={{
                      fontSize: FONT.sizes.xs,
                      fontFamily: FONT_FAMILY.regular,
                      color: "#CCC",
                    }}
                  >
                    {usernameInput.length}/24
                  </Text>
                </View>
                <View style={{ flexDirection: "row", gap: 8, justifyContent: "flex-end" }}>
                  <Pressable
                    onPress={() => {
                      setEditingUsername(false);
                      setUsernameInput(profile?.username ?? "");
                    }}
                    style={{
                      paddingHorizontal: 16,
                      paddingVertical: 8,
                      borderRadius: 10,
                      backgroundColor: "#F2F2F2",
                    }}
                  >
                    <Text style={{ color: "#999", fontSize: FONT.sizes.sm, fontFamily: FONT_FAMILY.semibold }}>
                      Annuler
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={handleSaveUsername}
                    disabled={updateUsername.isPending}
                    style={{
                      paddingHorizontal: 16,
                      paddingVertical: 8,
                      borderRadius: 10,
                      backgroundColor: PALETTE.sarcelle,
                      opacity: updateUsername.isPending ? 0.6 : 1,
                    }}
                  >
                    {updateUsername.isPending ? (
                      <ActivityIndicator color="#FFF" size={14} />
                    ) : (
                      <Text style={{ color: "#FFF", fontSize: FONT.sizes.sm, fontFamily: FONT_FAMILY.bold }}>
                        Sauvegarder
                      </Text>
                    )}
                  </Pressable>
                </View>
              </View>
            ) : (
              <SettingsItem
                icon="person-outline"
                color={PALETTE.sarcelle}
                label="Nom d'utilisateur"
                value={profile?.username}
                onPress={() => setEditingUsername(true)}
              />
            )}

            <View style={{ height: 1, backgroundColor: "rgba(0,0,0,0.05)", marginLeft: 60 }} />

            <SettingsItem
              icon="mail-outline"
              color="#6366F1"
              label="Email"
              value={user?.email}
              onPress={() => {}}
              chevron={false}
            />

            <View style={{ height: 1, backgroundColor: "rgba(0,0,0,0.05)", marginLeft: 60 }} />

            <SettingsItem
              icon="image-outline"
              color={PALETTE.fuchsia}
              label="Changer la photo de profil"
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                updateAvatar.mutate();
              }}
            />
          </View>

          {/* ─── Preferences section ─── */}
          <Text
            style={{
              paddingHorizontal: SPACING["2xl"],
              marginTop: SPACING["2xl"],
              marginBottom: SPACING.base,
              fontSize: FONT.sizes.xs,
              fontFamily: FONT_FAMILY.bold,
              color: "#999",
              textTransform: "uppercase",
              letterSpacing: 1.5,
            }}
          >
            Preferences
          </Text>

          <View
            style={{
              marginHorizontal: SPACING["2xl"],
              backgroundColor: "#FFFFFF",
              borderRadius: RADIUS.xl,
              borderWidth: 1,
              borderColor: "rgba(0,0,0,0.06)",
              overflow: "hidden",
            }}
          >
            <SettingsItem
              icon="notifications-outline"
              color={PALETTE.fuchsia}
              label="Notifications"
              onPress={() => router.push("/notifications-settings" as any)}
            />
          </View>

          {/* ─── Danger zone ─── */}
          <Text
            style={{
              paddingHorizontal: SPACING["2xl"],
              marginTop: SPACING["2xl"],
              marginBottom: SPACING.base,
              fontSize: FONT.sizes.xs,
              fontFamily: FONT_FAMILY.bold,
              color: "#999",
              textTransform: "uppercase",
              letterSpacing: 1.5,
            }}
          >
            Compte
          </Text>

          <View
            style={{
              marginHorizontal: SPACING["2xl"],
              backgroundColor: "#FFFFFF",
              borderRadius: RADIUS.xl,
              borderWidth: 1,
              borderColor: "rgba(0,0,0,0.06)",
              overflow: "hidden",
            }}
          >
            <SettingsItem
              icon="log-out-outline"
              color="#F97316"
              label="Se deconnecter"
              onPress={handleSignOut}
              chevron={false}
            />

            <View style={{ height: 1, backgroundColor: "rgba(0,0,0,0.05)", marginLeft: 60 }} />

            <SettingsItem
              icon="trash-outline"
              color={COLORS.error}
              label="Supprimer mon compte"
              onPress={handleDeleteAccount}
              chevron={false}
            />
          </View>

          {/* Version */}
          <Text
            style={{
              textAlign: "center",
              marginTop: SPACING["2xl"],
              fontSize: FONT.sizes.xs,
              fontFamily: FONT_FAMILY.regular,
              color: "#CCC",
            }}
          >
            Dumbys v1.0.0
          </Text>
        </ScrollView>
      </View>
    </>
  );
}
