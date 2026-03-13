import { View, ActivityIndicator, Pressable, Text } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { WebView } from "react-native-webview";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PALETTE, FONT, FONT_FAMILY } from "@/src/theme";

export default function VideoScreen() {
  const { url } = useLocalSearchParams<{ url: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  if (!url) {
    return (
      <View style={{ flex: 1, backgroundColor: "#000", alignItems: "center", justifyContent: "center" }}>
        <Ionicons name="videocam-off-outline" size={48} color="#666" />
        <Text style={{ color: "#999", fontSize: FONT.sizes.lg, fontFamily: FONT_FAMILY.semibold, marginTop: 12 }}>
          Pas de vidéo
        </Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#000" }}>
      {/* Close button */}
      <View style={{ position: "absolute", top: insets.top + 8, left: 16, zIndex: 10 }}>
        <Pressable
          onPress={() => router.back()}
          style={{
            width: 42,
            height: 42,
            borderRadius: 21,
            backgroundColor: "rgba(0,0,0,0.5)",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons name="close" size={24} color="#FFFFFF" />
        </Pressable>
      </View>

      <WebView
        source={{ uri: url }}
        style={{ flex: 1 }}
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        startInLoadingState
        renderLoading={() => (
          <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, alignItems: "center", justifyContent: "center", backgroundColor: "#000" }}>
            <ActivityIndicator size="large" color={PALETTE.sarcelle} />
          </View>
        )}
      />
    </View>
  );
}
