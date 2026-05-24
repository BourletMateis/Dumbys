import { useState, useEffect, useRef } from "react";
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
import { useLocalSearchParams } from "expo-router";
import { useMyGroups, type GroupWithRole } from "@/src/features/groups/useMyGroups";
import { useUploadGroupVideo } from "@/src/features/groups/useUploadGroupVideo";
import { useCreateGroup } from "@/src/features/groups/useGroupActions";
import { useCreateGroupTournament } from "@/src/features/groups/useGroupTournaments";
import { useTimelineLogic } from "@/src/hooks/useTimelineLogic";
import { AnimatedPressable } from "@/src/components/ui/AnimatedPressable";
import { Avatar } from "@/src/components/ui/Avatar";
import { BottomSheet } from "@/src/components/ui/BottomSheet";
import {
  PALETTE,
  RADIUS,
  FONT,
  FONT_FAMILY,
  SPACING,
} from "@/src/theme";
import { useTheme } from "@/src/providers/ThemeProvider";

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
  const { colors, isDark } = useTheme();
  const { data: myGroups } = useMyGroups();
  const uploadMutation = useUploadGroupVideo();
  const { weekNumber, year, canUpload } = useTimelineLogic();

  const createGroup = useCreateGroup();
  const createTournament = useCreateGroupTournament();

  const { tab: tabParam } = useLocalSearchParams<{ tab?: string }>();
  const [activeTab, setActiveTab] = useState<UploadTab>(
    tabParam === "enregistrer" ? "enregistrer" : "deposer"
  );
  const cameraLaunchedRef = useRef(false);

  const [videoUri, setVideoUri] = useState<string | null>(null);
  const [thumbnailUri, setThumbnailUri] = useState<string | null>(null);
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);
  const [tournamentVisibility, setTournamentVisibility] = useState<TournamentVisibility>("public");
  const [challengeName, setChallengeName] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  // Create group sheet
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDesc, setNewGroupDesc] = useState("");
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);

  // Tournament creation
  const [tournamentGroupId, setTournamentGroupId] = useState<string | null>(null);
  const [tournamentDesc, setTournamentDesc] = useState("");
  const [tournamentReward, setTournamentReward] = useState("");
  const [isCreatingTournament, setIsCreatingTournament] = useState(false);

  const privateGroups: GroupWithRole[] = (myGroups ?? []).filter((g) => !g.is_public);

  const recordVideo = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Permission requise", "Autorise l'accès à ta caméra.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["videos"],
      quality: 0.8,
      videoMaxDuration: 60,
    });
    if (result.canceled || !result.assets[0]) {
      // User cancelled — go back to deposer
      setActiveTab("deposer");
      return;
    }
    const uri = result.assets[0].uri;
    setVideoUri(uri);
    try {
      const thumb = await VideoThumbnails.getThumbnailAsync(uri, { time: 1000, quality: 0.5 });
      setThumbnailUri(thumb.uri);
    } catch {
      setThumbnailUri(null);
    }
    // After recording, show the deposer UI so user can post
    setActiveTab("deposer");
  };

  // Sync tab when navigating from FAB
  useEffect(() => {
    if (tabParam === "enregistrer") {
      setActiveTab("enregistrer");
      cameraLaunchedRef.current = false;
    }
  }, [tabParam]);

  // Auto-launch camera when on "enregistrer" tab
  useEffect(() => {
    if (activeTab === "enregistrer" && !cameraLaunchedRef.current) {
      cameraLaunchedRef.current = true;
      recordVideo();
    }
  }, [activeTab]);

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

  const toggleGroup = (id: string) => {
    setSelectedGroupIds((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]
    );
  };

  const resetForm = () => {
    setVideoUri(null);
    setThumbnailUri(null);
    setSelectedGroupIds([]);
    setChallengeName("");
  };

  const handleCreateGroup = () => {
    if (!newGroupName.trim()) return;
    setIsCreatingGroup(true);
    createGroup.mutate(
      { name: newGroupName.trim(), description: newGroupDesc.trim() || undefined, isPublic: false },
      {
        onSuccess: () => {
          setShowCreateGroup(false);
          setNewGroupName("");
          setNewGroupDesc("");
          Alert.alert("Groupe créé !", "Ton groupe a été créé avec succès.");
        },
        onError: (err) => Alert.alert("Erreur", err.message),
        onSettled: () => setIsCreatingGroup(false),
      },
    );
  };

  const handleCreateTournament = () => {
    if (!challengeName.trim() || !tournamentGroupId) return;
    setIsCreatingTournament(true);
    createTournament.mutate(
      {
        groupId: tournamentGroupId,
        title: challengeName.trim(),
        description: tournamentDesc.trim() || undefined,
        reward: tournamentReward.trim() || undefined,
      },
      {
        onSuccess: () => {
          setChallengeName("");
          setTournamentDesc("");
          setTournamentReward("");
          setTournamentGroupId(null);
          Alert.alert("Tournoi créé !", "Ton tournoi a été créé. Accède-y depuis la page du groupe.");
        },
        onError: (err) => Alert.alert("Erreur", err.message),
        onSettled: () => setIsCreatingTournament(false),
      },
    );
  };

  const handlePublish = () => {
    if (!videoUri || selectedGroupIds.length === 0) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setIsUploading(true);
    let completed = 0;
    let hasError = false;
    for (const groupId of selectedGroupIds) {
      uploadMutation.mutate(
        { videoUri, groupId, weekNumber, year },
        {
          onSuccess: () => {
            completed++;
            if (completed === selectedGroupIds.length && !hasError) {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              const label = selectedGroupIds.length > 1 ? `${selectedGroupIds.length} groupes` : "1 groupe";
              Alert.alert("Publié !", `Ta vidéo a été envoyée dans ${label}.`, [{ text: "OK", onPress: resetForm }]);
              setIsUploading(false);
            }
          },
          onError: (err) => {
            if (!hasError) {
              hasError = true;
              Alert.alert("Erreur", err.message);
              setIsUploading(false);
            }
          },
        },
      );
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 160 }}
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
              backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "#F2F2F2",
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
                  if (key === "enregistrer") {
                    cameraLaunchedRef.current = false;
                  }
                  setActiveTab(key);
                }}
                style={{
                  flex: 1,
                  paddingVertical: 10,
                  alignItems: "center",
                  borderRadius: 22,
                  backgroundColor: activeTab === key ? (isDark ? "#2C2C2C" : "#FFFFFF") : "transparent",
                  ...(activeTab === key
                    ? {
                        shadowColor: "#000",
                        shadowOffset: { width: 0, height: 1 },
                        shadowOpacity: isDark ? 0 : 0.08,
                        shadowRadius: 4,
                        elevation: isDark ? 0 : 2,
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
                borderColor: isDark ? "rgba(255,255,255,0.12)" : "#D8D8D8",
                borderStyle: "dashed",
                borderRadius: 20,
                paddingVertical: 44,
                paddingHorizontal: 20,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: videoUri ? colors.surface : colors.bg,
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
                      color: colors.textPrimary,
                      marginBottom: 6,
                    }}
                  >
                    Vidéo ou Image
                  </Text>
                  <Text
                    style={{
                      fontSize: FONT.sizes.xs,
                      fontFamily: FONT_FAMILY.semibold,
                      color: colors.textTertiary,
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
                      <Text style={{ fontSize: FONT.sizes.lg, fontFamily: FONT_FAMILY.semibold, color: colors.textPrimary, marginTop: 8 }}>
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
            <Text style={{ fontSize: FONT.sizes["2xl"], fontFamily: FONT_FAMILY.extrabold, color: colors.textPrimary }}>
              {"Groupes Privés"}
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
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setShowCreateGroup(true); }}
              style={{ alignItems: "center", width: 68 }}
            >
              <View
                style={{
                  width: 60,
                  height: 60,
                  borderRadius: 30,
                  backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "#F2F2F2",
                  alignItems: "center",
                  justifyContent: "center",
                  borderWidth: 1.5,
                  borderColor: isDark ? "rgba(255,255,255,0.1)" : "#E0E0E0",
                  borderStyle: "dashed",
                }}
              >
                <Ionicons name="people-outline" size={24} color={PALETTE.sarcelle} />
              </View>
              <Text style={{ fontSize: FONT.sizes.xs, fontFamily: FONT_FAMILY.medium, color: colors.textSecondary, marginTop: 6, textAlign: "center" }}>
                Créer
              </Text>
            </AnimatedPressable>

            {/* Private groups */}
            {privateGroups.length > 0
              ? privateGroups.map((group) => {
                  const isSelected = selectedGroupIds.includes(group.id);
                  return (
                    <AnimatedPressable
                      key={group.id}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                        toggleGroup(group.id);
                      }}
                      style={{ alignItems: "center", width: 68 }}
                    >
                      <View style={{ position: "relative" }}>
                        <View
                          style={{
                            borderRadius: 30,
                            borderWidth: isSelected ? 2.5 : 0,
                            borderColor: isSelected ? PALETTE.sarcelle : "transparent",
                          }}
                        >
                          <Avatar url={group.cover_url} username={group.name} size={56} />
                        </View>
                        {isSelected && (
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
                              borderColor: colors.bg,
                            }}
                          >
                            <Ionicons name="checkmark" size={12} color="#FFF" />
                          </View>
                        )}
                      </View>
                      <Text
                        style={{
                          fontSize: FONT.sizes.xs,
                          fontFamily: isSelected ? FONT_FAMILY.semibold : FONT_FAMILY.medium,
                          color: isSelected ? PALETTE.sarcelle : colors.textSecondary,
                          marginTop: 6,
                          textAlign: "center",
                        }}
                        numberOfLines={1}
                      >
                        {group.name}
                      </Text>
                    </AnimatedPressable>
                  );
                })
              : // Demo groups when no real groups exist
                DEMO_GROUPS.filter((g) => !g.isCreate).map((group) => (
                  <View key={group.id} style={{ alignItems: "center", width: 68 }}>
                    <View style={{ position: "relative" }}>
                      <View
                        style={{
                          width: 60,
                          height: 60,
                          borderRadius: 30,
                          backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "#E8E8E8",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Ionicons name="person" size={26} color={colors.textTertiary} />
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
                            borderColor: colors.bg,
                          }}
                        />
                      )}
                    </View>
                    <Text
                      style={{
                        fontSize: FONT.sizes.xs,
                        fontFamily: FONT_FAMILY.medium,
                        color: colors.textSecondary,
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

        {/* ─── Bouton Publier ─────────────────────────────────────── */}
        {activeTab !== "tournoi" && (
          <View style={{ paddingHorizontal: 20, marginBottom: 28 }}>
            {selectedGroupIds.length > 0 && (
              <Text style={{ fontSize: FONT.sizes.xs, fontFamily: FONT_FAMILY.medium, color: colors.textTertiary, textAlign: "center", marginBottom: 12 }}>
                {selectedGroupIds.length === 1
                  ? "1 groupe sélectionné"
                  : `${selectedGroupIds.length} groupes sélectionnés`}
              </Text>
            )}
            <AnimatedPressable
              onPress={handlePublish}
              disabled={!videoUri || selectedGroupIds.length === 0 || isUploading}
              style={{
                backgroundColor: videoUri && selectedGroupIds.length > 0 ? PALETTE.fuchsia : (isDark ? "#2C2C2C" : "#DDD"),
                paddingVertical: 16,
                borderRadius: 14,
                alignItems: "center",
                flexDirection: "row",
                justifyContent: "center",
                gap: 8,
              }}
            >
              {isUploading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Ionicons name="cloud-upload-outline" size={20} color="#FFFFFF" />
              )}
              <Text style={{ color: "#FFFFFF", fontSize: FONT.sizes.lg, fontFamily: FONT_FAMILY.bold }}>
                {isUploading ? "Publication…" : "Publier la vidéo"}
              </Text>
            </AnimatedPressable>
          </View>
        )}

        {/* ─── Créer un Tournoi ───────────────────────────────────── */}
        <View style={{ paddingHorizontal: 20 }}>
          <View
            style={{
              backgroundColor: colors.card,
              borderRadius: 20,
              padding: 24,
              borderWidth: 1,
              borderColor: colors.border,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: isDark ? 0 : 0.04,
              shadowRadius: 8,
              elevation: isDark ? 0 : 2,
            }}
          >
            <Text
              style={{
                fontSize: FONT.sizes["3xl"],
                fontFamily: FONT_FAMILY.extrabold,
                color: colors.textPrimary,
                marginBottom: 20,
              }}
            >
              {"Créer un Tournoi"}
            </Text>

            {/* Group selector */}
            <Text style={{ fontSize: FONT.sizes.xs, fontFamily: FONT_FAMILY.bold, color: colors.textTertiary, textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 10 }}>
              GROUPE *
            </Text>
            {(myGroups ?? []).length === 0 ? (
              <Text style={{ color: colors.textMuted, fontSize: FONT.sizes.base, fontFamily: FONT_FAMILY.regular, marginBottom: 16 }}>
                Crée d'abord un groupe ci-dessus.
              </Text>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, marginBottom: 20 }}>
                {(myGroups ?? []).map((g) => (
                  <Pressable
                    key={g.id}
                    onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setTournamentGroupId(g.id); }}
                    style={{
                      paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
                      backgroundColor: tournamentGroupId === g.id ? PALETTE.sarcelle : (isDark ? "rgba(255,255,255,0.06)" : "#F2F2F2"),
                      borderWidth: tournamentGroupId === g.id ? 0 : 1,
                      borderColor: isDark ? "rgba(255,255,255,0.1)" : "#E0E0E0",
                    }}
                  >
                    <Text style={{ fontSize: FONT.sizes.sm, fontFamily: FONT_FAMILY.semibold, color: tournamentGroupId === g.id ? "#FFFFFF" : colors.textSecondary }} numberOfLines={1}>
                      {g.name}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            )}

            <Text style={{ fontSize: FONT.sizes.xs, fontFamily: FONT_FAMILY.bold, color: colors.textTertiary, textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 10 }}>
              NOM DU TOURNOI *
            </Text>
            <TextInput
              value={challengeName}
              onChangeText={setChallengeName}
              placeholder="Ex: Kickflip Masters"
              placeholderTextColor={colors.textMuted}
              style={{ backgroundColor: colors.surface, borderRadius: 14, paddingHorizontal: 18, paddingVertical: 14, fontSize: FONT.sizes.lg, fontFamily: FONT_FAMILY.regular, color: colors.textPrimary, borderWidth: 1, borderColor: colors.border, marginBottom: 16 }}
              maxLength={60}
            />

            <Text style={{ fontSize: FONT.sizes.xs, fontFamily: FONT_FAMILY.bold, color: colors.textTertiary, textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 10 }}>
              RÉCOMPENSE (optionnel)
            </Text>
            <TextInput
              value={tournamentReward}
              onChangeText={setTournamentReward}
              placeholder="Ex: Pizza pour l'équipe"
              placeholderTextColor={colors.textMuted}
              style={{ backgroundColor: colors.surface, borderRadius: 14, paddingHorizontal: 18, paddingVertical: 14, fontSize: FONT.sizes.base, fontFamily: FONT_FAMILY.regular, color: colors.textPrimary, borderWidth: 1, borderColor: colors.border, marginBottom: 24 }}
              maxLength={100}
            />

            {/* Submit */}
            <AnimatedPressable
              onPress={handleCreateTournament}
              disabled={!challengeName.trim() || !tournamentGroupId || isCreatingTournament}
              style={{ backgroundColor: challengeName.trim() && tournamentGroupId ? PALETTE.fuchsia : "#DDD", paddingVertical: 16, borderRadius: 14, alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 8 }}
            >
              {isCreatingTournament ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Ionicons name="trophy-outline" size={20} color="#FFFFFF" />
              )}
              <Text style={{ color: "#FFFFFF", fontSize: FONT.sizes.lg, fontFamily: FONT_FAMILY.bold }}>
                {isCreatingTournament ? "Création..." : "Créer le tournoi"}
              </Text>
            </AnimatedPressable>
          </View>
        </View>
      </ScrollView>

      {/* Create Group Bottom Sheet */}
      <BottomSheet isOpen={showCreateGroup} onClose={() => { setShowCreateGroup(false); setNewGroupName(""); setNewGroupDesc(""); }} snapPoint={0.5}>
        <View style={{ paddingHorizontal: 20, paddingTop: 8 }}>
          <Text style={{ color: colors.textPrimary, fontSize: FONT.sizes["2xl"], fontFamily: FONT_FAMILY.bold, marginBottom: 20 }}>
            Créer un groupe
          </Text>
          <Text style={{ fontSize: FONT.sizes.xs, fontFamily: FONT_FAMILY.bold, color: colors.textTertiary, textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 8 }}>
            NOM DU GROUPE *
          </Text>
          <TextInput
            value={newGroupName}
            onChangeText={setNewGroupName}
            placeholder="Ex: Les Champions"
            placeholderTextColor={colors.textMuted}
            style={{ backgroundColor: colors.surface, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 13, fontSize: FONT.sizes.base, fontFamily: FONT_FAMILY.regular, color: colors.textPrimary, borderWidth: 1, borderColor: colors.border, marginBottom: 16 }}
            maxLength={60}
            autoFocus
          />
          <Text style={{ fontSize: FONT.sizes.xs, fontFamily: FONT_FAMILY.bold, color: colors.textTertiary, textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 8 }}>
            DESCRIPTION (optionnel)
          </Text>
          <TextInput
            value={newGroupDesc}
            onChangeText={setNewGroupDesc}
            placeholder="Décris ton groupe..."
            placeholderTextColor={colors.textMuted}
            multiline
            numberOfLines={2}
            style={{ backgroundColor: colors.surface, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 13, fontSize: FONT.sizes.base, fontFamily: FONT_FAMILY.regular, color: colors.textPrimary, borderWidth: 1, borderColor: colors.border, marginBottom: 24, minHeight: 72, textAlignVertical: "top" }}
            maxLength={200}
          />
          <AnimatedPressable
            onPress={handleCreateGroup}
            disabled={!newGroupName.trim() || isCreatingGroup}
            style={{ backgroundColor: newGroupName.trim() ? PALETTE.sarcelle : (isDark ? "#2C2C2C" : "#DDD"), paddingVertical: 16, borderRadius: 14, alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 8 }}
          >
            {isCreatingGroup ? <ActivityIndicator color="#FFFFFF" /> : <Ionicons name="people-outline" size={20} color="#FFFFFF" />}
            <Text style={{ color: "#FFFFFF", fontSize: FONT.sizes.lg, fontFamily: FONT_FAMILY.bold }}>
              {isCreatingGroup ? "Création..." : "Créer le groupe"}
            </Text>
          </AnimatedPressable>
        </View>
      </BottomSheet>
    </View>
  );
}
