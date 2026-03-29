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
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useGroupTournament } from "@/src/features/groups/useGroupTournaments";
import { useTournamentChallenges, useCreateChallenge, useDeleteChallenge } from "@/src/features/groups/useChallenges";
import { useAuthStore } from "@/src/store/useAuthStore";
import { createChallengeSchema } from "@/src/lib/schemas";
import { toast } from "@/src/lib/toast";
import { AnimatedPressable } from "@/src/components/ui/AnimatedPressable";
import { BottomSheet } from "@/src/components/ui/BottomSheet";
import { EmptyState } from "@/src/components/ui/EmptyState";
import type { Challenge } from "@/src/types/database.types";
import {
  PALETTE,
  RADIUS,
  FONT,
  FONT_FAMILY,
  CARD_STYLE,
  INPUT_STYLE,
  SECTION_HEADER_STYLE,
} from "@/src/theme";

function ChallengeCard({
  challenge,
  isOwn,
  onDelete,
  onPress,
}: {
  challenge: Challenge;
  isOwn: boolean;
  onDelete: () => void;
  onPress: () => void;
}) {
  return (
    <AnimatedPressable onPress={onPress}>
      <View
        style={{
          ...CARD_STYLE,
          padding: 16,
          marginBottom: 12,
          flexDirection: "row",
          alignItems: "center",
          gap: 14,
        }}
      >
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: RADIUS.sm,
            backgroundColor: PALETTE.fuchsia + "15",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons name="flag" size={20} color={PALETTE.fuchsia} />
        </View>

        <View style={{ flex: 1 }}>
          <Text
            style={{
              color: "#1A1A1A",
              fontSize: FONT.sizes.base,
              fontFamily: FONT_FAMILY.semibold,
            }}
            numberOfLines={1}
          >
            {challenge.title}
          </Text>
          {challenge.description && (
            <Text
              style={{
                color: "#999",
                fontSize: FONT.sizes.sm,
                fontFamily: FONT_FAMILY.regular,
                marginTop: 2,
              }}
              numberOfLines={2}
            >
              {challenge.description}
            </Text>
          )}
        </View>

        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          {isOwn && (
            <AnimatedPressable onPress={onDelete} hitSlop={8}>
              <Ionicons name="trash-outline" size={16} color="#F43F5E" />
            </AnimatedPressable>
          )}
          <Ionicons name="chevron-forward" size={16} color="#CCC" />
        </View>
      </View>
    </AnimatedPressable>
  );
}

