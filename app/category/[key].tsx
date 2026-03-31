import { useState } from "react";
import { View, Text, Pressable, FlatList, ActivityIndicator, RefreshControl } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { usePublicGroups, PUBLIC_CATEGORIES, type PublicGroup } from "@/src/features/groups/usePublicGroups";
import { useJoinPublicGroup } from "@/src/features/groups/useGroupActions";
import { AnimatedPressable } from "@/src/components/ui/AnimatedPressable";
import { FONT, FONT_FAMILY, PALETTE, RADIUS, SPACING, getGroupBannerColor } from "@/src/theme";

function GroupCard({ group }: { group: PublicGroup }) {
  const router = useRouter();
  const joinGroup = useJoinPublicGroup();
  const banner = getGroupBannerColor(group.id);
  const initials = group.name.slice(0, 2).toUpperCase();

  return (
    <AnimatedPressable
      onPress={() => {
        if (group.is_member) router.push({ pathname: "/group/[id]", params: { id: group.id } });
      }}
      style={{ marginHorizontal: SPACING["2xl"], marginBottom: 14, borderRadius: RADIUS.xl, overflow: "hidden", shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4 }}
    >
      <View style={{ height: 150 }}>
        {group.cover_url ? (
          <Image source={{ uri: group.cover_url }} style={{ position: "absolute", width: "100%", height: "100%" }} contentFit="cover" />
        ) : (
          <LinearGradient colors={[banner.from, banner.to]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ position: "absolute", width: "100%", height: "100%", alignItems: "center", justifyContent: "center" }}>
            <Text style={{ fontSize: 56, fontFamily: FONT_FAMILY.black, color: "rgba(255,255,255,0.2)", letterSpacing: -3 }}>{initials}</Text>
          </LinearGradient>
        )}
        <LinearGradient colors={["transparent", "rgba(0,0,0,0.75)"]} style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 110 }} />

        {group.prize && (
          <View style={{ position: "absolute", top: 12, right: 12, backgroundColor: "rgba(253,184,19,0.92)", borderRadius: RADIUS.full, paddingHorizontal: 9, paddingVertical: 3, flexDirection: "row", alignItems: "center", gap: 4 }}>
            <Ionicons name="gift" size={10} color="#1A1A1A" />
            <Text style={{ color: "#1A1A1A", fontSize: FONT.sizes.xs, fontFamily: FONT_FAMILY.bold }} numberOfLines={1}>{group.prize}</Text>
          </View>
        )}

        <View style={{ position: "absolute", bottom: 14, left: 16, right: 16, flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between" }}>
          <View style={{ flex: 1, marginRight: 10 }}>
            <Text style={{ color: "#FFF", fontSize: FONT.sizes.xl, fontFamily: FONT_FAMILY.bold, marginBottom: 3 }} numberOfLines={1}>{group.name}</Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                <Ionicons name="people-outline" size={11} color="rgba(255,255,255,0.65)" />
                <Text style={{ color: "rgba(255,255,255,0.65)", fontSize: FONT.sizes.xs, fontFamily: FONT_FAMILY.medium }}>
                  {group.member_count} membre{group.member_count !== 1 ? "s" : ""}
                </Text>
              </View>
              {group.challenge_count > 0 && (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                  <Ionicons name="flag-outline" size={11} color="rgba(255,255,255,0.65)" />
                  <Text style={{ color: "rgba(255,255,255,0.65)", fontSize: FONT.sizes.xs, fontFamily: FONT_FAMILY.medium }}>
                    {group.challenge_count} défi{group.challenge_count !== 1 ? "s" : ""}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {group.is_member ? (
            <View style={{ backgroundColor: "rgba(63,208,201,0.2)", borderWidth: 1, borderColor: "rgba(63,208,201,0.6)", borderRadius: RADIUS.full, paddingHorizontal: 13, paddingVertical: 6 }}>
              <Text style={{ color: PALETTE.sarcelle, fontSize: FONT.sizes.xs, fontFamily: FONT_FAMILY.bold }}>Membre</Text>
            </View>
          ) : (
            <AnimatedPressable
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); joinGroup.mutate(group.id); }}
              disabled={joinGroup.isPending}
              style={{ backgroundColor: PALETTE.sarcelle, borderRadius: RADIUS.full, paddingHorizontal: 16, paddingVertical: 7, flexDirection: "row", alignItems: "center", gap: 5 }}
            >
              {joinGroup.isPending ? <ActivityIndicator size="small" color="#FFF" /> : (
                <>
                  <Ionicons name="add" size={14} color="#FFF" />
                  <Text style={{ color: "#FFF", fontSize: FONT.sizes.sm, fontFamily: FONT_FAMILY.bold }}>Rejoindre</Text>
                </>
              )}
            </AnimatedPressable>
          )}
        </View>
      </View>
    </AnimatedPressable>
  );
}

