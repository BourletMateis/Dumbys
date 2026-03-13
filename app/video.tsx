import { View, ActivityIndicator, Pressable, Text } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { WebView } from "react-native-webview";
import { Ionicons } from "@expo/vector-icons";

export default function VideoScreen() {
  const { url } = useLocalSearchParams<{ url: string }>();
  const router = useRouter();

  if (!url) {
    return (
      <View className="flex-1 bg-black items-center justify-center">
        <Text className="text-white">No video URL</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black">
      {/* Close button */}
      <View className="absolute top-14 left-4 z-10">
        <Pressable
          onPress={() => router.back()}
          className="bg-black/60 w-10 h-10 rounded-full items-center justify-center"
        >
          <Ionicons name="close" size={24} color="white" />
        </Pressable>
      </View>

      <WebView
        source={{ uri: url }}
        style={{ flex: 1 }}
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        startInLoadingState
        renderLoading={() => (
          <View className="absolute inset-0 items-center justify-center bg-black">
            <ActivityIndicator size="large" color="white" />
          </View>
        )}
      />
    </View>
  );
}
