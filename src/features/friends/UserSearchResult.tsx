import { View, Text, Pressable, ActivityIndicator } from "react-native";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import type { UserRow } from "./useSearchUsers";

type FriendStatus = "none" | "pending_sent" | "pending_received" | "accepted";

type Props = {
  user: UserRow;
  status: FriendStatus;
  onAdd: () => void;
  isLoading: boolean;
};

export function UserSearchResult({ user, status, onAdd, isLoading }: Props) {
  return (
    <View className="flex-row items-center px-4 py-3 bg-white dark:bg-neutral-900 border-b border-neutral-100 dark:border-neutral-800">
      {/* Avatar */}
      {user.avatar_url ? (
        <Image
          source={{ uri: user.avatar_url }}
          style={{ width: 40, height: 40, borderRadius: 20 }}
        />
      ) : (
        <View className="w-10 h-10 rounded-full bg-blue-500 items-center justify-center">
          <Text className="text-white font-bold">
            {user.username.charAt(0).toUpperCase()}
          </Text>
        </View>
      )}

      {/* Username */}
      <Text
        className="flex-1 ml-3 text-neutral-900 dark:text-white font-medium text-base"
        numberOfLines={1}
      >
        {user.username}
      </Text>

      {/* Action */}
      {status === "none" && (
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onAdd();
          }}
          disabled={isLoading}
          className="bg-blue-500 px-4 py-2 rounded-xl active:opacity-80 disabled:opacity-50"
        >
          {isLoading ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <Text className="text-white text-sm font-semibold">Add</Text>
          )}
        </Pressable>
      )}
      {status === "pending_sent" && (
        <View className="bg-neutral-200 dark:bg-neutral-700 px-4 py-2 rounded-xl">
          <Text className="text-neutral-500 dark:text-neutral-400 text-sm font-medium">
            Pending
          </Text>
        </View>
      )}
      {status === "pending_received" && (
        <View className="bg-orange-100 dark:bg-orange-900/30 px-4 py-2 rounded-xl">
          <Text className="text-orange-600 dark:text-orange-400 text-sm font-medium">
            Responds to you
          </Text>
        </View>
      )}
      {status === "accepted" && (
        <View className="bg-green-100 dark:bg-green-900/30 px-4 py-2 rounded-xl">
          <Text className="text-green-600 dark:text-green-400 text-sm font-medium">
            Friends
          </Text>
        </View>
      )}
    </View>
  );
}
