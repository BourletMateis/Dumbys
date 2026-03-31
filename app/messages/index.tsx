import { View, Text, Pressable, ActivityIndicator } from "react-native";
import { useRouter, Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FlatList } from "react-native";
import { Image } from "expo-image";
import { useConversations, type ConversationWithUser } from "@/src/features/messages/useConversations";
import { useAuthStore } from "@/src/store/useAuthStore";
import { PALETTE, FONT, FONT_FAMILY } from "@/src/theme";
import { Avatar } from "@/src/components/ui/Avatar";

function formatTime(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "maintenant";
  if (mins < 60) return `${mins}min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}j`;
  return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

function ConversationRow({ conversation }: { conversation: ConversationWithUser }) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { otherUser, lastMessage } = conversation;

  const isMe = lastMessage?.sender_id === user?.id;
  const preview = lastMessage
    ? (isMe ? "Toi : " : "") + lastMessage.text
    : "Pas encore de messages";

  return (
    <Pressable
      onPress={() =>
        router.push({
          pathname: "/messages/[conversationId]" as any,
          params: {
            conversationId: conversation.id,
            username: otherUser.username,
            avatarUrl: otherUser.avatar_url ?? "",
            otherUserId: otherUser.id,
          },
        })
      }
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 20,
        paddingVertical: 14,
        backgroundColor: pressed ? "rgba(0,0,0,0.02)" : "transparent",
      })}
    >
      <Avatar url={otherUser.avatar_url} username={otherUser.username} size={52} />
      <View style={{ flex: 1, marginLeft: 14 }}>
        <Text
          style={{
            fontSize: FONT.sizes.lg,
            fontFamily: FONT_FAMILY.bold,
            color: "#1A1A1A",
          }}
          numberOfLines={1}
        >
          {otherUser.username}
        </Text>
        <Text
          style={{
            fontSize: FONT.sizes.base,
            fontFamily: FONT_FAMILY.regular,
            color: "#999",
            marginTop: 2,
          }}
          numberOfLines={1}
        >
          {preview}
        </Text>
      </View>
      {lastMessage && (
        <Text
          style={{
            fontSize: FONT.sizes.xs,
            fontFamily: FONT_FAMILY.medium,
            color: "#CCC",
            marginLeft: 8,
          }}
        >
          {formatTime(lastMessage.created_at)}
        </Text>
      )}
    </Pressable>
  );
}

export default function MessagesListScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { data: conversations, isPending } = useConversations();

  return (
    <View style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View
        style={{
          paddingTop: insets.top + 8,
          paddingHorizontal: 20,
          paddingBottom: 12,
          flexDirection: "row",
          alignItems: "center",
          gap: 14,
        }}
      >
        <Pressable
          onPress={() => router.back()}
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            backgroundColor: "rgba(0,0,0,0.04)",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons name="arrow-back" size={22} color="#1A1A1A" />
        </Pressable>
        <Text
          style={{
            flex: 1,
            fontSize: FONT.sizes["4xl"],
            fontFamily: FONT_FAMILY.extrabold,
            color: PALETTE.sarcelle,
          }}
        >
          Messages
        </Text>
      </View>

      {isPending ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color={PALETTE.sarcelle} />
        </View>
      ) : !conversations || conversations.length === 0 ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 40 }}>
          <View
            style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: PALETTE.sarcelle + "15",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 16,
            }}
          >
            <Ionicons name="chatbubbles-outline" size={36} color={PALETTE.sarcelle} />
          </View>
          <Text
            style={{
              fontSize: FONT.sizes.lg,
              fontFamily: FONT_FAMILY.bold,
              color: "#1A1A1A",
              textAlign: "center",
            }}
          >
            Pas encore de messages
          </Text>
          <Text
            style={{
              fontSize: FONT.sizes.base,
              fontFamily: FONT_FAMILY.regular,
              color: "#AAA",
              textAlign: "center",
              marginTop: 6,
            }}
          >
            Envoie un message à un ami pour commencer !
          </Text>
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <ConversationRow conversation={item} />}
          contentContainerStyle={{ paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}
