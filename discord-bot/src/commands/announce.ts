import {
  SlashCommandBuilder,
  EmbedBuilder,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
} from "discord.js";

export const announce = {
  data: new SlashCommandBuilder()
    .setName("announce")
    .setDescription("[STAFF] Faire une annonce officielle Dumbeez")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addStringOption((opt) =>
      opt.setName("titre").setDescription("Titre de l'annonce").setRequired(true)
    )
    .addStringOption((opt) =>
      opt.setName("message").setDescription("Contenu de l'annonce").setRequired(true)
    )
    .addStringOption((opt) =>
      opt
        .setName("couleur")
        .setDescription("Couleur de l'embed")
        .setRequired(false)
        .addChoices(
          { name: "🩵 Sarcelle (défaut)", value: "teal" },
          { name: "🩷 Fuchsia", value: "fuchsia" },
          { name: "💛 Or", value: "gold" }
        )
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const titre = interaction.options.getString("titre", true);
    const message = interaction.options.getString("message", true);
    const couleur = interaction.options.getString("couleur") ?? "teal";

    const colorMap: Record<string, number> = {
      teal: 0x3fd0c9,
      fuchsia: 0xff2d7d,
      gold: 0xfdb813,
    };

    const embed = new EmbedBuilder()
      .setColor(colorMap[couleur])
      .setTitle(`📢 ${titre}`)
      .setDescription(message)
      .setFooter({ text: `Annonce officielle Dumbeez 🐝 · par ${interaction.user.username}` })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
