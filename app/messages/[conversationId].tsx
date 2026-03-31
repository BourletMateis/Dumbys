import { useState, useRef, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  View,
  Text,
  TextInput,
  Pressable,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useMessages, type Message } from "@/src/features/messages/useMessages";
import { useSendMessage } from "@/src/features/messages/useSendMessage";
import { useAuthStore } from "@/src/store/useAuthStore";
import { Avatar } from "@/src/components/ui/Avatar";
import { PALETTE, FONT, FONT_FAMILY } from "@/src/theme";

function formatMessageTime(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

function formatDateSeparator(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / 86400000);

  if (days === 0) return "Aujourd'hui";
  if (days === 1) return "Hier";
  if (days < 7) return date.toLocaleDateString("fr-FR", { weekday: "long" });
  return date.toLocaleDateString("fr-FR", { day: "numeric", month: "long" });
}

function shouldShowDateSeparator(messages: Message[], index: number): boolean {
  if (index === 0) return true;
  const prev = new Date(messages[index - 1].created_at).toDateString();
  const curr = new Date(messages[index].created_at).toDateString();
  return prev !== curr;
}

function MessageBubble({
  message,
  isMe,
  showTail,
}: {
  message: Message;
  isMe: boolean;
  showTail: boolean;
}) {
  return (
    <View
      style={{
        alignSelf: isMe ? "flex-end" : "flex-start",
        maxWidth: "78%",
        marginBottom: showTail ? 8 : 2,
        paddingHorizontal: 16,
      }}
    >
      <View
        style={{
          backgroundColor: isMe ? PALETTE.sarcelle : "#F2F2F2",
          borderRadius: 20,
          borderBottomRightRadius: isMe && showTail ? 6 : 20,
          borderBottomLeftRadius: !isMe && showTail ? 6 : 20,
          paddingHorizontal: 16,
          paddingVertical: 10,
        }}
      >
        <Text
          style={{
            fontSize: FONT.sizes.base,
            fontFamily: FONT_FAMILY.regular,
            color: isMe ? "#FFFFFF" : "#1A1A1A",
            lineHeight: 20,
          }}
        >
          {message.text}
        </Text>
      </View>
      {showTail && (
        <Text
          style={{
            fontSize: 10,
            fontFamily: FONT_FAMILY.regular,
            color: "#CCC",
            marginTop: 2,
            textAlign: isMe ? "right" : "left",
            paddingHorizontal: 4,
          }}
        >
          {formatMessageTime(message.created_at)}
        </Text>
      )}
    </View>
  );
}

