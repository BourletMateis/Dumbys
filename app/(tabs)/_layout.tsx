import { Tabs } from "expo-router";
import { View, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { COLORS, GRADIENTS, RADIUS, SPACING } from "@/src/theme";
import { useTheme } from "@/src/providers/ThemeProvider";

const TABS: readonly { name: string; icon: keyof typeof Ionicons.glyphMap; iconOutline: keyof typeof Ionicons.glyphMap; isCenter?: boolean }[] = [
  { name: "index", icon: "globe", iconOutline: "globe-outline" },
  { name: "explore", icon: "lock-closed", iconOutline: "lock-closed-outline" },
  { name: "upload", icon: "add", iconOutline: "add", isCenter: true },
  { name: "friends", icon: "people", iconOutline: "people-outline" },
  { name: "profile", icon: "person-circle", iconOutline: "person-circle-outline" },
];

function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{
        position: "absolute",
        bottom: Math.max(insets.bottom, 12),
        left: SPACING.lg,
        right: SPACING.lg,
      }}
    >
      <BlurView
        intensity={60}
        tint={isDark ? "dark" : "light"}
        style={{
          flexDirection: "row",
          borderRadius: RADIUS["3xl"],
          overflow: "hidden",
          borderWidth: 1,
          borderColor: colors.borderLight,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            flex: 1,
            paddingVertical: SPACING.md,
            paddingHorizontal: SPACING.sm,
            backgroundColor: colors.elevated + "CC",
            alignItems: "center",
          }}
        >
          {state.routes.map((route, index) => {
            const tab = TABS.find((t) => t.name === route.name);
            if (!tab) return null;

            const isFocused = state.index === index;

            const onPress = () => {
              Haptics.impactAsync(
                tab.isCenter
                  ? Haptics.ImpactFeedbackStyle.Medium
                  : Haptics.ImpactFeedbackStyle.Light,
              );
              const event = navigation.emit({
                type: "tabPress",
                target: route.key,
                canPreventDefault: true,
              });
              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            };

            // Big center "+" button
            if (tab.isCenter) {
              return (
                <Pressable
                  key={route.key}
                  onPress={onPress}
                  style={{
                    flex: 1,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <LinearGradient
                    colors={
                      isFocused
                        ? [...GRADIENTS.brandAccent]
                        : [...GRADIENTS.brand]
                    }
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{
                      width: 50,
                      height: 38,
                      borderRadius: RADIUS.md,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Ionicons name="add" size={26} color={colors.textPrimary} />
                  </LinearGradient>
                </Pressable>
              );
            }

            return (
              <Pressable
                key={route.key}
                onPress={onPress}
                style={{
                  flex: 1,
                  alignItems: "center",
                  justifyContent: "center",
                  paddingVertical: SPACING.xs,
                  gap: 3,
                }}
              >
                <Ionicons
                  name={isFocused ? tab.icon : tab.iconOutline}
                  size={24}
                  color={isFocused ? COLORS.brand : colors.textTertiary}
                />
                {isFocused && (
                  <View
                    style={{
                      width: 4,
                      height: 4,
                      borderRadius: RADIUS.full,
                      backgroundColor: COLORS.accent,
                    }}
                  />
                )}
              </Pressable>
            );
          })}
        </View>
      </BlurView>
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="explore" />
      <Tabs.Screen name="upload" />
      <Tabs.Screen name="friends" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}
