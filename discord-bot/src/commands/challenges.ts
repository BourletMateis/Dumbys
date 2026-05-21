import { SlashCommandBuilder, EmbedBuilder, ChatInputCommandInteraction } from "discord.js";
import type { SupabaseClient } from "@supabase/supabase-js";

export const challenges = {
  data: new SlashCommandBuilder()
    .setName("challenges")
    .setDescription("🎯 Voir les derniers tournois actifs sur Dumbeez"),

  async execute(interaction: ChatInputCommandInteraction, supabase: SupabaseClient) {
    await interaction.deferReply();

    const { data: tournaments } = await supabase
      .from("group_tournaments")
      .select("id, title, description, reward, created_at, groups!inner(name)")
      .order("created_at", { ascending: false })
      .limit(5);

    if (!tournaments?.length) {
      return interaction.editReply(
        "Aucun tournoi actif pour le moment. Crée-en un sur l'app ! 🐝"
      );
    }

    const embed = new EmbedBuilder()
      .setColor(0xff2d7d)
      .setTitle("🎯 Tournois Dumbeez")
      .setDescription("Les 5 derniers lancés :")
      .setFooter({ text: "Dumbeez 🐝 · Let's Go !" })
      .setTimestamp();

    for (const t of tournaments) {
      const groupName = (t as any).groups?.name ?? "Groupe inconnu";
      const lines = [
        `👥 **${groupName}**`,
        t.description ? `📝 ${t.description}` : "",
        t.reward ? `🎁 Récompense : **${t.reward}**` : "",
      ].filter(Boolean);

      embed.addFields({ name: `🏆 ${t.title}`, value: lines.join("\n"), inline: false });
    }

    await interaction.editReply({ embeds: [embed] });
  },
};