export default function CategoryScreen() {
  const { key } = useLocalSearchParams<{ key: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const cat = PUBLIC_CATEGORIES.find((c) => c.key === key);
  const { data: groups, isPending, refetch, isRefetching } = usePublicGroups(key);

  const publicGroups = (groups ?? []).sort((a, b) => b.member_count - a.member_count);
  const totalMembers = (groups ?? []).reduce((acc, g) => acc + g.member_count, 0);

  if (!cat) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <Text style={{ color: "#999" }}>Catégorie introuvable</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#F2F3F7" }}>
      {/* ── Hero header ──────────────────────────────────────── */}
      <View style={{ backgroundColor: "#FFF", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 3 }}>
        {/* Back + title */}
        <View style={{ paddingTop: insets.top + 8, paddingHorizontal: SPACING["2xl"], paddingBottom: SPACING.xl }}>
          <Pressable
            onPress={() => router.back()}
            hitSlop={12}
            style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: SPACING.xl }}
          >
            <Ionicons name="chevron-back" size={20} color="#555" />
            <Text style={{ fontSize: FONT.sizes.base, fontFamily: FONT_FAMILY.medium, color: "#555" }}>Retour</Text>
          </Pressable>

          <View style={{ flexDirection: "row", alignItems: "center", gap: SPACING.lg }}>
            {/* Icon bubble */}
            <View style={{ width: 64, height: 64, borderRadius: 20, backgroundColor: `${cat.color}18`, alignItems: "center", justifyContent: "center" }}>
              <Ionicons name={cat.icon as any} size={32} color={cat.color} />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: FONT.sizes["3xl"], fontFamily: FONT_FAMILY.black, color: "#1A1A1A", letterSpacing: -0.5 }}>
                {cat.label}
              </Text>
              {!isPending && (
                <View style={{ flexDirection: "row", alignItems: "center", gap: SPACING.lg, marginTop: 4 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                    <Ionicons name="people-outline" size={13} color="#AAA" />
                    <Text style={{ fontSize: FONT.sizes.sm, fontFamily: FONT_FAMILY.medium, color: "#AAA" }}>
                      {totalMembers.toLocaleString()} membres
                    </Text>
                  </View>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                    <Ionicons name="grid-outline" size={13} color="#AAA" />
                    <Text style={{ fontSize: FONT.sizes.sm, fontFamily: FONT_FAMILY.medium, color: "#AAA" }}>
                      {publicGroups.length} groupe{publicGroups.length !== 1 ? "s" : ""}
                    </Text>
                  </View>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Color bar */}
        <View style={{ height: 3, backgroundColor: cat.color, opacity: 0.7 }} />
      </View>

      {/* ── List ─────────────────────────────────────────────── */}
      {isPending ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color={cat.color} />
        </View>
      ) : (
        <FlatList
          data={publicGroups}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingTop: SPACING.xl, paddingBottom: insets.bottom + 110 }}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={cat.color} />}
          ListEmptyComponent={
            <View style={{ alignItems: "center", paddingVertical: 64, paddingHorizontal: SPACING["2xl"] }}>
              <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: "#EAEAEF", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
                <Ionicons name={cat.icon as any} size={36} color="#CCC" />
              </View>
              <Text style={{ fontSize: FONT.sizes.lg, fontFamily: FONT_FAMILY.bold, color: "#1A1A1A", textAlign: "center" }}>
                Pas encore de groupe
              </Text>
              <Text style={{ marginTop: 6, fontSize: FONT.sizes.sm, fontFamily: FONT_FAMILY.regular, color: "#AAAAAA", textAlign: "center" }}>
                Sois le premier à créer un groupe {cat.label} !
              </Text>
            </View>
          }
          renderItem={({ item }) => <GroupCard group={item} />}
        />
      )}
    </View>
  );
}
