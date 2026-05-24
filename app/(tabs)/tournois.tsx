import { useState } from "react";
import {
  View,
  Text,
  Pressable,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { useMyTournaments } from "@/src/features/groups/useTournamentFeed";
import {
  useAllPublicTournaments,
  useJoinTournamentGroup,
  type PublicTournament,
} from "@/src/features/groups/useAllPublicTournaments";
import { PhaseIndicator } from "@/src/components/ui/PhaseIndicator";
import { FONT, FONT_FAMILY, PALETTE, RADIUS, SPACING } from "@/src/theme";
import { useTheme } from "@/src/providers/ThemeProvider";

type Tab = "mes-tournois" | "decouvrir";

function TournamentCard({
  tournament,
  onPress,
}: {
  tournament: PublicTournament;
  onPress: () => void;
}) {
  const joinGroup = useJoinTournamentGroup();
  const { colors } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        opacity: pressed ? 0.85 : 1,
        backgroundColor: colors.card,
        borderRadius: RADIUS.xl,
        borderWidth: 1,
        borderColor: colors.border,
        marginHorizontal: SPACING["2xl"],
        marginBottom: SPACING.base,
        overflow: "hidden",
      })}
    >
      {/* Cover band */}
      {tournament.group.cover_url ? (
        <Image
          source={{ uri: tournament.group.cover_url }}
          style={{ width: "100%", height: 80 }}
          contentFit="cover"
        />
      ) : (
        <View
          style={{
            width: "100%",
            height: 80,
            backgroundColor: `${PALETTE.fuchsia}12`,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons name="trophy-outline" size={28} color={PALETTE.fuchsia} />
        </View>
      )}

      <View style={{ padding: SPACING.lg }}>
        {/* Group name badge */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
            marginBottom: SPACING.xs,
          }}
        >
          <Ionicons name="people-outline" size={12} color={colors.textTertiary} />
          <Text
            style={{
              fontSize: FONT.sizes.xs,
              fontFamily: FONT_FAMILY.medium,
              color: colors.textTertiary,
            }}
          >
            {tournament.group.name}
          </Text>
        </View>

        {/* Tournament title */}
        <Text
          style={{
            fontSize: FONT.sizes.lg,
            fontFamily: FONT_FAMILY.bold,
            color: colors.textPrimary,
            marginBottom: SPACING.xs,
          }}
          numberOfLines={2}
        >
          {tournament.title}
        </Text>

        {/* Description */}
        {tournament.description ? (
          <Text
            style={{
              fontSize: FONT.sizes.sm,
              fontFamily: FONT_FAMILY.regular,
              color: colors.textSecondary,
              marginBottom: SPACING.base,
            }}
            numberOfLines={2}
          >
            {tournament.description}
          </Text>
        ) : null}

        {/* Footer row */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: SPACING.base }}>
            {/* Challenge count */}
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <Ionicons name="flag-outline" size={13} color={colors.textMuted} />
              <Text
                style={{
                  fontSize: FONT.sizes.xs,
                  fontFamily: FONT_FAMILY.medium,
                  color: colors.textMuted,
                }}
              >
                {tournament.challenge_count} défi{tournament.challenge_count !== 1 ? "s" : ""}
              </Text>
            </View>

            {/* Member count */}
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <Ionicons name="people-outline" size={13} color={colors.textMuted} />
              <Text
                style={{
                  fontSize: FONT.sizes.xs,
                  fontFamily: FONT_FAMILY.medium,
                  color: colors.textMuted,
                }}
              >
                {tournament.group.member_count}
              </Text>
            </View>

            {/* Reward */}
            {tournament.reward ? (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                <Ionicons name="gift-outline" size={13} color={PALETTE.jaune} />
                <Text
                  style={{
                    fontSize: FONT.sizes.xs,
                    fontFamily: FONT_FAMILY.medium,
                    color: PALETTE.jaune,
                  }}
                  numberOfLines={1}
                >
                  {tournament.reward}
                </Text>
              </View>
            ) : null}
          </View>

          {/* Join / View button */}
          {!tournament.is_member ? (
            <Pressable
              onPress={(e) => {
                e.stopPropagation();
                joinGroup.mutate(tournament.group.id);
              }}
              style={({ pressed }) => ({
                opacity: pressed ? 0.7 : 1,
                backgroundColor: PALETTE.fuchsia,
                borderRadius: RADIUS.full,
                paddingHorizontal: SPACING.base,
                paddingVertical: 5,
              })}
            >
              <Text
                style={{
                  fontSize: FONT.sizes.xs,
                  fontFamily: FONT_FAMILY.bold,
                  color: "#FFF",
                }}
              >
                Rejoindre
              </Text>
            </Pressable>
          ) : (
            <View
              style={{
                backgroundColor: `${PALETTE.sarcelle}15`,
                borderRadius: RADIUS.full,
                paddingHorizontal: SPACING.base,
                paddingVertical: 5,
              }}
            >
              <Text
                style={{
                  fontSize: FONT.sizes.xs,
                  fontFamily: FONT_FAMILY.semibold,
                  color: PALETTE.sarcelle,
                }}
              >
                Membre
              </Text>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
}

export default function TournoisScreen() {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const [activeTab, setActiveTab] = useState<Tab>("mes-tournois");

  const myTournaments = useMyTournaments();
  const publicTournaments = useAllPublicTournaments();

  const isLoading =
    activeTab === "mes-tournois" ? myTournaments.isLoading : publicTournaments.isLoading;

  const refetch =
    activeTab === "mes-tournois" ? myTournaments.refetch : publicTournaments.refetch;

  // For "mes-tournois": convert ExploreTournament[] to PublicTournament-like structure
  // We use publicTournaments data filtered to is_member for mes-tournois
  const myTournamentsData: PublicTournament[] =
    (publicTournaments.data ?? []).filter((t) => t.is_member);

  const discoverData: PublicTournament[] =
    (publicTournaments.data ?? []).filter((t) => !t.is_member);

  const data = activeTab === "mes-tournois" ? myTournamentsData : discoverData;

  const handleTournamentPress = (tournament: PublicTournament) => {
    router.push({ pathname: "/tournament/[id]", params: { id: tournament.id } });
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      {/* Header */}
      <View
        style={{
          paddingTop: insets.top + SPACING.base,
          paddingHorizontal: SPACING["2xl"],
          paddingBottom: SPACING.lg,
          backgroundColor: colors.surface,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: SPACING.lg,
          }}
        >
          <Text
            style={{
              fontSize: FONT.sizes["3xl"],
              fontFamily: FONT_FAMILY.black,
              color: colors.textPrimary,
            }}
          >
            Tournois
          </Text>
          <PhaseIndicator showDaysLeft={false} />
        </View>

        {/* Tabs */}
        <View
          style={{
            flexDirection: "row",
            backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
            borderRadius: RADIUS.lg,
            padding: 3,
          }}
        >
          {(
            [
              { key: "mes-tournois", label: "Mes tournois" },
              { key: "decouvrir", label: "Découvrir" },
            ] as const
          ).map((tab) => (
            <Pressable
              key={tab.key}
              onPress={() => setActiveTab(tab.key)}
              style={{
                flex: 1,
                paddingVertical: 7,
                alignItems: "center",
                borderRadius: RADIUS.md,
                backgroundColor: activeTab === tab.key ? colors.elevated : "transparent",
                shadowColor: activeTab === tab.key ? "#000" : "transparent",
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.06,
                shadowRadius: 3,
                elevation: activeTab === tab.key ? 2 : 0,
              }}
            >
              <Text
                style={{
                  fontSize: FONT.sizes.sm,
                  fontFamily:
                    activeTab === tab.key ? FONT_FAMILY.semibold : FONT_FAMILY.medium,
                  color: activeTab === tab.key ? colors.textPrimary : colors.textTertiary,
                }}
              >
                {tab.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* List */}
      {isLoading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color={PALETTE.fuchsia} />
        </View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{
            paddingTop: SPACING.xl,
            paddingBottom: insets.bottom + 100,
          }}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={refetch}
              tintColor={PALETTE.fuchsia}
            />
          }
          ListEmptyComponent={
            <View
              style={{
                alignItems: "center",
                justifyContent: "center",
                paddingVertical: 60,
                paddingHorizontal: SPACING["2xl"],
              }}
            >
              <Ionicons name="trophy-outline" size={48} color={colors.textMuted} />
              <Text
                style={{
                  marginTop: SPACING.lg,
                  fontSize: FONT.sizes.lg,
                  fontFamily: FONT_FAMILY.semibold,
                  color: colors.textMuted,
                  textAlign: "center",
                }}
              >
                {activeTab === "mes-tournois"
                  ? "Aucun tournoi dans tes groupes"
                  : "Aucun tournoi public disponible"}
              </Text>
              {activeTab === "mes-tournois" && (
                <Text
                  style={{
                    marginTop: SPACING.xs,
                    fontSize: FONT.sizes.sm,
                    fontFamily: FONT_FAMILY.regular,
                    color: colors.textMuted,
                    textAlign: "center",
                  }}
                >
                  Rejoins un groupe ou crée-en un pour participer
                </Text>
              )}
            </View>
          }
          renderItem={({ item }) => (
            <TournamentCard
              tournament={item}
              onPress={() => handleTournamentPress(item)}
            />
          )}
        />
      )}
    </View>
  );
}
