import { useState } from "react";
import {
  View,
  Text,
  Pressable,
  FlatList,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRouter, Stack } from "expo-router";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  useAllPublicTournaments,
  useJoinTournamentGroup,
  type PublicTournament,
} from "@/src/features/groups/useAllPublicTournaments";
import { AnimatedPressable } from "@/src/components/ui/AnimatedPressable";
import { PALETTE, FONT, FONT_FAMILY } from "@/src/theme";

function TournamentCard({ tournament }: { tournament: PublicTournament }) {
  const router = useRouter();
  const joinGroup = useJoinTournamentGroup();
  const [joining, setJoining] = useState(false);

  const handleJoin = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setJoining(true);
    joinGroup.mutate(tournament.group.id, {
      onSuccess: () => {
        setJoining(false);
        Alert.alert("🎉 Rejoint !", `Tu fais maintenant partie de ${tournament.group.name} et tu peux voir ses tournois.`);
      },
      onError: (err) => {
        setJoining(false);
        Alert.alert("Erreur", err.message);
      },
    });
  };

  // Deterministic color from group name
  const COLORS = [PALETTE.sarcelle, PALETTE.fuchsia, "#3B82F6", "#22C55E", "#8B5CF6", "#F59E0B"];
  let hash = 0;
  for (let i = 0; i < tournament.group.name.length; i++) {
    hash = tournament.group.name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const accentColor = COLORS[Math.abs(hash) % COLORS.length];

  return (
    <AnimatedPressable
      onPress={() => {
        if (tournament.is_member) {
          router.push({ pathname: "/tournament/[id]", params: { id: tournament.id } });
        }
      }}
      style={{
        marginHorizontal: 20,
        marginBottom: 16,
        borderRadius: 24,
        overflow: "hidden",
        backgroundColor: "#FFFFFF",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.07,
        shadowRadius: 12,
        elevation: 3,
        borderWidth: 1,
        borderColor: "rgba(0,0,0,0.05)",
      }}
    >
      {/* Color accent bar */}
      <View style={{ height: 4, backgroundColor: accentColor }} />

      <View style={{ padding: 20 }}>
        {/* Header row */}
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 14 }}>
          {/* Group avatar */}
          {tournament.group.cover_url ? (
            <Image
              source={{ uri: tournament.group.cover_url }}
              style={{ width: 48, height: 48, borderRadius: 14 }}
              contentFit="cover"
            />
          ) : (
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: 14,
                backgroundColor: accentColor + "20",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ fontSize: 22, fontFamily: FONT_FAMILY.extrabold, color: accentColor }}>
                {tournament.group.name.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}

          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text
              style={{ fontSize: FONT.sizes.lg, fontFamily: FONT_FAMILY.extrabold, color: "#1A1A1A" }}
              numberOfLines={1}
            >
              {tournament.title}
            </Text>
            <Text style={{ fontSize: FONT.sizes.sm, fontFamily: FONT_FAMILY.medium, color: "#999", marginTop: 2 }}>
              {tournament.group.name}
            </Text>
          </View>

          {tournament.is_member && (
            <View style={{ backgroundColor: PALETTE.sarcelle + "20", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 }}>
              <Text style={{ fontSize: FONT.sizes.xs, fontFamily: FONT_FAMILY.bold, color: PALETTE.sarcelle }}>
                REJOINT
              </Text>
            </View>
          )}
        </View>

        {/* Description */}
        {tournament.description ? (
          <Text
            style={{ fontSize: FONT.sizes.base, fontFamily: FONT_FAMILY.regular, color: "#666", lineHeight: 20, marginBottom: 14 }}
            numberOfLines={2}
          >
            {tournament.description}
          </Text>
        ) : null}

        {/* Stats row */}
        <View style={{ flexDirection: "row", gap: 16, marginBottom: 16 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
            <Ionicons name="people-outline" size={14} color="#AAA" />
            <Text style={{ fontSize: FONT.sizes.sm, fontFamily: FONT_FAMILY.semibold, color: "#AAA" }}>
              {tournament.group.member_count} membres
            </Text>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
            <Ionicons name="flag-outline" size={14} color="#AAA" />
            <Text style={{ fontSize: FONT.sizes.sm, fontFamily: FONT_FAMILY.semibold, color: "#AAA" }}>
              {tournament.challenge_count} défi{tournament.challenge_count !== 1 ? "s" : ""}
            </Text>
          </View>
        </View>

        {/* Reward */}
        {tournament.reward ? (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
              backgroundColor: PALETTE.jaune + "15",
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderRadius: 12,
              marginBottom: 16,
            }}
          >
            <Ionicons name="trophy" size={16} color={PALETTE.jaune} />
            <Text style={{ fontSize: FONT.sizes.sm, fontFamily: FONT_FAMILY.semibold, color: "#8A6200", flex: 1 }} numberOfLines={1}>
              {tournament.reward}
            </Text>
          </View>
        ) : null}

        {/* Action button */}
        {tournament.is_member ? (
          <AnimatedPressable
            onPress={() => router.push({ pathname: "/tournament/[id]", params: { id: tournament.id } })}
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              backgroundColor: PALETTE.sarcelle,
              paddingVertical: 13,
              borderRadius: 14,
            }}
          >
            <Ionicons name="play-circle" size={18} color="#FFF" />
            <Text style={{ fontSize: FONT.sizes.base, fontFamily: FONT_FAMILY.bold, color: "#FFF" }}>
              Voir le tournoi
            </Text>
          </AnimatedPressable>
        ) : (
          <AnimatedPressable
            onPress={handleJoin}
            disabled={joining}
            style={{
              borderRadius: 14,
              overflow: "hidden",
            }}
          >
            <LinearGradient
              colors={[PALETTE.fuchsia, "#C41A62"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                paddingVertical: 13,
              }}
            >
              {joining ? (
                <ActivityIndicator color="#FFF" size="small" />
              ) : (
                <>
                  <Ionicons name="add-circle" size={18} color="#FFF" />
                  <Text style={{ fontSize: FONT.sizes.base, fontFamily: FONT_FAMILY.bold, color: "#FFF" }}>
                    Rejoindre ce tournoi
                  </Text>
                </>
              )}
            </LinearGradient>
          </AnimatedPressable>
        )}
      </View>
    </AnimatedPressable>
  );
}

