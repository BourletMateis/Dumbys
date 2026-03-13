import { View, Text, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, RADIUS, FONT, FONT_FAMILY } from "@/src/theme";
import { useTheme } from "@/src/providers/ThemeProvider";

type EmptyStateProps = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function EmptyState({
  icon,
  title,
  subtitle,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  const { colors } = useTheme();

  return (
    <View style={{ alignItems: "center", justifyContent: "center", paddingVertical: 64, paddingHorizontal: 32 }}>
      <View
        style={{
          width: 80,
          height: 80,
          borderRadius: 40,
          backgroundColor: "rgba(255,45,125,0.12)",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 20,
        }}
      >
        <Ionicons name={icon} size={36} color={COLORS.brand} />
      </View>
      <Text
        style={{
          color: colors.textPrimary,
          fontSize: FONT.sizes.lg,
          fontFamily: FONT_FAMILY.bold,
          textAlign: "center",
          marginBottom: 8,
        }}
      >
        {title}
      </Text>
      {subtitle && (
        <Text
          style={{
            color: colors.textSecondary,
            fontSize: FONT.sizes.sm,
            textAlign: "center",
            marginBottom: 24,
          }}
        >
          {subtitle}
        </Text>
      )}
      {actionLabel && onAction && (
        <Pressable
          onPress={onAction}
          style={({ pressed }) => ({
            backgroundColor: COLORS.brand,
            paddingHorizontal: 24,
            paddingVertical: 12,
            borderRadius: RADIUS.full,
            opacity: pressed ? 0.8 : 1,
          })}
        >
          <Text
            style={{
              color: "#FFFFFF",
              fontFamily: FONT_FAMILY.semibold,
            }}
          >
            {actionLabel}
          </Text>
        </Pressable>
      )}
    </View>
  );
}
