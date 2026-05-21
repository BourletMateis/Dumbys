import { useState } from "react";
import {
  View,
  Text,
  Pressable,
  TextInput,
  ActivityIndicator,
  Alert,
  ScrollView,
  RefreshControl,
  Dimensions,
} from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useMyGroups, type GroupWithRole } from "@/src/features/groups/useMyGroups";
import { useCreateGroup } from "@/src/features/groups/useGroupActions";
import { useMyTournaments } from "@/src/features/groups/useTournamentFeed";
import { BottomSheet } from "@/src/components/ui/BottomSheet";
import { useUserProfile } from "@/src/features/profile/useUserProfile";
import { AnimatedPressable } from "@/src/components/ui/AnimatedPressable";
import { useUnreadCount } from "@/src/features/notifications/useNotifications";
import {
  PALETTE,
  RADIUS,
  FONT,
  FONT_FAMILY,
} from "@/src/theme";
import { useTheme } from "@/src/providers/ThemeProvider";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const GROUP_CARD_WIDTH = SCREEN_WIDTH * 0.72;

// ─── Decorative blob ────────────────────────────────────────────
function Blob({ size, color, top, left, right, bottom }: {
  size: number; color: string;
  top?: number; left?: number; right?: number; bottom?: number;
}) {
  return (
    <View
      style={{
        position: "absolute",
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color,
        opacity: 0.12,
        top, left, right, bottom,
      }}
    />
  );
}

