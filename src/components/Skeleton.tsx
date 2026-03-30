import { useEffect } from "react";
import { View, Dimensions } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { RADIUS } from "@/src/theme";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_WIDTH = SCREEN_WIDTH - 48; // matches index.tsx SPACING["2xl"] * 2

type SkeletonProps = {
  width?: number | string;
  height?: number;
  borderRadius?: number;
};

export function Skeleton({ width = "100%", height = 16, borderRadius = 8 }: SkeletonProps) {
  const opacity = useSharedValue(0.35);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(0.75, { duration: 900, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      style={[
        {
          width: width as number,
          height,
          borderRadius,
          backgroundColor: "#E0E0E0",
        },
        animatedStyle,
      ]}
    />
  );
}

// ── Feed card skeleton — matches VideoCard in index.tsx ──────────
export function HomeFeedCardSkeleton() {
  const THUMB_HEIGHT = CARD_WIDTH * (9 / 16);

  return (
    <View
      style={{
        marginHorizontal: 24,
        marginBottom: 16,
        borderRadius: RADIUS.xl,
        backgroundColor: "#FFFFFF",
        borderWidth: 1,
        borderColor: "rgba(0,0,0,0.06)",
        overflow: "hidden",
      }}
    >
      {/* Thumbnail placeholder */}
      <Skeleton width={CARD_WIDTH} height={THUMB_HEIGHT} borderRadius={0} />

      {/* Overlay info skeleton */}
      <View style={{ position: "absolute", bottom: 12, left: 12, right: 12, gap: 6 }}>
        <Skeleton width={CARD_WIDTH * 0.5} height={14} borderRadius={6} />
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Skeleton width={26} height={26} borderRadius={13} />
          <Skeleton width={80} height={12} borderRadius={5} />
        </View>
      </View>
    </View>
  );
}

// ── Home feed skeleton — stories + 3 cards ───────────────────────
export function HomeFeedSkeleton() {
  return (
    <View>
      {/* Stories bar */}
      <View
        style={{
          flexDirection: "row",
          paddingHorizontal: 24,
          paddingVertical: 16,
          gap: 16,
          backgroundColor: "#FFFFFF",
          borderBottomWidth: 1,
          borderBottomColor: "rgba(0,0,0,0.05)",
        }}
      >
        {[0, 1, 2, 3].map((i) => (
          <View key={i} style={{ alignItems: "center", gap: 6 }}>
            <Skeleton width={56} height={56} borderRadius={28} />
            <Skeleton width={44} height={9} borderRadius={4} />
          </View>
        ))}
      </View>

      {/* Feed heading */}
      <View style={{ paddingHorizontal: 24, paddingVertical: 16, gap: 6 }}>
        <Skeleton width={160} height={16} borderRadius={7} />
        <Skeleton width={220} height={12} borderRadius={5} />
      </View>

      {/* Cards */}
      <HomeFeedCardSkeleton />
      <HomeFeedCardSkeleton />
      <HomeFeedCardSkeleton />
    </View>
  );
}

// ── Profile skeleton ─────────────────────────────────────────────
export function ProfileSkeleton() {
  return (
    <View style={{ alignItems: "center", paddingTop: 32, paddingHorizontal: 24 }}>
      <Skeleton width={80} height={80} borderRadius={40} />
      <View style={{ marginTop: 12, alignItems: "center", gap: 8 }}>
        <Skeleton width={140} height={18} borderRadius={7} />
        <Skeleton width={100} height={12} borderRadius={5} />
      </View>
      <View style={{ flexDirection: "row", gap: 12, marginTop: 24, width: "100%" }}>
        <View style={{ flex: 1 }}>
          <Skeleton width="100%" height={68} borderRadius={RADIUS.lg} />
        </View>
        <View style={{ flex: 1 }}>
          <Skeleton width="100%" height={68} borderRadius={RADIUS.lg} />
        </View>
        <View style={{ flex: 1 }}>
          <Skeleton width="100%" height={68} borderRadius={RADIUS.lg} />
        </View>
      </View>
    </View>
  );
}

// ── Video card skeleton (group / tournament pages) ───────────────
export function VideoCardSkeleton() {
  return (
    <View
      style={{
        backgroundColor: "#FFFFFF",
        borderRadius: RADIUS.xl,
        overflow: "hidden",
        marginBottom: 12,
        borderWidth: 1,
        borderColor: "rgba(0,0,0,0.06)",
      }}
    >
      <Skeleton width="100%" height={200} borderRadius={0} />
      <View style={{ padding: 14, gap: 8 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <Skeleton width={32} height={32} borderRadius={16} />
          <Skeleton width={120} height={14} borderRadius={6} />
        </View>
        <View style={{ flexDirection: "row", gap: 12 }}>
          <Skeleton width={48} height={22} borderRadius={RADIUS.sm} />
          <Skeleton width={48} height={22} borderRadius={RADIUS.sm} />
        </View>
      </View>
    </View>
  );
}
