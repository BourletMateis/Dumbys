import { useEffect, useRef } from "react";
import {
  View,
  Pressable,
  Dimensions,
  ScrollView,
  Modal,
  Keyboard,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  interpolate,
  Extrapolation,
} from "react-native-reanimated";
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import { RADIUS } from "@/src/theme";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

type BottomSheetProps = {
  isOpen: boolean;
  onClose: () => void;
  snapPoint?: number;
  children: React.ReactNode;
};

export function BottomSheet({
  isOpen,
  onClose,
  snapPoint = 0.5,
  children,
}: BottomSheetProps) {
  const insets = useSafeAreaInsets();
  const translateY = useSharedValue(SCREEN_HEIGHT);
  const backdropOpacity = useSharedValue(0);
  const context = useSharedValue(0);
  const keyboardHeight = useSharedValue(0);
  // Track current keyboard height so we don't re-animate if it hasn't changed
  const currentKbHeight = useRef(0);

  useEffect(() => {
    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const onShow = Keyboard.addListener(showEvent, (e) => {
      const h = e.endCoordinates.height;
      if (h === currentKbHeight.current) return; // no change, avoid jump
      currentKbHeight.current = h;
      const duration = Platform.OS === "ios" ? e.duration : 200;
      keyboardHeight.value = withTiming(h, { duration });
    });

    const onHide = Keyboard.addListener(hideEvent, (e) => {
      currentKbHeight.current = 0;
      const duration = Platform.OS === "ios" ? e.duration : 200;
      keyboardHeight.value = withTiming(0, { duration });
    });

    return () => { onShow.remove(); onHide.remove(); };
  }, []);

  const maxTranslate = SCREEN_HEIGHT * (1 - snapPoint);

  useEffect(() => {
    if (isOpen) {
      translateY.value = withSpring(maxTranslate, { damping: 25, stiffness: 200 });
      backdropOpacity.value = withTiming(1, { duration: 200 });
    } else {
      translateY.value = withSpring(SCREEN_HEIGHT, { damping: 25, stiffness: 200 });
      backdropOpacity.value = withTiming(0, { duration: 200 });
    }
  }, [isOpen]);

  const gesture = Gesture.Pan()
    .onStart(() => { context.value = translateY.value; })
    .onUpdate((event) => {
      const newY = context.value + event.translationY;
      translateY.value = Math.max(newY, maxTranslate);
    })
    .onEnd((event) => {
      if (event.translationY > 100 || event.velocityY > 500) {
        translateY.value = withSpring(SCREEN_HEIGHT, { damping: 25, stiffness: 200 });
        backdropOpacity.value = withTiming(0, { duration: 200 });
        runOnJS(onClose)();
      } else {
        translateY.value = withSpring(maxTranslate, { damping: 25, stiffness: 200 });
      }
    });

  const sheetStyle = useAnimatedStyle(() => {
    // Fade out the keyboard offset as the sheet closes so there's no jump
    const keyboardOffset = interpolate(
      translateY.value,
      [maxTranslate, SCREEN_HEIGHT],
      [keyboardHeight.value, 0],
      Extrapolation.CLAMP,
    );
    return { transform: [{ translateY: translateY.value - keyboardOffset }] };
  });

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  if (!isOpen) return null;

  return (
    <Modal visible={isOpen} transparent animationType="none" statusBarTranslucent onRequestClose={onClose}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        {/* Backdrop */}
        <Animated.View
          style={[
            { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.35)" },
            backdropStyle,
          ]}
        >
          <Pressable style={{ flex: 1 }} onPress={onClose} />
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
                backgroundColor: "#FFFFFF",
                borderTopLeftRadius: RADIUS.xl,
                borderTopRightRadius: RADIUS.xl,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: -4 },
                shadowOpacity: 0.08,
                shadowRadius: 12,
                elevation: 12,
              },
              sheetStyle,
            ]}
          >
            {/* Handle */}
            <View style={{ alignItems: "center", paddingTop: 12, paddingBottom: 8 }}>
              <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: "#D0D0D0" }} />
            </View>

            <ScrollView
              bounces={false}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 20) + 20 }}
            >
              {children}
            </ScrollView>
          </Animated.View>
        </GestureDetector>
      </GestureHandlerRootView>
    </Modal>
  );
}
