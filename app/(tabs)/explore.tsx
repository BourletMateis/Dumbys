import { useState, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
} from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as ImagePicker from "expo-image-picker";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useMyGroups, type GroupWithRole } from "@/src/features/groups/useMyGroups";
import {
  useCreateGroup,
  useJoinGroupByCode,
  useDeleteGroup,
} from "@/src/features/groups/useGroupActions";
import { useChallengeStats } from "@/src/features/groups/useChallengeStats";
import { useUploadGroupVideo } from "@/src/features/groups/useUploadGroupVideo";
import { useTimelineLogic } from "@/src/hooks/useTimelineLogic";
import { AnimatedPressable } from "@/src/components/ui/AnimatedPressable";
import { FloatingActionButton } from "@/src/components/ui/FloatingActionButton";
import { BottomSheet } from "@/src/components/ui/BottomSheet";
import { EmptyState } from "@/src/components/ui/EmptyState";
import {
  COLORS,
  GRADIENTS,
  RADIUS,
  SPACING,
  FONT,
  FONT_FAMILY,
  CARD_STYLE,
  INPUT_STYLE,
  SECTION_HEADER_STYLE,
  AVATAR_COLORS,
} from "@/src/theme";
import { useTheme } from "@/src/providers/ThemeProvider";

function ChallengeCard({
  group,
  thumbnail,
  videoCount,
  canUpload,
  onPress,
  onLongPress,
  onUpload,
}: {
  group: GroupWithRole;
  thumbnail: string | null;
  videoCount: number;
  canUpload: boolean;
  onPress: () => void;
  onLongPress: () => void;
  onUpload: () => void;
}) {
  const { colors } = useTheme();
  let hash = 0;
  for (let i = 0; i < group.name.length; i++) {
    hash = group.name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const color = AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];

  return (
    <AnimatedPressable
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={400}
      style={{
        ...CARD_STYLE,
        overflow: "hidden",
        marginBottom: SPACING.lg,
      }}
    >
      {/* Thumbnail / fallback header */}
      {thumbnail ? (
        <View style={{ height: 150, position: "relative" }}>
          <Image
            source={{ uri: thumbnail }}
            style={{ width: "100%", height: "100%" }}
            contentFit="cover"
          />
          <LinearGradient
            colors={GRADIENTS.overlay as any}
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: 70,
            }}
          />
          {videoCount > 0 && (
            <View
              style={{
                position: "absolute",
                top: SPACING.base,
                right: SPACING.base,
                flexDirection: "row",
                alignItems: "center",
                gap: SPACING.xs,
                backgroundColor: colors.overlay,
                paddingHorizontal: SPACING.base,
                paddingVertical: SPACING.sm,
                borderRadius: RADIUS.xs,
              }}
            >
              <Ionicons name="flame" size={12} color={COLORS.error} />
              <Text style={{ color: colors.textPrimary, fontSize: FONT.sizes.sm, fontWeight: FONT.weights.bold }}>
                {videoCount}
              </Text>
            </View>
          )}
          <View
            style={{
              position: "absolute",
              top: SPACING.base,
              left: SPACING.base,
              backgroundColor: "rgba(255,45,125,0.7)",
              paddingHorizontal: SPACING.base,
              paddingVertical: SPACING.sm,
              borderRadius: RADIUS.xs,
              borderWidth: 1,
              borderColor: "rgba(255,45,125,0.3)",
            }}
          >
            <Text style={{ color: colors.textPrimary, fontSize: FONT.sizes.xs, fontWeight: FONT.weights.bold, textTransform: "capitalize" }}>
              {group.role}
            </Text>
          </View>
        </View>
      ) : (
        <View
          style={{
            height: 110,
            backgroundColor: color + "10",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
          }}
        >
          <Ionicons name="trophy" size={36} color={color + "35"} />
          {videoCount > 0 && (
            <View
              style={{
                position: "absolute",
                top: SPACING.base,
                right: SPACING.base,
                flexDirection: "row",
                alignItems: "center",
                gap: SPACING.xs,
                backgroundColor: colors.overlay,
                paddingHorizontal: SPACING.base,
                paddingVertical: SPACING.sm,
                borderRadius: RADIUS.xs,
              }}
            >
              <Ionicons name="flame" size={12} color={COLORS.error} />
              <Text style={{ color: colors.textPrimary, fontSize: FONT.sizes.sm, fontWeight: FONT.weights.bold }}>
                {videoCount}
              </Text>
            </View>
          )}
          <View
            style={{
              position: "absolute",
              top: SPACING.base,
              left: SPACING.base,
              backgroundColor: "rgba(255,45,125,0.7)",
              paddingHorizontal: SPACING.base,
              paddingVertical: SPACING.sm,
              borderRadius: RADIUS.xs,
              borderWidth: 1,
              borderColor: "rgba(255,45,125,0.3)",
            }}
          >
            <Text style={{ color: colors.textPrimary, fontSize: FONT.sizes.xs, fontWeight: FONT.weights.bold, textTransform: "capitalize" }}>
              {group.role}
            </Text>
          </View>
        </View>
      )}

      {/* Challenge info */}
      <View style={{ padding: SPACING.lg }}>
        <Text
          style={{ color: colors.textPrimary, fontSize: FONT.sizes.xl, fontFamily: FONT_FAMILY.extrabold }}
          numberOfLines={2}
        >
          {group.name}
        </Text>
        {group.description && (
          <Text
            style={{ color: colors.textSecondary, fontSize: FONT.sizes.md, marginTop: SPACING.xs, lineHeight: 19 }}
            numberOfLines={2}
          >
            {group.description}
          </Text>
        )}

        {/* Prize / Goal */}
        {(group.prize || group.goal_description) && (
          <View style={{ marginTop: SPACING.md, gap: SPACING.xs }}>
            {group.goal_description && (
              <View style={{ flexDirection: "row", alignItems: "center", gap: SPACING.sm }}>
                <Ionicons name="flag" size={12} color={COLORS.warning} />
                <Text style={{ color: COLORS.warning, fontSize: FONT.sizes.sm, fontWeight: FONT.weights.medium }} numberOfLines={1}>
                  {group.goal_description}
                </Text>
              </View>
            )}
            {group.prize && (
              <View style={{ flexDirection: "row", alignItems: "center", gap: SPACING.sm }}>
                <Ionicons name="gift" size={12} color={COLORS.accent} />
                <Text style={{ color: COLORS.accent, fontSize: FONT.sizes.sm, fontWeight: FONT.weights.medium }} numberOfLines={1}>
                  {group.prize}
                </Text>
              </View>
            )}
          </View>
        )}

        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            marginTop: SPACING.base,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: SPACING.lg, flex: 1 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: SPACING.sm }}>
              <Ionicons name="people" size={14} color={colors.textTertiary} />
              <Text style={{ color: colors.textTertiary, fontSize: FONT.sizes.md, fontWeight: FONT.weights.medium }}>
                {group.member_count} participant{group.member_count !== 1 ? "s" : ""}
              </Text>
            </View>
            {videoCount > 0 && (
              <View style={{ flexDirection: "row", alignItems: "center", gap: SPACING.sm }}>
                <Ionicons name="flame" size={14} color={COLORS.error} />
                <Text style={{ color: COLORS.error, fontSize: FONT.sizes.md, fontWeight: FONT.weights.semibold }}>
                  {videoCount} this week
                </Text>
              </View>
            )}
          </View>
          {canUpload && (
            <Pressable
              onPress={(e) => {
                e.stopPropagation();
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                onUpload();
              }}
              style={{ borderRadius: RADIUS.full, overflow: "hidden" }}
            >
              <LinearGradient
                colors={GRADIENTS.brandAccent as any}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: RADIUS.full,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons name="add" size={20} color={colors.textPrimary} />
              </LinearGradient>
            </Pressable>
          )}
        </View>
      </View>
    </AnimatedPressable>
  );
}

