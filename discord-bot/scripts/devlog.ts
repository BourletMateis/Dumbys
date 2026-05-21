import * as path from "path";
import * as dotenv from "dotenv";
dotenv.config({ path: path.join(__dirname, "..", ".env") });

import { Client, GatewayIntentBits, EmbedBuilder, TextChannel } from "discord.js";

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

const today = new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });

const embed = new EmbedBuilder()
  .setColor(0x3fd0c9)
  .setTitle(`🛠️ Devlog Dumbeez — ${today}`)
  .setDescription("Session de dev productive ! Voilà ce qui vient d'atterrir :")
  .addFields(
    { name: "🌙 Dark Mode — App entière", value: "Le dark mode couvre maintenant **toutes les pages** : Feed, Amis, Upload, Profil — plus aucun fond blanc codé en dur", inline: false },
    { name: "🗂️ Onglet Paramètres intégré au Profil", value: "Les tabs **Défis + Shorts** fusionnés en **Vidéos**. Un nouvel onglet **Paramètres** est directement dans le profil : thème, username, guide, déconnexion", inline: false },
    { name: "📤 Publication multi-groupes", value: "Tu peux maintenant sélectionner **plusieurs groupes** quand tu publies une vidéo. Chaque groupe reçoit la vidéo — indicateur de sélection en teal avec badge ✓", inline: false },
    { name: "🐛 Fix positionnement", value: "Correction du layout des rows dans l'onglet Paramètres (icônes + texte bien alignés)", inline: false },
    { name: "🌙 Dark Mode — Page Groupe", value: "La page de détail d'un groupe est maintenant fully dark mode : header, cards vidéos, podium, tournois, bottom sheets membres & invitations — tous thémés avec les tokens `colors.*`", inline: false },
  )
  .setFooter({ text: "Dumbeez 🐝 · Let's Go !" })
  .setTimestamp();

client.once("ready", async () => {
  const channelId = process.env.DISCORD_NOTIF_CHANNEL_ID!;
  const channel = await client.channels.fetch(channelId) as TextChannel;
  await channel.send({ embeds: [embed] });
  console.log("✅ Devlog posté !");
  client.destroy();
  process.exit(0);
});

client.login(process.env.DISCORD_TOKEN);
