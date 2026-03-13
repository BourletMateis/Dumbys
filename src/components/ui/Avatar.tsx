import { View, Text } from "react-native";
import { Image } from "expo-image";
import { AVATAR_COLORS, FONT } from "@/src/theme";

type AvatarProps = {
  url?: string | null;
  username: string;
  size?: number;
  borderColor?: string;
  borderWidth?: number;
};

function getColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export function Avatar({
  url,
  username,
  size = 40,
  borderColor,
  borderWidth = 0,
}: AvatarProps) {
  const radius = size / 2;

  if (url) {
    return (
      <Image
        source={{ uri: url }}
        style={{
          width: size,
          height: size,
          borderRadius: radius,
          borderWidth,
          borderColor: borderColor ?? "transparent",
        }}
      />
    );
  }

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        backgroundColor: getColor(username),
        alignItems: "center",
        justifyContent: "center",
        borderWidth,
        borderColor: borderColor ?? "transparent",
      }}
    >
      <Text
        style={{
          color: "white",
          fontSize: size * 0.4,
          fontWeight: FONT.weights.bold,
        }}
      >
        {username.charAt(0).toUpperCase()}
      </Text>
    </View>
  );
}
