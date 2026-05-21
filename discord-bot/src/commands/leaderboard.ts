import { SlashCommandBuilder, EmbedBuilder, ChatInputCommandInteraction } from "discord.js";
import type { SupabaseClient } from "@supabase/supabase-js";

export const leaderboard = {
  data: new SlashCommandBuilder()
    .setName("leaderboard")
    .setDescription("🏆 Classement des joueurs Dumbeez"),

  async execute(interaction: ChatInputCommandInteraction, supabase: SupabaseClient) {
    await interaction.deferReply();

    const { data: videos, error } = await supabase
      .from("videos")
      .select("submitter_id, users!inner(username)")
      .limit(200);

    if (error || !videos?.length) {
      return interaction.editReply("Aucune donnée disponible pour le classement.");
    }

    // Compte les vidéos par user
    const counts: Record<string, { username: string; count: number }> = {};
    for (const v of videos) {
      const uid = v.submitter_id;
      const username = (v as any).users?.username ?? "Inconnu";
      if (!counts[uid]) counts[uid] = { username, count: 0 };
      counts[uid].count++;
    }

    const ranked = Object.values(counts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const medals = ["🥇", "🥈", "🥉"];
    const lines = ranked.map((u, i) =>
      `${medals[i] ?? `**${i + 1}.**`} **${u.username}** — ${u.count} vidéo${u.count > 1 ? "s" : ""}`
    );

    const embed = new EmbedBuilder()
      .setColor(0xfdb813)
      .setTitle("🏆 Classement Dumbeez")
      .setDescription(lines.join("\n") || "Pas encore de données.")
      .setFooter({ text: "Dumbeez 🐝 · Let's Go !" })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  },
};
