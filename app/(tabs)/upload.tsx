import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  ActivityIndicator,
  Alert,
  ScrollView,
  Pressable,
  Dimensions,
} from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as Haptics from "expo-haptics";
import * as VideoThumbnails from "expo-video-thumbnails";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useMyGroups, type GroupWithRole } from "@/src/features/groups/useMyGroups";
import { useUploadGroupVideo } from "@/src/features/groups/useUploadGroupVideo";
import { useTimelineLogic } from "@/src/hooks/useTimelineLogic";
import { AnimatedPressable } from "@/src/components/ui/AnimatedPressable";
import { Avatar } from "@/src/components/ui/Avatar";
import {
  PALETTE,
  RADIUS,
  FONT,
  FONT_FAMILY,
  SPACING,
} from "@/src/theme";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

type UploadTab = "enregistrer" | "deposer" | "tournoi";
type TournamentVisibility = "public" | "private";

// ─── Fake group avatars for demo (matches template) ──────────────
const DEMO_GROUPS = [
  { id: "create", name: "Créer", isCreate: true },
  { id: "1", name: "La Team", avatar: null, hasBadge: true },
  { id: "2", name: "Skate Crew", avatar: null, hasBadge: false },
  { id: "3", name: "Besties", avatar: null, hasBadge: false },
  { id: "4", name: "Voisins", avatar: null, hasBadge: false },
];

