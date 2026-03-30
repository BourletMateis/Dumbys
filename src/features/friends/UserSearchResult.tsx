import { View, Text, Pressable, ActivityIndicator } from "react-native";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { Avatar } from "@/src/components/ui/Avatar";
import { AnimatedPressable } from "@/src/components/ui/AnimatedPressable";
import { PALETTE, FONT, FONT_FAMILY } from "@/src/theme";
import type { UserRow } from "./useSearchUsers";

type FriendStatus = "none" | "pending_sent" | "pending_received" | "accepted";

type Props = {
  user: UserRow;
  status: FriendStatus;
  onAdd: () => void;
  isLoading: boolean;
};

export function UserSearchResult({ user, status, onAdd, isLoading }: Props) {
  const router = useRouter();

  const goToProfile = () => {
    router.push({ pathname: "/user/[id]", params: { id: user.id } });
  };

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 20,
        paddingVertical: 12,
        backgroundColor: "#FFFFFF",
        borderBottomWidth: 1,
        borderBottomColor: "rgba(0,0,0,0.04)",
      }}
    >
      {/* Avatar + Username → profile */}
      <Pressable onPress={goToProfile} style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
        <Avatar url={user.avatar_url} username={user.username} size={44} />
        <Text
          style={{
            flex: 1,
            marginLeft: 12,
            color: "#1A1A1A",
            fontFamily: FONT_FAMILY.semibold,
            fontSize: FONT.sizes.lg,
          }}
          numberOfLines={1}
        >
          {user.username}
        </Text>
      </Pressable>

      {/* Action */}
      {status === "none" && (
        <AnimatedPressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onAdd();
          }}
          disabled={isLoading}
          style={{
            backgroundColor: PALETTE.sarcelle,
            paddingHorizontal: 18,
            paddingVertical: 8,
            borderRadius: 14,
            opacity: isLoading ? 0.6 : 1,
          }}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text style={{ color: "#FFFFFF", fontSize: FONT.sizes.sm, fontFamily: FONT_FAMILY.bold }}>
              Ajouter
            </Text>
          )}
        </AnimatedPressable>
      )}
      {status === "pending_sent" && (
        <View style={{ backgroundColor: "#F2F2F2", paddingHorizontal: 16, paddingVertical: 8, borderRadius: 14 }}>
          <Text style={{ color: "#BBB", fontSize: FONT.sizes.sm, fontFamily: FONT_FAMILY.semibold }}>
            Envoyé
          </Text>
        </View>
      )}
      {status === "pending_received" && (
        <View style={{ backgroundColor: PALETTE.sarcelle + "15", paddingHorizontal: 16, paddingVertical: 8, borderRadius: 14 }}>
          <Text style={{ color: PALETTE.sarcelle, fontSize: FONT.sizes.sm, fontFamily: FONT_FAMILY.semibold }}>
            Te demande
          </Text>
        </View>
      )}
      {status === "accepted" && (
        <View style={{ backgroundColor: "#10B981" + "15", paddingHorizontal: 16, paddingVertical: 8, borderRadius: 14 }}>
          <Text style={{ color: "#10B981", fontSize: FONT.sizes.sm, fontFamily: FONT_FAMILY.semibold }}>
            Ami
          </Text>
        </View>
      )}
    </View>
  );
}
