import { useState } from "react";
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
import { LinearGradient } from "expo-linear-gradient";
import * as ImagePicker from "expo-image-picker";
import * as Haptics from "expo-haptics";
import * as VideoThumbnails from "expo-video-thumbnails";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useMyGroups, type GroupWithRole } from "@/src/features/groups/useMyGroups";
import { usePublicGroups, PUBLIC_CATEGORIES, type PublicGroup } from "@/src/features/groups/usePublicGroups";
import { useUploadGroupVideo } from "@/src/features/groups/useUploadGroupVideo";
import { useTimelineLogic } from "@/src/hooks/useTimelineLogic";
import { AnimatedPressable } from "@/src/components/ui/AnimatedPressable";
import {
  COLORS,
  GRADIENTS,
  RADIUS,
  FONT,
  FONT_FAMILY,
  SPACING,
  CARD_STYLE,
  SECTION_HEADER_STYLE,
  INPUT_STYLE,
  HEADER_BUTTON_STYLE,
} from "@/src/theme";
import { useTheme } from "@/src/providers/ThemeProvider";

type UploadGroup = {
  id: string;
  name: string;
  is_public: boolean;
  member_count: number;
  category?: string | null;
};

type GroupFilter = "all" | "private" | "public";

export default function UploadScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { data: myGroups } = useMyGroups();
  const { data: publicGroups } = usePublicGroups();
  const uploadMutation = useUploadGroupVideo();
  const { weekNumber, year, canUpload } = useTimelineLogic();

  // Step 1: pick video, Step 2: fill details
  const [videoUri, setVideoUri] = useState<string | null>(null);
  const [thumbnailUri, setThumbnailUri] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [groupFilter, setGroupFilter] = useState<GroupFilter>("all");
  const [isUploading, setIsUploading] = useState(false);

  // Private groups = from useMyGroups, filtered to private only
  const privateGroups: UploadGroup[] = (myGroups ?? [])
    .filter((g) => !g.is_public)
    .map((g) => ({ id: g.id, name: g.name, is_public: false, member_count: g.member_count }));

  // Public groups = ALL public groups from explore (not just joined ones)
  const allPublicGroups: UploadGroup[] = (publicGroups ?? [])
    .map((g) => ({ id: g.id, name: g.name, is_public: true, member_count: g.member_count, category: g.category }));

  const filteredGroups: UploadGroup[] =
    groupFilter === "private" ? privateGroups
    : groupFilter === "public" ? allPublicGroups
    : [...privateGroups, ...allPublicGroups];

  const selectedGroup = filteredGroups.find((g) => g.id === selectedGroupId);

  const pickVideo = async (source: "gallery" | "camera") => {
    if (source === "gallery") {
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
      await setVideoWithThumb(result.assets[0].uri);
    } else {
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
      await setVideoWithThumb(result.assets[0].uri);
    }
  };

  const setVideoWithThumb = async (uri: string) => {
    setVideoUri(uri);
    try {
      const thumb = await VideoThumbnails.getThumbnailAsync(uri, {
        time: 1000,
        quality: 0.5,
      });
      setThumbnailUri(thumb.uri);
    } catch {
      setThumbnailUri(null);
    }
  };

  const resetForm = () => {
    setVideoUri(null);
    setThumbnailUri(null);
    setTitle("");
    setDescription("");
    setSelectedGroupId(null);
  };

  const handlePublish = () => {
    if (!videoUri || !selectedGroupId) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setIsUploading(true);

    uploadMutation.mutate(
      { videoUri, groupId: selectedGroupId, weekNumber, year, title: title.trim() || undefined, description: description.trim() || undefined },
      {
        onSuccess: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          Alert.alert("Published!", "Your video has been uploaded.", [
            { text: "OK", onPress: resetForm },
          ]);
        },
        onError: (err) => {
          Alert.alert("Upload failed", err.message);
        },
        onSettled: () => setIsUploading(false),
      },
    );
  };

  // Not upload phase
  if (!canUpload) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: "center", justifyContent: "center", paddingHorizontal: SPACING["3xl"] }}>
        <View
          style={{
            width: 88,
            height: 88,
            borderRadius: 44,
            backgroundColor: "rgba(255,45,125,0.12)",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: SPACING["2xl"],
          }}
        >
          <Ionicons name="time-outline" size={40} color={COLORS.brandLight} />
        </View>
        <Text
          style={{
            color: colors.textPrimary,
            fontSize: FONT.sizes["2xl"],
            fontFamily: FONT_FAMILY.extrabold,
            textAlign: "center",
            marginBottom: SPACING.md,
          }}
        >
          Voting Weekend!
        </Text>
        <Text
          style={{
            color: colors.textTertiary,
            fontSize: FONT.sizes.base,
            textAlign: "center",
            lineHeight: 20,
          }}
        >
          Uploads are open Monday to Friday. Go vote for the best videos in your challenges!
        </Text>
      </View>
    );
  }

  // Step 1: Pick video
  if (!videoUri) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        <View style={{ paddingTop: insets.top + 12, paddingHorizontal: SPACING["2xl"], paddingBottom: SPACING.lg }}>
          <Text
            style={{
              color: colors.textPrimary,
              fontSize: FONT.sizes["4xl"],
              fontFamily: FONT_FAMILY.extrabold,
            }}
          >
            Upload
          </Text>
        </View>

        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: SPACING["3xl"], gap: SPACING.xl }}>
          {/* Gallery option */}
          <AnimatedPressable
            onPress={() => pickVideo("gallery")}
            style={{
              width: "100%",
              borderRadius: RADIUS["2xl"],
              overflow: "hidden",
            }}
          >
            <LinearGradient
              colors={[...GRADIENTS.brand]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                paddingVertical: SPACING["5xl"],
                paddingHorizontal: SPACING["3xl"],
                alignItems: "center",
              }}
            >
              <View
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: RADIUS.xl,
                  backgroundColor: "rgba(255,255,255,0.15)",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: SPACING.xl,
                }}
              >
                <Ionicons name="images" size={34} color="white" />
              </View>
              <Text
                style={{
                  color: colors.textPrimary,
                  fontSize: FONT.sizes["2xl"],
                  fontWeight: FONT.weights.bold,
                }}
              >
                Choose from Gallery
              </Text>
              <Text
                style={{
                  color: "rgba(255,255,255,0.6)",
                  fontSize: FONT.sizes.md,
                  marginTop: SPACING.sm,
                }}
              >
                Pick a video from your library
              </Text>
            </LinearGradient>
          </AnimatedPressable>

          {/* Camera option */}
          <AnimatedPressable
            onPress={() => pickVideo("camera")}
            style={{
              width: "100%",
              borderRadius: RADIUS["2xl"],
              overflow: "hidden",
            }}
          >
            <LinearGradient
              colors={[...GRADIENTS.brandAccent]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                paddingVertical: SPACING["5xl"],
                paddingHorizontal: SPACING["3xl"],
                alignItems: "center",
              }}
            >
              <View
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: RADIUS.xl,
                  backgroundColor: "rgba(255,255,255,0.15)",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: SPACING.xl,
                }}
              >
                <Ionicons name="videocam" size={34} color="white" />
              </View>
              <Text
                style={{
                  color: colors.textPrimary,
                  fontSize: FONT.sizes["2xl"],
                  fontWeight: FONT.weights.bold,
                }}
              >
                Record a Video
              </Text>
              <Text
                style={{
                  color: "rgba(255,255,255,0.6)",
                  fontSize: FONT.sizes.md,
                  marginTop: SPACING.sm,
                }}
              >
                Max 60 seconds
              </Text>
            </LinearGradient>
          </AnimatedPressable>
        </View>
      </View>
    );
  }

  // Step 2: Fill details + choose group
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      {/* Header */}
      <View
        style={{
          paddingTop: insets.top + 12,
          paddingHorizontal: SPACING["2xl"],
          paddingBottom: SPACING.lg,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <AnimatedPressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            resetForm();
          }}
          style={HEADER_BUTTON_STYLE}
        >
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </AnimatedPressable>
        <Text
          style={{
            color: colors.textPrimary,
            fontSize: FONT.sizes.xl,
            fontWeight: FONT.weights.bold,
          }}
        >
          New Post
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: SPACING["2xl"], paddingBottom: 200 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Video Preview */}
        <View
          style={{
            borderRadius: RADIUS.xl,
            overflow: "hidden",
            marginBottom: SPACING["2xl"],
            position: "relative",
            backgroundColor: colors.card,
          }}
        >
          {thumbnailUri ? (
            <Image
              source={{ uri: thumbnailUri }}
              style={{ width: "100%", height: 220, borderRadius: RADIUS.xl }}
              contentFit="cover"
            />
          ) : (
            <View
              style={{
                width: "100%",
                height: 220,
                backgroundColor: colors.card,
                borderRadius: RADIUS.xl,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons name="videocam" size={40} color={colors.textMuted} />
            </View>
          )}
          {/* Change video */}
          <AnimatedPressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              resetForm();
            }}
            style={{
              position: "absolute",
              top: 12,
              right: 12,
              flexDirection: "row",
              alignItems: "center",
              gap: SPACING.xs,
              backgroundColor: colors.overlay,
              paddingHorizontal: SPACING.base,
              paddingVertical: SPACING.sm,
              borderRadius: RADIUS.sm,
            }}
          >
            <Ionicons name="refresh" size={14} color={colors.textPrimary} />
            <Text style={{ color: colors.textPrimary, fontSize: FONT.sizes.sm, fontWeight: FONT.weights.semibold }}>Change</Text>
          </AnimatedPressable>
        </View>

        {/* Title */}
        <Text style={{ ...SECTION_HEADER_STYLE, marginBottom: SPACING.md }}>
          Title (optional)
        </Text>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="Give your video a name..."
          placeholderTextColor={colors.textMuted}
          style={{
            ...INPUT_STYLE,
            marginBottom: SPACING.lg,
          }}
          maxLength={100}
        />

        {/* Description */}
        <Text style={{ ...SECTION_HEADER_STYLE, marginBottom: SPACING.md }}>
          Description (optional)
        </Text>
        <TextInput
          value={description}
          onChangeText={setDescription}
          placeholder="What's happening in this video?"
          placeholderTextColor={colors.textMuted}
          multiline
          numberOfLines={3}
          style={{
            ...INPUT_STYLE,
            marginBottom: SPACING["3xl"],
            minHeight: 88,
            textAlignVertical: "top",
          }}
          maxLength={300}
        />

        {/* Group selector */}
        <Text style={{ ...SECTION_HEADER_STYLE, marginBottom: SPACING.base }}>
          Post to Challenge
        </Text>

        {/* Filter: All / Private / Public */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginBottom: SPACING.lg }}
          contentContainerStyle={{ gap: SPACING.md }}
        >
          {([
            { key: "all" as const, label: "All", icon: "apps" as const },
            { key: "private" as const, label: "Private", icon: "lock-closed" as const },
            { key: "public" as const, label: "Public", icon: "globe" as const },
          ]).map(({ key, label, icon }) => (
            <AnimatedPressable
              key={key}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setGroupFilter(key);
              }}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: SPACING.sm,
                paddingHorizontal: SPACING.lg,
                paddingVertical: SPACING.base,
                borderRadius: RADIUS.sm,
                backgroundColor: groupFilter === key ? COLORS.brand : colors.glass,
                borderWidth: 1,
                borderColor: groupFilter === key ? COLORS.brand : colors.border,
              }}
            >
              <Ionicons
                name={icon}
                size={14}
                color={groupFilter === key ? colors.textPrimary : colors.textTertiary}
              />
              <Text
                style={{
                  color: groupFilter === key ? colors.textPrimary : colors.textTertiary,
                  fontSize: FONT.sizes.md,
                  fontWeight: FONT.weights.semibold,
                }}
              >
                {label}
              </Text>
            </AnimatedPressable>
          ))}
        </ScrollView>

        {/* Empty state for private only */}
        {groupFilter === "private" && privateGroups.length === 0 && (
          <View style={{ alignItems: "center", paddingVertical: SPACING["3xl"] }}>
            <Ionicons name="lock-closed-outline" size={32} color={colors.textMuted} />
            <Text style={{ color: colors.textTertiary, fontSize: FONT.sizes.base, marginTop: SPACING.md }}>
              You don't have any private challenges yet
            </Text>
          </View>
        )}

        {/* Private groups: flat list */}
        {groupFilter !== "public" && privateGroups.map((group) => (
          <GroupOption
            key={group.id}
            group={group}
            isSelected={selectedGroupId === group.id}
            onSelect={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              setSelectedGroupId(group.id);
            }}
          />
        ))}

        {/* Public groups: organized by category */}
        {groupFilter !== "private" && PUBLIC_CATEGORIES.map((cat) => {
          const catGroups = allPublicGroups.filter((g) => g.category === cat.key);
          return (
            <View key={cat.key} style={{ marginBottom: SPACING.base }}>
              {/* Category header */}
              <View style={{ flexDirection: "row", alignItems: "center", gap: SPACING.md, marginBottom: SPACING.md, paddingVertical: SPACING.xs }}>
                <View
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: RADIUS.xs,
                    backgroundColor: cat.color + "20",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Ionicons name={cat.icon} size={14} color={cat.color} />
                </View>
                <Text style={{ color: colors.textPrimary, fontSize: FONT.sizes.base, fontWeight: FONT.weights.bold }}>
                  {cat.label}
                </Text>
                <Text style={{ color: colors.textMuted, fontSize: FONT.sizes.sm }}>
                  {catGroups.length} challenge{catGroups.length !== 1 ? "s" : ""}
                </Text>
              </View>

              {catGroups.length === 0 ? (
                <View style={{ paddingLeft: 38, paddingBottom: SPACING.xs }}>
                  <Text style={{ color: colors.textMuted, fontSize: FONT.sizes.sm, fontStyle: "italic" }}>
                    No challenges yet
                  </Text>
                </View>
              ) : (
                catGroups.map((group) => (
                  <GroupOption
                    key={group.id}
                    group={group}
                    isSelected={selectedGroupId === group.id}
                    onSelect={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                      setSelectedGroupId(group.id);
                    }}
                  />
                ))
              )}
            </View>
          );
        })}

        {/* Public groups without a category */}
        {groupFilter !== "private" && (() => {
          const uncategorized = allPublicGroups.filter(
            (g) => !g.category || !PUBLIC_CATEGORIES.some((c) => c.key === g.category)
          );
          if (uncategorized.length === 0) return null;
          return uncategorized.map((group) => (
            <GroupOption
              key={group.id}
              group={group}
              isSelected={selectedGroupId === group.id}
              onSelect={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                setSelectedGroupId(group.id);
              }}
            />
          ));
        })()}
      </ScrollView>

      {/* Publish button */}
      <View
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          paddingHorizontal: SPACING["2xl"],
          paddingTop: SPACING.base,
          paddingBottom: Math.max(insets.bottom + 60, 80),
          backgroundColor: colors.bg,
          borderTopWidth: 1,
          borderTopColor: colors.border,
        }}
      >
        <AnimatedPressable
          onPress={handlePublish}
          disabled={isUploading || !selectedGroupId}
          style={{
            borderRadius: RADIUS.md,
            overflow: "hidden",
          }}
        >
          {selectedGroupId ? (
            <LinearGradient
              colors={[...GRADIENTS.brand]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{
                paddingVertical: 18,
                alignItems: "center",
                flexDirection: "row",
                justifyContent: "center",
                gap: SPACING.md,
                borderRadius: RADIUS.md,
              }}
            >
              {isUploading ? (
                <>
                  <ActivityIndicator color="white" />
                  <Text style={{ color: colors.textPrimary, fontSize: FONT.sizes.xl, fontWeight: FONT.weights.bold }}>Uploading...</Text>
                </>
              ) : (
                <>
                  <Ionicons name="arrow-up-circle" size={22} color="white" />
                  <Text style={{ color: colors.textPrimary, fontSize: FONT.sizes.xl, fontWeight: FONT.weights.bold }}>
                    Publish to {selectedGroup?.name ?? "Challenge"}
                  </Text>
                </>
              )}
            </LinearGradient>
          ) : (
            <View
              style={{
                backgroundColor: colors.surface,
                paddingVertical: 18,
                alignItems: "center",
                flexDirection: "row",
                justifyContent: "center",
                gap: SPACING.md,
                borderRadius: RADIUS.md,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              {isUploading ? (
                <>
                  <ActivityIndicator color={colors.textMuted} />
                  <Text style={{ color: colors.textMuted, fontSize: FONT.sizes.xl, fontWeight: FONT.weights.bold }}>Uploading...</Text>
                </>
              ) : (
                <>
                  <Ionicons name="arrow-up-circle" size={22} color={colors.textMuted} />
                  <Text style={{ color: colors.textMuted, fontSize: FONT.sizes.xl, fontWeight: FONT.weights.bold }}>
                    Select a challenge
                  </Text>
                </>
              )}
            </View>
          )}
        </AnimatedPressable>
      </View>
    </View>
  );
}