export default function UploadScreen() {
  const insets = useSafeAreaInsets();
  const { data: myGroups } = useMyGroups();
  const uploadMutation = useUploadGroupVideo();
  const { weekNumber, year, canUpload } = useTimelineLogic();

  const [activeTab, setActiveTab] = useState<UploadTab>("deposer");
  const [videoUri, setVideoUri] = useState<string | null>(null);
  const [thumbnailUri, setThumbnailUri] = useState<string | null>(null);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [tournamentVisibility, setTournamentVisibility] = useState<TournamentVisibility>("public");
  const [challengeName, setChallengeName] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const privateGroups: GroupWithRole[] = (myGroups ?? []).filter((g) => !g.is_public);

  const pickMedia = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Permission requise", "Autorise l'accès à ta galerie.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["videos", "images"],
      quality: 0.8,
      videoMaxDuration: 60,
    });
    if (result.canceled || !result.assets[0]) return;
    const uri = result.assets[0].uri;
    setVideoUri(uri);
    // Try to generate thumbnail for videos
    try {
      const thumb = await VideoThumbnails.getThumbnailAsync(uri, { time: 1000, quality: 0.5 });
      setThumbnailUri(thumb.uri);
    } catch {
      setThumbnailUri(null);
    }
  };

  const resetForm = () => {
    setVideoUri(null);
    setThumbnailUri(null);
    setSelectedGroupId(null);
    setChallengeName("");
  };

  const handlePublish = () => {
    if (!videoUri || !selectedGroupId) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setIsUploading(true);
    uploadMutation.mutate(
      { videoUri, groupId: selectedGroupId, weekNumber, year },
      {
        onSuccess: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          Alert.alert("Publié !", "Ta vidéo a été envoyée.", [{ text: "OK", onPress: resetForm }]);
        },
        onError: (err) => Alert.alert("Erreur", err.message),
        onSettled: () => setIsUploading(false),
      },
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ─── Segmented Tab Control ──────────────────────────────── */}
        <View
          style={{
            paddingTop: insets.top + 12,
            paddingHorizontal: 20,
            paddingBottom: 16,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              backgroundColor: "#F2F2F2",
              borderRadius: 25,
              padding: 4,
            }}
          >
            {([
              { key: "enregistrer" as const, label: "Enregistrer" },
              { key: "deposer" as const, label: "Déposer" },
              { key: "tournoi" as const, label: "Tournoi" },
            ]).map(({ key, label }) => (
              <Pressable
                key={key}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setActiveTab(key);
                }}
                style={{
                  flex: 1,
                  paddingVertical: 10,
                  alignItems: "center",
                  borderRadius: 22,
                  backgroundColor: activeTab === key ? "#FFFFFF" : "transparent",
                  ...(activeTab === key
                    ? {
                        shadowColor: "#000",
                        shadowOffset: { width: 0, height: 1 },
                        shadowOpacity: 0.08,
                        shadowRadius: 4,
                        elevation: 2,
                      }
                    : {}),
                }}
              >
                <Text
                  style={{
                    fontSize: FONT.sizes.base,
                    fontFamily: activeTab === key ? FONT_FAMILY.semibold : FONT_FAMILY.medium,
                    color: activeTab === key ? PALETTE.sarcelle : "#999999",
                  }}
                >
                  {label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* ─── Upload Zone (Dashed Border) ────────────────────────── */}
        <View style={{ paddingHorizontal: 20, marginBottom: 28 }}>
          <AnimatedPressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              pickMedia();
            }}
          >
            <View
              style={{
                borderWidth: 2.5,
                borderColor: "#D8D8D8",
                borderStyle: "dashed",
                borderRadius: 20,
                paddingVertical: 44,
                paddingHorizontal: 20,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: videoUri ? "#F8F8F8" : "#FFFFFF",
                overflow: "hidden",
              }}
            >
              {videoUri && thumbnailUri ? (
                <Image
                  source={{ uri: thumbnailUri }}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    borderRadius: 18,
                  }}
                  contentFit="cover"
                />
              ) : null}

              {!videoUri ? (
                <>
                  {/* Teal circle with upload icon */}
                  <View
                    style={{
                      width: 64,
                      height: 64,
                      borderRadius: 32,
                      backgroundColor: PALETTE.sarcelle,
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: 16,
                    }}
                  >
                    <Ionicons name="cloud-upload-outline" size={30} color="#FFFFFF" />
                  </View>
                  <Text
                    style={{
                      fontSize: FONT.sizes["2xl"],
                      fontFamily: FONT_FAMILY.bold,
                      color: "#1A1A1A",
                      marginBottom: 6,
                    }}
                  >
                    Vidéo ou Image
                  </Text>
                  <Text
                    style={{
                      fontSize: FONT.sizes.xs,
                      fontFamily: FONT_FAMILY.semibold,
                      color: "#B0B0B0",
                      textTransform: "uppercase",
                      letterSpacing: 1.2,
                    }}
                  >
                    GLISSE OU CLIQUE POUR AJOUTER
                  </Text>
                </>
              ) : (
                <>
                  {/* Selected state overlay */}
                  {!thumbnailUri && (
                    <View style={{ alignItems: "center" }}>
                      <Ionicons name="checkmark-circle" size={48} color={PALETTE.sarcelle} />
                      <Text style={{ fontSize: FONT.sizes.lg, fontFamily: FONT_FAMILY.semibold, color: "#1A1A1A", marginTop: 8 }}>
                        Média sélectionné
                      </Text>
                      <Pressable onPress={resetForm} style={{ marginTop: 8 }}>
                        <Text style={{ fontSize: FONT.sizes.sm, color: PALETTE.fuchsia, fontFamily: FONT_FAMILY.semibold }}>
                          Changer
                        </Text>
                      </Pressable>
                    </View>
                  )}
                  {thumbnailUri && (
                    <View
                      style={{
                        position: "absolute",
                        bottom: 12,
                        right: 12,
                        backgroundColor: "rgba(0,0,0,0.5)",
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: 12,
                      }}
                    >
                      <Pressable onPress={resetForm}>
                        <Text style={{ color: "#FFF", fontSize: FONT.sizes.sm, fontFamily: FONT_FAMILY.semibold }}>
                          Changer
                        </Text>
                      </Pressable>
                    </View>
                  )}
                </>
              )}
            </View>
          </AnimatedPressable>
        </View>

        {/* ─── Groupes Privés ─────────────────────────────────────── */}
        <View style={{ paddingHorizontal: 20, marginBottom: 24 }}>
          {/* Header row */}
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <Text style={{ fontSize: FONT.sizes["2xl"], fontFamily: FONT_FAMILY.extrabold, color: "#1A1A1A" }}>
              {"Groupes Privés 🤝"}
            </Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <Text style={{ fontSize: FONT.sizes.sm, fontFamily: FONT_FAMILY.bold, color: PALETTE.sarcelle, textTransform: "uppercase" }}>
                NOUVEAU
              </Text>
              <View
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 10,
                  borderWidth: 1.5,
                  borderColor: PALETTE.sarcelle,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons name="add" size={12} color={PALETTE.sarcelle} />
              </View>
            </View>
          </View>

          {/* Horizontal scroll of group avatars */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 16, paddingRight: 8 }}
          >
            {/* Create button */}
            <AnimatedPressable
              onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
              style={{ alignItems: "center", width: 68 }}
            >
              <View
                style={{
                  width: 60,
                  height: 60,
                  borderRadius: 30,
                  backgroundColor: "#F2F2F2",
                  alignItems: "center",
                  justifyContent: "center",
                  borderWidth: 1.5,
                  borderColor: "#E0E0E0",
                  borderStyle: "dashed",
                }}
              >
                <Ionicons name="people-outline" size={24} color={PALETTE.sarcelle} />
              </View>
              <Text style={{ fontSize: FONT.sizes.xs, fontFamily: FONT_FAMILY.medium, color: "#666", marginTop: 6, textAlign: "center" }}>
                Créer
              </Text>
            </AnimatedPressable>

            {/* Private groups */}
            {privateGroups.length > 0
              ? privateGroups.map((group) => (
                  <AnimatedPressable
                    key={group.id}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                      setSelectedGroupId(group.id);
                    }}
                    style={{ alignItems: "center", width: 68 }}
                  >
                    <View style={{ position: "relative" }}>
                      <Avatar url={group.cover_url} username={group.name} size={60} />
                      {selectedGroupId === group.id && (
                        <View
                          style={{
                            position: "absolute",
                            bottom: -2,
                            right: -2,
                            width: 20,
                            height: 20,
                            borderRadius: 10,
                            backgroundColor: PALETTE.sarcelle,
                            alignItems: "center",
                            justifyContent: "center",
                            borderWidth: 2,
                            borderColor: "#FFFFFF",
                          }}
                        >
                          <Ionicons name="checkmark" size={12} color="#FFF" />
                        </View>
                      )}
                      {/* Yellow badge dot */}
                      <View
                        style={{
                          position: "absolute",
                          top: 0,
                          right: 0,
                          width: 14,
                          height: 14,
                          borderRadius: 7,
                          backgroundColor: PALETTE.jaune,
                          borderWidth: 2,
                          borderColor: "#FFFFFF",
                        }}
                      />
                    </View>
                    <Text
                      style={{
                        fontSize: FONT.sizes.xs,
                        fontFamily: FONT_FAMILY.medium,
                        color: "#333",
                        marginTop: 6,
                        textAlign: "center",
                      }}
                      numberOfLines={1}
                    >
                      {group.name}
                    </Text>
                  </AnimatedPressable>
                ))
              : // Demo groups when no real groups exist
                DEMO_GROUPS.filter((g) => !g.isCreate).map((group) => (
                  <View key={group.id} style={{ alignItems: "center", width: 68 }}>
                    <View style={{ position: "relative" }}>
                      <View
                        style={{
                          width: 60,
                          height: 60,
                          borderRadius: 30,
                          backgroundColor: "#E8E8E8",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Ionicons name="person" size={26} color="#AAA" />
                      </View>
                      {group.hasBadge && (
                        <View
                          style={{
                            position: "absolute",
                            top: 0,
                            right: 0,
                            width: 14,
                            height: 14,
                            borderRadius: 7,
                            backgroundColor: PALETTE.jaune,
                            borderWidth: 2,
                            borderColor: "#FFFFFF",
                          }}
                        />
                      )}
                    </View>
                    <Text
                      style={{
                        fontSize: FONT.sizes.xs,
                        fontFamily: FONT_FAMILY.medium,
                        color: "#333",
                        marginTop: 6,
                        textAlign: "center",
                      }}
                      numberOfLines={1}
                    >
                      {group.name}
                    </Text>
                  </View>
                ))}
          </ScrollView>
        </View>

        {/* ─── Créer un Tournoi ───────────────────────────────────── */}
        <View style={{ paddingHorizontal: 20 }}>
          <View
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: 20,
              padding: 24,
              borderWidth: 1,
              borderColor: "rgba(0,0,0,0.06)",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.04,
              shadowRadius: 8,
              elevation: 2,
            }}
          >
            <Text
              style={{
                fontSize: FONT.sizes["3xl"],
                fontFamily: FONT_FAMILY.extrabold,
                color: "#1A1A1A",
                marginBottom: 20,
              }}
            >
              {"Créer un Tournoi 🏆"}
            </Text>

            {/* Public / Privé toggle */}
            <View style={{ flexDirection: "row", gap: 12, marginBottom: 24 }}>
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setTournamentVisibility("public");
                }}
                style={{
                  flex: 1,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  paddingVertical: 12,
                  borderRadius: 25,
                  backgroundColor: tournamentVisibility === "public" ? PALETTE.sarcelle : "transparent",
                  borderWidth: tournamentVisibility === "public" ? 0 : 1.5,
                  borderColor: "#E0E0E0",
                }}
              >
                <Ionicons
                  name="globe-outline"
                  size={16}
                  color={tournamentVisibility === "public" ? "#FFFFFF" : "#999"}
                />
                <Text
                  style={{
                    fontSize: FONT.sizes.base,
                    fontFamily: FONT_FAMILY.bold,
                    color: tournamentVisibility === "public" ? "#FFFFFF" : "#999",
                  }}
                >
                  Public
                </Text>
              </Pressable>

              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setTournamentVisibility("private");
                }}
                style={{
                  flex: 1,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  paddingVertical: 12,
                  borderRadius: 25,
                  backgroundColor: tournamentVisibility === "private" ? PALETTE.sarcelle : "transparent",
                  borderWidth: tournamentVisibility === "private" ? 0 : 1.5,
                  borderColor: "#E0E0E0",
                }}
              >
                <Ionicons
                  name="lock-closed-outline"
                  size={16}
                  color={tournamentVisibility === "private" ? "#FFFFFF" : "#999"}
                />
                <Text
                  style={{
                    fontSize: FONT.sizes.base,
                    fontFamily: FONT_FAMILY.bold,
                    color: tournamentVisibility === "private" ? "#FFFFFF" : "#999",
                  }}
                >
                  Privé
                </Text>
              </Pressable>
            </View>

            {/* Nom du challenge */}
            <Text
              style={{
                fontSize: FONT.sizes.xs,
                fontFamily: FONT_FAMILY.bold,
                color: "#B0B0B0",
                textTransform: "uppercase",
                letterSpacing: 1.2,
                marginBottom: 10,
              }}
            >
              NOM DU CHALLENGE
            </Text>
            <TextInput
              value={challengeName}
              onChangeText={setChallengeName}
              placeholder="Ex: Kickflip Masters ✏️"
              placeholderTextColor="#CCCCCC"
              style={{
                backgroundColor: "#F8F8FA",
                borderRadius: 14,
                paddingHorizontal: 18,
                paddingVertical: 14,
                fontSize: FONT.sizes.lg,
                fontFamily: FONT_FAMILY.regular,
                color: "#1A1A1A",
                borderWidth: 1,
                borderColor: "rgba(0,0,0,0.05)",
              }}
              maxLength={60}
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