export default function TournamentScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);

  const { data: tournament, isPending: tournamentPending, isError } = useGroupTournament(id!);
  const { data: challenges, isPending: challengesPending } = useTournamentChallenges(id!);
  const createChallenge = useCreateChallenge();
  const deleteChallenge = useDeleteChallenge();

  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [challengeErrors, setChallengeErrors] = useState<{ title?: string }>({});

  const handleCreate = () => {
    const result = createChallengeSchema.safeParse({ title: newTitle.trim(), description: newDesc.trim() || undefined });
    if (!result.success) {
      const flat = result.error.flatten().fieldErrors;
      setChallengeErrors({ title: flat.title?.[0] });
      return;
    }
    setChallengeErrors({});
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    createChallenge.mutate(
      {
        tournamentId: id!,
        title: newTitle.trim(),
        description: newDesc.trim() || undefined,
      },
      {
        onSuccess: () => {
          setShowCreate(false);
          setNewTitle("");
          setNewDesc("");
        },
        onError: (err) => toast.error(err.message),
      },
    );
  };

  const handleDelete = (challenge: Challenge) => {
    Alert.alert("Supprimer le défi", `Supprimer "${challenge.title}" ?`, [
      { text: "Annuler", style: "cancel" },
      {
        text: "Supprimer",
        style: "destructive",
        onPress: () =>
          deleteChallenge.mutate({
            challengeId: challenge.id,
            tournamentId: id!,
          }),
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

          <Text
            style={{
              flex: 1,
              color: "#1A1A1A",
              fontSize: FONT.sizes.xl,
              fontFamily: FONT_FAMILY.bold,
            }}
            numberOfLines={1}
          >
            {tournament?.title ?? "Tournoi"}
          </Text>

          <AnimatedPressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setShowCreate(true);
            }}
            style={{
              width: 40,
              height: 40,
              borderRadius: RADIUS.sm,
              backgroundColor: PALETTE.sarcelle + "15",
              alignItems: "center",
              justifyContent: "center",
              borderWidth: 1,
              borderColor: PALETTE.sarcelle + "30",
            }}
          >
            <Ionicons name="add" size={22} color={PALETTE.sarcelle} />
          </AnimatedPressable>
        </View>

        {/* Loading */}
        {tournamentPending && (
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
            <ActivityIndicator size="large" color={PALETTE.sarcelle} />
          </View>
        )}

        {/* Erreur */}
        {isError && (
          <EmptyState
            icon="alert-circle-outline"
            title="Impossible de charger le tournoi"
            subtitle="Vérifie ta connexion et réessaie."
          />
        )}

        {/* Contenu */}
        {tournament && (
          <ScrollView
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
            showsVerticalScrollIndicator={false}
          >
            {/* Card info tournoi */}
            <View style={{ ...CARD_STYLE, padding: 20, marginBottom: 20 }}>

              {/* Badge reward */}
              {tournament.reward && (
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                    backgroundColor: PALETTE.jaune + "15",
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: RADIUS.full,
                    alignSelf: "flex-start",
                    marginBottom: 14,
                  }}
                >
                  <Ionicons name="trophy" size={14} color={PALETTE.jaune} />
                  <Text
                    style={{
                      color: PALETTE.jaune,
                      fontSize: FONT.sizes.sm,
                      fontFamily: FONT_FAMILY.bold,
                    }}
                  >
                    {tournament.reward}
                  </Text>
                </View>
              )}

              <Text
                style={{
                  color: "#1A1A1A",
                  fontSize: FONT.sizes["3xl"],
                  fontFamily: FONT_FAMILY.extrabold,
                  marginBottom: tournament.description ? 10 : 0,
                }}
              >
                {tournament.title}
              </Text>

              {tournament.description && (
                <Text
                  style={{
                    color: "#666",
                    fontSize: FONT.sizes.base,
                    fontFamily: FONT_FAMILY.regular,
                    lineHeight: 22,
                  }}
                >
                  {tournament.description}
                </Text>
              )}
            </View>

            {/* En-tête section défis */}
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
                Défis
              </Text>
              <Text
                style={{
                  color: "#999",
                  fontSize: FONT.sizes.sm,
                  fontFamily: FONT_FAMILY.regular,
                }}
              >
                {challenges?.length ?? 0} défi{(challenges?.length ?? 0) !== 1 ? "s" : ""}
              </Text>
            </View>

            {challengesPending && (
              <ActivityIndicator color={PALETTE.sarcelle} style={{ paddingVertical: 24 }} />
            )}

            {!challengesPending && (challenges ?? []).length === 0 && (
              <EmptyState
                icon="flag-outline"
                title="Aucun défi pour l'instant"
                subtitle="Appuie sur + pour ajouter le premier défi."
              />
            )}

            {(challenges ?? []).map((challenge) => (
              <ChallengeCard
                key={challenge.id}
                challenge={challenge}
                isOwn={challenge.created_by === user?.id}
                onDelete={() => handleDelete(challenge)}
                onPress={() => {
                  router.push({
                    pathname: "/challenge/[id]",
                    params: { id: challenge.id, tournamentId: id },
                  });
                }}
              />
            ))}
          </ScrollView>
        )}

        {/* BottomSheet — Créer un défi */}
        <BottomSheet
          isOpen={showCreate}
          onClose={() => {
            setShowCreate(false);
            setNewTitle("");
            setNewDesc("");
          }}
          snapPoint={0.55}
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
              Nouveau défi
            </Text>

            <Text style={{ ...SECTION_HEADER_STYLE, marginBottom: 8 }}>
              Titre *
            </Text>
            <TextInput
              value={newTitle}
              onChangeText={(t) => { setNewTitle(t); setChallengeErrors({}); }}
              placeholder="Ex : Faire une vidéo déguisé..."
              placeholderTextColor="#BBB"
              style={{ ...INPUT_STYLE, marginBottom: challengeErrors.title ? 4 : 16, borderColor: challengeErrors.title ? "#F43F5E" : undefined }}
              maxLength={100}
              autoFocus
            />
            {challengeErrors.title ? (
              <Text style={{ color: "#F43F5E", fontSize: 12, fontFamily: FONT_FAMILY.medium, marginBottom: 12, marginLeft: 2 }}>
                {challengeErrors.title}
              </Text>
            ) : null}

            <Text style={{ ...SECTION_HEADER_STYLE, marginBottom: 8 }}>
              Description (optionnel)
            </Text>
            <TextInput
              value={newDesc}
              onChangeText={setNewDesc}
              placeholder="Explique les règles du défi..."
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
              onPress={handleCreate}
              disabled={!newTitle.trim() || createChallenge.isPending}
              style={{
                backgroundColor: newTitle.trim() ? PALETTE.sarcelle : "rgba(0,0,0,0.08)",
                paddingVertical: 16,
                borderRadius: RADIUS.md,
                alignItems: "center",
                flexDirection: "row",
                justifyContent: "center",
                gap: 8,
              }}
            >
              {createChallenge.isPending ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons
                    name="flag"
                    size={18}
                    color={newTitle.trim() ? "#FFFFFF" : "#BBB"}
                  />
                  <Text
                    style={{
                      color: newTitle.trim() ? "#FFFFFF" : "#BBB",
                      fontSize: FONT.sizes.lg,
                      fontFamily: FONT_FAMILY.bold,
                    }}
                  >
                    Créer le défi
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