function GroupOption({
  group,
  isSelected,
  onSelect,
}: {
  group: UploadGroup;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const { colors } = useTheme();
  // For public groups, use category icon/color. For private, derive from name.
  const cat = group.is_public && group.category
    ? PUBLIC_CATEGORIES.find((c) => c.key === group.category)
    : null;

  const GROUP_COLORS = ["#FF2D7D", "#3B82F6", "#EC4899", "#22C55E", "#F59E0B", "#EF4444"];
  let hash = 0;
  for (let i = 0; i < group.name.length; i++) {
    hash = group.name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const fallbackColor = GROUP_COLORS[Math.abs(hash) % GROUP_COLORS.length];
  const avatarColor = cat?.color ?? fallbackColor;

  return (
    <AnimatedPressable
      onPress={onSelect}
      style={{
        ...CARD_STYLE,
        flexDirection: "row",
        alignItems: "center",
        gap: SPACING.lg,
        padding: SPACING.lg,
        marginBottom: SPACING.md,
        backgroundColor: isSelected ? "rgba(255,45,125,0.1)" : CARD_STYLE.backgroundColor,
        borderColor: isSelected ? colors.borderBrand : CARD_STYLE.borderColor,
      }}
    >
      {/* Group avatar */}
      <View
        style={{
          width: 46,
          height: 46,
          borderRadius: RADIUS.md,
          backgroundColor: avatarColor + "20",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {cat ? (
          <Ionicons name={cat.icon} size={20} color={avatarColor} />
        ) : (
          <Text style={{ color: avatarColor, fontSize: FONT.sizes.xl, fontWeight: FONT.weights.extrabold }}>
            {group.name.charAt(0).toUpperCase()}
          </Text>
        )}
      </View>

      {/* Info */}
      <View style={{ flex: 1 }}>
        <Text
          style={{ color: colors.textPrimary, fontSize: FONT.sizes.lg, fontWeight: FONT.weights.bold }}
          numberOfLines={1}
        >
          {group.name}
        </Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: SPACING.sm, marginTop: 3 }}>
          <Ionicons
            name={group.is_public ? "globe" : "lock-closed"}
            size={11}
            color={group.is_public ? COLORS.success : COLORS.brand}
          />
          <Text style={{ color: group.is_public ? COLORS.success : COLORS.brand, fontSize: FONT.sizes.sm, fontWeight: FONT.weights.medium }}>
            {group.is_public ? (cat?.label ?? "Public") : "Private"}
          </Text>
          <Text style={{ color: colors.textMuted }}>·</Text>
          <Ionicons name="people" size={11} color={colors.textTertiary} />
          <Text style={{ color: colors.textTertiary, fontSize: FONT.sizes.sm }}>{group.member_count}</Text>
        </View>
      </View>

      {/* Checkbox */}
      <View
        style={{
          width: 26,
          height: 26,
          borderRadius: 13,
          borderWidth: 2,
          borderColor: isSelected ? COLORS.brand : colors.textMuted,
          backgroundColor: isSelected ? COLORS.brand : "transparent",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {isSelected && <Ionicons name="checkmark" size={16} color="white" />}
      </View>
    </AnimatedPressable>
  );
}
