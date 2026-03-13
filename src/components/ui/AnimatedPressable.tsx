import { Pressable, type PressableProps } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

const AnimatedPress = Animated.createAnimatedComponent(Pressable);

type AnimatedPressableProps = PressableProps & {
  scaleValue?: number;
};

export function AnimatedPressable({
  scaleValue = 0.96,
  style,
  onPressIn,
  onPressOut,
  ...props
}: AnimatedPressableProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPress
      {...props}
      style={[animatedStyle, style as any]}
      onPressIn={(e) => {
        scale.value = withSpring(scaleValue, { damping: 15, stiffness: 300 });
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        scale.value = withSpring(1, { damping: 15, stiffness: 300 });
        onPressOut?.(e);
      }}
    />
  );
}