export default function ExploreScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: groups, isPending, refetch, isRefetching } = useMyGroups();
  const privateChallenges = (groups ?? []).filter((g) => !g.is_public);
  const createGroup = useCreateGroup();
  const joinGroup = useJoinGroupByCode();
  const deleteGroup = useDeleteGroup();
  const { weekNumber, year, canUpload } = useTimelineLogic();
  const uploadMutation = useUploadGroupVideo();

  // Get challenge stats (video count + thumbnail)
  const groupIds = useMemo(
    () => privateChallenges.map((g) => g.id),
    [privateChallenges],
  );
  const { data: statsMap } = useChallengeStats(groupIds);

  const [sheetMode, setSheetMode] = useState<"closed" | "menu" | "create" | "join">("closed");
  const [groupName, setGroupName] = useState("");
  const [groupDesc, setGroupDesc] = useState("");
  const [groupGoal, setGroupGoal] = useState("");
  const [groupPrize, setGroupPrize] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [uploadGroupId, setUploadGroupId] = useState<string | null>(null);
  const [pendingVideoUri, setPendingVideoUri] = useState<string | null>(null);
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadDesc, setUploadDesc] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const handleUploadButtonPress = (groupId: string) => {
    setUploadGroupId(groupId);
  };

  const handlePickVideo = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Permission required", "Allow access to your gallery.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["videos"],
      quality: 0.8,
      videoMaxDuration: 60,
    });
    if (result.canceled || !result.assets[0]) return;
    setPendingVideoUri(result.assets[0].uri);
  };

  const handleRecordVideo = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Permission required", "Allow camera access to record.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["videos"],
      quality: 0.8,
      videoMaxDuration: 60,
    });
    if (result.canceled || !result.assets[0]) return;
    setPendingVideoUri(result.assets[0].uri);
  };

  const doUpload = () => {
    if (!pendingVideoUri || !uploadGroupId) return;
    setIsUploading(true);
    uploadMutation.mutate(
      {
        videoUri: pendingVideoUri,
        groupId: uploadGroupId,
        weekNumber,
        year,
        title: uploadTitle.trim() || undefined,
        description: uploadDesc.trim() || undefined,
      },
      {
        onSuccess: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          setPendingVideoUri(null);
          setUploadTitle("");
          setUploadDesc("");
          setUploadGroupId(null);
        },
        onSettled: () => setIsUploading(false),
        onError: (err) => Alert.alert("Upload failed", err.message),
      },
    );
  };

  const handleCreate = () => {
    if (!groupName.trim()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    createGroup.mutate(
      {
        name: groupName.trim(),
        description: groupDesc.trim() || undefined,
        isPublic: false,
        goalDescription: groupGoal.trim() || undefined,
        prize: groupPrize.trim() || undefined,
      },
      {
        onSuccess: () => {
          setSheetMode("closed");
          setGroupName("");
          setGroupDesc("");
          setGroupGoal("");
          setGroupPrize("");
        },
        onError: (err) => Alert.alert("Error", err.message),
      },
    );
  };

  const handleJoin = () => {
    if (!inviteCode.trim()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    joinGroup.mutate(inviteCode.trim(), {
      onSuccess: () => {
        setSheetMode("closed");
        setInviteCode("");
      },
      onError: (err) => Alert.alert("Error", err.message),
    });
  };

  const handleLongPress = (group: GroupWithRole) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    const options: { text: string; style?: "destructive" | "cancel"; onPress?: () => void }[] = [];

    if (group.role === "owner") {
      options.push({
        text: "Delete Challenge",
        style: "destructive",
        onPress: () => {
          Alert.alert(
            "Delete Challenge",
            `Are you sure you want to delete "${group.name}"? This cannot be undone.`,
            [
              { text: "Cancel", style: "cancel" },
              {
                text: "Delete",
                style: "destructive",
                onPress: () => {
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                  deleteGroup.mutate(group.id);
                },
              },
            ],
          );
        },
      });
    }

    options.push({ text: "Cancel", style: "cancel" });

    Alert.alert(group.name, undefined, options);
  };

  const openChallenge = (group: GroupWithRole) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({ pathname: "/feed/[groupId]", params: { groupId: group.id } });
  };

  const renderChallenge = ({ item: group }: { item: GroupWithRole }) => {
    const stats = statsMap?.get(group.id);
    return (
      <ChallengeCard
        group={group}
        thumbnail={stats?.latest_thumbnail ?? null}
        videoCount={stats?.video_count ?? 0}
        canUpload={canUpload}
        onPress={() => openChallenge(group)}
        onLongPress={() => handleLongPress(group)}
        onUpload={() => handleUploadButtonPress(group.id)}
      />
    );
  };

  const ListHeader = (
    <>
      {/* Header */}
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: SPACING.xl }}>
        <Text style={{ color: colors.textPrimary, fontSize: FONT.sizes["4xl"], fontWeight: FONT.weights.black }}>
          My Challenges
        </Text>
      </View>

      {/* Section header */}
      <View style={{ flexDirection: "row", alignItems: "center", gap: SPACING.sm, marginBottom: SPACING.lg }}>
        <Ionicons name="lock-closed" size={12} color={colors.textTertiary} />
        <Text style={SECTION_HEADER_STYLE as any}>
          Private Challenges
        </Text>
      </View>
    </>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <FlatList
        data={privateChallenges}
        keyExtractor={(item) => item.id}
        renderItem={renderChallenge}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={
          isPending ? (
            <View style={{ alignItems: "center", paddingVertical: SPACING["5xl"] }}>
              <ActivityIndicator size="large" color={COLORS.brand} />
            </View>
          ) : (
            <EmptyState
              icon="people-outline"
              title="Start your crew"
              subtitle="Create a private challenge with your friends or join one with an invite code"
              actionLabel="Create Private Challenge"
              onAction={() => setSheetMode("create")}
            />
          )
        }
        contentContainerStyle={{
          paddingTop: insets.top + SPACING.md,
          paddingHorizontal: SPACING.lg,
          paddingBottom: 120,
        }}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={COLORS.brand}
          />
        }
        showsVerticalScrollIndicator={false}
      />

      {/* FAB */}
      <FloatingActionButton
        onPress={() => setSheetMode(sheetMode === "closed" ? "menu" : "closed")}
        icon={sheetMode !== "closed" ? "close" : "add"}
      />

      {/* Bottom Sheet */}
      <BottomSheet
        isOpen={sheetMode !== "closed"}
        onClose={() => setSheetMode("closed")}
        snapPoint={sheetMode === "menu" ? 0.35 : 0.65}
      >
        <View style={{ paddingHorizontal: SPACING.xl, paddingTop: SPACING.md }}>
          {sheetMode === "menu" && (
            <>
              <Text style={{ color: colors.textPrimary, fontSize: FONT.sizes["2xl"], fontWeight: FONT.weights.bold, marginBottom: SPACING.xl }}>
                Private Challenge
              </Text>
              <AnimatedPressable
                onPress={() => setSheetMode("create")}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: SPACING.lg,
                  padding: SPACING.lg,
                  backgroundColor: colors.glass,
                  borderRadius: RADIUS.lg,
                  marginBottom: SPACING.base,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <View style={{ width: 46, height: 46, borderRadius: RADIUS.md, backgroundColor: "rgba(255,45,125,0.15)", alignItems: "center", justifyContent: "center" }}>
                  <Ionicons name="add" size={24} color={COLORS.brand} />
                </View>
                <View>
                  <Text style={{ color: colors.textPrimary, fontSize: FONT.sizes.lg, fontWeight: FONT.weights.semibold }}>Create Private Challenge</Text>
                  <Text style={{ color: colors.textTertiary, fontSize: FONT.sizes.md }}>Invite friends with a code</Text>
                </View>
              </AnimatedPressable>
              <AnimatedPressable
                onPress={() => setSheetMode("join")}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: SPACING.lg,
                  padding: SPACING.lg,
                  backgroundColor: colors.glass,
                  borderRadius: RADIUS.lg,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <View style={{ width: 46, height: 46, borderRadius: RADIUS.md, backgroundColor: "rgba(59,130,246,0.15)", alignItems: "center", justifyContent: "center" }}>
                  <Ionicons name="enter-outline" size={24} color={COLORS.info} />
                </View>
                <View>
                  <Text style={{ color: colors.textPrimary, fontSize: FONT.sizes.lg, fontWeight: FONT.weights.semibold }}>Join Private Challenge</Text>
                  <Text style={{ color: colors.textTertiary, fontSize: FONT.sizes.md }}>Enter a friend's invite code</Text>
                </View>
              </AnimatedPressable>
            </>
          )}

          {sheetMode === "create" && (
            <>
              <Text style={{ color: colors.textPrimary, fontSize: FONT.sizes["2xl"], fontWeight: FONT.weights.bold, marginBottom: SPACING.xl }}>
                Create Private Challenge
              </Text>
              <TextInput
                value={groupName}
                onChangeText={setGroupName}
                placeholder="Challenge name"
                placeholderTextColor={colors.textMuted}
                style={{
                  ...INPUT_STYLE,
                  marginBottom: SPACING.base,
                }}
              />
              <TextInput
                value={groupDesc}
                onChangeText={setGroupDesc}
                placeholder="Description (optional)"
                placeholderTextColor={colors.textMuted}
                style={{
                  ...INPUT_STYLE,
                  marginBottom: SPACING.base,
                }}
              />
              <TextInput
                value={groupGoal}
                onChangeText={setGroupGoal}
                placeholder="Goal (optional, e.g. Funniest fail)"
                placeholderTextColor={colors.textMuted}
                style={{
                  ...INPUT_STYLE,
                  marginBottom: SPACING.base,
                }}
              />
              <TextInput
                value={groupPrize}
                onChangeText={setGroupPrize}
                placeholder="Prize (optional, e.g. Free pizza)"
                placeholderTextColor={colors.textMuted}
                style={{
                  ...INPUT_STYLE,
                  marginBottom: SPACING.xl,
                }}
              />
              <AnimatedPressable
                onPress={handleCreate}
                disabled={createGroup.isPending || !groupName.trim()}
                style={{
                  borderRadius: RADIUS.md,
                  overflow: "hidden",
                  opacity: !groupName.trim() ? 0.5 : 1,
                }}
              >
                <LinearGradient
                  colors={GRADIENTS.brand as any}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{
                    paddingVertical: SPACING.lg,
                    borderRadius: RADIUS.md,
                    alignItems: "center",
                  }}
                >
                  {createGroup.isPending ? (
                    <ActivityIndicator color={colors.textPrimary} />
                  ) : (
                    <Text style={{ color: colors.textPrimary, fontSize: FONT.sizes.lg, fontWeight: FONT.weights.bold }}>Create Challenge</Text>
                  )}
                </LinearGradient>
              </AnimatedPressable>
            </>
          )}

          {sheetMode === "join" && (
            <>
              <Text style={{ color: colors.textPrimary, fontSize: FONT.sizes["2xl"], fontWeight: FONT.weights.bold, marginBottom: SPACING.xl }}>
                Join Private Challenge
              </Text>
              <TextInput
                value={inviteCode}
                onChangeText={setInviteCode}
                placeholder="Enter invite code"
                placeholderTextColor={colors.textMuted}
                autoCapitalize="none"
                style={{
                  ...INPUT_STYLE,
                  marginBottom: SPACING.xl,
                  fontFamily: "SpaceMono",
                  letterSpacing: 2,
                }}
              />
              <AnimatedPressable
                onPress={handleJoin}
                disabled={joinGroup.isPending || !inviteCode.trim()}
                style={{
                  borderRadius: RADIUS.md,
                  overflow: "hidden",
                  opacity: !inviteCode.trim() ? 0.5 : 1,
                }}
              >
                <LinearGradient
                  colors={GRADIENTS.accent as any}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{
                    paddingVertical: SPACING.lg,
                    borderRadius: RADIUS.md,
                    alignItems: "center",
                  }}
                >
                  {joinGroup.isPending ? (
                    <ActivityIndicator color={colors.textPrimary} />
                  ) : (
                    <Text style={{ color: colors.textPrimary, fontSize: FONT.sizes.lg, fontWeight: FONT.weights.bold }}>Join Challenge</Text>
                  )}
                </LinearGradient>
              </AnimatedPressable>
            </>
          )}
        </View>
      </BottomSheet>

      {/* Single upload bottom sheet — switches content between picker & details */}
      <BottomSheet
        isOpen={!!uploadGroupId}
        onClose={() => {
          setUploadGroupId(null);
          setPendingVideoUri(null);
          setUploadTitle("");
          setUploadDesc("");
        }}
        snapPoint={pendingVideoUri ? 0.5 : 0.35}
      >
        <View style={{ paddingHorizontal: SPACING.xl, paddingTop: SPACING.md }}>
          {!pendingVideoUri ? (
            <>
              <Text style={{ color: colors.textPrimary, fontSize: FONT.sizes["2xl"], fontWeight: FONT.weights.bold, marginBottom: SPACING.xl }}>
                Add a video
              </Text>
              <AnimatedPressable
                onPress={handlePickVideo}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: SPACING.lg,
                  padding: SPACING.lg,
                  backgroundColor: colors.glass,
                  borderRadius: RADIUS.lg,
                  marginBottom: SPACING.base,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <View style={{ width: 46, height: 46, borderRadius: RADIUS.md, backgroundColor: "rgba(255,45,125,0.15)", alignItems: "center", justifyContent: "center" }}>
                  <Ionicons name="images" size={22} color={COLORS.brand} />
                </View>
                <View>
                  <Text style={{ color: colors.textPrimary, fontSize: FONT.sizes.lg, fontWeight: FONT.weights.semibold }}>Choose from Gallery</Text>
                  <Text style={{ color: colors.textTertiary, fontSize: FONT.sizes.md }}>Pick a video from your library</Text>
                </View>
              </AnimatedPressable>
              <AnimatedPressable
                onPress={handleRecordVideo}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: SPACING.lg,
                  padding: SPACING.lg,
                  backgroundColor: colors.glass,
                  borderRadius: RADIUS.lg,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <View style={{ width: 46, height: 46, borderRadius: RADIUS.md, backgroundColor: "rgba(255,45,125,0.12)", alignItems: "center", justifyContent: "center" }}>
                  <Ionicons name="videocam" size={22} color={COLORS.brandLight} />
                </View>
                <View>
                  <Text style={{ color: colors.textPrimary, fontSize: FONT.sizes.lg, fontWeight: FONT.weights.semibold }}>Record a Video</Text>
                  <Text style={{ color: colors.textTertiary, fontSize: FONT.sizes.md }}>Max 60 seconds</Text>
                </View>
              </AnimatedPressable>
            </>
          ) : (
            <>
              <Text style={{ color: colors.textPrimary, fontSize: FONT.sizes["2xl"], fontWeight: FONT.weights.bold, marginBottom: SPACING.xl }}>
                New Post
              </Text>

              <Text style={{ ...SECTION_HEADER_STYLE, marginBottom: SPACING.md } as any}>
                Title (optional)
              </Text>
              <TextInput
                value={uploadTitle}
                onChangeText={setUploadTitle}
                placeholder="Give your video a name..."
                placeholderTextColor={colors.textMuted}
                style={{
                  ...INPUT_STYLE,
                  marginBottom: SPACING.lg,
                }}
                maxLength={100}
              />

              <Text style={{ ...SECTION_HEADER_STYLE, marginBottom: SPACING.md } as any}>
                Description (optional)
              </Text>
              <TextInput
                value={uploadDesc}
                onChangeText={setUploadDesc}
                placeholder="What's happening in this video?"
                placeholderTextColor={colors.textMuted}
                multiline
                numberOfLines={3}
                style={{
                  ...INPUT_STYLE,
                  marginBottom: SPACING["2xl"],
                  minHeight: 80,
                  textAlignVertical: "top",
                }}
                maxLength={300}
              />

              <AnimatedPressable
                onPress={doUpload}
                disabled={isUploading}
                style={{
                  borderRadius: RADIUS.md,
                  overflow: "hidden",
                }}
              >
                <LinearGradient
                  colors={GRADIENTS.brand as any}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{
                    paddingVertical: SPACING.lg,
                    borderRadius: RADIUS.md,
                    alignItems: "center",
                    flexDirection: "row",
                    justifyContent: "center",
                    gap: SPACING.md,
                  }}
                >
                  {isUploading ? (
                    <>
                      <ActivityIndicator color={colors.textPrimary} />
                      <Text style={{ color: colors.textPrimary, fontSize: FONT.sizes.lg, fontWeight: FONT.weights.bold }}>Uploading...</Text>
                    </>
                  ) : (
                    <>
                      <Ionicons name="arrow-up-circle" size={20} color={colors.textPrimary} />
                      <Text style={{ color: colors.textPrimary, fontSize: FONT.sizes.lg, fontWeight: FONT.weights.bold }}>Publish</Text>
                    </>
                  )}
                </LinearGradient>
              </AnimatedPressable>
            </>
          )}
        </View>
      </BottomSheet>
    </View>
  );
}
