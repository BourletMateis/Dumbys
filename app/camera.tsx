import { useRef, useState, useEffect } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Dimensions,
  Alert,
} from "react-native";
import { CameraView, useCameraPermissions, useMicrophonePermissions } from "expo-camera";
import { useIsFocused } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import * as VideoThumbnails from "expo-video-thumbnails";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PALETTE, FONT_FAMILY, FONT, RADIUS } from "@/src/theme";

const { width: W } = Dimensions.get("window");
const DURATIONS = [15, 30, 60];

export default function CameraScreen() {
  const insets = useSafeAreaInsets();
  const [camPerm, requestCamPerm] = useCameraPermissions();
  const [micPerm, requestMicPerm] = useMicrophonePermissions();
  const cameraRef = useRef<CameraView>(null);

  const isFocused = useIsFocused();
  const [facing, setFacing] = useState<"front" | "back">("back");
  const [torchOn, setTorchOn] = useState(false);
  const [selectedDuration, setSelectedDuration] = useState(30);
  const [isRecording, setIsRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    (async () => {
      if (!camPerm?.granted) await requestCamPerm();
      if (!micPerm?.granted) await requestMicPerm();
    })();
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startTimer = () => {
    setElapsed(0);
    timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const navigateToPost = async (uri: string) => {
    let thumbUri = "";
    try {
      const thumb = await VideoThumbnails.getThumbnailAsync(uri, { time: 500, quality: 0.6 });
      thumbUri = thumb.uri;
    } catch {}
    router.push({ pathname: "/post" as any, params: { videoUri: uri, thumbnailUri: thumbUri } });
  };

  const handleRecord = async () => {
    if (isRecording) {
      cameraRef.current?.stopRecording();
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setIsRecording(true);
    startTimer();
    try {
      const result = await cameraRef.current?.recordAsync({ maxDuration: selectedDuration });
      stopTimer();
      setIsRecording(false);
      if (!result?.uri) return;
      await navigateToPost(result.uri);
    } catch {
      stopTimer();
      setIsRecording(false);
    }
  };

  const pickFromGallery = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Permission requise", "Autorise l'accès à ta galerie.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["videos"],
      quality: 0.8,
      videoMaxDuration: 60,
    });
    if (result.canceled || !result.assets[0]) return;
    await navigateToPost(result.assets[0].uri);
  };

  const formatTime = (s: number) =>
    `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  const progress = isRecording ? (elapsed / selectedDuration) * W : 0;

  // ── Permission denied ─────────────────────────────────────────
  if (camPerm && !camPerm.granted) {
    return (
      <View style={{ flex: 1, backgroundColor: "#080F0F", alignItems: "center", justifyContent: "center", gap: 20 }}>
        <Ionicons name="camera-outline" size={56} color={PALETTE.sarcelle} />
        <Text style={{ color: "#FFF", fontFamily: FONT_FAMILY.extrabold, fontSize: FONT.sizes["2xl"], textAlign: "center" }}>
          Accès caméra requis
        </Text>
        <Pressable
          onPress={requestCamPerm}
          style={{ backgroundColor: PALETTE.sarcelle, paddingHorizontal: 28, paddingVertical: 14, borderRadius: RADIUS.full }}
        >
          <Text style={{ color: "#FFF", fontFamily: FONT_FAMILY.bold, fontSize: FONT.sizes.lg }}>Autoriser</Text>
        </Pressable>
        <Pressable onPress={() => router.back()}>
          <Text style={{ color: "rgba(255,255,255,0.4)", fontFamily: FONT_FAMILY.medium, fontSize: FONT.sizes.base }}>
            Annuler
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#080F0F" }}>
      {/* Camera preview — only active when screen is focused */}
      {isFocused && (
        <CameraView
          ref={cameraRef}
          style={StyleSheet.absoluteFill}
          facing={facing}
          enableTorch={torchOn}
          mode="video"
        />
      )}

      {/* Progress bar at top */}
      {isRecording && (
        <View style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, zIndex: 30, backgroundColor: "rgba(63,208,201,0.2)" }}>
          <View style={{ width: progress, height: 3, backgroundColor: PALETTE.sarcelle }} />
        </View>
      )}

      {/* ── TOP OVERLAY ─────────────────────────────────────────── */}
      <View
        style={{
          position: "absolute",
          top: insets.top + 10,
          left: 20,
          right: 20,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          zIndex: 20,
        }}
      >
        {/* Close */}
        <Pressable
          onPress={() => router.back()}
          style={styles.iconBtn}
        >
          <Ionicons name="close" size={22} color="#FFF" />
        </Pressable>

        {/* Timer */}
        {isRecording ? (
          <View style={{
            paddingHorizontal: 16, paddingVertical: 8, borderRadius: RADIUS.full,
            backgroundColor: "rgba(0,0,0,0.55)",
            borderWidth: 1, borderColor: `${PALETTE.fuchsia}66`,
          }}>
            <Text style={{ color: PALETTE.fuchsia, fontFamily: FONT_FAMILY.bold, fontSize: FONT.sizes.lg }}>
              {formatTime(elapsed)}
            </Text>
          </View>
        ) : (
          <View />
        )}

        {/* Flash + Flip */}
        <View style={{ flexDirection: "row", gap: 10 }}>
          <Pressable
            onPress={() => setTorchOn((v) => !v)}
            style={[styles.iconBtn, torchOn && { backgroundColor: PALETTE.jaune }]}
          >
            <Ionicons
              name={torchOn ? "flash" : "flash-off"}
              size={20}
              color={torchOn ? "#000" : "#FFF"}
            />
          </Pressable>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setFacing(facing === "back" ? "front" : "back");
            }}
            style={styles.iconBtn}
          >
            <Ionicons name="camera-reverse-outline" size={22} color="#FFF" />
          </Pressable>
        </View>
      </View>

      {/* ── DURATION SELECTOR ───────────────────────────────────── */}
      {!isRecording && (
        <View
          style={{
            position: "absolute",
            bottom: insets.bottom + 118,
            left: 0,
            right: 0,
            flexDirection: "row",
            justifyContent: "center",
            gap: 10,
            zIndex: 20,
          }}
        >
          {DURATIONS.map((d) => (
            <Pressable
              key={d}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setSelectedDuration(d);
              }}
              style={{
                paddingHorizontal: 20,
                paddingVertical: 8,
                borderRadius: RADIUS.full,
                backgroundColor: selectedDuration === d ? PALETTE.sarcelle : "rgba(0,0,0,0.45)",
                borderWidth: 1.5,
                borderColor: selectedDuration === d ? PALETTE.sarcelle : "rgba(255,255,255,0.12)",
              }}
            >
              <Text style={{
                color: selectedDuration === d ? "#080F0F" : "#FFF",
                fontFamily: FONT_FAMILY.bold,
                fontSize: FONT.sizes.sm,
              }}>
                {d}s
              </Text>
            </Pressable>
          ))}
        </View>
      )}

      {/* ── BOTTOM CONTROLS ─────────────────────────────────────── */}
      <View
        style={{
          position: "absolute",
          bottom: insets.bottom + 28,
          left: 0,
          right: 0,
          paddingHorizontal: 48,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          zIndex: 20,
        }}
      >
        {/* Gallery button */}
        <Pressable onPress={pickFromGallery} style={styles.sideBtn}>
          <Ionicons name="images-outline" size={26} color="#FFF" />
          <Text style={{ color: "rgba(255,255,255,0.6)", fontFamily: FONT_FAMILY.medium, fontSize: FONT.sizes.xs, marginTop: 4 }}>
            Galerie
          </Text>
        </Pressable>

        {/* Record button */}
        <Pressable onPress={handleRecord}>
          {isRecording ? (
            // Stop button
            <View style={styles.recordRingRed}>
              <View style={styles.stopSquare} />
            </View>
          ) : (
            // Record button with gradient
            <View style={styles.recordRing}>
              <LinearGradient
                colors={[PALETTE.fuchsia, "#FF6B3D"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.recordInner}
              />
            </View>
          )}
        </Pressable>

        {/* Flip shortcut */}
        <View style={[styles.sideBtn, { opacity: 0 }]} pointerEvents="none" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  sideBtn: {
    alignItems: "center",
    width: 58,
    height: 58,
    borderRadius: 18,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.1)",
  },
  recordRing: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "#FFF",
  },
  recordInner: {
    width: 62,
    height: 62,
    borderRadius: 31,
  },
  recordRingRed: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255,45,125,0.1)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: PALETTE.fuchsia,
  },
  stopSquare: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: PALETTE.fuchsia,
  },
});
