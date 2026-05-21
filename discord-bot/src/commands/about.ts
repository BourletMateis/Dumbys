import { SlashCommandBuilder, EmbedBuilder, ChatInputCommandInteraction } from "discord.js";

export const about = {
  data: new SlashCommandBuilder()
    .setName("about")
    .setDescription("🐝 À propos de Dumbeez / About Dumbeez"),

  async execute(interaction: ChatInputCommandInteraction) {
    const embed = new EmbedBuilder()
      .setColor(0x3fd0c9)
      .setTitle("🐝 Dumbeez — Let's Go !")
      .setDescription(
        [
          "**Dumbeez** est l'app de défis vidéo entre amis.",
          "",
          "Lance des tournois, poste tes vidéos, grimpe au classement et prouve que t'es le meilleur ! 🔥",
          "",
          "━━━━━━━━━━━━━━━━━━━━━",
          "📲 **Téléchargement** : bêta en cours — contacte la team",
          "🐝 **Discord** : tu y es déjà !",
          "━━━━━━━━━━━━━━━━━━━━━",
        ].join("\n")
      )
      .addFields(
        { name: "🎯 Défis", value: "Lance des tournois dans ton groupe", inline: true },
        { name: "🎬 Vidéos", value: "Poste tes prouesses", inline: true },
        { name: "🏆 Classement", value: "Prouve que t'es le boss", inline: true }
      )
      .setFooter({ text: "Dumbeez 🐝 · Made with 🔥 by the Dumbeez team" });

    await interaction.reply({ embeds: [embed] });
  },
};
