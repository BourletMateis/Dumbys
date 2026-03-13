import { useMemo } from "react";

export type TimelinePhase = "upload" | "vote" | "podium";

function getISOWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

export function useTimelineLogic() {
  return useMemo(() => {
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat

    let phase: TimelinePhase;
    if (dayOfWeek === 6 || dayOfWeek === 0) {
      // Saturday or Sunday → Vote phase
      phase = "vote";
    } else if (dayOfWeek === 1) {
      // Monday → Podium phase (show last week's winners + can upload)
      phase = "podium";
    } else {
      // Tuesday-Friday → Upload phase
      phase = "upload";
    }

    const weekNumber = getISOWeekNumber(now);
    const year = now.getFullYear();

    // Previous week for podium display
    const prevWeek = weekNumber === 1 ? 52 : weekNumber - 1;
    const prevYear = weekNumber === 1 ? year - 1 : year;

    // Can upload on Monday-Friday
    const canUpload = dayOfWeek >= 1 && dayOfWeek <= 5;
    // Can vote on Saturday-Sunday
    const canVote = dayOfWeek === 6 || dayOfWeek === 0;

    return {
      phase,
      weekNumber,
      year,
      prevWeek,
      prevYear,
      canUpload,
      canVote,
      dayOfWeek,
    };
  }, []);
}
