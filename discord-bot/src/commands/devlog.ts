import {
  SlashCommandBuilder,
  EmbedBuilder,
  ChatInputCommandInteraction,
} from "discord.js";

// ─── Entrées du devlog ────────────────────────────────────────────
// Ajoute une nouvelle entrée ici à chaque session de dev.
// Format : { date, version, features[], fixes[], next[] }
const DEVLOG: {
  date: string;
  version: string;
  features: string[];
  fixes: string[];
  next: string[];
}[] = [
  {
    date: "26 Mai 2026",
    version: "1.2.0",
    features: [
      "🎛️ Page Paramètres — alignement UI entièrement refait (icons centrées, rows premium)",
      "🗂️ Menu actions amis — bottom sheet avec 7 options (message, profil, groupe, tournoi, retirer, bloquer, signaler)",
      "📤 Partage vidéo natif — bouton Partager dans le feed (iOS + Android)",
      "💬 Bouton message — feedback toast + haptic",
    ],
    fixes: [
      "🐛 Icônes non centrées dans leurs containers colorés (iOS & Android)",
      "🐛 Tap '⋯' supprimait l'ami sans confirmation",
      "🐛 Textes mal alignés verticalement (font padding Android)",
      "🐛 Séparateurs intra-card mal indentés",
      "🐛 Tap message → rien ne se passait",
    ],
    next: [
      "📩 Messagerie DM entre amis",
      "🔗 Deep links sur les vidéos partagées",
      "🏅 Compteur de partages en base",
      "🤝 Inviter un ami dans un groupe/tournoi directement",
    ],
  },
];

// ─── Commande ─────────────────────────────────────────────────────
export const devlog = {
  data: new SlashCommandBuilder()
    .setName("devlog")
    .setDescription("📋 Dernières mises à jour de l'application Dumbys")
    .addIntegerOption((opt) =>
      opt
        .setName("entrée")
        .setDescription("Numéro de l'entrée à afficher (1 = la plus récente)")
        .setRequired(false)
        .setMinValue(1)
        .setMaxValue(DEVLOG.length)
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const index = (interaction.options.getInteger("entrée") ?? 1) - 1;
    const entry = DEVLOG[index];

    if (!entry) {
      return interaction.reply({
        content: `❌ Entrée introuvable. Il y a **${DEVLOG.length}** entrée(s) disponible(s).`,
        ephemeral: true,
      });
    }

    const embed = new EmbedBuilder()
      .setColor(0x3fd0c9)
      .setTitle(`📋 Devlog Dumbys — v${entry.version}`)
      .setDescription(`**📅 ${entry.date}** — Entrée ${index + 1} / ${DEVLOG.length}`)
      .addFields(
        {
          name: "✨ Nouveautés",
          value: entry.features.map((f) => `> ${f}`).join("\n") || "*Aucune*",
          inline: false,
        },
        {
          name: "🐛 Bugs corrigés",
          value: entry.fixes.map((f) => `> ${f}`).join("\n") || "*Aucun*",
          inline: false,
        },
        {
          name: "🔜 Prochainement",
          value: entry.next.map((n) => `> ${n}`).join("\n") || "*À définir*",
          inline: false,
        }
      )
      .setFooter({ text: `Dumbys 🐝 · v${entry.version} · Let's Go !` })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
