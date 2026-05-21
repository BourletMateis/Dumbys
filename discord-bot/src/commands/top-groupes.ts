import { SlashCommandBuilder, EmbedBuilder, ChatInputCommandInteraction } from "discord.js";
import type { SupabaseClient } from "@supabase/supabase-js";

export const topGroupes = {
  data: new SlashCommandBuilder()
    .setName("top-groupes")
    .setDescription("👥 Classement des groupes les plus actifs"),

  async execute(interaction: ChatInputCommandInteraction, supabase: SupabaseClient) {
    await interaction.deferReply();

    const { data: videos } = await supabase
      .from("videos")
      .select("group_id, groups!inner(name)")
      .not("group_id", "is", null)
      .limit(500);

    if (!videos?.length) {
      return interaction.editReply("Aucune vidéo de groupe pour le moment. 🐝");
    }

    const counts: Record<string, { name: string; count: number }> = {};
    for (const v of videos) {
      const gid = v.group_id as string;
      const name = (v as any).groups?.name ?? "Inconnu";
      if (!counts[gid]) counts[gid] = { name, count: 0 };
      counts[gid].count++;
    }

    const ranked = Object.values(counts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const medals = ["🥇", "🥈", "🥉"];
    const lines = ranked.map((g, i) =>
      `${medals[i] ?? `**${i + 1}.**`} **${g.name}** — ${g.count} vidéo${g.count > 1 ? "s" : ""}`
    );

    const embed = new EmbedBuilder()
      .setColor(0xff2d7d)
      .setTitle("👥 Top Groupes Dumbeez")
      .setDescription(lines.join("\n"))
      .setFooter({ text: "Dumbeez 🐝 · Let's Go !" })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  },
};
