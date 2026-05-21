import { SlashCommandBuilder, EmbedBuilder, ChatInputCommandInteraction } from "discord.js";

export const ping = {
  data: new SlashCommandBuilder()
    .setName("ping")
    .setDescription("🏓 Vérifier la latence du bot"),

  async execute(interaction: ChatInputCommandInteraction) {
    const sent = await interaction.reply({ content: "Calcul en cours...", fetchReply: true });
    const latency = sent.createdTimestamp - interaction.createdTimestamp;
    const wsLatency = interaction.client.ws.ping;

    const color = latency < 100 ? 0x3fd0c9 : latency < 300 ? 0xfdb813 : 0xff2d7d;

    const embed = new EmbedBuilder()
      .setColor(color)
      .setTitle("🏓 Pong !")
      .addFields(
        { name: "📡 Latence bot", value: `${latency}ms`, inline: true },
        { name: "🌐 Latence WebSocket", value: `${wsLatency}ms`, inline: true }
      )
      .setFooter({ text: "Dumbeez 🐝 · Let's Go !" });

    await interaction.editReply({ content: "", embeds: [embed] });
  },
};
