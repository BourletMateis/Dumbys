import { useEffect } from "react";
import {
  View,
  Pressable,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Modal,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from "react-native-reanimated";
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import { COLORS, RADIUS } from "@/src/theme";
import { useTheme } from "@/src/providers/ThemeProvider";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

type BottomSheetProps = {
  isOpen: boolean;
  onClose: () => void;
  snapPoint?: number; // percentage of screen height (default 0.5)
  children: React.ReactNode;
};

export function BottomSheet({
  isOpen,
  onClose,
  snapPoint = 0.5,
  children,
}: BottomSheetProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const translateY = useSharedValue(SCREEN_HEIGHT);
  const backdropOpacity = useSharedValue(0);
  const context = useSharedValue(0);

  const maxTranslate = SCREEN_HEIGHT * (1 - snapPoint);

  useEffect(() => {
    if (isOpen) {
      translateY.value = withSpring(maxTranslate, {
        damping: 25,
        stiffness: 200,
      });
      backdropOpacity.value = withTiming(1, { duration: 200 });
    } else {
      translateY.value = withSpring(SCREEN_HEIGHT, {
        damping: 25,
        stiffness: 200,
      });
      backdropOpacity.value = withTiming(0, { duration: 200 });
    }
  }, [isOpen]);

  const gesture = Gesture.Pan()
    .onStart(() => {
      context.value = translateY.value;
    })
    .onUpdate((event) => {
      const newY = context.value + event.translationY;
      translateY.value = Math.max(newY, maxTranslate);
    })
    .onEnd((event) => {
      if (event.translationY > 100 || event.velocityY > 500) {
        translateY.value = withSpring(SCREEN_HEIGHT, {
          damping: 25,
          stiffness: 200,
        });
        backdropOpacity.value = withTiming(0, { duration: 200 });
        runOnJS(onClose)();
      } else {
        translateY.value = withSpring(maxTranslate, {
          damping: 25,
          stiffness: 200,
        });
      }
    });

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  if (!isOpen) return null;

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <GestureHandlerRootView style={{ flex: 1 }}>
        {/* Backdrop */}
        <Animated.View
          style={[
            {
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: colors.overlay,
            },
            backdropStyle,
          ]}
        >
          <Pressable
            style={{ flex: 1 }}
            onPress={onClose}
          />
        </Animated.View>

        {/* Sheet */}
        <GestureDetector gesture={gesture}>
          <Animated.View
            style={[
              {
                position: "absolute",
                left: 0,
                right: 0,
                height: SCREEN_HEIGHT,
                backgroundColor: colors.elevated,
                borderTopLeftRadius: RADIUS.xl,
                borderTopRightRadius: RADIUS.xl,
              },
              sheetStyle,
            ]}
          >
            {/* Handle */}
            <View style={{ alignItems: "center", paddingTop: 12, paddingBottom: 8 }}>
              <View
                style={{
                  width: 40,
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: colors.textMuted,
                }}
              />
            </View>

            <KeyboardAvoidingView
              behavior={Platform.OS === "ios" ? "padding" : undefined}
              style={{ flex: 1 }}
            >
              <ScrollView
                bounces={false}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 20) + 20 }}
              >
                {children}
              </ScrollView>
            </KeyboardAvoidingView>
          </Animated.View>
        </GestureDetector>
      </GestureHandlerRootView>
    </Modal>
  );
}
