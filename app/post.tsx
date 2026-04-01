import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
} from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { PALETTE, FONT, FONT_FAMILY, RADIUS } from "@/src/theme";
import { useMyGroups } from "@/src/features/groups/useMyGroups";
import { useGroupChallenges } from "@/src/features/groups/useChallenges";
import { useUploadStore } from "@/src/store/useUploadStore";
import { useTimelineLogic } from "@/src/hooks/useTimelineLogic";
import { AnimatedPressable } from "@/src/components/ui/AnimatedPressable";
import { toast } from "@/src/lib/toast";

export default function PostScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ videoUri: string; thumbnailUri: string; groupId?: string; challengeId?: string }>();
  const videoUri = Array.isArray(params.videoUri) ? params.videoUri[0] : params.videoUri;
  const thumbnailUri = Array.isArray(params.thumbnailUri) ? params.thumbnailUri[0] : (params.thumbnailUri ?? null);
  const { data: myGroups } = useMyGroups();
  const addUpload = useUploadStore((s) => s.addUpload);
  const { weekNumber, year } = useTimelineLogic();

  const preselectedGroupId = Array.isArray(params.groupId) ? params.groupId[0] : (params.groupId ?? null);
  const preselectedChallengeId = Array.isArray(params.challengeId) ? params.challengeId[0] : (params.challengeId ?? null);

  const [description, setDescription] = useState("");
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(preselectedGroupId);
  const [selectedChallengeId, setSelectedChallengeId] = useState<string | null>(preselectedChallengeId);

  const { data: groupChallenges } = useGroupChallenges(selectedGroupId ?? "");
  const openChallenges = (groupChallenges ?? []).filter((c) => c.status === "open");

  const selectedGroup = myGroups?.find((g) => g.id === selectedGroupId) ?? null;

  const handlePublish = () => {
    if (!videoUri) return;
    if (!selectedGroupId) {
      toast.error("Choisis un groupe pour publier.");
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    addUpload({
      localId: `${Date.now()}-${Math.random()}`,
      videoUri,
      thumbnailUri: thumbnailUri ?? null,
      groupId: selectedGroupId,
      challengeId: selectedChallengeId ?? undefined,
      weekNumber,
      year,
    });
    router.dismissAll();
    router.push("/(tabs)/profile");
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#080F0F" }}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Header ──────────────────────────────────────────────── */}
        <View
          style={{
            paddingTop: insets.top + 10,
            paddingHorizontal: 20,
            paddingBottom: 24,
            flexDirection: "row",
            alignItems: "center",
            gap: 14,
          }}
        >
          <Pressable
            onPress={() => router.back()}
            style={{
              width: 42,
              height: 42,
              borderRadius: 21,
              backgroundColor: "rgba(255,255,255,0.06)",
              alignItems: "center",
              justifyContent: "center",
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.1)",
            }}
          >
            <Ionicons name="arrow-back" size={20} color="#FFF" />
          </Pressable>
          <Text
            style={{
              color: "#FFF",
              fontFamily: FONT_FAMILY.extrabold,
              fontSize: FONT.sizes["3xl"],
            }}
          >
            Publier
          </Text>
        </View>

        {/* ── Thumbnail + Description ──────────────────────────────── */}
        <View
          style={{
            paddingHorizontal: 20,
            flexDirection: "row",
            gap: 14,
            marginBottom: 32,
          }}
        >
          {/* Thumbnail */}
          <View
            style={{
              width: 96,
              height: 148,
              borderRadius: 18,
              overflow: "hidden",
              backgroundColor: "rgba(63,208,201,0.07)",
              borderWidth: 1,
              borderColor: "rgba(63,208,201,0.15)",
            }}
          >
            {thumbnailUri ? (
              <Image source={{ uri: thumbnailUri }} style={{ flex: 1 }} contentFit="cover" />
            ) : (
              <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
                <Ionicons name="videocam" size={30} color={PALETTE.sarcelle} />
              </View>
            )}
          </View>

          {/* Description */}
          <View style={{ flex: 1 }}>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder={"Décris ta vidéo...\n#défi #dumbys 🔥"}
              placeholderTextColor="rgba(255,255,255,0.2)"
              multiline
              returnKeyType="done"
              blurOnSubmit={true}
              style={{
                flex: 1,
                color: "#FFF",
                fontFamily: FONT_FAMILY.regular,
                fontSize: FONT.sizes.base,
                backgroundColor: "rgba(255,255,255,0.04)",
                borderRadius: 18,
                padding: 14,
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.08)",
                textAlignVertical: "top",
                minHeight: 148,
              }}
              maxLength={150}
            />
            <Text
              style={{
                color: "rgba(255,255,255,0.2)",
                fontFamily: FONT_FAMILY.medium,
                fontSize: FONT.sizes.xs,
                textAlign: "right",
                marginTop: 4,
              }}
            >
              {description.length}/150
            </Text>
          </View>
        </View>

        {/* ── Séparateur ──────────────────────────────────────────── */}
        <View
          style={{
            marginHorizontal: 20,
            height: 1,
            backgroundColor: "rgba(255,255,255,0.06)",
            marginBottom: 28,
          }}
        />

        {/* ── Groupe ──────────────────────────────────────────────── */}
        <View style={{ paddingHorizontal: 20, marginBottom: 28 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 14 }}>
            <Ionicons name="people-outline" size={18} color={PALETTE.sarcelle} />
            <Text
              style={{
                color: "rgba(255,255,255,0.5)",
                fontFamily: FONT_FAMILY.bold,
                fontSize: FONT.sizes.xs,
                textTransform: "uppercase",
                letterSpacing: 1.4,
              }}
            >
              Groupe <Text style={{ color: PALETTE.fuchsia }}>*</Text>
            </Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 10, paddingRight: 20 }}
          >
            {(myGroups ?? []).length === 0 && (
              <Text style={{ color: "rgba(255,255,255,0.35)", fontFamily: FONT_FAMILY.medium, fontSize: FONT.sizes.sm, paddingVertical: 10 }}>
                Crée d'abord un groupe dans l'onglet Découvrir.
              </Text>
            )}
            {(myGroups ?? []).map((g) => {
              const isSelected = selectedGroupId === g.id;
              return (
                <Pressable
                  key={g.id}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSelectedGroupId(g.id);
                    setSelectedChallengeId(null);
                  }}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 8,
                    paddingHorizontal: 16,
                    paddingVertical: 10,
                    borderRadius: RADIUS.full,
                    backgroundColor: isSelected ? `${PALETTE.sarcelle}20` : "rgba(255,255,255,0.05)",
                    borderWidth: 1.5,
                    borderColor: isSelected ? PALETTE.sarcelle : "rgba(255,255,255,0.1)",
                  }}
                >
                  {isSelected && (
                    <Ionicons name="checkmark-circle" size={15} color={PALETTE.sarcelle} />
                  )}
                  <Text
                    style={{
                      color: isSelected ? PALETTE.sarcelle : "rgba(255,255,255,0.45)",
                      fontFamily: FONT_FAMILY.semibold,
                      fontSize: FONT.sizes.sm,
                    }}
                    numberOfLines={1}
                  >
                    {g.name}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* ── Défi (optionnel) — visible only when group has open challenges ── */}
        {selectedGroupId && openChallenges.length > 0 && (
          <>
            <View
              style={{
                marginHorizontal: 20,
                height: 1,
                backgroundColor: "rgba(255,255,255,0.06)",
                marginBottom: 28,
              }}
            />
            <View style={{ paddingHorizontal: 20, marginBottom: 28 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 14 }}>
                <Ionicons name="flag-outline" size={18} color={PALETTE.fuchsia} />
                <Text
                  style={{
                    color: "rgba(255,255,255,0.5)",
                    fontFamily: FONT_FAMILY.bold,
                    fontSize: FONT.sizes.xs,
                    textTransform: "uppercase",
                    letterSpacing: 1.4,
                  }}
                >
                  Participer à un défi{" "}
                  <Text style={{ color: "rgba(255,255,255,0.25)", fontFamily: FONT_FAMILY.regular, textTransform: "none", letterSpacing: 0 }}>
                    (optionnel)
                  </Text>
                </Text>
              </View>

              {/* "Aucun" pill to deselect */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 10, paddingRight: 20 }}
              >
                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSelectedChallengeId(null);
                  }}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                    paddingHorizontal: 16,
                    paddingVertical: 10,
                    borderRadius: RADIUS.full,
                    backgroundColor: selectedChallengeId === null ? "rgba(255,255,255,0.10)" : "rgba(255,255,255,0.04)",
                    borderWidth: 1.5,
                    borderColor: selectedChallengeId === null ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.08)",
                  }}
                >
                  <Text
                    style={{
                      color: selectedChallengeId === null ? "#FFF" : "rgba(255,255,255,0.35)",
                      fontFamily: FONT_FAMILY.semibold,
                      fontSize: FONT.sizes.sm,
                    }}
                  >
                    Aucun
                  </Text>
                </Pressable>

                {openChallenges.map((c) => {
                  const isSelected = selectedChallengeId === c.id;
                  return (
                    <Pressable
                      key={c.id}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setSelectedChallengeId(c.id);
                      }}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 8,
                        paddingHorizontal: 16,
                        paddingVertical: 10,
                        borderRadius: RADIUS.full,
                        backgroundColor: isSelected ? `${PALETTE.fuchsia}20` : "rgba(255,255,255,0.04)",
                        borderWidth: 1.5,
                        borderColor: isSelected ? PALETTE.fuchsia : "rgba(255,255,255,0.08)",
                      }}
                    >
                      {isSelected && (
                        <Ionicons name="checkmark-circle" size={15} color={PALETTE.fuchsia} />
                      )}
                      <Ionicons name="flag" size={13} color={isSelected ? PALETTE.fuchsia : "rgba(255,255,255,0.3)"} />
                      <Text
                        style={{
                          color: isSelected ? PALETTE.fuchsia : "rgba(255,255,255,0.45)",
                          fontFamily: FONT_FAMILY.semibold,
                          fontSize: FONT.sizes.sm,
                          maxWidth: 160,
                        }}
                        numberOfLines={1}
                      >
                        {c.title}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>

              {selectedChallengeId && (
                <View
                  style={{
                    marginTop: 12,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 8,
                    backgroundColor: `${PALETTE.fuchsia}10`,
                    borderRadius: RADIUS.lg,
                    padding: 12,
                    borderWidth: 1,
                    borderColor: `${PALETTE.fuchsia}20`,
                  }}
                >
                  <Ionicons name="information-circle-outline" size={16} color={PALETTE.fuchsia} />
                  <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: FONT.sizes.xs, fontFamily: FONT_FAMILY.regular, flex: 1 }}>
                    Ta vidéo sera soumise au défi et comptera pour la phase de qualification.
                  </Text>
                </View>
              )}
            </View>
          </>
        )}

      </ScrollView>

      {/* ── Publish button — fixed bottom ───────────────────────── */}
      <View
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          paddingHorizontal: 20,
          paddingBottom: insets.bottom + 16,
          paddingTop: 16,
          backgroundColor: "rgba(8,15,15,0.96)",
          borderTopWidth: 1,
          borderTopColor: "rgba(255,255,255,0.06)",
        }}
      >
        <AnimatedPressable onPress={handlePublish}>
          <LinearGradient
            colors={selectedChallengeId ? [PALETTE.fuchsia, "#C0007A"] : [PALETTE.fuchsia, PALETTE.sarcelle]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{
              paddingVertical: 18,
              borderRadius: RADIUS.xl,
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "row",
              gap: 10,
            }}
          >
            <Ionicons name={selectedChallengeId ? "flag" : "send"} size={20} color="#FFF" />
            <Text style={{ color: "#FFF", fontFamily: FONT_FAMILY.extrabold, fontSize: FONT.sizes.xl }}>
              {selectedChallengeId ? "Soumettre au défi" : "Publier"}
            </Text>
          </LinearGradient>
        </AnimatedPressable>
      </View>
    </View>
  );
}
