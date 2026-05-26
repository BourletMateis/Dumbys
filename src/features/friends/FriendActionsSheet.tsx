/**
 * FriendActionsSheet — Dumbys
 * Bottom sheet with spring animation, iOS/Telegram-style groups.
 * Layout: zero-ambiguity flex, no `gap`, explicit margins everywhere.
 */

import { useEffect, useRef } from "react";
import {
  View,
  Text,
  Modal,
  Pressable,
  Alert,
  StyleSheet,
  Animated,
  TouchableWithoutFeedback,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PALETTE, FONT_FAMILY } from "@/src/theme";
import { useTheme } from "@/src/providers/ThemeProvider";
import { Avatar } from "@/src/components/ui/Avatar";
import { toast } from "@/src/lib/toast";

const { height: SCREEN_H } = Dimensions.get("window");

// ─────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────
type SheetAction = {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  sublabel?: string;          // ← optional subtitle shown under the label
  iconColor: string;
  iconBg: string;
  isDanger?: boolean;
  onPress: () => void;
};

export type FriendActionsSheetProps = {
  visible: boolean;
  onClose: () => void;
  friendshipId: string;
  userId: string;
  username: string;
  avatarUrl?: string | null;
  onRemove: () => void;
};

// ─────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────
export function FriendActionsSheet({
  visible,
  onClose,
  userId,
  username,
  avatarUrl,
  onRemove,
}: FriendActionsSheetProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();

  const translateY      = useRef(new Animated.Value(SCREEN_H)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  // ── open / close animation ──────────────────────────────────
  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          damping: 24,
          stiffness: 240,
          mass: 0.9,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const dismiss = (after?: () => void) => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: SCREEN_H,
        duration: 240,
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
      after?.();
    });
  };

  // ── handlers ────────────────────────────────────────────────
  const handleRemove = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert(
      "Retirer des amis",
      `Retirer ${username} de ta liste d'amis ?`,
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Retirer",
          style: "destructive",
          onPress: () => dismiss(() => setTimeout(onRemove, 80)),
        },
      ]
    );
  };

  const handleBlock = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert(
      `Bloquer ${username}`,
      "Il ne pourra plus te voir ni t'envoyer de demandes.",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Bloquer",
          style: "destructive",
          onPress: () =>
            dismiss(() =>
              setTimeout(() => toast.info(`${username} a été bloqué.`), 300)
            ),
        },
      ]
    );
  };

  const handleReport = () =>
    dismiss(() =>
      setTimeout(
        () =>
          Alert.alert(
            `Signaler ${username}`,
            "Pourquoi veux-tu signaler ce compte ?",
            [
              { text: "Comportement inapproprié", onPress: () => toast.success("Signalement envoyé. Merci !") },
              { text: "Spam",                     onPress: () => toast.success("Signalement envoyé. Merci !") },
              { text: "Contenu offensant",         onPress: () => toast.success("Signalement envoyé. Merci !") },
              { text: "Annuler", style: "cancel" },
            ]
          ),
        300
      )
    );

  // ── action lists ─────────────────────────────────────────────
  const mainActions: SheetAction[] = [
    {
      id: "message",
      icon: "chatbubble-ellipses-outline",
      label: "Envoyer un message",
      sublabel: "Conversation privée",
      iconColor: PALETTE.sarcelle,
      iconBg: "rgba(63,208,201,0.16)",
      onPress: () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        dismiss(() => setTimeout(() => toast.info("Messagerie bientôt disponible ! 💬"), 300));
      },
    },
    {
      id: "profile",
      icon: "person-circle-outline",
      label: "Voir le profil",
      sublabel: `@${username}`,
      iconColor: "#8B5CF6",
      iconBg: "rgba(139,92,246,0.16)",
      onPress: () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        dismiss(() =>
          setTimeout(
            () => router.push({ pathname: "/user/[id]", params: { id: userId } }),
            80
          )
        );
      },
    },
    {
      id: "group",
      icon: "people-outline",
      label: "Inviter dans un groupe",
      sublabel: "Rejoindre un groupe ensemble",
      iconColor: "#10B981",
      iconBg: "rgba(16,185,129,0.16)",
      onPress: () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        dismiss(() => setTimeout(() => toast.info("Bientôt disponible 🚀"), 300));
      },
    },
    {
      id: "tournament",
      icon: "trophy-outline",
      label: "Inviter dans un tournoi",
      sublabel: "Défi entre amis",
      iconColor: PALETTE.jaune,
      iconBg: "rgba(253,184,19,0.16)",
      onPress: () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        dismiss(() => setTimeout(() => toast.info("Bientôt disponible 🏆"), 300));
      },
    },
  ];

  const dangerActions: SheetAction[] = [
    {
      id: "remove",
      icon: "person-remove-outline",
      label: "Retirer des amis",
      iconColor: "#F97316",
      iconBg: "rgba(249,115,22,0.16)",
      onPress: handleRemove,
    },
    {
      id: "block",
      icon: "ban-outline",
      label: "Bloquer",
      iconColor: "#EF4444",
      iconBg: "rgba(239,68,68,0.16)",
      isDanger: true,
      onPress: handleBlock,
    },
    {
      id: "report",
      icon: "flag-outline",
      label: "Signaler",
      iconColor: "#DC2626",
      iconBg: "rgba(220,38,38,0.16)",
      isDanger: true,
      onPress: handleReport,
    },
  ];

  // ── theme ────────────────────────────────────────────────────
  const sheetBg   = isDark ? "#1C1C1E" : "#FFFFFF";
  const groupBg   = isDark ? "#2C2C2E" : "#F2F2F7";
  const handleBg  = isDark ? "rgba(255,255,255,0.18)" : "rgba(0,0,0,0.13)";
  const closeBg   = isDark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.07)";
  const closeColor= isDark ? "#AEAEB2" : "#6C6C70";
  const sepColor  = isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)";
  const nameColor = isDark ? "#F5F5F5" : "#1A1A1A";
  const tagColor  = isDark ? "#8E8E93" : "#8E8E93";

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      statusBarTranslucent
      onRequestClose={() => dismiss()}
    >
      {/* Backdrop */}
      <TouchableWithoutFeedback onPress={() => dismiss()}>
        <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]} />
      </TouchableWithoutFeedback>

      {/* Sheet */}
      <Animated.View
        style={[
          styles.sheet,
          {
            backgroundColor: sheetBg,
            transform: [{ translateY }],
            paddingBottom: Math.max(insets.bottom, 20),
          },
        ]}
      >
        {/* Handle */}
        <View style={styles.handleRow}>
          <View style={[styles.handle, { backgroundColor: handleBg }]} />
        </View>

        {/* User header */}
        <View style={styles.userHeader}>
          <Avatar url={avatarUrl} username={username} size={46} />
          <View style={styles.userHeaderBody}>
            <Text style={[styles.userName, { color: nameColor }]} numberOfLines={1}>
              {username}
            </Text>
            <Text style={[styles.userTag, { color: tagColor }]}>
              @{username}
            </Text>
          </View>
          <Pressable
            onPress={() => dismiss()}
            hitSlop={10}
            style={[styles.closeBtn, { backgroundColor: closeBg }]}
          >
            <Ionicons name="close" size={15} color={closeColor} />
          </Pressable>
        </View>

        {/* Group 1 — main actions */}
        <View style={[styles.group, { backgroundColor: groupBg }]}>
          {mainActions.map((a, i) => (
            <ActionRow
              key={a.id}
              action={a}
              isDark={isDark}
              sepColor={sepColor}
              showSep={i < mainActions.length - 1}
              showChevron
            />
          ))}
        </View>

        {/* Group 2 — danger actions */}
        <View style={[styles.group, { backgroundColor: groupBg, marginTop: 10 }]}>
          {dangerActions.map((a, i) => (
            <ActionRow
              key={a.id}
              action={a}
              isDark={isDark}
              sepColor={sepColor}
              showSep={i < dangerActions.length - 1}
            />
          ))}
        </View>
      </Animated.View>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────────
