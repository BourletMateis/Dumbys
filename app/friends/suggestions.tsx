import { View, Text, Pressable, FlatList, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useSuggestedFriends } from "@/src/features/friends/useSuggestedFriends";
import { useSendRequest } from "@/src/features/friends/useFriendActions";
import { useFriendships } from "@/src/features/friends/useFriendships";
import { Avatar } from "@/src/components/ui/Avatar";
import { AnimatedPressable } from "@/src/components/ui/AnimatedPressable";
import { PALETTE, FONT, FONT_FAMILY, RADIUS, SPACING } from "@/src/theme";

export default function SuggestionsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: suggestions, isPending } = useSuggestedFriends();
  const { data: friendships } = useFriendships();
  const sendRequest = useSendRequest();

  const sentIds = new Set((friendships?.pendingSent ?? []).map((f) => f.otherUser.id));
  const acceptedIds = new Set((friendships?.accepted ?? []).map((f) => f.otherUser.id));

  return (
    <View style={{ flex: 1, backgroundColor: "#F8F8FA" }}>
      {/* Header */}
      <View style={{
        paddingTop: insets.top + 8,
        paddingHorizontal: SPACING["2xl"],
        paddingBottom: SPACING.lg,
        backgroundColor: "#FFFFFF",
        borderBottomWidth: 1,
        borderBottomColor: "rgba(0,0,0,0.05)",
      }}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: SPACING.lg }}
        >
          <Ionicons name="chevron-back" size={20} color="#555" />
          <Text style={{ fontSize: FONT.sizes.base, fontFamily: FONT_FAMILY.medium, color: "#555" }}>Retour</Text>
        </Pressable>
        <Text style={{ fontSize: FONT.sizes["3xl"], fontFamily: FONT_FAMILY.black, color: "#1A1A1A", letterSpacing: -0.5 }}>
          Suggestions 💡
        </Text>
        <Text style={{ fontSize: FONT.sizes.sm, fontFamily: FONT_FAMILY.regular, color: "#AAA", marginTop: 4 }}>
          Personnes à découvrir
        </Text>
      </View>

      {isPending ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color={PALETTE.sarcelle} />
        </View>
      ) : (
        <FlatList
          data={suggestions ?? []}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingTop: 12, paddingBottom: insets.bottom + 110 }}
          ListEmptyComponent={
            <View style={{ alignItems: "center", paddingVertical: 64, paddingHorizontal: SPACING["2xl"] }}>
              <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: "#EAEAEF", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
                <Ionicons name="people-outline" size={36} color="#CCC" />
              </View>
              <Text style={{ fontSize: FONT.sizes.lg, fontFamily: FONT_FAMILY.bold, color: "#1A1A1A", textAlign: "center" }}>
                Aucune suggestion
              </Text>
              <Text style={{ fontSize: FONT.sizes.sm, fontFamily: FONT_FAMILY.regular, color: "#AAA", textAlign: "center", marginTop: 6 }}>
                Rejoins des groupes pour trouver des personnes à ajouter
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const sent = sentIds.has(item.id);
            const accepted = acceptedIds.has(item.id);

            return (
              <AnimatedPressable
                onPress={() => router.push({ pathname: "/user/[id]", params: { id: item.id } })}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginHorizontal: SPACING["2xl"],
                  marginBottom: 10,
                  backgroundColor: "#FFFFFF",
                  borderRadius: RADIUS.xl,
                  padding: 14,
                  borderWidth: 1,
                  borderColor: "rgba(0,0,0,0.05)",
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.04,
                  shadowRadius: 8,
                  elevation: 2,
                }}
              >
                <Avatar url={item.avatar_url} username={item.username} size={52} />
                <View style={{ flex: 1, marginLeft: 14 }}>
                  <Text style={{ fontSize: FONT.sizes.lg, fontFamily: FONT_FAMILY.bold, color: "#1A1A1A" }} numberOfLines={1}>
                    {item.username}
                  </Text>
                  {item.shared_groups > 0 && (
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 }}>
                      <Ionicons name="people-outline" size={11} color={PALETTE.sarcelle} />
                      <Text style={{ fontSize: FONT.sizes.xs, fontFamily: FONT_FAMILY.medium, color: PALETTE.sarcelle }}>
                        {item.shared_groups} groupe{item.shared_groups !== 1 ? "s" : ""} en commun
                      </Text>
                    </View>
                  )}
                </View>

                {accepted ? (
                  <View style={{ backgroundColor: `${PALETTE.sarcelle}15`, borderRadius: RADIUS.full, paddingHorizontal: 14, paddingVertical: 7 }}>
                    <Text style={{ color: PALETTE.sarcelle, fontSize: FONT.sizes.xs, fontFamily: FONT_FAMILY.bold }}>Ami ✓</Text>
                  </View>
                ) : sent ? (
                  <View style={{ backgroundColor: "#F2F2F2", borderRadius: RADIUS.full, paddingHorizontal: 14, paddingVertical: 7 }}>
                    <Text style={{ color: "#BBB", fontSize: FONT.sizes.xs, fontFamily: FONT_FAMILY.semibold }}>Envoyé</Text>
                  </View>
                ) : (
                  <AnimatedPressable
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                      sendRequest.mutate(item.id);
                    }}
                    disabled={sendRequest.isPending && sendRequest.variables === item.id}
                    style={{ backgroundColor: PALETTE.sarcelle, borderRadius: RADIUS.full, paddingHorizontal: 16, paddingVertical: 8, flexDirection: "row", alignItems: "center", gap: 5 }}
                  >
                    {sendRequest.isPending && sendRequest.variables === item.id ? (
                      <ActivityIndicator size="small" color="#FFF" />
                    ) : (
                      <>
                        <Ionicons name="person-add" size={14} color="#FFF" />
                        <Text style={{ color: "#FFF", fontSize: FONT.sizes.xs, fontFamily: FONT_FAMILY.bold }}>Ajouter</Text>
                      </>
                    )}
                  </AnimatedPressable>
                )}
              </AnimatedPressable>
            );
          }}
        />
      )}
    </View>
  );
}
