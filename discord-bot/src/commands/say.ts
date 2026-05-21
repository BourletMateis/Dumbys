import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  TextChannel,
} from "discord.js";

export const say = {
  data: new SlashCommandBuilder()
    .setName("say")
    .setDescription("[STAFF] Faire parler le bot dans un channel")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addChannelOption((opt) =>
      opt.setName("channel").setDescription("Channel cible").setRequired(true)
    )
    .addStringOption((opt) =>
      opt.setName("message").setDescription("Message à envoyer").setRequired(true)
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const channel = interaction.options.getChannel("channel", true) as TextChannel;
    const message = interaction.options.getString("message", true);

    if (!channel.isTextBased()) {
      return interaction.reply({ content: "❌ Ce channel n'est pas un channel textuel.", ephemeral: true });
    }

    await channel.send(message);
    await interaction.reply({ content: `✅ Message envoyé dans <#${channel.id}>`, ephemeral: true });
  },
};
