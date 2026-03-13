import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  ScrollView,
  FlatList,
} from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { useSearchUsers } from "@/src/features/friends/useSearchUsers";
import { useFriendships } from "@/src/features/friends/useFriendships";
import {
  useSendRequest,
  useAcceptRequest,
  useRemoveFriendship,
} from "@/src/features/friends/useFriendActions";
import { useSuggestedFriends, type SuggestedUser } from "@/src/features/friends/useSuggestedFriends";
import { UserSearchResult } from "@/src/features/friends/UserSearchResult";
import { EmptyState } from "@/src/components/ui/EmptyState";
import { Avatar } from "@/src/components/ui/Avatar";
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
} from "@/src/theme";
import { useTheme } from "@/src/providers/ThemeProvider";
import type { FriendshipWithUser } from "@/src/features/friends/useFriendships";
import type { UserRow } from "@/src/features/friends/useSearchUsers";

type FriendStatus = "none" | "pending_sent" | "pending_received" | "accepted";

export default function FriendsScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchInput.trim()), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const isSearching = debouncedSearch.length >= 2;

  const {
    data: searchResults,
    isPending: searchPending,
    isError: searchError,
  } = useSearchUsers(debouncedSearch);

  const {
    data: friendships,
    isPending: friendsPending,
    isError: friendsError,
    refetch: refetchFriends,
  } = useFriendships();

  const { data: suggestions } = useSuggestedFriends();

  const sendRequest = useSendRequest();
  const acceptRequest = useAcceptRequest();
  const removeFriendship = useRemoveFriendship();

  const getFriendStatus = useCallback(
    (userId: string): { status: FriendStatus; friendshipId?: string } => {
      if (!friendships) return { status: "none" };
      const accepted = friendships.accepted.find((f) => f.otherUser.id === userId);
      if (accepted) return { status: "accepted", friendshipId: accepted.id };
      const sent = friendships.pendingSent.find((f) => f.otherUser.id === userId);
      if (sent) return { status: "pending_sent", friendshipId: sent.id };
      const received = friendships.pendingReceived.find((f) => f.otherUser.id === userId);
      if (received) return { status: "pending_received", friendshipId: received.id };
      return { status: "none" };
    },
    [friendships],
  );

  const renderSearchItem = useCallback(
    ({ item }: { item: UserRow }) => {
      const { status } = getFriendStatus(item.id);
      return (
        <UserSearchResult
          user={item}
          status={status}
          onAdd={() => sendRequest.mutate(item.id)}
          isLoading={sendRequest.isPending && sendRequest.variables === item.id}
        />
      );
    },
    [getFriendStatus, sendRequest],
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      {/* Header */}
      <View style={{ paddingTop: insets.top + 12, paddingHorizontal: SPACING["2xl"], paddingBottom: SPACING.lg }}>
        <Text
          style={{
            color: colors.textPrimary,
            fontSize: FONT.sizes["4xl"],
            fontFamily: FONT_FAMILY.extrabold,
            marginBottom: SPACING.lg,
          }}
        >
          Friends
        </Text>
        {/* Search */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: INPUT_STYLE.backgroundColor,
            borderRadius: RADIUS.md,
            borderWidth: 1,
            borderColor: colors.border,
            paddingHorizontal: SPACING.lg,
            gap: SPACING.base,
          }}
        >
          <Ionicons name="search" size={18} color={colors.textTertiary} />
          <TextInput
            value={searchInput}
            onChangeText={setSearchInput}
            placeholder="Search users..."
            placeholderTextColor={colors.textMuted}
            autoCapitalize="none"
            autoCorrect={false}
            style={{
              flex: 1,
              color: colors.textPrimary,
              fontSize: FONT.sizes.lg,
              paddingVertical: 14,
            }}
          />
          {searchInput.length > 0 && (
            <Pressable onPress={() => setSearchInput("")}>
              <Ionicons name="close-circle" size={18} color={colors.textTertiary} />
            </Pressable>
          )}
        </View>
      </View>

      {/* Search Mode */}
      {isSearching && (
        <View style={{ flex: 1 }}>
          {searchPending && (
            <View style={{ alignItems: "center", paddingVertical: SPACING["4xl"] }}>
              <ActivityIndicator size="large" color={COLORS.brand} />
            </View>
          )}
          {searchError && (
            <Text style={{ color: COLORS.error, textAlign: "center", paddingVertical: SPACING.lg }}>
              Search failed. Try again.
            </Text>
          )}
          {!searchPending && !searchError && searchResults?.length === 0 && (
            <EmptyState
              icon="search"
              title="No users found"
              subtitle={`No results for "${debouncedSearch}"`}
            />
          )}
          {!searchPending && !searchError && searchResults && searchResults.length > 0 && (
            <FlatList
              data={searchResults}
              keyExtractor={(item) => item.id}
              renderItem={renderSearchItem}
            />
          )}
        </View>
      )}

      {/* Default Mode */}
      {!isSearching && (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
        >
          {friendsPending && (
            <View style={{ alignItems: "center", paddingVertical: SPACING["4xl"] }}>
              <ActivityIndicator size="large" color={COLORS.brand} />
            </View>
          )}
          {friendsError && (
            <Text style={{ color: COLORS.error, textAlign: "center", paddingVertical: SPACING.lg }}>
              Failed to load friends.
            </Text>
          )}
          {!friendsPending && !friendsError && friendships && (
            <>
              {/* Suggestions section */}
              {suggestions && suggestions.length > 0 && (
                <>
                  <View style={{ paddingHorizontal: SPACING["2xl"], paddingTop: SPACING.md, paddingBottom: SPACING.base }}>
                    <Text style={SECTION_HEADER_STYLE}>
                      Suggestions
                    </Text>
                  </View>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingHorizontal: SPACING["2xl"], gap: SPACING.base }}
                    style={{ marginBottom: SPACING["2xl"] }}
                  >
                    {suggestions.map((user) => {
                      const { status } = getFriendStatus(user.id);
                      return (
                        <AnimatedPressable
                          key={user.id}
                          onPress={() => {
                            if (status === "none") {
                              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                              sendRequest.mutate(user.id);
                            }
                          }}
                          style={{
                            width: 110,
                            alignItems: "center",
                            backgroundColor: colors.glass,
                            borderRadius: RADIUS.lg,
                            paddingVertical: SPACING.xl,
                            paddingHorizontal: SPACING.md,
                            borderWidth: 1,
                            borderColor: colors.border,
                          }}
                        >
                          <Avatar url={user.avatar_url} username={user.username} size={60} />
                          <Text
                            style={{
                              color: colors.textPrimary,
                              fontSize: FONT.sizes.md,
                              fontWeight: FONT.weights.semibold,
                              marginTop: SPACING.base,
                              textAlign: "center",
                            }}
                            numberOfLines={1}
                          >
                            {user.username}
                          </Text>
                          <Text
                            style={{
                              color: colors.textTertiary,
                              fontSize: FONT.sizes.xs,
                              marginTop: SPACING.xs,
                            }}
                          >
                            {user.shared_groups} shared
                          </Text>
                          {status === "none" && (
                            <View style={{ borderRadius: RADIUS.sm, overflow: "hidden", marginTop: SPACING.base }}>
                              <LinearGradient
                                colors={[...GRADIENTS.brand]}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={{
                                  paddingHorizontal: 16,
                                  paddingVertical: 6,
                                }}
                              >
                                <Text style={{ color: colors.textPrimary, fontSize: FONT.sizes.xs, fontWeight: FONT.weights.bold }}>Add</Text>
                              </LinearGradient>
                            </View>
                          )}
                          {status === "pending_sent" && (
                            <View
                              style={{
                                backgroundColor: colors.glass,
                                paddingHorizontal: 16,
                                paddingVertical: 6,
                                borderRadius: RADIUS.sm,
                                marginTop: SPACING.base,
                                borderWidth: 1,
                                borderColor: colors.border,
                              }}
                            >
                              <Text style={{ color: colors.textMuted, fontSize: FONT.sizes.xs, fontWeight: FONT.weights.semibold }}>Sent</Text>
                            </View>
                          )}
                        </AnimatedPressable>
                      );
                    })}
                  </ScrollView>
                </>
              )}

              {/* Friend Requests - horizontal cards */}
              {friendships.pendingReceived.length > 0 && (
                <>
                  <View style={{ paddingHorizontal: SPACING["2xl"], paddingBottom: SPACING.base }}>
                    <Text style={SECTION_HEADER_STYLE}>
                      Friend Requests ({friendships.pendingReceived.length})
                    </Text>
                  </View>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingHorizontal: SPACING["2xl"], gap: SPACING.base }}
                    style={{ marginBottom: SPACING["2xl"] }}
                  >
                    {friendships.pendingReceived.map((item) => (
                      <View
                        key={item.id}
                        style={{
                          width: 150,
                          alignItems: "center",
                          backgroundColor: colors.glass,
                          borderRadius: RADIUS.lg,
                          paddingVertical: SPACING.xl,
                          paddingHorizontal: SPACING.base,
                          borderWidth: 1,
                          borderColor: colors.borderBrand,
                        }}
                      >
                        <Avatar url={item.otherUser.avatar_url} username={item.otherUser.username} size={60} />
                        <Text
                          style={{
                            color: colors.textPrimary,
                            fontSize: FONT.sizes.base,
                            fontWeight: FONT.weights.semibold,
                            marginTop: SPACING.base,
                            textAlign: "center",
                          }}
                          numberOfLines={1}
                        >
                          {item.otherUser.username}
                        </Text>
                        <View style={{ flexDirection: "row", gap: SPACING.md, marginTop: SPACING.base }}>
                          <AnimatedPressable
                            onPress={() => {
                              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                              acceptRequest.mutate(item.id);
                            }}
                            disabled={acceptRequest.isPending && acceptRequest.variables === item.id}
                            style={{
                              backgroundColor: COLORS.success,
                              paddingHorizontal: 16,
                              paddingVertical: 8,
                              borderRadius: RADIUS.sm,
                            }}
                          >
                            {acceptRequest.isPending && acceptRequest.variables === item.id ? (
                              <ActivityIndicator color="white" size="small" />
                            ) : (
                              <Text style={{ color: colors.textPrimary, fontSize: FONT.sizes.sm, fontWeight: FONT.weights.bold }}>Accept</Text>
                            )}
                          </AnimatedPressable>
                          <AnimatedPressable
                            onPress={() => {
                              Haptics.selectionAsync();
                              removeFriendship.mutate(item.id);
                            }}
                            disabled={removeFriendship.isPending && removeFriendship.variables === item.id}
                            style={{
                              backgroundColor: colors.glass,
                              paddingHorizontal: 16,
                              paddingVertical: 8,
                              borderRadius: RADIUS.sm,
                              borderWidth: 1,
                              borderColor: colors.border,
                            }}
                          >
                            <Text style={{ color: colors.textTertiary, fontSize: FONT.sizes.sm, fontWeight: FONT.weights.semibold }}>Deny</Text>
                          </AnimatedPressable>
                        </View>
                      </View>
                    ))}
                  </ScrollView>
                </>
              )}

              {/* Sent Requests */}
              {friendships.pendingSent.length > 0 && (
                <>
                  <View style={{ paddingHorizontal: SPACING["2xl"], paddingTop: SPACING.xs, paddingBottom: SPACING.md }}>
                    <Text style={SECTION_HEADER_STYLE}>
                      Sent Requests
                    </Text>
                  </View>
                  {friendships.pendingSent.map((item) => (
                    <View
                      key={item.id}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        paddingHorizontal: SPACING["2xl"],
                        paddingVertical: SPACING.base,
                        gap: SPACING.base,
                      }}
                    >
                      <Avatar
                        url={item.otherUser.avatar_url}
                        username={item.otherUser.username}
                        size={48}
                      />
                      <Text
                        style={{
                          flex: 1,
                          color: colors.textPrimary,
                          fontSize: FONT.sizes.lg,
                          fontWeight: FONT.weights.semibold,
                        }}
                        numberOfLines={1}
                      >
                        {item.otherUser.username}
                      </Text>
                      <View
                        style={{
                          backgroundColor: colors.glass,
                          paddingHorizontal: 16,
                          paddingVertical: 8,
                          borderRadius: RADIUS.sm,
                          borderWidth: 1,
                          borderColor: colors.border,
                        }}
                      >
                        <Text style={{ color: colors.textMuted, fontSize: FONT.sizes.md, fontWeight: FONT.weights.semibold }}>
                          Pending
                        </Text>
                      </View>
                    </View>
                  ))}
                </>
              )}

              {/* Friends list */}
              <View style={{ paddingHorizontal: SPACING["2xl"], paddingTop: SPACING.xs, paddingBottom: SPACING.md }}>
                <Text style={SECTION_HEADER_STYLE}>
                  Friends ({friendships.accepted.length})
                </Text>
              </View>

              {friendships.accepted.length === 0 && (
                <EmptyState
                  icon="people-outline"
                  title="No friends yet"
                  subtitle="Search for users above to add your first friends!"
                />
              )}

              {friendships.accepted.map((item) => (
                <Pressable
                  key={item.id}
                  onPress={() => router.push({ pathname: "/user/[id]", params: { id: item.otherUser.id } })}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingHorizontal: SPACING["2xl"],
                    paddingVertical: SPACING.base,
                    gap: SPACING.lg,
                  }}
                >
                  <View style={{ position: "relative" }}>
                    <Avatar
                      url={item.otherUser.avatar_url}
                      username={item.otherUser.username}
                      size={64}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        color: colors.textPrimary,
                        fontSize: FONT.sizes.lg,
                        fontWeight: FONT.weights.semibold,
                      }}
                      numberOfLines={1}
                    >
                      {item.otherUser.username}
                    </Text>
                    <Text
                      style={{
                        color: colors.textTertiary,
                        fontSize: FONT.sizes.sm,
                        marginTop: 2,
                      }}
                    >
                      Friends
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => {
                      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                      removeFriendship.mutate(item.id);
                    }}
                    disabled={removeFriendship.isPending && removeFriendship.variables === item.id}
                    hitSlop={8}
                    style={{
                      backgroundColor: "rgba(244,63,94,0.1)",
                      paddingHorizontal: 16,
                      paddingVertical: 9,
                      borderRadius: RADIUS.sm,
                      borderWidth: 1,
                      borderColor: "rgba(244,63,94,0.15)",
                    }}
                  >
                    {removeFriendship.isPending && removeFriendship.variables === item.id ? (
                      <ActivityIndicator size="small" color={COLORS.error} />
                    ) : (
                      <Text style={{ color: COLORS.error, fontSize: FONT.sizes.md, fontWeight: FONT.weights.semibold }}>Remove</Text>
                    )}
                  </Pressable>
                </Pressable>
              ))}
            </>
          )}
        </ScrollView>
      )}
    </View>
  );
}
