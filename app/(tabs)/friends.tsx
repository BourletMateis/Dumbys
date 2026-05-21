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
import { useSuggestedFriends } from "@/src/features/friends/useSuggestedFriends";
import { UserSearchResult } from "@/src/features/friends/UserSearchResult";
import { Avatar } from "@/src/components/ui/Avatar";
import { AnimatedPressable } from "@/src/components/ui/AnimatedPressable";
import { PALETTE, RADIUS, FONT, FONT_FAMILY, SPACING } from "@/src/theme";
import { useTheme } from "@/src/providers/ThemeProvider";
import type { UserRow } from "@/src/features/friends/useSearchUsers";

type FriendStatus = "none" | "pending_sent" | "pending_received" | "accepted";

// ─── Decorative blob ────────────────────────────────────────────
function Blob({ size, color, top, left, right, bottom }: {
  size: number; color: string;
  top?: number; left?: number; right?: number; bottom?: number;
}) {
  return (
    <View
      style={{
        position: "absolute",
        width: size, height: size, borderRadius: size / 2,
        backgroundColor: color, opacity: 0.12,
        top, left, right, bottom,
      }}
    />
  );
}

export default function FriendsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchInput.trim()), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const isSearching = debouncedSearch.length >= 2;

  const { data: searchResults, isPending: searchPending } = useSearchUsers(debouncedSearch);
  const { data: friendships, isPending: friendsPending } = useFriendships();
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

  const pendingCount = friendships?.pendingReceived.length ?? 0;
  const friendsCount = friendships?.accepted.length ?? 0;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Blob size={180} color={PALETTE.sarcelle} top={-40} right={-50} />
      <Blob size={120} color={PALETTE.fuchsia} bottom={200} left={-40} />

      {/* ─── Header ──────────────────────────────────────────── */}
      <View style={{ paddingTop: insets.top + 8, paddingHorizontal: 20, paddingBottom: 12 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <Text style={{ fontSize: FONT.sizes["4xl"], fontFamily: FONT_FAMILY.extrabold, color: colors.textPrimary }}>
            Amis
          </Text>
          <View style={{ flexDirection: "row", gap: 12, alignItems: "center" }}>
            {pendingCount > 0 && (
              <View
                style={{
                  backgroundColor: PALETTE.fuchsia,
                  width: 24, height: 24, borderRadius: 12,
                  alignItems: "center", justifyContent: "center",
                }}
              >
                <Text style={{ color: "#FFF", fontSize: FONT.sizes.xs, fontFamily: FONT_FAMILY.bold }}>
                  {pendingCount}
                </Text>
              </View>
            )}
            <Pressable hitSlop={8}>
              <Ionicons name="person-add-outline" size={22} color={colors.textSecondary} />
            </Pressable>
          </View>
        </View>

        {/* Search bar */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "#F2F2F2",
            borderRadius: 14,
            paddingHorizontal: 14,
            gap: 10,
          }}
        >
          <Ionicons name="search" size={18} color={colors.textTertiary} />
          <TextInput
            value={searchInput}
            onChangeText={setSearchInput}
            placeholder="Rechercher un ami..."
            placeholderTextColor={colors.textMuted}
            autoCapitalize="none"
            autoCorrect={false}
            style={{
              flex: 1,
              color: colors.textPrimary,
              fontSize: FONT.sizes.lg,
              fontFamily: FONT_FAMILY.regular,
              paddingVertical: 12,
            }}
          />
          {searchInput.length > 0 && (
            <Pressable onPress={() => setSearchInput("")}>
              <Ionicons name="close-circle" size={18} color={colors.textTertiary} />
            </Pressable>
          )}
        </View>
      </View>

      {/* ─── Search Mode ─────────────────────────────────────── */}
      {isSearching ? (
        <View style={{ flex: 1 }}>
          {searchPending && (
            <View style={{ alignItems: "center", paddingVertical: 40 }}>
              <ActivityIndicator size="large" color={PALETTE.sarcelle} />
            </View>
          )}
          {!searchPending && searchResults?.length === 0 && (
            <View style={{ alignItems: "center", paddingVertical: 40 }}>
              <Ionicons name="search-outline" size={48} color={colors.textMuted} />
              <Text style={{ color: colors.textTertiary, fontSize: FONT.sizes.lg, fontFamily: FONT_FAMILY.semibold, marginTop: 12 }}>
                Aucun résultat
              </Text>
              <Text style={{ color: colors.textMuted, fontSize: FONT.sizes.base, fontFamily: FONT_FAMILY.regular, marginTop: 4 }}>
                {`Pas de résultat pour "${debouncedSearch}"`}
              </Text>
            </View>
          )}
          {!searchPending && searchResults && searchResults.length > 0 && (
            <FlatList
              data={searchResults}
              keyExtractor={(item) => item.id}
              renderItem={renderSearchItem}
              contentContainerStyle={{ paddingBottom: 160 }}
            />
          )}
        </View>
      ) : (
        /* ─── Default Mode ─────────────────────────────────── */
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 160 }}
          showsVerticalScrollIndicator={false}
        >
          {friendsPending ? (
            <View style={{ alignItems: "center", paddingVertical: 40 }}>
              <ActivityIndicator size="large" color={PALETTE.sarcelle} />
            </View>
          ) : friendships ? (
            <>
              {/* ── Suggestions ── */}
              {suggestions && suggestions.length > 0 && (
                <View style={{ marginBottom: 24 }}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, marginBottom: 14 }}>
                    <Text style={{ fontSize: FONT.sizes.xl, fontFamily: FONT_FAMILY.extrabold, color: colors.textPrimary }}>
                      {"Suggestions 💡"}
                    </Text>
                    <Pressable>
                      <Text style={{ fontSize: FONT.sizes.sm, fontFamily: FONT_FAMILY.bold, color: PALETTE.sarcelle, textTransform: "uppercase" }}>
                        VOIR TOUT
                      </Text>
                    </Pressable>
                  </View>

                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}
                  >
                    {suggestions.map((user) => {
                      const { status } = getFriendStatus(user.id);
                      return (
                        <View
                          key={user.id}
                          style={{
                            width: 130,
                            alignItems: "center",
                            backgroundColor: colors.card,
                            borderRadius: 20,
                            paddingVertical: 20,
                            paddingHorizontal: 10,
                            borderWidth: 1,
                            borderColor: colors.border,
                            shadowColor: "#000",
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: isDark ? 0 : 0.04,
                            shadowRadius: 8,
                            elevation: isDark ? 0 : 2,
                          }}
                        >
                          <Avatar url={user.avatar_url} username={user.username} size={56} />
                          <Text
                            style={{
                              fontSize: FONT.sizes.base,
                              fontFamily: FONT_FAMILY.bold,
                              color: colors.textPrimary,
                              marginTop: 10,
                              textAlign: "center",
                            }}
                            numberOfLines={1}
                          >
                            {user.username}
                          </Text>
                          <Text style={{ fontSize: FONT.sizes.xs, fontFamily: FONT_FAMILY.regular, color: colors.textTertiary, marginTop: 2 }}>
                            {user.shared_groups} groupe{user.shared_groups !== 1 ? "s" : ""} en commun
                          </Text>

                          {status === "none" && (
                            <AnimatedPressable
                              onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                                sendRequest.mutate(user.id);
                              }}
                              style={{
                                backgroundColor: PALETTE.sarcelle,
                                paddingHorizontal: 20,
                                paddingVertical: 7,
                                borderRadius: 14,
                                marginTop: 12,
                              }}
                            >
                              <Text style={{ color: "#FFF", fontSize: FONT.sizes.xs, fontFamily: FONT_FAMILY.bold }}>
                                Ajouter
                              </Text>
                            </AnimatedPressable>
                          )}
                          {status === "pending_sent" && (
                            <View
                              style={{
                                backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "#F2F2F2",
                                paddingHorizontal: 20,
                                paddingVertical: 7,
                                borderRadius: 14,
                                marginTop: 12,
                              }}
                            >
                              <Text style={{ color: colors.textTertiary, fontSize: FONT.sizes.xs, fontFamily: FONT_FAMILY.semibold }}>
                                Envoyé
                              </Text>
                            </View>
                          )}
                        </View>
                      );
                    })}
                  </ScrollView>
                </View>
              )}

              {/* ── Demandes d'amis ── */}
              {friendships.pendingReceived.length > 0 && (
                <View style={{ marginBottom: 24 }}>
                  <View style={{ paddingHorizontal: 20, marginBottom: 14 }}>
                    <Text style={{ fontSize: FONT.sizes.xl, fontFamily: FONT_FAMILY.extrabold, color: colors.textPrimary }}>
                      {"Demandes reçues 🔔"}
                    </Text>
                  </View>

                  {friendships.pendingReceived.map((item) => (
                    <View
                      key={item.id}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        marginHorizontal: 20,
                        marginBottom: 10,
                        backgroundColor: colors.card,
                        borderRadius: 16,
                        padding: 14,
                        borderWidth: 1,
                        borderColor: PALETTE.sarcelle + "25",
                        shadowColor: "#000",
                        shadowOffset: { width: 0, height: 1 },
                        shadowOpacity: isDark ? 0 : 0.03,
                        shadowRadius: 4,
                        elevation: isDark ? 0 : 1,
                      }}
                    >
                      <Avatar url={item.otherUser.avatar_url} username={item.otherUser.username} size={48} />
                      <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text style={{ fontSize: FONT.sizes.lg, fontFamily: FONT_FAMILY.bold, color: colors.textPrimary }} numberOfLines={1}>
                          {item.otherUser.username}
                        </Text>
                        <Text style={{ fontSize: FONT.sizes.xs, fontFamily: FONT_FAMILY.regular, color: colors.textTertiary, marginTop: 2 }}>
                          Veut devenir ton ami
                        </Text>
                      </View>
                      <View style={{ flexDirection: "row", gap: 8 }}>
                        <AnimatedPressable
                          onPress={() => {
                            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                            acceptRequest.mutate(item.id);
                          }}
                          disabled={acceptRequest.isPending && acceptRequest.variables === item.id}
                          style={{
                            backgroundColor: PALETTE.sarcelle,
                            paddingHorizontal: 14,
                            paddingVertical: 8,
                            borderRadius: 12,
                          }}
                        >
                          {acceptRequest.isPending && acceptRequest.variables === item.id ? (
                            <ActivityIndicator color="#FFF" size="small" />
                          ) : (
                            <Ionicons name="checkmark" size={18} color="#FFF" />
                          )}
                        </AnimatedPressable>
                        <AnimatedPressable
                          onPress={() => {
                            Haptics.selectionAsync();
                            removeFriendship.mutate(item.id);
                          }}
                          disabled={removeFriendship.isPending && removeFriendship.variables === item.id}
                          style={{
                            backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "#F2F2F2",
                            paddingHorizontal: 14,
                            paddingVertical: 8,
                            borderRadius: 12,
                          }}
                        >
                          <Ionicons name="close" size={18} color={colors.textTertiary} />
                        </AnimatedPressable>
                      </View>
                    </View>
                  ))}
                </View>
              )}

              {/* ── Demandes envoyées ── */}
              {friendships.pendingSent.length > 0 && (
                <View style={{ marginBottom: 24 }}>
                  <View style={{ paddingHorizontal: 20, marginBottom: 14 }}>
                    <Text style={{ fontSize: FONT.sizes.xl, fontFamily: FONT_FAMILY.extrabold, color: colors.textPrimary }}>
                      Envoyées
                    </Text>
                  </View>
                  {friendships.pendingSent.map((item) => (
                    <View
                      key={item.id}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        marginHorizontal: 20,
                        marginBottom: 8,
                        paddingVertical: 10,
                      }}
                    >
                      <Avatar url={item.otherUser.avatar_url} username={item.otherUser.username} size={44} />
                      <Text
                        style={{ flex: 1, marginLeft: 12, fontSize: FONT.sizes.lg, fontFamily: FONT_FAMILY.semibold, color: colors.textPrimary }}
                        numberOfLines={1}
                      >
                        {item.otherUser.username}
                      </Text>
                      <View
                        style={{
                          backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "#F2F2F2",
                          paddingHorizontal: 14,
                          paddingVertical: 6,
                          borderRadius: 12,
                        }}
                      >
                        <Text style={{ color: colors.textTertiary, fontSize: FONT.sizes.sm, fontFamily: FONT_FAMILY.semibold }}>
                          En attente
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}

              {/* ── Mes Amis ── */}
              <View style={{ paddingHorizontal: 20, marginBottom: 14 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                  <Text style={{ fontSize: FONT.sizes.xl, fontFamily: FONT_FAMILY.extrabold, color: colors.textPrimary }}>
                    {"Mes Amis 🤝"}
                  </Text>
                  <Text style={{ fontSize: FONT.sizes.sm, fontFamily: FONT_FAMILY.bold, color: colors.textMuted }}>
                    {friendsCount}
                  </Text>
                </View>
              </View>

              {friendsCount === 0 ? (
                <View style={{ alignItems: "center", paddingVertical: 40, paddingHorizontal: 40 }}>
                  <View
                    style={{
                      width: 80, height: 80, borderRadius: 40,
                      backgroundColor: PALETTE.sarcelle + "15",
                      alignItems: "center", justifyContent: "center",
                      marginBottom: 16,
                    }}
                  >
                    <Ionicons name="people-outline" size={36} color={PALETTE.sarcelle} />
                  </View>
                  <Text style={{ fontSize: FONT.sizes.lg, fontFamily: FONT_FAMILY.bold, color: colors.textPrimary, textAlign: "center" }}>
                    Pas encore d'amis
                  </Text>
                  <Text style={{ fontSize: FONT.sizes.base, fontFamily: FONT_FAMILY.regular, color: colors.textTertiary, textAlign: "center", marginTop: 6 }}>
                    Recherche des utilisateurs pour ajouter tes premiers amis !
                  </Text>
                </View>
              ) : (
                friendships.accepted.map((item) => (
                  <AnimatedPressable
                    key={item.id}
                    onPress={() => router.push({ pathname: "/user/[id]", params: { id: item.otherUser.id } })}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      marginHorizontal: 20,
                      marginBottom: 6,
                      backgroundColor: colors.card,
                      borderRadius: 16,
                      padding: 14,
                      borderWidth: 1,
                      borderColor: colors.border,
                    }}
                  >
                    <View style={{ position: "relative" }}>
                      <Avatar url={item.otherUser.avatar_url} username={item.otherUser.username} size={52} />
                      <View
                        style={{
                          position: "absolute",
                          bottom: 0, right: 0,
                          width: 14, height: 14, borderRadius: 7,
                          backgroundColor: "#10B981",
                          borderWidth: 2.5,
                          borderColor: colors.card,
                        }}
                      />
                    </View>
                    <View style={{ flex: 1, marginLeft: 14 }}>
                      <Text
                        style={{ fontSize: FONT.sizes.lg, fontFamily: FONT_FAMILY.bold, color: colors.textPrimary }}
                        numberOfLines={1}
                      >
                        {item.otherUser.username}
                      </Text>
                      <Text style={{ fontSize: FONT.sizes.xs, fontFamily: FONT_FAMILY.regular, color: colors.textTertiary, marginTop: 2 }}>
                        Ami
                      </Text>
                    </View>

                    <View style={{ flexDirection: "row", gap: 8 }}>
                      <Pressable
                        onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
                        style={{
                          width: 38, height: 38, borderRadius: 12,
                          backgroundColor: PALETTE.sarcelle + "12",
                          alignItems: "center", justifyContent: "center",
                        }}
                      >
                        <Ionicons name="chatbubble-outline" size={18} color={PALETTE.sarcelle} />
                      </Pressable>
                      <Pressable
                        onPress={() => {
                          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                          removeFriendship.mutate(item.id);
                        }}
                        disabled={removeFriendship.isPending && removeFriendship.variables === item.id}
                        style={{
                          width: 38, height: 38, borderRadius: 12,
                          backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "#F2F2F2",
                          alignItems: "center", justifyContent: "center",
                        }}
                      >
                        {removeFriendship.isPending && removeFriendship.variables === item.id ? (
                          <ActivityIndicator size="small" color={colors.textTertiary} />
                        ) : (
                          <Ionicons name="ellipsis-horizontal" size={18} color={colors.textTertiary} />
                        )}
                      </Pressable>
                    </View>
                  </AnimatedPressable>
                ))
              )}
            </>
          ) : null}
        </ScrollView>
      )}
    </View>
  );
}
