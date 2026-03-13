import { View, Text, Pressable, ActivityIndicator } from "react-native";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import type { FriendshipWithUser } from "./useFriendships";

type Props = {
  friendship: FriendshipWithUser;
  onRemove: () => void;
  isRemoving: boolean;
};

export function FriendRow({ friendship, onRemove, isRemoving }: Props) {
  const { otherUser } = friendship;

  return (
    <View className="flex-row items-center px-4 py-3 bg-white dark:bg-neutral-900 border-b border-neutral-100 dark:border-neutral-800">
      {/* Avatar */}
      {otherUser.avatar_url ? (
        <Image
          source={{ uri: otherUser.avatar_url }}
          style={{ width: 40, height: 40, borderRadius: 20 }}
        />
      ) : (
        <View className="w-10 h-10 rounded-full bg-blue-500 items-center justify-center">
          <Text className="text-white font-bold">
            {otherUser.username.charAt(0).toUpperCase()}
          </Text>
        </View>
      )}

      {/* Username */}
      <Text
        className="flex-1 ml-3 text-neutral-900 dark:text-white font-medium text-base"
        numberOfLines={1}
      >
        {otherUser.username}
      </Text>

      {/* Remove */}
      <Pressable
        onPress={() => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          onRemove();
        }}
        disabled={isRemoving}
        className="bg-red-50 dark:bg-red-900/20 px-4 py-2 rounded-xl active:opacity-80 disabled:opacity-50"
      >
        {isRemoving ? (
          <ActivityIndicator size="small" />
        ) : (
          <Text className="text-red-500 text-sm font-semibold">Remove</Text>
        )}
      </Pressable>
    </View>
  );
}
