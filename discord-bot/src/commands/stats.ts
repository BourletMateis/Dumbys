import { SlashCommandBuilder, EmbedBuilder, ChatInputCommandInteraction } from "discord.js";
import type { SupabaseClient } from "@supabase/supabase-js";

export const stats = {
  data: new SlashCommandBuilder()
    .setName("stats")
    .setDescription("📊 Stats globales de la communauté Dumbeez"),

  async execute(interaction: ChatInputCommandInteraction, supabase: SupabaseClient) {
    await interaction.deferReply();

    const [
      { count: userCount },
      { count: videoCount },
      { count: groupCount },
      { count: tournamentCount },
    ] = await Promise.all([
      supabase.from("users").select("*", { count: "exact", head: true }),
      supabase.from("videos").select("*", { count: "exact", head: true }),
      supabase.from("groups").select("*", { count: "exact", head: true }),
      supabase.from("group_tournaments").select("*", { count: "exact", head: true }),
    ]);

    const embed = new EmbedBuilder()
      .setColor(0x3fd0c9)
      .setTitle("📊 Stats Dumbeez")
      .addFields(
        { name: "👤 Joueurs", value: `${userCount ?? 0}`, inline: true },
        { name: "🎬 Vidéos", value: `${videoCount ?? 0}`, inline: true },
        { name: "👥 Groupes", value: `${groupCount ?? 0}`, inline: true },
        { name: "🏆 Tournois", value: `${tournamentCount ?? 0}`, inline: true },
      )
      .setFooter({ text: "Dumbeez 🐝 · Let's Go !" })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  },
};
