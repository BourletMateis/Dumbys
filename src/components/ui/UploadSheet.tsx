import { View, Text, Pressable, ScrollView, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { BottomSheet } from "./BottomSheet";
import { PhaseIndicator } from "./PhaseIndicator";
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
    <BottomSheet isOpen={isOpen} onClose={onClose} snapPoint={0.65}>
      {/* Header */}
      <View
        style={{
          paddingHorizontal: SPACING["2xl"],
          paddingBottom: SPACING.lg,
          borderBottomWidth: 1,
          borderBottomColor: "rgba(0,0,0,0.06)",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Text
          style={{
            fontSize: FONT.sizes["2xl"],
            fontFamily: FONT_FAMILY.bold,
            color: "#1A1A1A",
          }}
        >
          Uploader dans...
        </Text>
        <PhaseIndicator showDaysLeft={false} />
      </View>

      {/* Phase warning when not upload phase */}
      {!canUpload && (
        <View
          style={{
            marginHorizontal: SPACING["2xl"],
            marginTop: SPACING.lg,
            backgroundColor: "rgba(249,115,22,0.08)",
            borderRadius: RADIUS.md,
            padding: SPACING.base,
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
              ? "Phase de vote en cours — upload disponible dès mardi"
              : "L'upload reprend dès mardi"}
          </Text>
        </View>
      )}

      {/* Groups section */}
      <View style={{ paddingTop: SPACING.xl }}>
        <Text
          style={{
            paddingHorizontal: SPACING["2xl"],
            fontSize: FONT.sizes.xs,
            fontFamily: FONT_FAMILY.bold,
            color: "#999",
            letterSpacing: 1.5,
            textTransform: "uppercase",
            marginBottom: SPACING.base,
          }}
        >
          Mes groupes
        </Text>

        {isLoading ? (
          <View style={{ alignItems: "center", paddingVertical: SPACING["2xl"] }}>
            <ActivityIndicator color={PALETTE.sarcelle} />
          </View>
        ) : !groups || groups.length === 0 ? (
          <View
            style={{
              marginHorizontal: SPACING["2xl"],
              alignItems: "center",
              paddingVertical: SPACING["2xl"],
            }}
          >
            <Ionicons name="people-outline" size={32} color="#CCC" />
            <Text
              style={{
                marginTop: SPACING.base,
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
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              paddingHorizontal: SPACING["2xl"],
              gap: SPACING.base,
            }}
          >
            {groups.map((group) => (
              <Pressable
                key={group.id}
                onPress={() => handleGroupPress(group.id)}
                style={({ pressed }) => ({
                  opacity: pressed ? 0.7 : 1,
                  width: 120,
                  borderRadius: RADIUS.lg,
                  backgroundColor: canUpload ? "#F8F8FA" : "rgba(0,0,0,0.03)",
                  borderWidth: 1,
                  borderColor: canUpload ? "rgba(0,0,0,0.06)" : "rgba(0,0,0,0.04)",
                  padding: SPACING.base,
                  alignItems: "center",
                  gap: 8,
                })}
              >
                {/* Group avatar / initials */}
                <View
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: RADIUS.md,
                    backgroundColor: canUpload
                      ? `${PALETTE.fuchsia}18`
                      : "rgba(0,0,0,0.06)",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text
                    style={{
                      fontSize: FONT.sizes.xl,
                      fontFamily: FONT_FAMILY.bold,
                      color: canUpload ? PALETTE.fuchsia : "#999",
                    }}
                  >
                    {group.name.charAt(0).toUpperCase()}
                  </Text>
                </View>

                {/* Group name */}
                <Text
                  numberOfLines={2}
                  style={{
                    fontSize: FONT.sizes.sm,
                    fontFamily: FONT_FAMILY.semibold,
                    color: canUpload ? "#1A1A1A" : "#999",
                    textAlign: "center",
                  }}
                >
                  {group.name}
                </Text>

                {/* Member count */}
                <Text
                  style={{
                    fontSize: FONT.sizes.xs,
                    fontFamily: FONT_FAMILY.regular,
                    color: "#BBB",
                  }}
                >
                  {group.member_count} membre{group.member_count > 1 ? "s" : ""}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        )}
      </View>

      {/* Create group CTA */}
      <Pressable
        onPress={handleCreateGroup}
        style={({ pressed }) => ({
          opacity: pressed ? 0.7 : 1,
          marginHorizontal: SPACING["2xl"],
          marginTop: SPACING.xl,
          flexDirection: "row",
          alignItems: "center",
          gap: SPACING.base,
          paddingVertical: SPACING.lg,
          paddingHorizontal: SPACING.lg,
          borderRadius: RADIUS.lg,
          borderWidth: 1,
          borderColor: "rgba(0,0,0,0.10)",
        })}
      >
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: RADIUS.sm,
            backgroundColor: `${PALETTE.sarcelle}15`,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons name="add" size={20} color={PALETTE.sarcelle} />
        </View>
        <Text
          style={{
            fontSize: FONT.sizes.base,
            fontFamily: FONT_FAMILY.semibold,
            color: PALETTE.sarcelle,
          }}
        >
          Créer un nouveau groupe
        </Text>
      </Pressable>
    </BottomSheet>
  );
}
