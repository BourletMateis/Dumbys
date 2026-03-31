import { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  TextInput,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useGroupChallenges } from "@/src/features/groups/useChallenges";
import { useChallengeVideos, useUploadChallengeVideo, type ChallengeVideo } from "@/src/features/groups/useChallengeVideos";
import { useDeleteVideo } from "@/src/features/feed/useDeleteVideo";
import { useLikeCount, useHasLiked, useToggleLike } from "@/src/features/feed/useLikes";
import { useCommentCount } from "@/src/features/feed/useComments";
import { useAuthStore } from "@/src/store/useAuthStore";
import { Avatar } from "@/src/components/ui/Avatar";
import { AnimatedPressable } from "@/src/components/ui/AnimatedPressable";
import { BottomSheet } from "@/src/components/ui/BottomSheet";
import { EmptyState } from "@/src/components/ui/EmptyState";
import {
  PALETTE,
  RADIUS,
  FONT,
  FONT_FAMILY,
  CARD_STYLE,
  INPUT_STYLE,
  SECTION_HEADER_STYLE,
} from "@/src/theme";

function VideoCard({
  video,
  isOwn,
  onDelete,
  onPress,
}: {
  video: ChallengeVideo;
  isOwn: boolean;
  onDelete: () => void;
  onPress: () => void;
}) {
  const router = useRouter();
  const { data: likeCount } = useLikeCount(video.id);
  const { data: hasLiked } = useHasLiked(video.id);
  const toggleLike = useToggleLike(video.id);
  const { data: commentCount } = useCommentCount(video.id);

  return (
    <View style={{ ...CARD_STYLE, overflow: "hidden", marginBottom: 12 }}>
      {/* Thumbnail */}
      <AnimatedPressable onPress={onPress}>
        {video.thumbnail_url ? (
          <View>
            <Image
              source={{ uri: video.thumbnail_url }}
              style={{
                width: "100%",
                height: 220,
                borderTopLeftRadius: RADIUS.xl,
                borderTopRightRadius: RADIUS.xl,
              }}
              contentFit="cover"
            />
            <View
              style={{
                position: "absolute",
                top: 0, left: 0, right: 0, bottom: 0,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <View
                style={{
                  backgroundColor: "rgba(0,0,0,0.35)",
                  width: 56,
                  height: 56,
                  borderRadius: RADIUS.full,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons name="play" size={28} color="#FFFFFF" />
              </View>
            </View>
          </View>
        ) : (
          <View
            style={{
              width: "100%",
              height: 200,
              backgroundColor: "#F5F5F5",
              alignItems: "center",
              justifyContent: "center",
              borderTopLeftRadius: RADIUS.xl,
              borderTopRightRadius: RADIUS.xl,
            }}
          >
            <Ionicons name="play" size={28} color="#BBB" />
          </View>
        )}
      </AnimatedPressable>

      <View style={{ padding: 14 }}>
        {/* Auteur */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 10,
          }}
        >
          <AnimatedPressable
            onPress={() =>
              router.push({ pathname: "/user/[id]", params: { id: video.submitter.id } })
            }
            style={{ flexDirection: "row", alignItems: "center", gap: 10, flex: 1 }}
          >
            <Avatar url={video.submitter.avatar_url} username={video.submitter.username} size={32} />
            <Text
              style={{
                color: "#1A1A1A",
                fontSize: FONT.sizes.base,
                fontFamily: FONT_FAMILY.semibold,
              }}
              numberOfLines={1}
            >
              {video.submitter.username}
            </Text>
          </AnimatedPressable>

          {isOwn && (
            <AnimatedPressable onPress={onDelete} hitSlop={8}>
              <Ionicons name="trash-outline" size={16} color="#F43F5E" />
            </AnimatedPressable>
          )}
        </View>

        {/* Titre vidéo */}
        {video.title && (
          <Text
            style={{
              color: "#1A1A1A",
              fontSize: FONT.sizes.sm,
              fontFamily: FONT_FAMILY.medium,
              marginBottom: 8,
            }}
            numberOfLines={1}
          >
            {video.title}
          </Text>
        )}

        {/* Actions like / comment */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 18 }}>
          <AnimatedPressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              toggleLike.mutate();
            }}
            style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
          >
            <Ionicons
              name={hasLiked ? "heart" : "heart-outline"}
              size={22}
              color={hasLiked ? "#F43F5E" : "#999"}
            />
            {(likeCount ?? 0) > 0 && (
              <Text
                style={{
                  color: hasLiked ? "#F43F5E" : "#999",
                  fontSize: FONT.sizes.sm,
                  fontFamily: FONT_FAMILY.semibold,
                }}
              >
                {likeCount}
              </Text>
            )}
          </AnimatedPressable>

          <AnimatedPressable
            onPress={() =>
              router.push({
                pathname: "/video-comments/[id]",
                params: {
                  id: video.id,
                  thumbnail: video.thumbnail_url ?? "",
                  sourceUrl: video.source_url ?? "",
                  username: video.submitter.username,
                  avatarUrl: video.submitter.avatar_url ?? "",
                },
              })
            }
            style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
          >
            <Ionicons name="chatbubble-outline" size={20} color="#999" />
            {(commentCount ?? 0) > 0 && (
              <Text
                style={{
                  color: "#999",
                  fontSize: FONT.sizes.sm,
                  fontFamily: FONT_FAMILY.semibold,
                }}
              >
                {commentCount}
              </Text>
            )}
          </AnimatedPressable>
        </View>
      </View>
    </View>
  );
}

