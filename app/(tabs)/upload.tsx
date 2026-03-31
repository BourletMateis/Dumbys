import { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  ActivityIndicator,
  Alert,
  ScrollView,
  Pressable,
} from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as Haptics from "expo-haptics";
import * as VideoThumbnails from "expo-video-thumbnails";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";
import { useMyGroups } from "@/src/features/groups/useMyGroups";
import { useUploadGroupVideo } from "@/src/features/groups/useUploadGroupVideo";
import { useCreateChallenge } from "@/src/features/groups/useChallenges";
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
import { createChallengeSchema } from "@/src/lib/schemas";
import { toast } from "@/src/lib/toast";

type UploadTab = "deposer" | "defi";

export default function UploadScreen() {
  const insets = useSafeAreaInsets();
  const { data: myGroups } = useMyGroups();
  const uploadMutation = useUploadGroupVideo();
  const { weekNumber, year, canUpload } = useTimelineLogic();
  const createChallenge = useCreateChallenge();

  const { tab: tabParam } = useLocalSearchParams<{ tab?: string }>();
  const [activeTab, setActiveTab] = useState<UploadTab>("deposer");

  const [videoUri, setVideoUri] = useState<string | null>(null);
  const [thumbnailUri, setThumbnailUri] = useState<string | null>(null);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Challenge creation
  const [challengeGroupId, setChallengeGroupId] = useState<string | null>(null);
  const [challengeName, setChallengeName] = useState("");
  const [challengeDesc, setChallengeDesc] = useState("");
  const [isCreatingChallenge, setIsCreatingChallenge] = useState(false);
  const [challengeErrors, setChallengeErrors] = useState<{ title?: string }>({});

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
  };

  const handleCreateChallenge = () => {
    const result = createChallengeSchema.safeParse({
      title: challengeName.trim(),
      description: challengeDesc.trim() || undefined,
    });
    if (!result.success) {
      setChallengeErrors({ title: result.error.flatten().fieldErrors.title?.[0] });
      return;
    }
    if (!challengeGroupId) return;
    setChallengeErrors({});
    setIsCreatingChallenge(true);
    createChallenge.mutate(
      {
        groupId: challengeGroupId,
        title: challengeName.trim(),
        description: challengeDesc.trim() || undefined,
      },
      {
        onSuccess: () => {
          setChallengeName("");
          setChallengeDesc("");
          setChallengeGroupId(null);
          toast.success("Accède-y depuis la page du groupe.", "Défi créé !");
        },
        onError: (err) => toast.error(err.message),
        onSettled: () => setIsCreatingChallenge(false),
      },
    );
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
          toast.success("Ta vidéo a été envoyée.");
          resetForm();
        },
        onError: (err) => toast.error(err.message),
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
        {/* ─── Tab Control ───────────────────────────────────── */}
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
              { key: "deposer" as const, label: "Poster" },
              { key: "defi" as const, label: "Défi" },
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

        {activeTab === "deposer" ? (
          <>
            {/* ─── Upload Zone ──────────────────────────────────── */}
            <View style={{ paddingHorizontal: 20, marginBottom: 24 }}>
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
                      style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, borderRadius: 18 }}
                      contentFit="cover"
                    />
                  ) : null}

                  {!videoUri ? (
                    <>
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
                        CLIQUE POUR AJOUTER
                      </Text>
                    </>
                  ) : (
                    <>
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

            {/* ─── Group Selector ───────────────────────────────── */}
            <View style={{ paddingHorizontal: 20, marginBottom: 24 }}>
              <Text style={{ fontSize: FONT.sizes.xs, fontFamily: FONT_FAMILY.bold, color: "#B0B0B0", textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 10 }}>
                POSTER DANS
              </Text>

              {(myGroups ?? []).length === 0 ? (
                <View style={{ alignItems: "center", paddingVertical: 20 }}>
                  <Text style={{ color: "#CCC", fontSize: FONT.sizes.base, fontFamily: FONT_FAMILY.medium, marginBottom: 12 }}>
                    Tu n'as pas encore de groupe
                  </Text>
                  <Pressable
                    onPress={() => router.push("/(tabs)/explorer")}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 6,
                      backgroundColor: PALETTE.sarcelle,
                      paddingHorizontal: 16,
                      paddingVertical: 10,
                      borderRadius: RADIUS.full,
                    }}
                  >
                    <Ionicons name="compass-outline" size={16} color="#FFF" />
                    <Text style={{ fontSize: FONT.sizes.sm, fontFamily: FONT_FAMILY.bold, color: "#FFF" }}>
                      Découvrir des groupes
                    </Text>
                  </Pressable>
                </View>
              ) : (
                <View style={{ gap: 6 }}>
                  {(myGroups ?? []).map((group) => (
                    <Pressable
                      key={group.id}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setSelectedGroupId(group.id);
                      }}
                      style={({ pressed }) => ({
                        opacity: pressed ? 0.7 : 1,
                        flexDirection: "row",
                        alignItems: "center",
                        backgroundColor: selectedGroupId === group.id ? `${PALETTE.sarcelle}10` : "#F8F8FA",
                        borderRadius: RADIUS.lg,
                        padding: 12,
                        gap: 12,
                        borderWidth: 1.5,
                        borderColor: selectedGroupId === group.id ? PALETTE.sarcelle : "rgba(0,0,0,0.04)",
                      })}
                    >
                      <Avatar url={group.cover_url} username={group.name} size={40} />
                      <View style={{ flex: 1 }}>
                        <Text
                          numberOfLines={1}
                          style={{
                            fontSize: FONT.sizes.base,
                            fontFamily: FONT_FAMILY.semibold,
                            color: "#1A1A1A",
                          }}
                        >
                          {group.name}
                        </Text>
                        <Text style={{ fontSize: FONT.sizes.xs, fontFamily: FONT_FAMILY.regular, color: "#BBB", marginTop: 1 }}>
                          {group.member_count} membre{group.member_count > 1 ? "s" : ""}
                        </Text>
                      </View>
                      {selectedGroupId === group.id && (
                        <Ionicons name="checkmark-circle" size={22} color={PALETTE.sarcelle} />
                      )}
                    </Pressable>
                  ))}
                </View>
              )}
            </View>

            {/* ─── Publish Button ───────────────────────────────── */}
            {videoUri && selectedGroupId && (
              <View style={{ paddingHorizontal: 20 }}>
                <AnimatedPressable
                  onPress={handlePublish}
                  disabled={isUploading}
                  style={{
                    backgroundColor: PALETTE.fuchsia,
                    paddingVertical: 16,
                    borderRadius: RADIUS.lg,
                    alignItems: "center",
                    flexDirection: "row",
                    justifyContent: "center",
                    gap: 8,
                  }}
                >
                  {isUploading ? (
                    <>
                      <ActivityIndicator color="#FFFFFF" />
                      <Text style={{ color: "#FFFFFF", fontSize: FONT.sizes.lg, fontFamily: FONT_FAMILY.bold }}>
                        Upload en cours...
                      </Text>
                    </>
                  ) : (
                    <>
                      <Ionicons name="arrow-up-circle" size={22} color="#FFFFFF" />
                      <Text style={{ color: "#FFFFFF", fontSize: FONT.sizes.lg, fontFamily: FONT_FAMILY.bold }}>
                        Publier
                      </Text>
                    </>
                  )}
                </AnimatedPressable>
              </View>
            )}
          </>
        ) : (
          /* ─── Créer un Défi ──────────────────────────────────── */
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
                  fontSize: FONT.sizes["2xl"],
                  fontFamily: FONT_FAMILY.bold,
                  color: "#1A1A1A",
                  marginBottom: 20,
                }}
              >
                Nouveau défi
              </Text>

              {/* Group selector */}
              <Text style={{ fontSize: FONT.sizes.xs, fontFamily: FONT_FAMILY.bold, color: "#B0B0B0", textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 10 }}>
                GROUPE *
              </Text>
              {(myGroups ?? []).length === 0 ? (
                <View style={{ alignItems: "center", paddingVertical: 16 }}>
                  <Text style={{ color: "#CCC", fontSize: FONT.sizes.base, fontFamily: FONT_FAMILY.medium, marginBottom: 12 }}>
                    Rejoins un groupe d'abord
                  </Text>
                  <Pressable
                    onPress={() => router.push("/(tabs)/explorer")}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 6,
                      backgroundColor: PALETTE.sarcelle,
                      paddingHorizontal: 16,
                      paddingVertical: 10,
                      borderRadius: RADIUS.full,
                    }}
                  >
                    <Ionicons name="compass-outline" size={16} color="#FFF" />
                    <Text style={{ fontSize: FONT.sizes.sm, fontFamily: FONT_FAMILY.bold, color: "#FFF" }}>
                      Découvrir des groupes
                    </Text>
                  </Pressable>
                </View>
              ) : (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, marginBottom: 20 }}>
                  {(myGroups ?? []).map((g) => (
                    <Pressable
                      key={g.id}
                      onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setChallengeGroupId(g.id); }}
                      style={{
                        paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
                        backgroundColor: challengeGroupId === g.id ? PALETTE.sarcelle : "#F2F2F2",
                        borderWidth: challengeGroupId === g.id ? 0 : 1, borderColor: "#E0E0E0",
                      }}
                    >
                      <Text style={{ fontSize: FONT.sizes.sm, fontFamily: FONT_FAMILY.semibold, color: challengeGroupId === g.id ? "#FFFFFF" : "#666" }} numberOfLines={1}>
                        {g.name}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              )}

              {/* Challenge name */}
              <Text style={{ fontSize: FONT.sizes.xs, fontFamily: FONT_FAMILY.bold, color: "#B0B0B0", textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 10 }}>
                NOM DU DÉFI *
              </Text>
              <TextInput
                value={challengeName}
                onChangeText={(t) => { setChallengeName(t); setChallengeErrors({}); }}
                placeholder="Ex: Meilleur trick de la semaine"
                placeholderTextColor="#CCCCCC"
                style={{ backgroundColor: "#F8F8FA", borderRadius: 14, paddingHorizontal: 18, paddingVertical: 14, fontSize: FONT.sizes.lg, fontFamily: FONT_FAMILY.regular, color: "#1A1A1A", borderWidth: 1, borderColor: challengeErrors.title ? "#F43F5E" : "rgba(0,0,0,0.05)", marginBottom: challengeErrors.title ? 4 : 16 }}
                maxLength={100}
              />
              {challengeErrors.title ? (
                <Text style={{ color: "#F43F5E", fontSize: 12, fontFamily: FONT_FAMILY.medium, marginBottom: 12, marginLeft: 2 }}>
                  {challengeErrors.title}
                </Text>
              ) : null}

              {/* Description */}
              <Text style={{ fontSize: FONT.sizes.xs, fontFamily: FONT_FAMILY.bold, color: "#B0B0B0", textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 10 }}>
                DESCRIPTION (optionnel)
              </Text>
              <TextInput
                value={challengeDesc}
                onChangeText={setChallengeDesc}
                placeholder="Décris le défi..."
                placeholderTextColor="#CCCCCC"
                multiline
                numberOfLines={2}
                style={{ backgroundColor: "#F8F8FA", borderRadius: 14, paddingHorizontal: 18, paddingVertical: 14, fontSize: FONT.sizes.base, fontFamily: FONT_FAMILY.regular, color: "#1A1A1A", borderWidth: 1, borderColor: "rgba(0,0,0,0.05)", marginBottom: 24, minHeight: 72, textAlignVertical: "top" }}
                maxLength={300}
              />

              {/* Submit */}
              <AnimatedPressable
                onPress={handleCreateChallenge}
                disabled={!challengeName.trim() || !challengeGroupId || isCreatingChallenge}
                style={{ backgroundColor: challengeName.trim() && challengeGroupId ? PALETTE.fuchsia : "#DDD", paddingVertical: 16, borderRadius: 14, alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 8 }}
              >
                {isCreatingChallenge ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Ionicons name="flag-outline" size={20} color="#FFFFFF" />
                )}
                <Text style={{ color: "#FFFFFF", fontSize: FONT.sizes.lg, fontFamily: FONT_FAMILY.bold }}>
                  {isCreatingChallenge ? "Création..." : "Créer le défi"}
                </Text>
              </AnimatedPressable>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
