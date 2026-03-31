import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Alert,
  ScrollView,
  Dimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { usePublicGroups, PUBLIC_CATEGORIES, type PublicGroup } from "@/src/features/groups/usePublicGroups";
import { useMyGroups, type GroupWithRole } from "@/src/features/groups/useMyGroups";
import { useJoinPublicGroup, useCreateGroup } from "@/src/features/groups/useGroupActions";
import { AnimatedPressable } from "@/src/components/ui/AnimatedPressable";
import { BottomSheet } from "@/src/components/ui/BottomSheet";
import { createGroupSchema } from "@/src/lib/schemas";
import { toast } from "@/src/lib/toast";
import { FONT, FONT_FAMILY, PALETTE, RADIUS, SPACING, getGroupBannerColor } from "@/src/theme";

type Tab = "mes-groupes" | "decouvrir";
type GroupType = "thematic" | "private";
type CreateStep = "type" | "category" | "details";

function getCategoryMeta(key: string | null) {
  if (!key) return null;
  return PUBLIC_CATEGORIES.find((c) => c.key === key) ?? null;
}

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
        backgroundColor: color, opacity: 0.10,
        top, left, right, bottom,
        pointerEvents: "none",
      } as any}
    />
  );
}

// ─── My Group Card ───────────────────────────────────────────────
function MyGroupCard({ group }: { group: GroupWithRole }) {
  const router = useRouter();
  const banner = getGroupBannerColor(group.id);
  const initials = group.name.slice(0, 2).toUpperCase();
  const catMeta = getCategoryMeta(group.category);

  return (
    <AnimatedPressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push({ pathname: "/group/[id]", params: { id: group.id } });
      }}
      style={{ marginHorizontal: SPACING["2xl"], marginBottom: 14, borderRadius: RADIUS.xl, overflow: "hidden", shadowColor: "#000", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.10, shadowRadius: 16, elevation: 5 }}
    >
      <View style={{ height: 170 }}>
        {group.cover_url ? (
          <Image source={{ uri: group.cover_url }} style={{ position: "absolute", width: "100%", height: "100%" }} contentFit="cover" />
        ) : (
          <LinearGradient colors={[banner.from, banner.to]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ position: "absolute", width: "100%", height: "100%", alignItems: "center", justifyContent: "center" }}>
            <Text style={{ fontSize: 64, fontFamily: FONT_FAMILY.black, color: "rgba(255,255,255,0.2)", letterSpacing: -3 }}>{initials}</Text>
            <View style={{ position: "absolute", bottom: 16, right: 16, opacity: 0.4 }}>
              <Ionicons name="people" size={28} color="#FFF" />
            </View>
          </LinearGradient>
        )}
        <LinearGradient colors={["transparent", "rgba(0,0,0,0.78)"]} style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 120 }} />

        {catMeta && (
          <View style={{ position: "absolute", top: 12, left: 12, backgroundColor: "rgba(0,0,0,0.48)", borderRadius: RADIUS.full, paddingHorizontal: 9, paddingVertical: 3, flexDirection: "row", alignItems: "center", gap: 4 }}>
            <Ionicons name={catMeta.icon as any} size={11} color={catMeta.color} />
            <Text style={{ color: "#FFF", fontSize: FONT.sizes.xs, fontFamily: FONT_FAMILY.semibold }}>{catMeta.label}</Text>
          </View>
        )}

        <View style={{ position: "absolute", top: 12, right: 12, flexDirection: "row", gap: 6, alignItems: "center" }}>
          {group.role === "owner" && (
            <View style={{ backgroundColor: "rgba(253,184,19,0.92)", borderRadius: RADIUS.full, paddingHorizontal: 9, paddingVertical: 3 }}>
              <Text style={{ color: "#1A1A1A", fontSize: FONT.sizes.xs, fontFamily: FONT_FAMILY.bold }}>Créateur</Text>
            </View>
          )}
          <View style={{ backgroundColor: group.is_public ? "rgba(63,208,201,0.88)" : "rgba(0,0,0,0.45)", borderRadius: RADIUS.full, paddingHorizontal: 9, paddingVertical: 3 }}>
            <Text style={{ color: "#FFF", fontSize: FONT.sizes.xs, fontFamily: FONT_FAMILY.semibold }}>
              {group.is_public ? "Public" : "Privé"}
            </Text>
          </View>
        </View>

        <View style={{ position: "absolute", bottom: 16, left: 16, right: 16, flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between" }}>
          <View style={{ flex: 1, marginRight: 12 }}>
            <Text style={{ color: "#FFF", fontSize: FONT.sizes.xl, fontFamily: FONT_FAMILY.bold, marginBottom: 3, letterSpacing: -0.3 }} numberOfLines={1}>{group.name}</Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
              <Ionicons name="people-outline" size={12} color="rgba(255,255,255,0.65)" />
              <Text style={{ color: "rgba(255,255,255,0.65)", fontSize: FONT.sizes.xs, fontFamily: FONT_FAMILY.medium }}>
                {group.member_count} membre{group.member_count !== 1 ? "s" : ""}
              </Text>
            </View>
          </View>
          <View style={{ backgroundColor: "rgba(255,255,255,0.15)", width: 32, height: 32, borderRadius: RADIUS.full, alignItems: "center", justifyContent: "center" }}>
            <Ionicons name="chevron-forward" size={16} color="#FFF" />
          </View>
        </View>
      </View>
    </AnimatedPressable>
  );
}