export default function ChallengeScreen() {
  const { id, groupId } = useLocalSearchParams<{ id: string; groupId: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);

  // On récupère les infos du défi depuis le hook challenges
  const { data: challenges } = useGroupChallenges(groupId ?? "");
  const challenge = challenges?.find((c) => c.id === id);

  const { data: videos, isPending: videosPending } = useChallengeVideos(id!);
  const uploadVideo = useUploadChallengeVideo();
  const deleteVideo = useDeleteVideo();

  const [showUpload, setShowUpload] = useState(false);
  const [pendingUri, setPendingUri] = useState<string | null>(null);
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadDesc, setUploadDesc] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const handlePickVideo = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission requise", "Autorise l'accès à ta galerie.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["videos"],
      quality: 0.8,
      videoMaxDuration: 60,
    });
    if (result.canceled || !result.assets[0]) return;
    setPendingUri(result.assets[0].uri);
    setShowUpload(true);
  };

  const handleRecordVideo = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission requise", "Autorise l'accès à la caméra.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["videos"],
      quality: 0.8,
      videoMaxDuration: 60,
    });
    if (result.canceled || !result.assets[0]) return;
    setPendingUri(result.assets[0].uri);
    setShowUpload(true);
  };

  const doUpload = () => {
    if (!pendingUri) return;
    setIsUploading(true);
    uploadVideo.mutate(
      {
        videoUri: pendingUri,
        challengeId: id!,
        groupId: groupId!,
        title: uploadTitle.trim() || undefined,
        description: uploadDesc.trim() || undefined,
      },
      {
        onSuccess: () => {
          setShowUpload(false);
          setPendingUri(null);
          setUploadTitle("");
          setUploadDesc("");
        },
        onError: (err) => Alert.alert("Erreur upload", err.message),
        onSettled: () => setIsUploading(false),
      },
    );
  };

  const handleDelete = (video: ChallengeVideo) => {
    Alert.alert("Supprimer la vidéo", "Es-tu sûr ?", [
      { text: "Annuler", style: "cancel" },
      {
        text: "Supprimer",
        style: "destructive",
        onPress: () => deleteVideo.mutate({ videoId: video.id, videoPath: video.video_path }),
      },
    ]);
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={{ flex: 1, backgroundColor: "#FFFFFF" }}>

        {/* Header */}
        <View
          style={{
            paddingTop: insets.top + 8,
            paddingBottom: 12,
            paddingHorizontal: 16,
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
          }}
        >
          <AnimatedPressable
            onPress={() => router.back()}
            style={{
              width: 40,
              height: 40,
              borderRadius: RADIUS.sm,
              backgroundColor: "rgba(0,0,0,0.04)",
              alignItems: "center",
              justifyContent: "center",
              borderWidth: 1,
              borderColor: "rgba(0,0,0,0.06)",
            }}
          >
            <Ionicons name="arrow-back" size={22} color="#1A1A1A" />
          </AnimatedPressable>

          <View style={{ flex: 1 }}>
            <Text
              style={{
                color: "#1A1A1A",
                fontSize: FONT.sizes.xl,
                fontFamily: FONT_FAMILY.bold,
              }}
              numberOfLines={1}
            >
              {challenge?.title ?? "Défi"}
            </Text>
            {challenge?.description && (
              <Text
                style={{
                  color: "#999",
                  fontSize: FONT.sizes.sm,
                  fontFamily: FONT_FAMILY.regular,
                }}
                numberOfLines={1}
              >
                {challenge.description}
              </Text>
            )}
          </View>
        </View>

        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Boutons upload */}
          <View style={{ flexDirection: "row", gap: 10, marginBottom: 20 }}>
            <AnimatedPressable
              onPress={handlePickVideo}
              style={{
                flex: 1,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                backgroundColor: "rgba(0,0,0,0.04)",
                paddingVertical: 16,
                borderRadius: RADIUS.lg,
                borderWidth: 1,
                borderColor: "rgba(0,0,0,0.06)",
              }}
            >
              <Ionicons name="images" size={20} color={PALETTE.sarcelle} />
              <Text style={{ color: "#1A1A1A", fontFamily: FONT_FAMILY.semibold }}>Galerie</Text>
            </AnimatedPressable>

            <AnimatedPressable
              onPress={handleRecordVideo}
              style={{
                flex: 1,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                backgroundColor: "rgba(0,0,0,0.04)",
                paddingVertical: 16,
                borderRadius: RADIUS.lg,
                borderWidth: 1,
                borderColor: "rgba(0,0,0,0.06)",
              }}
            >
              <Ionicons name="videocam" size={20} color={PALETTE.fuchsia} />
              <Text style={{ color: "#1A1A1A", fontFamily: FONT_FAMILY.semibold }}>Filmer</Text>
            </AnimatedPressable>
          </View>

          {/* Compteur vidéos */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 12,
            }}
          >
            <Text
              style={{
                color: "#1A1A1A",
                fontSize: FONT.sizes.xl,
                fontFamily: FONT_FAMILY.bold,
              }}
            >
              Vidéos
            </Text>
            <Text
              style={{
                color: "#999",
                fontSize: FONT.sizes.sm,
                fontFamily: FONT_FAMILY.regular,
              }}
            >
              {videos?.length ?? 0} vidéo{(videos?.length ?? 0) !== 1 ? "s" : ""}
            </Text>
          </View>

          {/* Loading */}
          {videosPending && (
            <ActivityIndicator size="large" color={PALETTE.sarcelle} style={{ paddingVertical: 40 }} />
          )}

          {/* Empty */}
          {!videosPending && (videos ?? []).length === 0 && (
            <EmptyState
              icon="videocam-outline"
              title="Aucune vidéo pour ce défi"
              subtitle="Sois le premier à relever le défi !"
            />
          )}

          {/* Liste vidéos */}
          {(videos ?? []).map((video, index) => (
            <VideoCard
              key={video.id}
              video={video}
              isOwn={video.submitter.id === user?.id}
              onDelete={() => handleDelete(video)}
              onPress={() => {
                router.push({
                  pathname: "/feed/challenge/[id]",
                  params: {
                    id: id!,
                    title: challenge?.title ?? "Défi",
                    startIndex: String(index),
                  },
                });
              }}
            />
          ))}
        </ScrollView>

        {/* BottomSheet upload */}
        <BottomSheet
          isOpen={showUpload}
          onClose={() => {
            setShowUpload(false);
            setPendingUri(null);
            setUploadTitle("");
            setUploadDesc("");
          }}
          snapPoint={0.5}
        >
          <View style={{ paddingHorizontal: 20, paddingTop: 8 }}>
            <Text
              style={{
                color: "#1A1A1A",
                fontSize: FONT.sizes["2xl"],
                fontFamily: FONT_FAMILY.bold,
                marginBottom: 20,
              }}
            >
              Poster ma vidéo
            </Text>

            <Text style={{ ...SECTION_HEADER_STYLE, marginBottom: 8 }}>
              Titre (optionnel)
            </Text>
            <TextInput
              value={uploadTitle}
              onChangeText={setUploadTitle}
              placeholder="Donne un nom à ta vidéo..."
              placeholderTextColor="#BBB"
              style={{ ...INPUT_STYLE, marginBottom: 16 }}
              maxLength={100}
            />

            <Text style={{ ...SECTION_HEADER_STYLE, marginBottom: 8 }}>
              Description (optionnel)
            </Text>
            <TextInput
              value={uploadDesc}
              onChangeText={setUploadDesc}
              placeholder="Qu'est-ce qui se passe dans cette vidéo ?"
              placeholderTextColor="#BBB"
              multiline
              numberOfLines={3}
              style={{
                ...INPUT_STYLE,
                marginBottom: 24,
                minHeight: 80,
                textAlignVertical: "top",
              }}
              maxLength={300}
            />

            <AnimatedPressable
              onPress={doUpload}
              disabled={isUploading}
              style={{
                backgroundColor: PALETTE.sarcelle,
                paddingVertical: 16,
                borderRadius: RADIUS.md,
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
                  <Ionicons name="arrow-up-circle" size={20} color="#FFFFFF" />
                  <Text style={{ color: "#FFFFFF", fontSize: FONT.sizes.lg, fontFamily: FONT_FAMILY.bold }}>
                    Publier
                  </Text>
                </>
              )}
            </AnimatedPressable>
          </View>
        </BottomSheet>
      </View>
    </>
  );
}
