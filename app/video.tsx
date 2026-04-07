import { View, Pressable, Text } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useVideoPlayer, VideoView } from "expo-video";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FONT, FONT_FAMILY } from "@/src/theme";

export default function VideoScreen() {
  const { url } = useLocalSearchParams<{ url: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const player = useVideoPlayer(url || null, (p) => {
    p.loop = true;
    p.play();
  });

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
      <VideoView
        player={player}
        style={{ flex: 1 }}
        contentFit="contain"
        nativeControls={false}
      />

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
    </View>
  );
}
