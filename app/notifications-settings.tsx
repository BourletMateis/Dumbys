import { View, Text, Switch, Pressable, ScrollView, ActivityIndicator } from "react-native";
import { router, Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  useNotificationPreferences,
  useUpdateNotificationPreferences,
  useToggleNotificationsEnabled,
  type NotificationPreferences,
} from "@/src/features/notifications/useNotificationPreferences";
import { useUserProfile } from "@/src/features/profile/useUserProfile";
import { FONT, FONT_FAMILY, PALETTE, RADIUS, SPACING } from "@/src/theme";

type PrefKey = keyof NotificationPreferences;

const PREF_ITEMS: {
  key: PrefKey;
  label: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}[] = [
  {
    key: "new_video",
    label: "Nouvelles vidéos",
    description: "Quand quelqu'un poste dans ton groupe",
    icon: "videocam-outline",
    color: PALETTE.fuchsia,
  },
  {
    key: "vote_reminder",
    label: "Rappel de vote",
    description: "Chaque samedi pour voter sur les vidéos",
    icon: "trophy-outline",
    color: "#F97316",
  },
  {
    key: "podium_result",
    label: "Résultat podium",
    description: "Chaque lundi pour connaître le gagnant",
    icon: "ribbon-outline",
    color: PALETTE.jaune,
  },
  {
    key: "friend_request",
    label: "Demandes d'amis",
    description: "Quand quelqu'un t'envoie une demande",
    icon: "person-add-outline",
    color: PALETTE.sarcelle,
  },
  {
    key: "new_challenge",
    label: "Nouveaux défis",
    description: "Quand un tournoi est créé dans ton groupe",
    icon: "flag-outline",
    color: "#8B5CF6",
  },
];

export default function NotificationsSettingsScreen() {
  const insets = useSafeAreaInsets();
  const { data: profile } = useUserProfile();
  const { data: prefs, isLoading } = useNotificationPreferences();
  const updatePrefs = useUpdateNotificationPreferences();
  const toggleEnabled = useToggleNotificationsEnabled();

  const globalEnabled = (profile as any)?.notifications_enabled ?? true;

  const handleTogglePref = (key: PrefKey, value: boolean) => {
    updatePrefs.mutate({ [key]: value });
  };

  const handleToggleGlobal = (value: boolean) => {
    toggleEnabled.mutate(value);
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
            Notifications
          </Text>
        </View>

        {isLoading ? (
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
            <ActivityIndicator color={PALETTE.fuchsia} />
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={{
              paddingBottom: insets.bottom + SPACING["2xl"],
            }}
            showsVerticalScrollIndicator={false}
          >
            {/* Global toggle */}
            <View
              style={{
                margin: SPACING["2xl"],
                backgroundColor: "#FFFFFF",
                borderRadius: RADIUS.xl,
                borderWidth: 1,
                borderColor: "rgba(0,0,0,0.06)",
                overflow: "hidden",
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  padding: SPACING.lg,
                  gap: 12,
                }}
              >
                <View
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: RADIUS.md,
                    backgroundColor: globalEnabled
                      ? `${PALETTE.fuchsia}15`
                      : "rgba(0,0,0,0.06)",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Ionicons
                    name={globalEnabled ? "notifications" : "notifications-off-outline"}
                    size={22}
                    color={globalEnabled ? PALETTE.fuchsia : "#BBB"}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.75}
                    style={{
                      fontSize: FONT.sizes.base,
                      fontFamily: FONT_FAMILY.bold,
                      color: "#1A1A1A",
                    }}
                  >
                    Toutes les notifications
                  </Text>
                  <Text
                    style={{
                      fontSize: FONT.sizes.xs,
                      fontFamily: FONT_FAMILY.regular,
                      color: "#999",
                      marginTop: 2,
                    }}
                  >
                    {globalEnabled ? "Activées" : "Désactivées"}
                  </Text>
                </View>
                <Switch
                  value={globalEnabled}
                  onValueChange={handleToggleGlobal}
                  trackColor={{ false: "#E0E0E0", true: `${PALETTE.fuchsia}60` }}
                  thumbColor={globalEnabled ? PALETTE.fuchsia : "#FFFFFF"}
                />
              </View>
            </View>

            {/* Per-type preferences */}
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
              Détail
            </Text>

            <View
              style={{
                marginHorizontal: SPACING["2xl"],
                backgroundColor: "#FFFFFF",
                borderRadius: RADIUS.xl,
                borderWidth: 1,
                borderColor: "rgba(0,0,0,0.06)",
                overflow: "hidden",
                opacity: globalEnabled ? 1 : 0.45,
              }}
            >
              {PREF_ITEMS.map((item, index) => {
                const value = prefs?.[item.key] ?? true;
                const isLast = index === PREF_ITEMS.length - 1;

                return (
                  <View key={item.key}>
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        padding: SPACING.lg,
                        gap: 12,
                      }}
                    >
                      <View
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: RADIUS.sm,
                          backgroundColor: `${item.color}15`,
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Ionicons name={item.icon} size={20} color={item.color} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text
                          numberOfLines={1}
                          adjustsFontSizeToFit
                          minimumFontScale={0.75}
                          style={{
                            fontSize: FONT.sizes.base,
                            fontFamily: FONT_FAMILY.semibold,
                            color: "#1A1A1A",
                          }}
                        >
                          {item.label}
                        </Text>
                        <Text
                          style={{
                            fontSize: FONT.sizes.xs,
                            fontFamily: FONT_FAMILY.regular,
                            color: "#999",
                            marginTop: 2,
                          }}
                        >
                          {item.description}
                        </Text>
                      </View>
                      <Switch
                        value={value}
                        onValueChange={(v) => handleTogglePref(item.key, v)}
                        disabled={!globalEnabled}
                        trackColor={{ false: "#E0E0E0", true: `${item.color}60` }}
                        thumbColor={value ? item.color : "#FFFFFF"}
                      />
                    </View>
                    {!isLast && (
                      <View
                        style={{
                          height: 1,
                          backgroundColor: "rgba(0,0,0,0.05)",
                          marginLeft: 64 + SPACING.lg,
                        }}
                      />
                    )}
                  </View>
                );
              })}
            </View>

            {/* Info note */}
            <View
              style={{
                marginHorizontal: SPACING["2xl"],
                marginTop: SPACING.xl,
                flexDirection: "row",
                alignItems: "flex-start",
                gap: 8,
              }}
            >
              <Ionicons name="information-circle-outline" size={16} color="#BBB" />
              <Text
                style={{
                  flex: 1,
                  fontSize: FONT.sizes.xs,
                  fontFamily: FONT_FAMILY.regular,
                  color: "#BBB",
                  lineHeight: 18,
                }}
              >
                Pour désactiver complètement les notifications, tu peux aussi modifier
                les autorisations directement dans les réglages de ton téléphone.
              </Text>
            </View>
          </ScrollView>
        )}
      </View>
    </>
  );
}
