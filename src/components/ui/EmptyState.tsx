import { View, Text, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { PALETTE, RADIUS, FONT, FONT_FAMILY } from "@/src/theme";

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
  return (
    <View style={{ alignItems: "center", justifyContent: "center", paddingVertical: 64, paddingHorizontal: 32 }}>
      <View
        style={{
          width: 80,
          height: 80,
          borderRadius: 40,
          backgroundColor: PALETTE.sarcelle + "15",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 20,
        }}
      >
        <Ionicons name={icon} size={36} color={PALETTE.sarcelle} />
      </View>
      <Text
        style={{
          color: "#1A1A1A",
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
            color: "#999",
            fontSize: FONT.sizes.sm,
            fontFamily: FONT_FAMILY.regular,
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
            backgroundColor: PALETTE.sarcelle,
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
