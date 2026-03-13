import { View, Text, Pressable, ActivityIndicator } from "react-native";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import type { FriendshipWithUser } from "./useFriendships";

type Props = {
  friendship: FriendshipWithUser;
  onAccept: () => void;
  onReject: () => void;
  isAccepting: boolean;
  isRejecting: boolean;
};

export function FriendRequestCard({
  friendship,
  onAccept,
  onReject,
  isAccepting,
  isRejecting,
}: Props) {
  const { otherUser } = friendship;
  const isLoading = isAccepting || isRejecting;

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

      {/* Actions */}
      <View className="flex-row gap-2">
        <Pressable
          onPress={() => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            onAccept();
          }}
          disabled={isLoading}
          className="bg-green-500 px-4 py-2 rounded-xl active:opacity-80 disabled:opacity-50"
        >
          {isAccepting ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <Text className="text-white text-sm font-semibold">Accept</Text>
          )}
        </Pressable>
        <Pressable
          onPress={() => {
            Haptics.selectionAsync();
            onReject();
          }}
          disabled={isLoading}
          className="bg-neutral-200 dark:bg-neutral-700 px-4 py-2 rounded-xl active:opacity-80 disabled:opacity-50"
        >
          {isRejecting ? (
            <ActivityIndicator size="small" />
          ) : (
            <Text className="text-neutral-600 dark:text-neutral-300 text-sm font-semibold">
              Reject
            </Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}