// ActionRow — sub-component for each action item
// ─────────────────────────────────────────────────────────────────
function ActionRow({
  action,
  isDark,
  sepColor,
  showSep,
  showChevron,
}: {
  action: SheetAction;
  isDark: boolean;
  sepColor: string;
  showSep: boolean;
  showChevron?: boolean;
}) {
  const labelColor = action.isDanger
    ? action.iconColor
    : isDark ? "#EBEBF5" : "#1C1C1E";

  const subColor = isDark ? "#8E8E93" : "#8E8E93";

  return (
    <>
      {/* Pressable handles tap only. Layout lives on the inner <View> — */}
      {/* this avoids an iOS bug where Pressable+array-style swallows */}
      {/* flexDirection:"row" and stacks children vertically. */}
      <Pressable
        onPress={action.onPress}
        android_ripple={{ color: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)" }}
        style={({ pressed }) =>
          pressed
            ? { backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)" }
            : null
        }
      >
        <View style={styles.actionRow}>
          {/* ── Coloured icon box ── */}
          <View
            style={[
              styles.iconBox,
              { backgroundColor: action.iconBg, borderRadius: ICON_RADIUS },
            ]}
          >
            <Ionicons name={action.icon} size={ICON_SIZE} color={action.iconColor} />
          </View>

          {/* ── Label + sublabel block ── */}
          <View style={styles.labelWrap}>
            <Text
              style={[
                styles.actionLabel,
                {
                  color: labelColor,
                  fontFamily: action.isDanger ? FONT_FAMILY.semibold : FONT_FAMILY.medium,
                },
              ]}
              numberOfLines={1}
            >
              {action.label}
            </Text>
            {action.sublabel ? (
              <Text
                style={[styles.actionSub, { color: subColor }]}
                numberOfLines={1}
              >
                {action.sublabel}
              </Text>
            ) : null}
          </View>

          {/* ── Chevron — explicit flexShrink:0 keeps it from wrapping ── */}
          {showChevron && (
            <Ionicons
              name="chevron-forward"
              size={15}
              color={isDark ? "#48484A" : "#C7C7CC"}
              style={styles.chevron}
            />
          )}
        </View>
      </Pressable>

      {/* ── Separator ── */}
      {showSep && (
        <View style={[styles.sep, { backgroundColor: sepColor }]} />
      )}
    </>
  );
}

// ─────────────────────────────────────────────────────────────────
// Layout constants — harmonised with app/settings.tsx
// ─────────────────────────────────────────────────────────────────
const ROW_PH        = 16;   // horizontal padding inside each row
const ROW_PV        = 11;   // vertical padding (real height driver)
const ICON_BOX      = 34;   // slightly larger than settings (38→ feels heavier in a sheet)
const ICON_SIZE     = 18;   // Ionicons glyph size
const ICON_PADDING  = (ICON_BOX - ICON_SIZE) / 2; // = 8 — explicit centering
const ICON_RADIUS   = 10;   // border-radius of icon box
const GAP_ICON_TEXT = 12;   // gap between icon box and label block
const SEP_INDENT    = ROW_PH + ICON_BOX + GAP_ICON_TEXT; // = 62

const styles = StyleSheet.create({
  // ── Modal backdrop
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.55)",
  },

  // ── Sheet container
  sheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 20,
  },

  // ── Drag handle
  handleRow: {
    alignItems: "center",
    paddingTop: 10,
    paddingBottom: 6,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
  },

  // ── User header — sheet-wide row
  userHeader: {
    width: "100%",
    alignSelf: "stretch",
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 4,
    marginBottom: 6,
  },
  userHeaderBody: {
    flex: 1,
    flexDirection: "column",
    marginLeft: 12,
  },
  userName: {
    fontSize: 16,
    fontFamily: FONT_FAMILY.bold,
    includeFontPadding: false,
  },
  userTag: {
    fontSize: 12,
    fontFamily: FONT_FAMILY.regular,
    marginTop: 2,
    includeFontPadding: false,
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
    flexShrink: 0,
  },

  // ── Action group card — must stretch to full sheet width
  group: {
    width: "100%",
    alignSelf: "stretch",
    borderRadius: 16,
    overflow: "hidden",
  },

  // ── Individual row — bullet-proof flex row
  // width:"100%" + alignSelf:"stretch" guarantees the Pressable
  // fills the group horizontally so the chevron has room on the right.
  actionRow: {
    width: "100%",
    alignSelf: "stretch",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: ROW_PH,
    paddingVertical: ROW_PV,
    minHeight: 54,
  },

  // ── Icon box (34×34)
  // Explicit padding + alignItems/justifyContent → reliable centering
  // for the font-icon glyph (Ionicons renders as <Text>).
  iconBox: {
    width: ICON_BOX,
    height: ICON_BOX,
    padding: ICON_PADDING,
    alignItems: "center",
    justifyContent: "center",
    flexGrow: 0,
    flexShrink: 0,
  },

  // ── Label + sublabel block — takes remaining horizontal space
  labelWrap: {
    flex: 1,
    flexShrink: 1,
    flexDirection: "column",
    marginLeft: GAP_ICON_TEXT,
  },
  actionLabel: {
    fontSize: 15,
    includeFontPadding: false,
    lineHeight: 19,
  },
  actionSub: {
    fontSize: 12,
    fontFamily: FONT_FAMILY.regular,
    marginTop: 2,
    includeFontPadding: false,
    lineHeight: 15,
  },

  // ── Right-side chevron — explicit non-shrink, non-grow
  chevron: {
    flexGrow: 0,
    flexShrink: 0,
    marginLeft: 8,
  },

  // ── Intra-group separator — indented to where text starts
  sep: {
    height: StyleSheet.hairlineWidth,
    marginLeft: SEP_INDENT,
  },
});
