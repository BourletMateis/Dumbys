import { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { PALETTE, FONT, FONT_FAMILY, RADIUS } from "@/src/theme";
import { useMyGroups } from "@/src/features/groups/useMyGroups";
import { useUploadGroupVideo } from "@/src/features/groups/useUploadGroupVideo";
import { useTimelineLogic } from "@/src/hooks/useTimelineLogic";
import { AnimatedPressable } from "@/src/components/ui/AnimatedPressable";
import { PUBLIC_CATEGORIES } from "@/src/features/groups/usePublicGroups";

export default function PostScreen() {
  const insets = useSafeAreaInsets();
  const { videoUri, thumbnailUri } = useLocalSearchParams<{ videoUri: string; thumbnailUri: string }>();
  const { data: myGroups } = useMyGroups();
  const uploadMutation = useUploadGroupVideo();
  const { weekNumber, year } = useTimelineLogic();

  const [description, setDescription] = useState("");
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);

  // Auto-select first group when groups load
  useEffect(() => {
    if (myGroups && myGroups.length > 0 && !selectedGroupId) {
      setSelectedGroupId(myGroups[0].id);
    }
  }, [myGroups]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handlePublish = () => {
    if (!videoUri) return;
    if (!selectedGroupId) {
      Alert.alert("Groupe requis", "Sélectionne un groupe pour publier ta vidéo.");
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setIsUploading(true);
    uploadMutation.mutate(
      { videoUri, groupId: selectedGroupId, weekNumber, year, description: description.trim() || undefined, category: selectedCategory ?? undefined },
      {
        onSuccess: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          Alert.alert("Publié 🔥", "Ta vidéo est en ligne !", [
            { text: "OK", onPress: () => router.dismissAll() },
          ]);
        },
        onError: (err) => Alert.alert("Erreur", err.message),
        onSettled: () => setIsUploading(false),
      }
    );
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
              Groupe
            </Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 10, paddingRight: 20 }}
          >
            {(myGroups ?? []).length === 0 && (
              <Text style={{ color: "rgba(255,255,255,0.35)", fontFamily: FONT_FAMILY.medium, fontSize: FONT.sizes.sm, paddingVertical: 10 }}>
                Crée d'abord un groupe dans l'onglet Déposer.
              </Text>
            )}
            {(myGroups ?? []).map((g) => (
              <Pressable
                key={g.id}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setSelectedGroupId(g.id);
                }}
                style={{
                  paddingHorizontal: 20,
                  paddingVertical: 10,
                  borderRadius: RADIUS.full,
                  backgroundColor:
                    selectedGroupId === g.id ? `${PALETTE.sarcelle}20` : "rgba(255,255,255,0.05)",
                  borderWidth: 1.5,
                  borderColor:
                    selectedGroupId === g.id ? PALETTE.sarcelle : "rgba(255,255,255,0.1)",
                }}
              >
                <Text
                  style={{
                    color: selectedGroupId === g.id ? PALETTE.sarcelle : "rgba(255,255,255,0.45)",
                    fontFamily: FONT_FAMILY.semibold,
                    fontSize: FONT.sizes.sm,
                  }}
                  numberOfLines={1}
                >
                  {g.name}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* ── Catégorie ───────────────────────────────────────────── */}
        <View style={{ paddingHorizontal: 20, marginBottom: 16 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 14 }}>
            <Ionicons name="grid-outline" size={18} color={PALETTE.fuchsia} />
            <Text
              style={{
                color: "rgba(255,255,255,0.5)",
                fontFamily: FONT_FAMILY.bold,
                fontSize: FONT.sizes.xs,
                textTransform: "uppercase",
                letterSpacing: 1.4,
              }}
            >
              Catégorie
            </Text>
          </View>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
            {PUBLIC_CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat.key;
              return (
                <Pressable
                  key={cat.key}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSelectedCategory(isSelected ? null : cat.key);
                  }}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                    paddingHorizontal: 14,
                    paddingVertical: 9,
                    borderRadius: RADIUS.full,
                    backgroundColor: isSelected ? `${PALETTE.fuchsia}20` : "rgba(255,255,255,0.05)",
                    borderWidth: 1.5,
                    borderColor: isSelected ? PALETTE.fuchsia : "rgba(255,255,255,0.1)",
                  }}
                >
                  <Ionicons name={cat.icon} size={14} color={isSelected ? PALETTE.fuchsia : cat.color} />
                  <Text
                    style={{
                      color: isSelected ? PALETTE.fuchsia : "rgba(255,255,255,0.45)",
                      fontFamily: FONT_FAMILY.semibold,
                      fontSize: FONT.sizes.sm,
                    }}
                  >
                    {cat.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
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
        <AnimatedPressable onPress={handlePublish} disabled={isUploading}>
          <LinearGradient
            colors={[PALETTE.fuchsia, PALETTE.sarcelle]}
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
            {isUploading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Ionicons name="send" size={20} color="#FFF" />
            )}
            <Text
              style={{
                color: "#FFF",
                fontFamily: FONT_FAMILY.extrabold,
                fontSize: FONT.sizes.xl,
              }}
            >
              {isUploading ? "Publication..." : "Publier maintenant"}
            </Text>
          </LinearGradient>
        </AnimatedPressable>
      </View>
    </View>
  );
}
