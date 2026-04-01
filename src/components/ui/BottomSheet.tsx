import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from "react";
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
} from "react-native-reanimated";
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import { RADIUS } from "@/src/theme";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

export type BottomSheetHandle = {
  scrollTo: (y: number) => void;
  scrollToEnd: () => void;
};

type BottomSheetProps = {
  isOpen: boolean;
  onClose: () => void;
  snapPoint?: number;
  children: React.ReactNode;
};

export const BottomSheet = forwardRef<BottomSheetHandle, BottomSheetProps>(function BottomSheet({
  isOpen,
  onClose,
  snapPoint = 0.5,
  children,
}: BottomSheetProps, ref) {
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const translateY = useSharedValue(SCREEN_HEIGHT);
  const backdropOpacity = useSharedValue(0);
  const context = useSharedValue(0);

  useImperativeHandle(ref, () => ({
    scrollTo: (y: number) => scrollRef.current?.scrollTo({ y, animated: true }),
    scrollToEnd: () => scrollRef.current?.scrollToEnd({ animated: true }),
  }));

  // Track keyboard height as plain state — no sheet movement.
  // iOS UIScrollView natively scrolls to the first responder when
  // there is enough paddingBottom below it, which we provide here.
  // Android "pan" mode in app.json handles it at the OS level.
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const onShow = Keyboard.addListener(showEvent, (e) => {
      setKeyboardHeight(e.endCoordinates.height);
    });
    const onHide = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
    });

    return () => {
      onShow.remove();
      onHide.remove();
    };
  }, []);

  const maxTranslate = SCREEN_HEIGHT * (1 - snapPoint);

  const handleClose = () => {
    Keyboard.dismiss();
    onClose();
  };

  useEffect(() => {
    if (isOpen) {
      translateY.value = withSpring(maxTranslate, { damping: 25, stiffness: 200 });
      backdropOpacity.value = withTiming(1, { duration: 200 });
    } else {
      Keyboard.dismiss();
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
        runOnJS(handleClose)();
      } else {
        translateY.value = withSpring(maxTranslate, { damping: 25, stiffness: 200 });
      }
    });

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  if (!isOpen) return null;

  const basePadding = Math.max(insets.bottom, 20) + 40;

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <GestureHandlerRootView style={{ flex: 1 }}>
        {/* Backdrop */}
        <Animated.View
          style={[
            { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.35)" },
            backdropStyle,
          ]}
        >
          <Pressable style={{ flex: 1 }} onPress={handleClose} />
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
              ref={scrollRef}
              bounces={false}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{
                // When keyboard is visible: add its height as extra bottom padding.
                // This gives iOS's native UIScrollView first-responder scroll
                // enough room to bring any input above the keyboard.
                paddingBottom: basePadding + keyboardHeight,
              }}
            >
              {children}
            </ScrollView>
          </Animated.View>
        </GestureDetector>
      </GestureHandlerRootView>
    </Modal>
  );
});
