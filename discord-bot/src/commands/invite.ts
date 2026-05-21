import { SlashCommandBuilder, EmbedBuilder, ChatInputCommandInteraction } from "discord.js";

export const invite = {
  data: new SlashCommandBuilder()
    .setName("invite")
    .setDescription("📲 Obtenir le lien de téléchargement de l'app Dumbeez"),

  async execute(interaction: ChatInputCommandInteraction) {
    const embed = new EmbedBuilder()
      .setColor(0x3fd0c9)
      .setTitle("📲 Rejoins Dumbeez !")
      .setDescription(
        [
          "**Dumbeez** — l'app de défis vidéo entre amis 🔥",
          "",
          "👉 **iOS** : App Store *(bientôt)*",
          "👉 **Android** : Google Play *(bientôt)*",
          "",
          "En attendant, demande un accès bêta à un membre de la team !",
        ].join("\n")
      )
      .setFooter({ text: "Dumbeez 🐝 · Let's Go !" });

    await interaction.reply({ embeds: [embed] });
  },
};
