import { View, Text, Pressable, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { BottomSheet } from "./BottomSheet";
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
    onClose();
    router.push(`/camera?groupId=${groupId}` as any);
  };

  const handleCreateGroup = () => {
    onClose();
    router.push("/groups/create" as any);
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} snapPoint={0.6}>
      {/* Header */}
      <View style={{ alignItems: "center", paddingHorizontal: SPACING["2xl"], paddingBottom: SPACING.xl }}>
        <View
          style={{
            width: 56,
            height: 56,
            borderRadius: 28,
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 12,
            overflow: "hidden",
          }}
        >
          <LinearGradient
            colors={["#FF6B3D", PALETTE.fuchsia]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ width: 56, height: 56, alignItems: "center", justifyContent: "center" }}
          >
            <Ionicons name="videocam" size={26} color="#FFF" />
          </LinearGradient>
        </View>
        <Text
          style={{
            fontSize: FONT.sizes["2xl"],
            fontFamily: FONT_FAMILY.bold,
            color: "#1A1A1A",
            textAlign: "center",
          }}
        >
          Poster une vidéo
        </Text>
        <Text
          style={{
            fontSize: FONT.sizes.sm,
            fontFamily: FONT_FAMILY.regular,
            color: "#999",
            textAlign: "center",
            marginTop: 4,
          }}
        >
          Choisis le groupe dans lequel poster
        </Text>
      </View>

      {/* Phase warning */}
      {!canUpload && (
        <View
          style={{
            marginHorizontal: SPACING["2xl"],
            marginBottom: SPACING.lg,
            backgroundColor: "rgba(249,115,22,0.08)",
            borderRadius: RADIUS.lg,
            paddingVertical: 12,
            paddingHorizontal: 16,
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
          }}
        >
          <Ionicons name="time-outline" size={18} color="#F97316" />
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

      {/* Separator */}
      <View
        style={{
          height: 1,
          backgroundColor: "rgba(0,0,0,0.05)",
          marginHorizontal: SPACING["2xl"],
          marginBottom: SPACING.lg,
        }}
      />

      {/* Groups list */}
      <View style={{ paddingHorizontal: SPACING["2xl"] }}>
        <Text
          style={{
            fontSize: 11,
            fontFamily: FONT_FAMILY.bold,
            color: "#BBB",
            letterSpacing: 1.2,
            textTransform: "uppercase",
            marginBottom: 12,
          }}
        >
          Mes groupes
        </Text>

        {isLoading ? (
          <View style={{ alignItems: "center", paddingVertical: 32 }}>
            <ActivityIndicator color={PALETTE.sarcelle} />
          </View>
        ) : !groups || groups.length === 0 ? (
          <View style={{ alignItems: "center", paddingVertical: 28 }}>
            <Ionicons name="people-outline" size={36} color="#D0D0D0" />
            <Text
              style={{
                marginTop: 10,
                fontSize: FONT.sizes.base,
                fontFamily: FONT_FAMILY.medium,
                color: "#999",
                textAlign: "center",
              }}
            >
              Tu n'as pas encore de groupe
            </Text>
          </View>
        ) : (
          <View style={{ gap: 8 }}>
            {groups.map((group) => (
              <Pressable
                key={group.id}
                onPress={() => handleGroupPress(group.id)}
                style={({ pressed }) => ({
                  opacity: pressed ? 0.7 : 1,
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: canUpload ? "#F8F8FA" : "rgba(0,0,0,0.02)",
                  borderRadius: RADIUS.lg,
                  padding: 14,
                  gap: 14,
                })}
              >
                {/* Group avatar */}
                <View
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 14,
                    backgroundColor: canUpload ? `${PALETTE.fuchsia}15` : "rgba(0,0,0,0.05)",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 18,
                      fontFamily: FONT_FAMILY.bold,
                      color: canUpload ? PALETTE.fuchsia : "#999",
                    }}
                  >
                    {group.name.charAt(0).toUpperCase()}
                  </Text>
                </View>

                {/* Group info */}
                <View style={{ flex: 1 }}>
                  <Text
                    numberOfLines={1}
                    style={{
                      fontSize: FONT.sizes.base,
                      fontFamily: FONT_FAMILY.semibold,
                      color: canUpload ? "#1A1A1A" : "#999",
                    }}
                  >
                    {group.name}
                  </Text>
                  <Text
                    style={{
                      fontSize: FONT.sizes.xs,
                      fontFamily: FONT_FAMILY.regular,
                      color: "#BBB",
                      marginTop: 2,
                    }}
                  >
                    {group.member_count} membre{group.member_count > 1 ? "s" : ""}
                  </Text>
                </View>

                {/* Arrow */}
                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color={canUpload ? "#CCC" : "#DDD"}
                />
              </Pressable>
            ))}
          </View>
        )}
      </View>

      {/* Create group CTA */}
      <Pressable
        onPress={handleCreateGroup}
        style={({ pressed }) => ({
          opacity: pressed ? 0.7 : 1,
          marginHorizontal: SPACING["2xl"],
          marginTop: 20,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          paddingVertical: 14,
          borderRadius: RADIUS.lg,
          borderWidth: 1.5,
          borderColor: `${PALETTE.sarcelle}30`,
          borderStyle: "dashed",
        })}
      >
        <Ionicons name="add-circle-outline" size={20} color={PALETTE.sarcelle} />
        <Text
          style={{
            fontSize: FONT.sizes.base,
            fontFamily: FONT_FAMILY.semibold,
            color: PALETTE.sarcelle,
          }}
        >
          Créer un groupe
        </Text>
      </Pressable>
    </BottomSheet>
  );
}
