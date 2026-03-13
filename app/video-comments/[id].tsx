import { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  Pressable,
  TextInput,
  FlatList,
  ActivityIndicator,
  Alert,
  Keyboard,
  Platform,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLikeCount, useHasLiked, useToggleLike } from "@/src/features/feed/useLikes";
import { useComments, useAddComment, useDeleteComment, type Comment } from "@/src/features/feed/useComments";
import { useAuthStore } from "@/src/store/useAuthStore";
import { Avatar } from "@/src/components/ui/Avatar";
import { COLORS, GRADIENTS, RADIUS, FONT, FONT_FAMILY } from "@/src/theme";
import { useTheme } from "@/src/providers/ThemeProvider";

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  return `${days}d`;
}

function useKeyboardHeight() {
  const height = useSharedValue(0);

  useEffect(() => {
    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const showSub = Keyboard.addListener(showEvent, (e) => {
      height.value = withTiming(e.endCoordinates.height, { duration: Platform.OS === "ios" ? 250 : 150 });
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      height.value = withTiming(0, { duration: Platform.OS === "ios" ? 250 : 150 });
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  return height;
}

function CommentRow({
  comment,
  isOwn,
  onDelete,
}: {
  comment: Comment;
  isOwn: boolean;
  onDelete: () => void;
}) {
  const { colors } = useTheme();
  const router = useRouter();
  const goToProfile = () => router.push({ pathname: "/user/[id]", params: { id: comment.user.id } });

  return (
    <View style={{ flexDirection: "row", paddingHorizontal: 16, paddingVertical: 12 }}>
      <Pressable onPress={goToProfile}>
        <Avatar url={comment.user.avatar_url} username={comment.user.username} size={34} />
      </Pressable>
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={{ color: colors.textPrimary, fontSize: FONT.sizes.base }}>
          <Text style={{ fontWeight: FONT.weights.bold }} onPress={goToProfile}>{comment.user.username}</Text>
          {"  "}
          <Text style={{ color: colors.textPrimary, fontWeight: FONT.weights.regular }}>{comment.text}</Text>
        </Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 16, marginTop: 4 }}>
          <Text style={{ color: colors.textTertiary, fontSize: FONT.sizes.sm }}>{timeAgo(comment.created_at)}</Text>
          {isOwn && (
            <Pressable onPress={onDelete} hitSlop={8}>
              <Text style={{ color: COLORS.error, fontSize: FONT.sizes.sm, fontWeight: FONT.weights.medium }}>Delete</Text>
            </Pressable>
          )}
        </View>
      </View>
    </View>
  );
}

export default function VideoCommentsScreen() {
  const { colors } = useTheme();
  const {
    id: videoId,
    username,
    avatarUrl,
  } = useLocalSearchParams<{
    id: string;
    thumbnail: string;
    sourceUrl: string;
    username: string;
    avatarUrl: string;
  }>();

  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const insets = useSafeAreaInsets();
  const inputRef = useRef<TextInput>(null);
  const listRef = useRef<FlatList>(null);
  const [commentText, setCommentText] = useState("");
  const keyboardHeight = useKeyboardHeight();

  const { data: likeCount } = useLikeCount(videoId!);
  const { data: hasLiked } = useHasLiked(videoId!);
  const toggleLike = useToggleLike(videoId!);
  const { data: comments, isPending } = useComments(videoId!);
  const addComment = useAddComment(videoId!);
  const deleteComment = useDeleteComment(videoId!);

  const handleLike = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    toggleLike.mutate();
  };

  const handleSend = () => {
    const text = commentText.trim();
    if (!text) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    addComment.mutate(text, {
      onSuccess: () => {
        setCommentText("");
        listRef.current?.scrollToEnd({ animated: true });
      },
      onError: (err) => Alert.alert("Error", err.message),
    });
  };

  const handleDeleteComment = (commentId: string) => {
    Alert.alert("Delete comment", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => deleteComment.mutate(commentId),
      },
    ]);
  };

  const hasText = commentText.trim().length > 0;

  // Animated padding that moves input above keyboard
  const animatedBottomStyle = useAnimatedStyle(() => ({
    paddingBottom: keyboardHeight.value > 0
      ? keyboardHeight.value - insets.bottom
      : insets.bottom || 10,
  }));

  return (
    <>
      <Stack.Screen
        options={{
          title: "Comments",
          headerStyle: { backgroundColor: colors.elevated },
          headerTintColor: colors.textPrimary,
          headerShadowVisible: false,
          headerLeft: () => (
            <Pressable onPress={() => router.back()} hitSlop={8} style={{ marginLeft: 4 }}>
              <Ionicons name="close" size={26} color={colors.textSecondary} />
            </Pressable>
          ),
        }}
      />
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        <FlatList
          ref={listRef}
          data={comments ?? []}
          keyExtractor={(item) => item.id}
          keyboardDismissMode="interactive"
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={
            <View>
              {/* Like bar */}
              <View
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  borderBottomWidth: 1,
                  borderBottomColor: colors.border,
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                  <Avatar url={avatarUrl} username={username ?? "?"} size={28} />
                  <Text style={{ color: colors.textPrimary, fontSize: FONT.sizes.base, fontWeight: FONT.weights.semibold }}>
                    {username}
                  </Text>
                </View>

                <Pressable onPress={handleLike} style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <Ionicons
                    name={hasLiked ? "heart" : "heart-outline"}
                    size={22}
                    color={hasLiked ? COLORS.error : colors.textTertiary}
                  />
                  <Text style={{ color: hasLiked ? COLORS.error : colors.textTertiary, fontSize: FONT.sizes.md, fontWeight: FONT.weights.semibold }}>
                    {likeCount ?? 0}
                  </Text>
                </Pressable>
              </View>

              {/* Comments header */}
              <View style={{ paddingHorizontal: 16, paddingVertical: 12 }}>
                <Text style={{ color: colors.textPrimary, fontSize: FONT.sizes.lg, fontWeight: FONT.weights.bold }}>
                  Comments ({(comments ?? []).length})
                </Text>
              </View>

              {isPending && (
                <View style={{ alignItems: "center", paddingVertical: 32 }}>
                  <ActivityIndicator color={COLORS.brand} />
                </View>
              )}

              {!isPending && (comments ?? []).length === 0 && (
                <View style={{ alignItems: "center", paddingVertical: 32, paddingHorizontal: 32 }}>
                  <Ionicons name="chatbubble-outline" size={36} color={colors.textMuted} />
                  <Text style={{ color: colors.textTertiary, fontSize: FONT.sizes.base, marginTop: 8 }}>
                    Be the first to comment!
                  </Text>
                </View>
              )}
            </View>
          }
          renderItem={({ item }) => (
            <CommentRow
              comment={item}
              isOwn={item.user.id === user?.id}
              onDelete={() => handleDeleteComment(item.id)}
            />
          )}
          contentContainerStyle={{ paddingBottom: 16 }}
        />

        {/* Input bar — animated padding pushes it above keyboard */}
        <Animated.View
          style={[
            {
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
              paddingHorizontal: 16,
              paddingTop: 10,
              backgroundColor: colors.elevated,
              borderTopWidth: 1,
              borderTopColor: colors.border,
            },
            animatedBottomStyle,
          ]}
        >
          <TextInput
            ref={inputRef}
            value={commentText}
            onChangeText={setCommentText}
            placeholder="Add a comment..."
            placeholderTextColor={colors.textMuted}
            style={{
              flex: 1,
              backgroundColor: colors.glassLight,
              color: colors.textPrimary,
              paddingHorizontal: 16,
              paddingVertical: 10,
              borderRadius: RADIUS.full,
              fontSize: FONT.sizes.base,
            }}
            maxLength={500}
            onSubmitEditing={handleSend}
            returnKeyType="send"
          />
          {hasText ? (
            <Pressable
              onPress={handleSend}
              disabled={addComment.isPending}
            >
              <LinearGradient
                colors={GRADIENTS.brand as unknown as string[]}
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: RADIUS.full,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {addComment.isPending ? (
                  <ActivityIndicator size="small" color={colors.textPrimary} />
                ) : (
                  <Ionicons name="arrow-up" size={20} color={colors.textPrimary} />
                )}
              </LinearGradient>
            </Pressable>
          ) : (
            <View
              style={{
                width: 38,
                height: 38,
                borderRadius: RADIUS.full,
                backgroundColor: colors.glass,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons name="arrow-up" size={20} color={colors.textMuted} />
            </View>
          )}
        </Animated.View>
      </View>
    </>
  );
}
