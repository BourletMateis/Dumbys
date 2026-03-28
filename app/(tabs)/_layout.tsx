import { Tabs, router } from "expo-router";
import { View, Text, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { PALETTE, FONT, FONT_FAMILY } from "@/src/theme";

const FAB_SIZE = 60;
const FAB_BORDER = 5;
const FAB_TOTAL = FAB_SIZE + FAB_BORDER * 2; // 70
const FAB_OVERLAP = FAB_TOTAL / 2; // half sticks above the bar

const TABS: readonly {
  name: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconOutline: keyof typeof Ionicons.glyphMap;
  isCenter?: boolean;
}[] = [
  { name: "index", label: "Feed", icon: "home", iconOutline: "home-outline" },
  { name: "explore", label: "Explore", icon: "compass", iconOutline: "compass-outline" },
  { name: "upload", label: "", icon: "add", iconOutline: "add", isCenter: true },
  { name: "friends", label: "Amis", icon: "people", iconOutline: "people-outline" },
  { name: "profile", label: "Profil", icon: "person-circle", iconOutline: "person-circle-outline" },
];

function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const TAB_BAR_HEIGHT = 56 + Math.max(insets.bottom, 8);

  const findTabIndex = (name: string) => state.routes.findIndex((r) => r.name === name);

  const onTabPress = (routeName: string, routeKey: string, isCenter: boolean) => {
    Haptics.impactAsync(
      isCenter ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Light,
    );
    if (isCenter) {
      router.navigate("/camera" as any);
      return;
    }
    const event = navigation.emit({
      type: "tabPress",
      target: routeKey,
      canPreventDefault: true,
    });
    const idx = findTabIndex(routeName);
    if (state.index !== idx && !event.defaultPrevented) {
      navigation.navigate(routeName);
    }
  };

  const activeColor = PALETTE.sarcelle;
  const inactiveColor = "#B0B0B0";

  return (
    <View
      style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        height: TAB_BAR_HEIGHT + FAB_OVERLAP,
      }}
      pointerEvents="box-none"
    >
      {/* ── FAB sitting on top edge of the bar ── */}
      {(() => {
        const uploadRoute = state.routes.find((r) => r.name === "upload");
        if (!uploadRoute) return null;
        return (
          <View
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              alignItems: "center",
              zIndex: 10,
            }}
            pointerEvents="box-none"
          >
            <Pressable
              onPress={() => onTabPress("upload", uploadRoute.key, true)}
              style={{
                width: FAB_TOTAL,
                height: FAB_TOTAL,
                borderRadius: 22,
                backgroundColor: "#FFFFFF",
                alignItems: "center",
                justifyContent: "center",
                shadowColor: "#FF6B3D",
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.3,
                shadowRadius: 12,
                elevation: 8,
              }}
            >
              <LinearGradient
                colors={["#FF6B3D", PALETTE.fuchsia]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  width: FAB_SIZE,
                  height: FAB_SIZE,
                  borderRadius: 18,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons name="add" size={34} color="#FFFFFF" />
              </LinearGradient>
            </Pressable>
          </View>
        );
      })()}

      {/* ── Tab bar background ── */}
      <View
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: TAB_BAR_HEIGHT,
          backgroundColor: "#FFFFFF",
          borderTopWidth: 1,
          borderTopColor: "rgba(0,0,0,0.05)",
          flexDirection: "row",
          alignItems: "flex-start",
          justifyContent: "space-around",
          paddingTop: 10,
          paddingBottom: Math.max(insets.bottom, 8),
        }}
      >
        {state.routes.map((route, index) => {
          const tab = TABS.find((t) => t.name === route.name);
          if (!tab) return null;

          // Skip center tab — rendered as FAB above
          if (tab.isCenter) {
            return <View key={route.key} style={{ minWidth: FAB_TOTAL }} />;
          }

          const isFocused = state.index === index;

          return (
            <Pressable
              key={route.key}
              onPress={() => onTabPress(route.name, route.key, false)}
              style={{
                alignItems: "center",
                justifyContent: "center",
                minWidth: 56,
              }}
            >
              <Ionicons
                name={isFocused ? tab.icon : tab.iconOutline}
                size={24}
                color={isFocused ? activeColor : inactiveColor}
              />
              <Text
                style={{
                  fontSize: FONT.sizes.xs,
                  fontFamily: isFocused ? FONT_FAMILY.semibold : FONT_FAMILY.medium,
                  color: isFocused ? activeColor : inactiveColor,
                  marginTop: 2,
                }}
              >
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
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