// ─── Discover Card ───────────────────────────────────────────────
function DiscoverCard({ group }: { group: PublicGroup }) {
  const router = useRouter();
  const joinGroup = useJoinPublicGroup();
  const banner = getGroupBannerColor(group.id);
  const initials = group.name.slice(0, 2).toUpperCase();
  const catMeta = getCategoryMeta(group.category);

  return (
    <AnimatedPressable
      onPress={() => { if (group.is_member) router.push({ pathname: "/group/[id]", params: { id: group.id } }); }}
      style={{ marginHorizontal: SPACING["2xl"], marginBottom: 14, borderRadius: RADIUS.xl, overflow: "hidden", shadowColor: "#000", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.10, shadowRadius: 16, elevation: 5 }}
    >
      <View style={{ height: 170 }}>
        {group.cover_url ? (
          <Image source={{ uri: group.cover_url }} style={{ position: "absolute", width: "100%", height: "100%" }} contentFit="cover" />
        ) : (
          <LinearGradient colors={[banner.from, banner.to]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ position: "absolute", width: "100%", height: "100%", alignItems: "center", justifyContent: "center" }}>
            <Text style={{ fontSize: 64, fontFamily: FONT_FAMILY.black, color: "rgba(255,255,255,0.2)", letterSpacing: -3 }}>{initials}</Text>
          </LinearGradient>
        )}
        <LinearGradient colors={["transparent", "rgba(0,0,0,0.78)"]} style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 120 }} />

        <View style={{ position: "absolute", top: 12, left: 12, flexDirection: "row", gap: 6 }}>
          {catMeta && (
            <View style={{ backgroundColor: "rgba(0,0,0,0.48)", borderRadius: RADIUS.full, paddingHorizontal: 9, paddingVertical: 3, flexDirection: "row", alignItems: "center", gap: 4 }}>
              <Ionicons name={catMeta.icon as any} size={11} color={catMeta.color} />
              <Text style={{ color: "#FFF", fontSize: FONT.sizes.xs, fontFamily: FONT_FAMILY.semibold }}>{catMeta.label}</Text>
            </View>
          )}
          {group.challenge_count > 0 && (
            <View style={{ backgroundColor: "rgba(0,0,0,0.48)", borderRadius: RADIUS.full, paddingHorizontal: 9, paddingVertical: 3, flexDirection: "row", alignItems: "center", gap: 4 }}>
              <Ionicons name="flag" size={10} color={PALETTE.jaune} />
              <Text style={{ color: "#FFF", fontSize: FONT.sizes.xs, fontFamily: FONT_FAMILY.semibold }}>{group.challenge_count} défi{group.challenge_count !== 1 ? "s" : ""}</Text>
            </View>
          )}
        </View>

        {group.prize && (
          <View style={{ position: "absolute", top: 12, right: 12, backgroundColor: "rgba(253,184,19,0.92)", borderRadius: RADIUS.full, paddingHorizontal: 9, paddingVertical: 3, flexDirection: "row", alignItems: "center", gap: 4, maxWidth: 140 }}>
            <Ionicons name="gift" size={10} color="#1A1A1A" />
            <Text style={{ color: "#1A1A1A", fontSize: FONT.sizes.xs, fontFamily: FONT_FAMILY.bold }} numberOfLines={1}>{group.prize}</Text>
          </View>
        )}

        <View style={{ position: "absolute", bottom: 16, left: 16, right: 16, flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between" }}>
          <View style={{ flex: 1, marginRight: 10 }}>
            <Text style={{ color: "#FFF", fontSize: FONT.sizes.xl, fontFamily: FONT_FAMILY.bold, marginBottom: 3, letterSpacing: -0.3 }} numberOfLines={1}>{group.name}</Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
              <Ionicons name="people-outline" size={12} color="rgba(255,255,255,0.65)" />
              <Text style={{ color: "rgba(255,255,255,0.65)", fontSize: FONT.sizes.xs, fontFamily: FONT_FAMILY.medium }}>
                {group.member_count} membre{group.member_count !== 1 ? "s" : ""}
              </Text>
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
                <><Ionicons name="add" size={14} color="#FFF" /><Text style={{ color: "#FFF", fontSize: FONT.sizes.sm, fontFamily: FONT_FAMILY.bold }}>Rejoindre</Text></>
              )}
            </AnimatedPressable>
          )}
        </View>
      </View>
    </AnimatedPressable>
  );
}

