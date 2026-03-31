import { View, Text, Pressable, ActivityIndicator, ScrollView } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { BottomSheet } from "./BottomSheet";
import { Avatar } from "./Avatar";
import { useMyGroups } from "@/src/features/groups/useMyGroups";
import { getPhaseForDate } from "@/src/hooks/useTimelineLogic";
import { FONT, FONT_FAMILY, PALETTE, RADIUS, SPACING } from "@/src/theme";

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

export function UploadSheet({ isOpen, onClose }: Props) {
  const { data: groups, isLoading } = useMyGroups();
  const { phase } = getPhaseForDate(new Date());
  const canUpload = phase === "upload" || phase === "podium";

  const handleGroupPress = (groupId: string) => {
    if (!canUpload) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onClose();
    router.push(`/camera?groupId=${groupId}` as any);
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} snapPoint={0.55}>
      {/* Header */}
      <View style={{ alignItems: "center", paddingHorizontal: SPACING["2xl"], paddingBottom: SPACING.lg }}>
        <View
          style={{
            width: 52,
            height: 52,
            borderRadius: 16,
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 10,
            overflow: "hidden",
          }}
        >
          <LinearGradient
            colors={["#FF6B3D", PALETTE.fuchsia]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ width: 52, height: 52, alignItems: "center", justifyContent: "center" }}
          >
            <Ionicons name="videocam" size={24} color="#FFF" />
          </LinearGradient>
        </View>
        <Text
          style={{
            fontSize: FONT.sizes["2xl"],
            fontFamily: FONT_FAMILY.bold,
            color: "#1A1A1A",
          }}
        >
          Poster une vidéo
        </Text>
        <Text
          style={{
            fontSize: FONT.sizes.sm,
            fontFamily: FONT_FAMILY.regular,
            color: "#999",
            marginTop: 2,
          }}
        >
          Choisis un groupe
        </Text>
      </View>

      {/* Phase warning */}
      {!canUpload && (
        <View
          style={{
            marginHorizontal: SPACING["2xl"],
            marginBottom: SPACING.base,
            backgroundColor: "rgba(249,115,22,0.08)",
            borderRadius: RADIUS.lg,
            paddingVertical: 10,
            paddingHorizontal: 14,
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
          }}
        >
          <Ionicons name="time-outline" size={16} color="#F97316" />
          <Text
            style={{
              fontSize: FONT.sizes.sm,
              fontFamily: FONT_FAMILY.medium,
              color: "#F97316",
              flex: 1,
            }}
          >
            {phase === "vote"
              ? "Phase de vote en cours — upload dès mardi"
              : "L'upload reprend dès mardi"}
          </Text>
        </View>
      )}

      {/* Groups list */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: SPACING["2xl"], paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <View style={{ alignItems: "center", paddingVertical: 32 }}>
            <ActivityIndicator color={PALETTE.sarcelle} />
          </View>
        ) : !groups || groups.length === 0 ? (
          <View style={{ alignItems: "center", paddingVertical: 32 }}>
            <Ionicons name="people-outline" size={40} color="#DDD" />
            <Text
              style={{
                marginTop: 10,
                fontSize: FONT.sizes.base,
                fontFamily: FONT_FAMILY.semibold,
                color: "#CCC",
                textAlign: "center",
              }}
            >
              Tu n'as pas encore de groupe
            </Text>
            <Pressable
              onPress={() => {
                onClose();
                router.push("/(tabs)/explorer");
              }}
              style={{
                marginTop: SPACING.lg,
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
                backgroundColor: PALETTE.sarcelle,
                paddingHorizontal: 18,
                paddingVertical: 10,
                borderRadius: RADIUS.full,
              }}
            >
              <Ionicons name="compass-outline" size={16} color="#FFF" />
              <Text style={{ fontSize: FONT.sizes.sm, fontFamily: FONT_FAMILY.bold, color: "#FFF" }}>
                Découvrir des groupes
              </Text>
            </Pressable>
          </View>
        ) : (
          <View style={{ gap: 6 }}>
            {groups.map((group) => (
              <Pressable
                key={group.id}
                onPress={() => handleGroupPress(group.id)}
                disabled={!canUpload}
                style={({ pressed }) => ({
                  opacity: !canUpload ? 0.5 : pressed ? 0.7 : 1,
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: "#F8F8FA",
                  borderRadius: RADIUS.lg,
                  padding: 12,
                  gap: 12,
                  borderWidth: 1,
                  borderColor: "rgba(0,0,0,0.04)",
                })}
              >
                <Avatar url={group.cover_url} username={group.name} size={40} />

                <View style={{ flex: 1 }}>
                  <Text
                    numberOfLines={1}
                    style={{
                      fontSize: FONT.sizes.base,
                      fontFamily: FONT_FAMILY.semibold,
                      color: "#1A1A1A",
                    }}
                  >
                    {group.name}
                  </Text>
                  <Text
                    style={{
                      fontSize: FONT.sizes.xs,
                      fontFamily: FONT_FAMILY.regular,
                      color: "#BBB",
                      marginTop: 1,
                    }}
                  >
                    {group.member_count} membre{group.member_count > 1 ? "s" : ""}
                  </Text>
                </View>

                <Ionicons name="chevron-forward" size={16} color="#CCC" />
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>
    </BottomSheet>
  );
}
