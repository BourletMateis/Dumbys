import { View, Text } from "react-native";
import { getPhaseForDate, type TimelinePhase } from "@/src/hooks/useTimelineLogic";
import { FONT, FONT_FAMILY, PALETTE, RADIUS } from "@/src/theme";

const PHASE_CONFIG: Record<TimelinePhase, {
  label: string;
  color: string;
  bg: string;
  barColor: string;
  progress: number;
}> = {
  upload: {
    label: "UPLOAD",
    color: "#22C55E",
    bg: "rgba(34,197,94,0.12)",
    barColor: "#22C55E",
    progress: 0.55,
  },
  vote: {
    label: "VOTE",
    color: "#F97316",
    bg: "rgba(249,115,22,0.12)",
    barColor: "#F97316",
    progress: 0.80,
  },
  podium: {
    label: "PODIUM",
    color: PALETTE.jaune,
    bg: "rgba(253,184,19,0.12)",
    barColor: PALETTE.jaune,
    progress: 1,
  },
};

type Props = {
  /** Optionnel : passer une date pour simuler une phase. Défaut = maintenant. */
  date?: Date;
  /** Affiche aussi les jours restants */
  showDaysLeft?: boolean;
};

export function PhaseIndicator({ date, showDaysLeft = true }: Props) {
  const { phase, daysLeft } = getPhaseForDate(date ?? new Date());
  const cfg = PHASE_CONFIG[phase];

  const daysLabel =
    phase === "podium"
      ? "Podium du jour"
      : phase === "vote"
      ? daysLeft === 0 ? "Dernier jour" : `J+${daysLeft} restant`
      : daysLeft === 0 ? "Dernier jour upload" : `J+${daysLeft} restant${daysLeft > 1 ? "s" : ""}`;

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        backgroundColor: cfg.bg,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: RADIUS.full,
      }}
    >
      {/* Barre de progression */}
      <View
        style={{
          width: 48,
          height: 4,
          borderRadius: 2,
          backgroundColor: "rgba(0,0,0,0.08)",
          overflow: "hidden",
        }}
      >
        <View
          style={{
            width: `${cfg.progress * 100}%`,
            height: "100%",
            backgroundColor: cfg.barColor,
            borderRadius: 2,
          }}
        />
      </View>

      {/* Badge phase */}
      <Text
        style={{
          color: cfg.color,
          fontSize: FONT.sizes.xs,
          fontFamily: FONT_FAMILY.extrabold,
          letterSpacing: 1.2,
        }}
      >
        {cfg.label}
      </Text>

      {/* Jours restants */}
      {showDaysLeft && (
        <Text
          style={{
            color: cfg.color,
            fontSize: FONT.sizes.xs,
            fontFamily: FONT_FAMILY.medium,
            opacity: 0.75,
          }}
        >
          {daysLabel}
        </Text>
      )}
    </View>
  );
}
