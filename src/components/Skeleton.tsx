import { useEffect } from "react";
import { View } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from "react-native-reanimated";

type Props = {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  className?: string;
};

export function Skeleton({
  width = "100%",
  height = 16,
  borderRadius = 8,
  className = "",
}: Props) {
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(0.7, { duration: 800, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          width: width as number,
          height,
          borderRadius,
          backgroundColor: "#d4d4d4",
        },
        animatedStyle,
      ]}
      className={`dark:bg-neutral-700 ${className}`}
    />
  );
}

// Pre-built skeleton layouts

export function VideoCardSkeleton() {
  return (
    <View className="bg-white dark:bg-neutral-900 mx-4 mb-3 rounded-2xl overflow-hidden border border-neutral-100 dark:border-neutral-800">
      <Skeleton width="100%" height={200} borderRadius={0} />
      <View className="p-4">
        <View className="flex-row items-center gap-2 mb-2">
          <Skeleton width={28} height={28} borderRadius={14} />
          <Skeleton width={120} height={14} />
        </View>
        <Skeleton width={80} height={24} borderRadius={12} />
      </View>
    </View>
  );
}

export function FeedSkeleton() {
  return (
    <View>
      <VideoCardSkeleton />
      <VideoCardSkeleton />
      <VideoCardSkeleton />
    </View>
  );
}

export function ProfileSkeleton() {
  return (
    <View className="items-center pt-8 px-4">
      <Skeleton width={80} height={80} borderRadius={40} />
      <View className="mt-3">
        <Skeleton width={140} height={20} />
      </View>
      <View className="mt-2">
        <Skeleton width={100} height={14} />
      </View>
      <View className="flex-row mt-6 gap-4 w-full">
        <View className="flex-1">
          <Skeleton width="100%" height={70} borderRadius={16} />
        </View>
      </View>
    </View>
  );
}

export function FriendRowSkeleton() {
  return (
    <View className="flex-row items-center px-4 py-3">
      <Skeleton width={40} height={40} borderRadius={20} />
      <View className="ml-3 flex-1">
        <Skeleton width={130} height={16} />
      </View>
      <Skeleton width={70} height={32} borderRadius={12} />
    </View>
  );
}

export function FriendsSkeleton() {
  return (
    <View>
      <FriendRowSkeleton />
      <FriendRowSkeleton />
      <FriendRowSkeleton />
      <FriendRowSkeleton />
    </View>
  );
}
