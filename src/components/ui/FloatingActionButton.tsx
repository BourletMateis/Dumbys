import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { Pressable } from "react-native";
import { COLORS, RADIUS } from "@/src/theme";

type FABProps = {
  onPress: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  size?: number;
  bottom?: number;
};

export function FloatingActionButton({
  onPress,
  icon = "add",
  size = 56,
  bottom = 100,
}: FABProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress();
  };

  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          right: 20,
          bottom,
          zIndex: 50,
        },
        animatedStyle,
      ]}
    >
      <Pressable
        onPress={handlePress}
        onPressIn={() => {
          scale.value = withSpring(0.9, { damping: 15, stiffness: 300 });
        }}
        onPressOut={() => {
          scale.value = withSpring(1, { damping: 15, stiffness: 300 });
        }}
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: COLORS.brand,
          alignItems: "center",
          justifyContent: "center",
          shadowColor: "rgba(255,45,125,0.35)",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 1,
          shadowRadius: 12,
          elevation: 8,
        }}
      >
        <Ionicons name={icon} size={28} color="white" />
      </Pressable>
    </Animated.View>
  );
}