// ─── Group card (horizontal scroll) ─────────────────────────────
function GroupCard({
  group,
  onPress,
}: {
  group: GroupWithRole;
  onPress: () => void;
}) {
  const { colors, isDark } = useTheme();
  const GROUP_COLORS = [PALETTE.sarcelle, PALETTE.fuchsia, "#3B82F6", "#22C55E", "#F59E0B", "#8B5CF6"];
  let hash = 0;
  for (let i = 0; i < group.name.length; i++) {
    hash = group.name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const avatarColor = GROUP_COLORS[Math.abs(hash) % GROUP_COLORS.length];
  const initial = group.name.charAt(0).toUpperCase();

  return (
    <AnimatedPressable
      onPress={onPress}
      style={{
        width: GROUP_CARD_WIDTH,
        backgroundColor: colors.card,
        borderRadius: 20,
        padding: 20,
        borderWidth: 1,
        borderColor: colors.border,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: isDark ? 0 : 0.04,
        shadowRadius: 8,
        elevation: isDark ? 0 : 2,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 14 }}>
        {group.cover_url ? (
          <Image
            source={{ uri: group.cover_url }}
            style={{ width: 48, height: 48, borderRadius: 24 }}
            contentFit="cover"
          />
        ) : (
          <View
            style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              backgroundColor: avatarColor + "18",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ fontSize: FONT.sizes.xl, fontFamily: FONT_FAMILY.extrabold, color: avatarColor }}>
              {initial}
            </Text>
          </View>
        )}

        <View style={{ marginLeft: 12, flex: 1 }}>
          <Text
            style={{ fontSize: FONT.sizes.lg, fontFamily: FONT_FAMILY.bold, color: colors.textPrimary }}
            numberOfLines={1}
          >
            {group.name}
          </Text>
          <Text style={{ fontSize: FONT.sizes.xs, fontFamily: FONT_FAMILY.semibold, color: colors.textTertiary, textTransform: "uppercase", letterSpacing: 0.8, marginTop: 2 }}>
            {group.member_count} MEMBRES • ACTIF
          </Text>
        </View>
      </View>

      {group.description ? (
        <Text
          style={{ fontSize: FONT.sizes.base, fontFamily: FONT_FAMILY.regular, color: colors.textSecondary, lineHeight: 20, marginBottom: 14 }}
          numberOfLines={2}
        >
          {group.description}
        </Text>
      ) : null}

      <View style={{ flexDirection: "row", alignItems: "center" }}>
        {[0, 1, 2, 3].map((i) => (
          <View
            key={i}
            style={{
              width: 28,
              height: 28,
              borderRadius: 14,
              backgroundColor: GROUP_COLORS[(Math.abs(hash) + i) % GROUP_COLORS.length] + "30",
              borderWidth: 2,
              borderColor: colors.card,
              marginLeft: i > 0 ? -8 : 0,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name="person" size={12} color={GROUP_COLORS[(Math.abs(hash) + i) % GROUP_COLORS.length]} />
          </View>
        ))}
        {group.member_count > 4 && (
          <Text style={{ fontSize: FONT.sizes.sm, fontFamily: FONT_FAMILY.semibold, color: PALETTE.sarcelle, marginLeft: 6 }}>
            +{group.member_count - 4}
          </Text>
        )}
      </View>
    </AnimatedPressable>
  );
}

// ─── Demo data for when no groups exist ─────────────────────────
const DEMO_GROUPS_DATA = [
  {
    id: "demo1",
    name: "Les Branque-Héros",
    description: "Le groupe où la bêtise est un art. On relève des défis improbable...",
    member_count: 12,
    is_public: false,
  },
  {
    id: "demo2",
    name: "Challenge Crew",
    description: "Uniquement des défis fous et de la synchro...",
    member_count: 8,
    is_public: false,
  },
];

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { data: profile } = useUserProfile();
  const { data: myGroups, isPending: groupsPending, refetch, isRefetching } = useMyGroups();
  const { data: unreadCount = 0 } = useUnreadCount();

  const { data: myTournaments, isPending: tournamentsPending } = useMyTournaments();
  const createGroup = useCreateGroup();
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDesc, setNewGroupDesc] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const username = profile?.username ?? "Alex";
  const groups = myGroups ?? [];

  const handleCreateGroup = () => {
    if (!newGroupName.trim()) return;
    setIsCreating(true);
    createGroup.mutate(
      { name: newGroupName.trim(), description: newGroupDesc.trim() || undefined, isPublic: false },
      {
        onSuccess: (group) => {
          setShowCreateGroup(false);
          setNewGroupName("");
          setNewGroupDesc("");
          router.push({ pathname: "/group/[id]", params: { id: group.id } });
        },
        onError: (err) => Alert.alert("Erreur", err.message),
        onSettled: () => setIsCreating(false),
      },
    );
  };


  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      {/* Decorative blobs */}
      <Blob size={200} color={PALETTE.sarcelle} top={-40} right={-60} />
      <Blob size={160} color={PALETTE.fuchsia} top={300} left={-70} />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 160 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={PALETTE.sarcelle} />
        }
      >
        {/* ─── Top bar ──────────────────────────────────────────── */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingTop: insets.top + 8,
            paddingHorizontal: 20,
            paddingBottom: 8,
          }}
        >
          {/* Logo */}
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: PALETTE.fuchsia + "15",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ fontSize: 22, fontFamily: FONT_FAMILY.black, color: PALETTE.fuchsia }}>
              D
            </Text>
          </View>

          {/* Search + Notification */}
          <View style={{ flexDirection: "row", gap: 16, alignItems: "center" }}>
            <Pressable hitSlop={8}>
              <Ionicons name="search-outline" size={24} color={colors.textSecondary} />
            </Pressable>
            <Pressable
              hitSlop={8}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push("/notifications");
              }}
            >
              <View style={{ position: "relative" }}>
                <Ionicons name="notifications-outline" size={24} color={colors.textSecondary} />
                {unreadCount > 0 && (
                  <View
                    style={{
                      position: "absolute",
                      top: -4,
                      right: -4,
                      minWidth: 16,
                      height: 16,
                      borderRadius: 8,
                      backgroundColor: PALETTE.fuchsia,
                      borderWidth: 2,
                      borderColor: colors.bg,
                      alignItems: "center",
                      justifyContent: "center",
                      paddingHorizontal: 3,
                    }}
                  >
                    <Text style={{ fontSize: 9, fontFamily: FONT_FAMILY.bold, color: "#FFF" }}>
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </Text>
                  </View>
                )}
              </View>
            </Pressable>
          </View>
        </View>

        {/* ─── Greeting ─────────────────────────────────────────── */}
        <View style={{ paddingHorizontal: 20, marginTop: 20, marginBottom: 28 }}>
          <Text style={{ fontSize: FONT.sizes["4xl"], fontFamily: FONT_FAMILY.extrabold, color: colors.textPrimary }}>
            {"Salut " + username + " ! 🤘"}
          </Text>
          <Text style={{ fontSize: FONT.sizes.base, fontFamily: FONT_FAMILY.regular, color: colors.textTertiary, marginTop: 4 }}>
            {"Prêt pour un nouveau défi aujourd'hui ?"}
          </Text>
        </View>

        {/* ─── Mes Groupes ──────────────────────────────────────── */}
        <View style={{ marginBottom: 32 }}>
          {/* Section header */}
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, marginBottom: 16 }}>
            <Text style={{ fontSize: FONT.sizes["2xl"], fontFamily: FONT_FAMILY.extrabold, color: colors.textPrimary }}>
              Mes Groupes
            </Text>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setShowCreateGroup(true);
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                <Ionicons name="add-circle-outline" size={18} color={PALETTE.sarcelle} />
                <Text style={{ fontSize: FONT.sizes.sm, fontFamily: FONT_FAMILY.bold, color: PALETTE.sarcelle, textTransform: "uppercase" }}>
                  CRÉER
                </Text>
              </View>
            </Pressable>
          </View>

          {/* Horizontal scroll of group cards */}
          {groupsPending ? (
            <View style={{ alignItems: "center", paddingVertical: 40 }}>
              <ActivityIndicator size="large" color={PALETTE.sarcelle} />
            </View>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 20, gap: 14 }}
              decelerationRate="fast"
              snapToInterval={GROUP_CARD_WIDTH + 14}
              snapToAlignment="start"
            >
              {groups.length > 0
                ? groups.map((group) => (
                    <GroupCard
                      key={group.id}
                      group={group}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        router.push({ pathname: "/group/[id]", params: { id: group.id } });
                      }}
                    />
                  ))
                : DEMO_GROUPS_DATA.map((demo) => (
                    <GroupCard
                      key={demo.id}
                      group={demo as any}
                      onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
                    />
                  ))}
            </ScrollView>
          )}
        </View>

        {/* ─── Tournois Actifs ──────────────────────────────────── */}
        <View style={{ marginBottom: 32 }}>
          {/* Section header */}
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16, paddingHorizontal: 20 }}>
            <Text style={{ fontSize: FONT.sizes["2xl"], fontFamily: FONT_FAMILY.extrabold, color: colors.textPrimary }}>
              Mes Tournois
            </Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: PALETTE.fuchsia }} />
                <Text style={{ fontSize: FONT.sizes.sm, fontFamily: FONT_FAMILY.bold, color: PALETTE.sarcelle, textTransform: "uppercase" }}>
                  EN DIRECT
                </Text>
              </View>
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push("/tournaments");
                }}
              >
                <Text style={{ fontSize: FONT.sizes.sm, fontFamily: FONT_FAMILY.bold, color: PALETTE.fuchsia, textTransform: "uppercase" }}>
                  DÉCOUVRIR
                </Text>
              </Pressable>
            </View>
          </View>

          {tournamentsPending ? (
            <View style={{ alignItems: "center", paddingVertical: 32 }}>
              <ActivityIndicator color={PALETTE.sarcelle} />
            </View>
          ) : (myTournaments ?? []).length === 0 ? (
            <View style={{ marginHorizontal: 20, borderRadius: 20, overflow: "hidden" }}>
              <LinearGradient
                colors={["#1A1A2E", "#16213E"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ padding: 24, borderRadius: 24, alignItems: "center" }}
              >
                <Ionicons name="trophy-outline" size={40} color="rgba(255,255,255,0.3)" />
                <Text style={{ color: "rgba(255,255,255,0.6)", fontSize: FONT.sizes.base, fontFamily: FONT_FAMILY.regular, marginTop: 12, textAlign: "center" }}>
                  Aucun tournoi pour l'instant.{"\n"}Crée un groupe et lance ton premier tournoi !
                </Text>
              </LinearGradient>
            </View>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 20, gap: 14 }}
              decelerationRate="fast"
              snapToInterval={SCREEN_WIDTH * 0.78 + 14}
              snapToAlignment="start"
            >
              {(myTournaments ?? []).map((t) => (
                <AnimatedPressable
                  key={t.id}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    router.push({ pathname: "/tournament/[id]", params: { id: t.id } });
                  }}
                  style={{ width: SCREEN_WIDTH * 0.78, borderRadius: 20, overflow: "hidden" }}
                >
                  <LinearGradient
                    colors={["#1A1A2E", "#16213E"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{ padding: 20, borderRadius: 20 }}
                  >
                    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                      <Text
                        style={{ fontSize: FONT.sizes.xl, fontFamily: FONT_FAMILY.extrabold, color: "#FFFFFF", flex: 1 }}
                        numberOfLines={1}
                      >
                        {t.title}
                      </Text>
                      <View style={{ backgroundColor: PALETTE.fuchsia, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, marginLeft: 10 }}>
                        <Text style={{ fontSize: FONT.sizes.xs, fontFamily: FONT_FAMILY.black, color: "#FFFFFF", textTransform: "uppercase" }}>
                          ACTIF
                        </Text>
                      </View>
                    </View>
                    <Text style={{ fontSize: FONT.sizes.sm, fontFamily: FONT_FAMILY.regular, color: "rgba(255,255,255,0.5)", marginBottom: 16 }}>
                      {t.group_name}
                    </Text>
                    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "flex-end" }}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "rgba(255,255,255,0.1)", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 }}>
                        <Ionicons name="arrow-forward" size={14} color="white" />
                        <Text style={{ color: "white", fontSize: FONT.sizes.sm, fontFamily: FONT_FAMILY.bold }}>Voir les défis</Text>
                      </View>
                    </View>
                  </LinearGradient>
                </AnimatedPressable>
              ))}
            </ScrollView>
          )}
        </View>
      </ScrollView>

      {/* Create Group Bottom Sheet */}
      <BottomSheet isOpen={showCreateGroup} onClose={() => { setShowCreateGroup(false); setNewGroupName(""); setNewGroupDesc(""); }} snapPoint={0.5}>
        <View style={{ paddingHorizontal: 20, paddingTop: 8 }}>
          <Text style={{ color: colors.textPrimary, fontSize: FONT.sizes["2xl"], fontFamily: FONT_FAMILY.bold, marginBottom: 20 }}>
            Créer un groupe
          </Text>
          <Text style={{ fontSize: FONT.sizes.xs, fontFamily: FONT_FAMILY.bold, color: colors.textTertiary, textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 8 }}>
            NOM DU GROUPE *
          </Text>
          <TextInput
            value={newGroupName}
            onChangeText={setNewGroupName}
            placeholder="Ex: Les Champions 🏆"
            placeholderTextColor={colors.textMuted}
            style={{ backgroundColor: colors.surface, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 13, fontSize: FONT.sizes.base, fontFamily: FONT_FAMILY.regular, color: colors.textPrimary, borderWidth: 1, borderColor: colors.border, marginBottom: 16 }}
            maxLength={60}
            autoFocus
          />
          <Text style={{ fontSize: FONT.sizes.xs, fontFamily: FONT_FAMILY.bold, color: colors.textTertiary, textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 8 }}>
            DESCRIPTION (optionnel)
          </Text>
          <TextInput
            value={newGroupDesc}
            onChangeText={setNewGroupDesc}
            placeholder="Décris ton groupe..."
            placeholderTextColor={colors.textMuted}
            multiline
            numberOfLines={2}
            style={{ backgroundColor: colors.surface, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 13, fontSize: FONT.sizes.base, fontFamily: FONT_FAMILY.regular, color: colors.textPrimary, borderWidth: 1, borderColor: colors.border, marginBottom: 24, minHeight: 72, textAlignVertical: "top" }}
            maxLength={200}
          />
          <AnimatedPressable
            onPress={handleCreateGroup}
            disabled={!newGroupName.trim() || isCreating}
            style={{ backgroundColor: newGroupName.trim() ? PALETTE.sarcelle : (isDark ? "#2C2C2C" : "#DDD"), paddingVertical: 16, borderRadius: 14, alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 8 }}
          >
            {isCreating ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Ionicons name="people-outline" size={20} color="#FFFFFF" />
            )}
            <Text style={{ color: "#FFFFFF", fontSize: FONT.sizes.lg, fontFamily: FONT_FAMILY.bold }}>
              {isCreating ? "Création..." : "Créer le groupe"}
            </Text>
          </AnimatedPressable>
        </View>
      </BottomSheet>
    </View>
  );
}
