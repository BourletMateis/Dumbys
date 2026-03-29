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
import { createGroupSchema, createTournamentSchema } from "@/src/lib/schemas";
import { toast } from "@/src/lib/toast";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

type UploadTab = "enregistrer" | "deposer" | "tournoi";
type TournamentVisibility = "public" | "private";

export default function UploadScreen() {
  const insets = useSafeAreaInsets();
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
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [tournamentVisibility, setTournamentVisibility] = useState<TournamentVisibility>("public");
  const [challengeName, setChallengeName] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  // Create group sheet
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDesc, setNewGroupDesc] = useState("");
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [groupErrors, setGroupErrors] = useState<{ name?: string }>({});

  // Tournament creation
  const [tournamentGroupId, setTournamentGroupId] = useState<string | null>(null);
  const [tournamentDesc, setTournamentDesc] = useState("");
  const [tournamentReward, setTournamentReward] = useState("");
  const [isCreatingTournament, setIsCreatingTournament] = useState(false);
  const [tournamentErrors, setTournamentErrors] = useState<{ title?: string }>({});

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

  const resetForm = () => {
    setVideoUri(null);
    setThumbnailUri(null);
    setSelectedGroupId(null);
    setChallengeName("");
  };

  const handleCreateGroup = () => {
    const result = createGroupSchema.safeParse({ name: newGroupName.trim(), description: newGroupDesc.trim() || undefined });
    if (!result.success) {
      setGroupErrors({ name: result.error.flatten().fieldErrors.name?.[0] });
      return;
    }
    setGroupErrors({});
    setIsCreatingGroup(true);
    createGroup.mutate(
      { name: newGroupName.trim(), description: newGroupDesc.trim() || undefined, isPublic: false },
      {
        onSuccess: () => {
          setShowCreateGroup(false);
          setNewGroupName("");
          setNewGroupDesc("");
          toast.success("Ton groupe a été créé avec succès.", "Groupe créé !");
        },
        onError: (err) => toast.error(err.message),
        onSettled: () => setIsCreatingGroup(false),
      },
    );
  };

  const handleCreateTournament = () => {
    const result = createTournamentSchema.safeParse({
      title: challengeName.trim(),
      description: tournamentDesc.trim() || undefined,
      reward: tournamentReward.trim() || undefined,
    });
    if (!result.success) {
      setTournamentErrors({ title: result.error.flatten().fieldErrors.title?.[0] });
      return;
    }
    if (!tournamentGroupId) return;
    setTournamentErrors({});
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
          toast.success("Accède-y depuis la page du groupe.", "Tournoi créé !");
        },
        onError: (err) => toast.error(err.message),
        onSettled: () => setIsCreatingTournament(false),
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
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setShowCreateGroup(true); }}
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

            {/* Group selector */}
            <Text style={{ fontSize: FONT.sizes.xs, fontFamily: FONT_FAMILY.bold, color: "#B0B0B0", textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 10 }}>
              GROUPE *
            </Text>
            {(myGroups ?? []).length === 0 ? (
              <Text style={{ color: "#CCC", fontSize: FONT.sizes.base, fontFamily: FONT_FAMILY.regular, marginBottom: 16 }}>
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
                      backgroundColor: tournamentGroupId === g.id ? PALETTE.sarcelle : "#F2F2F2",
                      borderWidth: tournamentGroupId === g.id ? 0 : 1, borderColor: "#E0E0E0",
                    }}
                  >
                    <Text style={{ fontSize: FONT.sizes.sm, fontFamily: FONT_FAMILY.semibold, color: tournamentGroupId === g.id ? "#FFFFFF" : "#666" }} numberOfLines={1}>
                      {g.name}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            )}

            {/* Nom du tournoi */}
            <Text style={{ fontSize: FONT.sizes.xs, fontFamily: FONT_FAMILY.bold, color: "#B0B0B0", textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 10 }}>
              NOM DU TOURNOI *
            </Text>
            <TextInput
              value={challengeName}
              onChangeText={(t) => { setChallengeName(t); setTournamentErrors({}); }}
              placeholder="Ex: Kickflip Masters ✏️"
              placeholderTextColor="#CCCCCC"
              style={{ backgroundColor: "#F8F8FA", borderRadius: 14, paddingHorizontal: 18, paddingVertical: 14, fontSize: FONT.sizes.lg, fontFamily: FONT_FAMILY.regular, color: "#1A1A1A", borderWidth: 1, borderColor: tournamentErrors.title ? "#F43F5E" : "rgba(0,0,0,0.05)", marginBottom: tournamentErrors.title ? 4 : 16 }}
              maxLength={60}
            />
            {tournamentErrors.title ? (
              <Text style={{ color: "#F43F5E", fontSize: 12, fontFamily: FONT_FAMILY.medium, marginBottom: 12, marginLeft: 2 }}>
                {tournamentErrors.title}
              </Text>
            ) : null}

            {/* Récompense */}
            <Text style={{ fontSize: FONT.sizes.xs, fontFamily: FONT_FAMILY.bold, color: "#B0B0B0", textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 10 }}>
              RÉCOMPENSE (optionnel)
            </Text>
            <TextInput
              value={tournamentReward}
              onChangeText={setTournamentReward}
              placeholder="Ex: Pizza pour l'équipe 🍕"
              placeholderTextColor="#CCCCCC"
              style={{ backgroundColor: "#F8F8FA", borderRadius: 14, paddingHorizontal: 18, paddingVertical: 14, fontSize: FONT.sizes.base, fontFamily: FONT_FAMILY.regular, color: "#1A1A1A", borderWidth: 1, borderColor: "rgba(0,0,0,0.05)", marginBottom: 24 }}
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
          <Text style={{ color: "#1A1A1A", fontSize: FONT.sizes["2xl"], fontFamily: FONT_FAMILY.bold, marginBottom: 20 }}>
            Créer un groupe
          </Text>
          <Text style={{ fontSize: FONT.sizes.xs, fontFamily: FONT_FAMILY.bold, color: "#B0B0B0", textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 8 }}>
            NOM DU GROUPE *
          </Text>
          <TextInput
            value={newGroupName}
            onChangeText={(t) => { setNewGroupName(t); setGroupErrors({}); }}
            placeholder="Ex: Les Champions 🏆"
            placeholderTextColor="#CCC"
            style={{ backgroundColor: "#F8F8FA", borderRadius: 14, paddingHorizontal: 16, paddingVertical: 13, fontSize: FONT.sizes.base, fontFamily: FONT_FAMILY.regular, color: "#1A1A1A", borderWidth: 1, borderColor: groupErrors.name ? "#F43F5E" : "rgba(0,0,0,0.06)", marginBottom: groupErrors.name ? 4 : 16 }}
            maxLength={60}
            autoFocus
          />
          {groupErrors.name ? (
            <Text style={{ color: "#F43F5E", fontSize: 12, fontFamily: FONT_FAMILY.medium, marginBottom: 12, marginLeft: 2 }}>
              {groupErrors.name}
            </Text>
          ) : null}
          <Text style={{ fontSize: FONT.sizes.xs, fontFamily: FONT_FAMILY.bold, color: "#B0B0B0", textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 8 }}>
            DESCRIPTION (optionnel)
          </Text>
          <TextInput
            value={newGroupDesc}
            onChangeText={setNewGroupDesc}
            placeholder="Décris ton groupe..."
            placeholderTextColor="#CCC"
            multiline
            numberOfLines={2}
            style={{ backgroundColor: "#F8F8FA", borderRadius: 14, paddingHorizontal: 16, paddingVertical: 13, fontSize: FONT.sizes.base, fontFamily: FONT_FAMILY.regular, color: "#1A1A1A", borderWidth: 1, borderColor: "rgba(0,0,0,0.06)", marginBottom: 24, minHeight: 72, textAlignVertical: "top" }}
            maxLength={200}
          />
          <AnimatedPressable
            onPress={handleCreateGroup}
            disabled={!newGroupName.trim() || isCreatingGroup}
            style={{ backgroundColor: newGroupName.trim() ? PALETTE.sarcelle : "#DDD", paddingVertical: 16, borderRadius: 14, alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 8 }}
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
