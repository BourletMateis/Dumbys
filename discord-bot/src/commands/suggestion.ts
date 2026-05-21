import {
  SlashCommandBuilder,
  EmbedBuilder,
  ChatInputCommandInteraction,
  TextChannel,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from "discord.js";

export const suggestion = {
  data: new SlashCommandBuilder()
    .setName("suggestion")
    .setDescription("💡 Propose une suggestion / Propose a suggestion")
    .addStringOption((opt) =>
      opt
        .setName("texte")
        .setDescription("Ta suggestion (app, serveur, fonctionnalité...)")
        .setRequired(true)
        .setMaxLength(500)
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const texte = interaction.options.getString("texte", true);
    const suggestionChannelId = process.env.DISCORD_SUGGESTION_CHANNEL_ID;

    const embed = new EmbedBuilder()
      .setColor(0xfdb813)
      .setTitle("💡 Nouvelle suggestion")
      .setDescription(texte)
      .addFields({ name: "👤 Proposé par", value: `<@${interaction.user.id}>`, inline: true })
      .setFooter({ text: "Dumbeez 🐝 · Vote avec les réactions !" })
      .setTimestamp();

    const voteRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId("suggestion_up")
        .setLabel("Pour")
        .setStyle(ButtonStyle.Success)
        .setEmoji("👍"),
      new ButtonBuilder()
        .setCustomId("suggestion_down")
        .setLabel("Contre")
        .setStyle(ButtonStyle.Danger)
        .setEmoji("👎")
    );

    if (suggestionChannelId) {
      const channel = interaction.guild?.channels.cache.get(suggestionChannelId) as TextChannel | undefined;
      if (channel) {
        await channel.send({ embeds: [embed], components: [voteRow] });
        await interaction.reply({
          content: `✅ Ta suggestion a été envoyée dans <#${suggestionChannelId}> !`,
          ephemeral: true,
        });
        return;
      }
    }

    // Fallback : répondre dans le channel courant
    await interaction.reply({ embeds: [embed], components: [voteRow] });
  },
};
