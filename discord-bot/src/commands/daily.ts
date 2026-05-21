import { SlashCommandBuilder, EmbedBuilder, ChatInputCommandInteraction } from "discord.js";
import type { SupabaseClient } from "@supabase/supabase-js";

export const daily = {
  data: new SlashCommandBuilder()
    .setName("daily")
    .setDescription("🎲 Défi du jour — tirage aléatoire parmi les défis actifs"),

  async execute(interaction: ChatInputCommandInteraction, supabase: SupabaseClient) {
    await interaction.deferReply();

    const { data: challenges } = await supabase
      .from("challenges")
      .select("title, description, created_at, group_tournaments!inner(title, groups!inner(name))")
      .order("created_at", { ascending: false })
      .limit(50);

    if (!challenges?.length) {
      return interaction.editReply("Aucun défi disponible pour le moment. Lance-en un sur l'app ! 🐝");
    }

    const pick = challenges[Math.floor(Math.random() * challenges.length)] as any;
    const tournamentTitle = pick.group_tournaments?.title ?? "Tournoi inconnu";
    const groupName = pick.group_tournaments?.groups?.name ?? "Groupe inconnu";

    const embed = new EmbedBuilder()
      .setColor(0xfdb813)
      .setTitle("🎲 Défi du jour !")
      .setDescription(`## ${pick.title}`)
      .addFields(
        ...(pick.description ? [{ name: "📝 Description", value: pick.description, inline: false }] : []),
        { name: "🏆 Tournoi", value: tournamentTitle, inline: true },
        { name: "👥 Groupe", value: groupName, inline: true }
      )
      .setFooter({ text: "Dumbeez 🐝 · Relève le défi sur l'app !" })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  },
};