export default function TournamentsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { data: tournaments, isPending, refetch, isRefetching } = useAllPublicTournaments();

  const joined = (tournaments ?? []).filter((t) => t.is_member);
  const available = (tournaments ?? []).filter((t) => !t.is_member);

  type ListItem =
    | { type: "section"; label: string; key: string }
    | { type: "tournament"; data: PublicTournament };

  const listData: ListItem[] = [
    ...(joined.length > 0 ? [{ type: "section" as const, label: "Mes tournois", key: "s-joined" }] : []),
    ...joined.map((t) => ({ type: "tournament" as const, data: t })),
    ...(available.length > 0 ? [{ type: "section" as const, label: "Disponibles", key: "s-available" }] : []),
    ...available.map((t) => ({ type: "tournament" as const, data: t })),
  ];

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={{ flex: 1, backgroundColor: "#F8F8FA" }}>

        {/* Header */}
        <LinearGradient
          colors={["#080F0F", "#142121"]}
          style={{
            paddingTop: insets.top + 8,
            paddingBottom: 24,
            paddingHorizontal: 20,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <Pressable
              onPress={() => router.back()}
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: "rgba(255,255,255,0.1)",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons name="arrow-back" size={22} color="#FFF" />
            </Pressable>

            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: FONT.sizes["2xl"], fontFamily: FONT_FAMILY.extrabold, color: "#FFF" }}>
                Tournois
              </Text>
              <Text style={{ fontSize: FONT.sizes.sm, fontFamily: FONT_FAMILY.regular, color: "rgba(255,255,255,0.5)", marginTop: 2 }}>
                Rejoins des tournois publics
              </Text>
            </View>

            <View style={{ backgroundColor: PALETTE.fuchsia, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 12 }}>
              <Text style={{ fontSize: FONT.sizes.sm, fontFamily: FONT_FAMILY.black, color: "#FFF" }}>
                {(tournaments ?? []).length}
              </Text>
            </View>
          </View>
        </LinearGradient>

        {isPending ? (
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
            <ActivityIndicator size="large" color={PALETTE.sarcelle} />
          </View>
        ) : (tournaments ?? []).length === 0 ? (
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 40 }}>
            <Ionicons name="trophy-outline" size={56} color="#CCC" />
            <Text style={{ fontSize: FONT.sizes.xl, fontFamily: FONT_FAMILY.extrabold, color: "#333", marginTop: 16, textAlign: "center" }}>
              Aucun tournoi public
            </Text>
            <Text style={{ fontSize: FONT.sizes.base, fontFamily: FONT_FAMILY.regular, color: "#999", marginTop: 8, textAlign: "center" }}>
              Les tournois des groupes publics apparaîtront ici.
            </Text>
          </View>
        ) : (
          <FlatList
            style={{ flex: 1 }}
            data={listData}
            keyExtractor={(item) => item.type === "section" ? item.key : item.data.id}
            renderItem={({ item }) => {
              if (item.type === "section") {
                return (
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 20, marginBottom: 8, marginTop: 4 }}>
                    <View style={{ width: 4, height: 16, backgroundColor: item.label === "Mes tournois" ? PALETTE.sarcelle : PALETTE.fuchsia, borderRadius: 2 }} />
                    <Text style={{ fontSize: FONT.sizes.sm, fontFamily: FONT_FAMILY.bold, color: "#888", textTransform: "uppercase", letterSpacing: 1 }}>
                      {item.label}
                    </Text>
                  </View>
                );
              }
              return <TournamentCard tournament={item.data} />;
            }}
            contentContainerStyle={{ paddingTop: 16, paddingBottom: 120 }}
            showsVerticalScrollIndicator={false}
            onRefresh={refetch}
            refreshing={isRefetching}
          />
        )}
      </View>
    </>
  );
}
