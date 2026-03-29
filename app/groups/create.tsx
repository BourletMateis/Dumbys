import { useState } from "react";
import {
  View, Text, TextInput, Pressable, ScrollView,
  ActivityIndicator, Switch,
} from "react-native";
import { router, Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useCreateGroup } from "@/src/features/groups/useGroupActions";
import { PALETTE, RADIUS, FONT, FONT_FAMILY, SPACING } from "@/src/theme";

export default function CreateGroupScreen() {
  const insets = useSafeAreaInsets();
  const createGroup = useCreateGroup();

  const [name,        setName]        = useState("");
  const [description, setDescription] = useState("");
  const [isPublic,    setIsPublic]    = useState(false);

  const canSubmit = name.trim().length >= 2 && !createGroup.isPending;

  const handleCreate = () => {
    if (!canSubmit) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    createGroup.mutate(
      { name: name.trim(), description: description.trim() || undefined, isPublic },
      {
        onSuccess: (group) => {
          router.replace({ pathname: "/group/[id]", params: { id: group.id } } as any);
        },
      },
    );
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={{ flex: 1, backgroundColor: "#F8F8FA" }}>

        {/* Header */}
        <View
          style={{
            paddingTop: insets.top + SPACING.base,
            paddingBottom: SPACING.base,
            paddingHorizontal: SPACING.lg,
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
            backgroundColor: "#FFFFFF",
            borderBottomWidth: 1,
            borderBottomColor: "rgba(0,0,0,0.05)",
          }}
        >
          <Pressable
            onPress={() => router.back()}
            style={{
              width: 38, height: 38,
              borderRadius: RADIUS.sm,
              backgroundColor: "rgba(0,0,0,0.04)",
              alignItems: "center", justifyContent: "center",
            }}
          >
            <Ionicons name="arrow-back" size={22} color="#1A1A1A" />
          </Pressable>
          <Text style={{ flex: 1, fontSize: FONT.sizes.xl, fontFamily: FONT_FAMILY.bold, color: "#1A1A1A" }}>
            Créer un groupe
          </Text>
        </View>

        <ScrollView
          contentContainerStyle={{ padding: SPACING["2xl"], gap: SPACING.xl }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Nom */}
          <View style={{ gap: SPACING.xs }}>
            <Text style={{ fontSize: FONT.sizes.xs, fontFamily: FONT_FAMILY.bold, color: "#999", textTransform: "uppercase", letterSpacing: 1.2 }}>
              Nom du groupe *
            </Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Ex : Les Legends du Vendredi"
              placeholderTextColor="#BBB"
              maxLength={40}
              style={{
                backgroundColor: "#FFFFFF",
                borderRadius: RADIUS.lg,
                borderWidth: 1,
                borderColor: name.trim().length >= 2 ? PALETTE.sarcelle : "rgba(0,0,0,0.08)",
                paddingHorizontal: SPACING.lg,
                paddingVertical: 14,
                fontSize: FONT.sizes.base,
                fontFamily: FONT_FAMILY.medium,
                color: "#1A1A1A",
              }}
              autoFocus
            />
            <Text style={{ fontSize: FONT.sizes.xs, fontFamily: FONT_FAMILY.regular, color: "#BBB", textAlign: "right" }}>
              {name.length}/40
            </Text>
          </View>

          {/* Description */}
          <View style={{ gap: SPACING.xs }}>
            <Text style={{ fontSize: FONT.sizes.xs, fontFamily: FONT_FAMILY.bold, color: "#999", textTransform: "uppercase", letterSpacing: 1.2 }}>
              Description <Text style={{ fontFamily: FONT_FAMILY.regular, textTransform: "none" }}>(optionnel)</Text>
            </Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="À quoi sert ce groupe ?"
              placeholderTextColor="#BBB"
              maxLength={200}
              multiline
              numberOfLines={3}
              style={{
                backgroundColor: "#FFFFFF",
                borderRadius: RADIUS.lg,
                borderWidth: 1,
                borderColor: "rgba(0,0,0,0.08)",
                paddingHorizontal: SPACING.lg,
                paddingVertical: 14,
                fontSize: FONT.sizes.base,
                fontFamily: FONT_FAMILY.medium,
                color: "#1A1A1A",
                minHeight: 90,
                textAlignVertical: "top",
              }}
            />
          </View>

          {/* Visibilité */}
          <View
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: RADIUS.xl,
              borderWidth: 1,
              borderColor: "rgba(0,0,0,0.06)",
              padding: SPACING.lg,
              flexDirection: "row",
              alignItems: "center",
              gap: 12,
            }}
          >
            <View
              style={{
                width: 40, height: 40,
                borderRadius: RADIUS.sm,
                backgroundColor: isPublic ? `${PALETTE.fuchsia}15` : "rgba(0,0,0,0.04)",
                alignItems: "center", justifyContent: "center",
              }}
            >
              <Ionicons
                name={isPublic ? "globe-outline" : "lock-closed-outline"}
                size={20}
                color={isPublic ? PALETTE.fuchsia : "#999"}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: FONT.sizes.base, fontFamily: FONT_FAMILY.semibold, color: "#1A1A1A" }}>
                {isPublic ? "Groupe public" : "Groupe privé"}
              </Text>
              <Text style={{ fontSize: FONT.sizes.xs, fontFamily: FONT_FAMILY.regular, color: "#999", marginTop: 2 }}>
                {isPublic
                  ? "Visible et rejoignable par tous"
                  : "Uniquement sur invitation"}
              </Text>
            </View>
            <Switch
              value={isPublic}
              onValueChange={setIsPublic}
              trackColor={{ false: "#E0E0E0", true: `${PALETTE.fuchsia}60` }}
              thumbColor={isPublic ? PALETTE.fuchsia : "#FFFFFF"}
            />
          </View>

          {/* Erreur */}
          {createGroup.isError && (
            <View
              style={{
                backgroundColor: "rgba(244,63,94,0.08)",
                borderRadius: RADIUS.md,
                padding: SPACING.base,
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
              }}
            >
              <Ionicons name="alert-circle-outline" size={16} color="#F43F5E" />
              <Text style={{ flex: 1, fontSize: FONT.sizes.sm, fontFamily: FONT_FAMILY.medium, color: "#F43F5E" }}>
                {(createGroup.error as Error)?.message ?? "Une erreur est survenue"}
              </Text>
            </View>
          )}

          {/* Submit */}
          <Pressable
            onPress={handleCreate}
            disabled={!canSubmit}
            style={({ pressed }) => ({
              opacity: pressed ? 0.85 : 1,
              backgroundColor: canSubmit ? PALETTE.sarcelle : "rgba(0,0,0,0.08)",
              borderRadius: RADIUS.lg,
              paddingVertical: 16,
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "row",
              gap: 8,
            })}
          >
            {createGroup.isPending ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="people" size={18} color={canSubmit ? "#FFFFFF" : "#999"} />
                <Text
                  style={{
                    fontSize: FONT.sizes.lg,
                    fontFamily: FONT_FAMILY.bold,
                    color: canSubmit ? "#FFFFFF" : "#999",
                  }}
                >
                  Créer le groupe
                </Text>
              </>
            )}
          </Pressable>
        </ScrollView>
      </View>
    </>
  );
}
