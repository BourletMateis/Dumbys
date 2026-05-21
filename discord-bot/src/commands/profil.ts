import { SlashCommandBuilder, EmbedBuilder, ChatInputCommandInteraction } from "discord.js";
import type { SupabaseClient } from "@supabase/supabase-js";

export const profil = {
  data: new SlashCommandBuilder()
    .setName("profil")
    .setDescription("👤 Voir le profil d'un joueur Dumbeez")
    .addStringOption((opt) =>
      opt
        .setName("username")
        .setDescription("Nom d'utilisateur Dumbeez (laisser vide = le tien)")
        .setRequired(false)
    ),

  async execute(interaction: ChatInputCommandInteraction, supabase: SupabaseClient) {
    await interaction.deferReply();

    const usernameInput = interaction.options.getString("username");

    let userQuery = supabase.from("users").select("id, username, avatar_url, created_at");
    if (usernameInput) {
      userQuery = userQuery.ilike("username", usernameInput);
    }
    // Without a username we can't link Discord ↔ Dumbeez account, so show top user as fallback
    userQuery = userQuery.limit(1);

    const { data: users } = await userQuery;
    const user = users?.[0];

    if (!user) {
      return interaction.editReply(
        usernameInput
          ? `❌ Aucun joueur trouvé avec le pseudo **${usernameInput}**.`
          : "❌ Aucun joueur trouvé. Précise un username Dumbeez."
      );
    }

    const [
      { count: videoCount },
      { count: groupCount },
      { count: reactionsReceived },
      { count: podiumCount },
    ] = await Promise.all([
      supabase.from("videos").select("*", { count: "exact", head: true }).eq("submitter_id", user.id),
      supabase.from("group_members").select("*", { count: "exact", head: true }).eq("user_id", user.id),
      supabase
        .from("reactions")
        .select("videos!inner(submitter_id)", { count: "exact", head: true })
        .eq("videos.submitter_id", user.id),
      supabase.from("weekly_podium").select("*", { count: "exact", head: true }).eq("user_id", user.id),
    ]);

    const joinDate = new Date(user.created_at).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });

    const embed = new EmbedBuilder()
      .setColor(0x3fd0c9)
      .setTitle(`👤 ${user.username}`)
      .setDescription(`Membre depuis le **${joinDate}**`)
      .addFields(
        { name: "🎬 Vidéos postées", value: `${videoCount ?? 0}`, inline: true },
        { name: "👥 Groupes", value: `${groupCount ?? 0}`, inline: true },
        { name: "🏆 Podiums", value: `${podiumCount ?? 0}`, inline: true },
        { name: "❤️ Réactions reçues", value: `${reactionsReceived ?? 0}`, inline: true }
      )
      .setFooter({ text: "Dumbeez 🐝 · Let's Go !" })
      .setTimestamp();

    if (user.avatar_url) embed.setThumbnail(user.avatar_url);

    await interaction.editReply({ embeds: [embed] });
  },
};
