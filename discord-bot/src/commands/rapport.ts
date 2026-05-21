import {
  SlashCommandBuilder,
  EmbedBuilder,
  ChatInputCommandInteraction,
  TextChannel,
} from "discord.js";

export const rapport = {
  data: new SlashCommandBuilder()
    .setName("rapport")
    .setDescription("🐛 Signaler un bug ou un problème dans l'app")
    .addStringOption((opt) =>
      opt
        .setName("description")
        .setDescription("Décris le problème (que s'est-il passé ?)")
        .setRequired(true)
        .setMaxLength(800)
    )
    .addStringOption((opt) =>
      opt
        .setName("gravite")
        .setDescription("Niveau de gravité")
        .setRequired(false)
        .addChoices(
          { name: "🟢 Mineur (cosmétique, légère gêne)", value: "minor" },
          { name: "🟡 Modéré (fonctionnalité cassée)", value: "moderate" },
          { name: "🔴 Critique (crash, perte de données)", value: "critical" }
        )
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const description = interaction.options.getString("description", true);
    const gravite = interaction.options.getString("gravite") ?? "minor";

    const graviteLabels: Record<string, { label: string; color: number }> = {
      minor: { label: "🟢 Mineur", color: 0x3fd0c9 },
      moderate: { label: "🟡 Modéré", color: 0xfdb813 },
      critical: { label: "🔴 Critique", color: 0xff2d7d },
    };

    const { label, color } = graviteLabels[gravite];

    const embed = new EmbedBuilder()
      .setColor(color)
      .setTitle("🐛 Rapport de bug")
      .setDescription(description)
      .addFields(
        { name: "⚠️ Gravité", value: label, inline: true },
        { name: "👤 Signalé par", value: `<@${interaction.user.id}>`, inline: true }
      )
      .setFooter({ text: "Dumbeez 🐝 · Merci de nous aider à améliorer l'app !" })
      .setTimestamp();

    const staffChannelId = process.env.DISCORD_STAFF_CHANNEL_ID;

    if (staffChannelId) {
      const channel = interaction.guild?.channels.cache.get(staffChannelId) as TextChannel | undefined;
      if (channel) {
        await channel.send({ embeds: [embed] });
        return interaction.reply({
          content: "✅ Ton rapport a bien été envoyé au staff. Merci ! 🐝",
          ephemeral: true,
        });
      }
    }

    await interaction.reply({ embeds: [embed] });
  },
};