const { width: SCREEN_W } = Dimensions.get("window");
const CAT_CARD_W = (SCREEN_W - SPACING["2xl"] * 2 - 12) / 2;

// ─── Category grid card (Discover) ──────────────────────────────
function CategoryCard({ cat, onPress }: { cat: typeof PUBLIC_CATEGORIES[number]; onPress: () => void }) {
  return (
    <AnimatedPressable
      onPress={onPress}
      style={{ width: CAT_CARD_W, borderRadius: RADIUS.xl, overflow: "hidden", shadowColor: cat.color, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.25, shadowRadius: 12, elevation: 5 }}
    >
      <LinearGradient
        colors={[cat.color, cat.color + "AA"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ height: 100, padding: 16, justifyContent: "space-between" }}
      >
        <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.22)", alignItems: "center", justifyContent: "center" }}>
          <Ionicons name={cat.icon as any} size={22} color="#FFF" />
        </View>
        <Text style={{ fontSize: FONT.sizes.lg, fontFamily: FONT_FAMILY.bold, color: "#FFF", letterSpacing: -0.3 }}>{cat.label}</Text>
      </LinearGradient>
    </AnimatedPressable>
  );
}

// ─── Main screen ─────────────────────────────────────────────────
export default function GroupsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("mes-groupes");
  const [search, setSearch] = useState("");

  // ── Create group multi-step state ───────────────────────────
  const [showCreate, setShowCreate] = useState(false);
  const [createStep, setCreateStep] = useState<CreateStep>("type");
  const [groupType, setGroupType] = useState<GroupType | null>(null);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newCoverUri, setNewCoverUri] = useState<string | null>(null);
  const [newCategory, setNewCategory] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [nameError, setNameError] = useState<string | undefined>();

  const createGroup = useCreateGroup();

  const resetCreate = () => {
    setShowCreate(false);
    setCreateStep("type");
    setGroupType(null);
    setNewName(""); setNewDesc(""); setNewCoverUri(null); setNewCategory(null);
    setNameError(undefined);
  };

  const pickCover = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) { Alert.alert("Permission requise", "Autorise l'accès à ta galerie."); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.8, allowsEditing: true, aspect: [16, 9] });
    if (result.canceled || !result.assets[0]) return;
    setNewCoverUri(result.assets[0].uri);
  };

  const handleCreate = () => {
    const parsed = createGroupSchema.safeParse({ name: newName.trim(), description: newDesc.trim() || undefined });
    if (!parsed.success) { setNameError(parsed.error.flatten().fieldErrors.name?.[0]); return; }
    setNameError(undefined);
    setIsCreating(true);
    createGroup.mutate(
      {
        name: newName.trim(),
        description: newDesc.trim() || undefined,
        isPublic: groupType === "thematic",
        category: groupType === "thematic" ? (newCategory ?? undefined) : undefined,
        coverUri: newCoverUri ?? undefined,
      },
      {
        onSuccess: (data) => { resetCreate(); router.push({ pathname: "/group/[id]", params: { id: data.id } }); },
        onError: (err) => toast.error(err.message),
        onSettled: () => setIsCreating(false),
      },
    );
  };

  const { data: myGroups, isPending: myPending, refetch: refetchMy, isRefetching: isRefetchingMy } = useMyGroups();
  const { data: publicGroups, isPending: publicPending, refetch: refetchPublic, isRefetching: isRefetchingPublic } = usePublicGroups();

  const sorted = (publicGroups ?? [])
    .filter((g) => !g.is_member)
    .filter((g) => !search.trim() || g.name.toLowerCase().includes(search.trim().toLowerCase()))
    .sort((a, b) => b.member_count - a.member_count);

  const myFiltered = (myGroups ?? []).filter((g) =>
    !search.trim() || g.name.toLowerCase().includes(search.trim().toLowerCase()),
  );

  const isPending = activeTab === "mes-groupes" ? myPending : publicPending;
  const isRefetching = activeTab === "mes-groupes" ? isRefetchingMy : isRefetchingPublic;
  const refetch = activeTab === "mes-groupes" ? refetchMy : refetchPublic;

  // ── Discover list items (categories hero + groups) ──────────
  type DiscoverItem =
    | { type: "categories"; key: string }
    | { type: "section"; label: string; key: string }
    | { type: "group"; group: PublicGroup; key: string };

  const discoverItems: DiscoverItem[] = search.trim()
    ? sorted.map((g) => ({ type: "group" as const, group: g, key: g.id }))
    : [
        { type: "categories", key: "cats" },
        ...(sorted.length > 0 ? [{ type: "section" as const, label: "Tous les groupes", key: "section-all" }] : []),
        ...sorted.map((g) => ({ type: "group" as const, group: g, key: g.id })),
      ];

  return (
    <View style={{ flex: 1, backgroundColor: "#F2F3F7" }}>
      <Blob size={220} color={PALETTE.sarcelle} top={-60} right={-70} />
      <Blob size={160} color={PALETTE.fuchsia} top={320} left={-60} />
      <Blob size={120} color={PALETTE.jaune} bottom={200} right={-40} />
      {/* ── Header ───────────────────────────────────────────── */}
      <View style={{ paddingTop: insets.top + 8, backgroundColor: "#FFFFFF", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 3 }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: SPACING["2xl"], paddingBottom: SPACING.lg }}>
          <Text style={{ fontSize: FONT.sizes["4xl"], fontFamily: FONT_FAMILY.black, color: "#1A1A1A", letterSpacing: -1 }}>Groupes</Text>
          <AnimatedPressable
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setShowCreate(true); }}
            style={{ borderRadius: 14, overflow: "hidden" }}
          >
            <LinearGradient colors={["#FF6B3D", PALETTE.fuchsia]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ width: 40, height: 40, alignItems: "center", justifyContent: "center" }}>
              <Ionicons name="add" size={24} color="#FFF" />
            </LinearGradient>
          </AnimatedPressable>
        </View>

        {/* Search */}
        <View style={{ flexDirection: "row", alignItems: "center", marginHorizontal: SPACING["2xl"], marginBottom: SPACING.lg, backgroundColor: "#F2F3F7", borderRadius: RADIUS.lg, paddingHorizontal: 14, gap: 10 }}>
          <Ionicons name="search" size={17} color="#BBBBC0" />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Rechercher un groupe..."
            placeholderTextColor="#BBBBC0"
            autoCapitalize="none"
            autoCorrect={false}
            style={{ flex: 1, color: "#1A1A1A", fontSize: FONT.sizes.base, fontFamily: FONT_FAMILY.regular, paddingVertical: 11 }}
          />
          {search.length > 0 && <Pressable onPress={() => setSearch("")}><Ionicons name="close-circle" size={18} color="#CCC" /></Pressable>}
        </View>

        {/* Tabs */}
        <View style={{ flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "rgba(0,0,0,0.06)" }}>
          {([
            { key: "mes-groupes" as const, label: "Mes groupes", count: myGroups?.length },
            { key: "decouvrir" as const, label: "Découvrir", count: undefined },
          ] as const).map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <Pressable
                key={tab.key}
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setActiveTab(tab.key); }}
                style={{ flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 12, borderBottomWidth: 2, borderBottomColor: isActive ? PALETTE.sarcelle : "transparent", marginBottom: -1 }}
              >
                <Text style={{ fontSize: FONT.sizes.base, fontFamily: isActive ? FONT_FAMILY.bold : FONT_FAMILY.medium, color: isActive ? PALETTE.sarcelle : "#AAAAAA" }}>
                  {tab.label}
                </Text>
                {tab.count !== undefined && tab.count > 0 && (
                  <View style={{ backgroundColor: isActive ? PALETTE.sarcelle : "rgba(0,0,0,0.08)", borderRadius: RADIUS.full, minWidth: 20, height: 20, alignItems: "center", justifyContent: "center", paddingHorizontal: 5 }}>
                    <Text style={{ fontSize: 10, fontFamily: FONT_FAMILY.bold, color: isActive ? "#FFF" : "#999" }}>{tab.count}</Text>
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* ── Content ──────────────────────────────────────────── */}
      {isPending ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color={PALETTE.sarcelle} />
        </View>
      ) : activeTab === "mes-groupes" ? (
        <FlatList
          data={myFiltered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingTop: SPACING.xl, paddingBottom: insets.bottom + 110 }}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={PALETTE.sarcelle} />}
          ListEmptyComponent={
            <View style={{ alignItems: "center", paddingVertical: 64, paddingHorizontal: SPACING["2xl"] }}>
              <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: "#EAEAEF", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
                <Ionicons name="people-outline" size={36} color="#CCC" />
              </View>
              <Text style={{ fontSize: FONT.sizes.lg, fontFamily: FONT_FAMILY.bold, color: "#1A1A1A", textAlign: "center" }}>
                {search.trim() ? "Aucun résultat" : "Pas encore de groupe"}
              </Text>
              <Text style={{ marginTop: 6, fontSize: FONT.sizes.sm, fontFamily: FONT_FAMILY.regular, color: "#AAAAAA", textAlign: "center", lineHeight: 20 }}>
                {search.trim() ? "Essaie un autre mot-clé" : "Rejoins un groupe public ou crée le tien"}
              </Text>
              {!search.trim() && (
                <Pressable
                  onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setActiveTab("decouvrir"); }}
                  style={{ marginTop: SPACING.xl, flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: PALETTE.sarcelle, paddingHorizontal: 22, paddingVertical: 13, borderRadius: RADIUS.full }}
                >
                  <Ionicons name="compass-outline" size={18} color="#FFF" />
                  <Text style={{ fontSize: FONT.sizes.base, fontFamily: FONT_FAMILY.bold, color: "#FFF" }}>Découvrir des groupes</Text>
                </Pressable>
              )}
            </View>
          }
          renderItem={({ item }) => <MyGroupCard group={item} />}
        />
      ) : (
        <FlatList
          data={discoverItems}
          keyExtractor={(item) => item.key}
          contentContainerStyle={{ paddingTop: SPACING.xl, paddingBottom: insets.bottom + 110 }}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={PALETTE.sarcelle} />}
          ListEmptyComponent={
            <View style={{ alignItems: "center", paddingVertical: 64, paddingHorizontal: SPACING["2xl"] }}>
              <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: "#EAEAEF", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
                <Ionicons name="search-outline" size={36} color="#CCC" />
              </View>
              <Text style={{ fontSize: FONT.sizes.lg, fontFamily: FONT_FAMILY.bold, color: "#1A1A1A", textAlign: "center" }}>Aucun groupe trouvé</Text>
              <Text style={{ marginTop: 6, fontSize: FONT.sizes.sm, fontFamily: FONT_FAMILY.regular, color: "#AAAAAA", textAlign: "center" }}>Essaie un autre mot-clé</Text>
            </View>
          }
          renderItem={({ item }) => {
            if (item.type === "categories") {
              return (
                <View style={{ paddingHorizontal: SPACING["2xl"], marginBottom: 28 }}>
                  <Text style={{ fontSize: FONT.sizes.xs, fontFamily: FONT_FAMILY.bold, color: "#AAAAAA", textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 14 }}>
                    Parcourir par thème
                  </Text>
                  <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
                    {PUBLIC_CATEGORIES.map((cat) => (
                      <CategoryCard
                        key={cat.key}
                        cat={cat}
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          router.push({ pathname: "/category/[key]", params: { key: cat.key } } as any);
                        }}
                      />
                    ))}
                  </View>
                </View>
              );
            }
            if (item.type === "section") {
              return (
                <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: SPACING["2xl"], marginBottom: SPACING.base, gap: 8 }}>
                  <Text style={{ fontSize: FONT.sizes.xs, fontFamily: FONT_FAMILY.bold, color: "#AAAAAA", textTransform: "uppercase", letterSpacing: 1.2 }}>
                    {item.label}
                  </Text>
                  <View style={{ flex: 1, height: 1, backgroundColor: "rgba(0,0,0,0.06)" }} />
                </View>
              );
            }
            return <DiscoverCard group={item.group} />;
          }}
        />
      )}

      {/* ── Create group sheet — multi-step ──────────────────── */}
      <BottomSheet
        isOpen={showCreate}
        onClose={resetCreate}
        snapPoint={createStep === "type" ? 0.5 : createStep === "category" ? 0.65 : 0.92}
      >
        <ScrollView style={{ paddingHorizontal: SPACING["2xl"], paddingTop: 8 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} automaticallyAdjustKeyboardInsets>

          {/* ── Step 1 : Type ─────────────────────────────────── */}
          {createStep === "type" && (
            <>
              <Text style={{ fontSize: FONT.sizes["2xl"], fontFamily: FONT_FAMILY.bold, color: "#1A1A1A", marginBottom: 6 }}>
                Créer un groupe
              </Text>
              <Text style={{ fontSize: FONT.sizes.sm, fontFamily: FONT_FAMILY.regular, color: "#AAAAAA", marginBottom: 28 }}>
                Quel type de groupe veux-tu créer ?
              </Text>

              {/* Thématique */}
              <AnimatedPressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  setGroupType("thematic");
                  setCreateStep("category");
                }}
                style={{ borderRadius: RADIUS.xl, overflow: "hidden", marginBottom: 14 }}
              >
                <LinearGradient colors={[PALETTE.sarcelle, "#2ABFB8"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ padding: 20, flexDirection: "row", alignItems: "center", gap: 16 }}>
                  <View style={{ width: 52, height: 52, borderRadius: 16, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" }}>
                    <Ionicons name="compass" size={26} color="#FFF" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: FONT.sizes.lg, fontFamily: FONT_FAMILY.bold, color: "#FFF" }}>Thématique</Text>
                    <Text style={{ fontSize: FONT.sizes.sm, fontFamily: FONT_FAMILY.regular, color: "rgba(255,255,255,0.8)", marginTop: 3 }}>
                      Public, avec une catégorie. Ouvert à tous.
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.7)" />
                </LinearGradient>
              </AnimatedPressable>

              {/* Privé */}
              <AnimatedPressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  setGroupType("private");
                  setCreateStep("details");
                }}
                style={{ borderRadius: RADIUS.xl, backgroundColor: "#F2F3F7", borderWidth: 1.5, borderColor: "rgba(0,0,0,0.06)", padding: 20, flexDirection: "row", alignItems: "center", gap: 16, marginBottom: 40 }}
              >
                <View style={{ width: 52, height: 52, borderRadius: 16, backgroundColor: "#E8E8EF", alignItems: "center", justifyContent: "center" }}>
                  <Ionicons name="lock-closed" size={24} color="#555" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: FONT.sizes.lg, fontFamily: FONT_FAMILY.bold, color: "#1A1A1A" }}>Entre potes</Text>
                  <Text style={{ fontSize: FONT.sizes.sm, fontFamily: FONT_FAMILY.regular, color: "#AAAAAA", marginTop: 3 }}>
                    Privé, sur invitation. Juste votre cercle.
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#CCC" />
              </AnimatedPressable>
            </>
          )}

          {/* ── Step 2 : Catégorie (thématique uniquement) ────── */}
          {createStep === "category" && (
            <>
              <Pressable onPress={() => setCreateStep("type")} style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 20 }}>
                <Ionicons name="chevron-back" size={18} color="#AAA" />
                <Text style={{ fontSize: FONT.sizes.sm, fontFamily: FONT_FAMILY.medium, color: "#AAA" }}>Retour</Text>
              </Pressable>

              <Text style={{ fontSize: FONT.sizes["2xl"], fontFamily: FONT_FAMILY.bold, color: "#1A1A1A", marginBottom: 6 }}>
                Choisis un thème
              </Text>
              <Text style={{ fontSize: FONT.sizes.sm, fontFamily: FONT_FAMILY.regular, color: "#AAAAAA", marginBottom: 24 }}>
                Le thème aide les autres à trouver ton groupe.
              </Text>

              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 28 }}>
                {PUBLIC_CATEGORIES.map((cat) => {
                  const isActive = newCategory === cat.key;
                  return (
                    <Pressable
                      key={cat.key}
                      onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setNewCategory(isActive ? null : cat.key); }}
                      style={{ flexDirection: "row", alignItems: "center", gap: 7, paddingHorizontal: 16, paddingVertical: 10, borderRadius: RADIUS.full, backgroundColor: isActive ? cat.color : "#F2F3F7", borderWidth: 2, borderColor: isActive ? cat.color : "transparent" }}
                    >
                      <Ionicons name={cat.icon as any} size={15} color={isActive ? "#FFF" : cat.color} />
                      <Text style={{ fontSize: FONT.sizes.sm, fontFamily: isActive ? FONT_FAMILY.bold : FONT_FAMILY.medium, color: isActive ? "#FFF" : "#555" }}>
                        {cat.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <AnimatedPressable
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setCreateStep("details"); }}
                style={{ overflow: "hidden", borderRadius: 14, marginBottom: 40, opacity: !newCategory ? 0.4 : 1 }}
                disabled={!newCategory}
              >
                <LinearGradient
                  colors={newCategory ? [PALETTE.sarcelle, "#2ABFB8"] : ["#DDD", "#CCC"]}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={{ paddingVertical: 16, alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 8 }}
                >
                  <Text style={{ color: "#FFF", fontSize: FONT.sizes.lg, fontFamily: FONT_FAMILY.bold }}>Continuer</Text>
                  <Ionicons name="arrow-forward" size={18} color="#FFF" />
                </LinearGradient>
              </AnimatedPressable>
            </>
          )}

          {/* ── Step 3 : Détails ──────────────────────────────── */}
          {createStep === "details" && (
            <>
              <Pressable onPress={() => setCreateStep(groupType === "thematic" ? "category" : "type")} style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 20 }}>
                <Ionicons name="chevron-back" size={18} color="#AAA" />
                <Text style={{ fontSize: FONT.sizes.sm, fontFamily: FONT_FAMILY.medium, color: "#AAA" }}>Retour</Text>
              </Pressable>

              <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 24 }}>
                <Text style={{ fontSize: FONT.sizes["2xl"], fontFamily: FONT_FAMILY.bold, color: "#1A1A1A" }}>
                  {groupType === "thematic" ? "Ton groupe thématique" : "Ton groupe privé"}
                </Text>
                {groupType === "private" && <Ionicons name="lock-closed" size={16} color="#999" />}
              </View>

              {/* Cover */}
              <Text style={{ fontSize: FONT.sizes.xs, fontFamily: FONT_FAMILY.bold, color: "#BBBBC0", textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 8 }}>
                IMAGE DE COUVERTURE
              </Text>
              <Pressable
                onPress={pickCover}
                style={{ width: "100%", height: 120, borderRadius: RADIUS.lg, backgroundColor: "#F2F3F7", borderWidth: 2, borderColor: newCoverUri ? PALETTE.sarcelle : "#E4E4E8", borderStyle: newCoverUri ? "solid" : "dashed", alignItems: "center", justifyContent: "center", overflow: "hidden", marginBottom: 20 }}
              >
                {newCoverUri ? (
                  <>
                    <Image source={{ uri: newCoverUri }} style={{ position: "absolute", width: "100%", height: "100%" }} contentFit="cover" />
                    <View style={{ position: "absolute", bottom: 8, right: 8, backgroundColor: "rgba(0,0,0,0.5)", borderRadius: RADIUS.full, paddingHorizontal: 10, paddingVertical: 4 }}>
                      <Text style={{ color: "#FFF", fontSize: FONT.sizes.xs, fontFamily: FONT_FAMILY.semibold }}>Changer</Text>
                    </View>
                  </>
                ) : (
                  <>
                    <Ionicons name="image-outline" size={28} color="#CCC" />
                    <Text style={{ color: "#BBBBC0", fontSize: FONT.sizes.sm, fontFamily: FONT_FAMILY.medium, marginTop: 6 }}>Ajouter une image</Text>
                  </>
                )}
              </Pressable>

              {/* Name */}
              <Text style={{ fontSize: FONT.sizes.xs, fontFamily: FONT_FAMILY.bold, color: "#BBBBC0", textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 8 }}>NOM *</Text>
              <TextInput
                value={newName}
                onChangeText={(t) => { setNewName(t); setNameError(undefined); }}
                placeholder="Ex: Les Champions"
                placeholderTextColor="#CCC"
                style={{ backgroundColor: "#F2F3F7", borderRadius: 14, paddingHorizontal: 16, paddingVertical: 13, fontSize: FONT.sizes.base, fontFamily: FONT_FAMILY.regular, color: "#1A1A1A", borderWidth: 1.5, borderColor: nameError ? "#F43F5E" : "transparent", marginBottom: nameError ? 4 : 18 }}
                maxLength={50}
              />
              {nameError && <Text style={{ color: "#F43F5E", fontSize: 12, fontFamily: FONT_FAMILY.medium, marginBottom: 14, marginLeft: 2 }}>{nameError}</Text>}

              {/* Description */}
              <Text style={{ fontSize: FONT.sizes.xs, fontFamily: FONT_FAMILY.bold, color: "#BBBBC0", textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 8 }}>DESCRIPTION (optionnel)</Text>
              <TextInput
                value={newDesc}
                onChangeText={setNewDesc}
                placeholder="Décris ton groupe..."
                placeholderTextColor="#CCC"
                multiline
                numberOfLines={2}
                style={{ backgroundColor: "#F2F3F7", borderRadius: 14, paddingHorizontal: 16, paddingVertical: 13, fontSize: FONT.sizes.base, fontFamily: FONT_FAMILY.regular, color: "#1A1A1A", borderWidth: 1.5, borderColor: "transparent", marginBottom: 24, minHeight: 72, textAlignVertical: "top" }}
                maxLength={200}
              />

              {/* Submit */}
              <AnimatedPressable
                onPress={handleCreate}
                disabled={!newName.trim() || isCreating}
                style={{ overflow: "hidden", borderRadius: 14, marginBottom: 40, opacity: !newName.trim() ? 0.4 : 1 }}
              >
                <LinearGradient
                  colors={newName.trim() ? [PALETTE.sarcelle, "#2ABFB8"] : ["#DDD", "#CCC"]}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={{ paddingVertical: 16, alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 8 }}
                >
                  {isCreating ? <ActivityIndicator color="#FFF" /> : <Ionicons name="people-outline" size={20} color="#FFF" />}
                  <Text style={{ color: "#FFF", fontSize: FONT.sizes.lg, fontFamily: FONT_FAMILY.bold }}>
                    {isCreating ? "Création..." : "Créer le groupe"}
                  </Text>
                </LinearGradient>
              </AnimatedPressable>
            </>
          )}
        </ScrollView>
      </BottomSheet>
    </View>
  );
}