export default function ChatScreen() {
  const { conversationId, username, avatarUrl, otherUserId } = useLocalSearchParams<{
    conversationId: string;
    username: string;
    avatarUrl?: string;
    otherUserId: string;
  }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);

  const { data: messages, isPending } = useMessages(conversationId);
  const sendMessage = useSendMessage(conversationId);

  const [text, setText] = useState("");
  const flatListRef = useRef<FlatList>(null);

  // Marque la conversation comme vue dès l'ouverture
  useEffect(() => {
    if (!conversationId) return;
    AsyncStorage.getItem("conversationLastSeen").then((raw) => {
      const map = raw ? JSON.parse(raw) : {};
      map[conversationId] = Date.now();
      AsyncStorage.setItem("conversationLastSeen", JSON.stringify(map));
    });
  }, [conversationId]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages && messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages?.length]);

  const handleSend = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    sendMessage.mutate(trimmed);
    setText("");
  }, [text, sendMessage]);

  const renderMessage = useCallback(
    ({ item, index }: { item: Message; index: number }) => {
      const isMe = item.sender_id === user?.id;
      // Show tail if next message is from a different sender or is the last message
      const isLast = !messages || index === messages.length - 1;
      const nextIsDifferent = messages && index < messages.length - 1 && messages[index + 1].sender_id !== item.sender_id;
      const showTail = isLast || nextIsDifferent || false;

      return (
        <>
          {messages && shouldShowDateSeparator(messages, index) && (
            <View style={{ alignItems: "center", paddingVertical: 16 }}>
              <Text
                style={{
                  fontSize: FONT.sizes.xs,
                  fontFamily: FONT_FAMILY.semibold,
                  color: "#CCC",
                  backgroundColor: "#F8F8FA",
                  paddingHorizontal: 12,
                  paddingVertical: 4,
                  borderRadius: 10,
                  overflow: "hidden",
                }}
              >
                {formatDateSeparator(item.created_at)}
              </Text>
            </View>
          )}
          <MessageBubble message={item} isMe={isMe} showTail={showTail} />
        </>
      );
    },
    [user?.id, messages],
  );

  return (
    <View style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View
        style={{
          paddingTop: insets.top + 4,
          paddingHorizontal: 16,
          paddingBottom: 12,
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: "#FFFFFF",
          borderBottomWidth: 1,
          borderBottomColor: "rgba(0,0,0,0.05)",
        }}
      >
        <Pressable
          onPress={() => router.back()}
          style={{
            width: 38,
            height: 38,
            borderRadius: 12,
            backgroundColor: "rgba(0,0,0,0.04)",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons name="arrow-back" size={20} color="#1A1A1A" />
        </Pressable>

        <Pressable
          onPress={() =>
            router.push({ pathname: "/user/[id]", params: { id: otherUserId ?? "" } })
          }
          style={{ flexDirection: "row", alignItems: "center", flex: 1, marginLeft: 12 }}
        >
          <Avatar url={avatarUrl || null} username={username ?? "?"} size={38} />
          <Text
            style={{
              fontSize: FONT.sizes.xl,
              fontFamily: FONT_FAMILY.bold,
              color: "#1A1A1A",
              marginLeft: 10,
            }}
            numberOfLines={1}
          >
            {username}
          </Text>
        </Pressable>
      </View>

      {/* Messages */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={0}
      >
        {isPending ? (
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
            <ActivityIndicator size="large" color={PALETTE.sarcelle} />
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages ?? []}
            keyExtractor={(item) => item.id}
            renderItem={renderMessage}
            style={{ flex: 1 }}
            contentContainerStyle={{
              paddingTop: 12,
              paddingBottom: 8,
              flexGrow: 1,
              justifyContent: messages && messages.length > 0 ? "flex-end" : "center",
            }}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={{ alignItems: "center", paddingVertical: 40 }}>
                <Ionicons name="chatbubble-ellipses-outline" size={48} color="#E0E0E0" />
                <Text
                  style={{
                    fontSize: FONT.sizes.base,
                    fontFamily: FONT_FAMILY.medium,
                    color: "#CCC",
                    marginTop: 12,
                  }}
                >
                  Envoie le premier message !
                </Text>
              </View>
            }
          />
        )}

        {/* Input bar */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "flex-end",
            paddingHorizontal: 12,
            paddingTop: 8,
            paddingBottom: insets.bottom + 8,
            backgroundColor: "#FFFFFF",
            borderTopWidth: 1,
            borderTopColor: "rgba(0,0,0,0.05)",
            gap: 8,
          }}
        >
          <View
            style={{
              flex: 1,
              flexDirection: "row",
              alignItems: "flex-end",
              backgroundColor: "#F2F2F2",
              borderRadius: 22,
              paddingHorizontal: 16,
              paddingVertical: Platform.OS === "ios" ? 10 : 4,
              minHeight: 44,
              maxHeight: 120,
            }}
          >
            <TextInput
              value={text}
              onChangeText={setText}
              placeholder="Message..."
              placeholderTextColor="#CCC"
              multiline
              style={{
                flex: 1,
                fontSize: FONT.sizes.base,
                fontFamily: FONT_FAMILY.regular,
                color: "#1A1A1A",
                maxHeight: 100,
              }}
            />
          </View>

          <Pressable
            onPress={handleSend}
            disabled={!text.trim() || sendMessage.isPending}
            style={({ pressed }) => ({
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: PALETTE.sarcelle,
              alignItems: "center",
              justifyContent: "center",
              opacity: !text.trim() || sendMessage.isPending ? 0.3 : pressed ? 0.8 : 1,
            })}
          >
            {sendMessage.isPending ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <Ionicons name="send" size={20} color="#FFF" />
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
