import * as path from "path";
import * as dotenv from "dotenv";
dotenv.config({ path: path.join(__dirname, "..", ".env") });

import { Client, GatewayIntentBits, EmbedBuilder, TextChannel } from "discord.js";

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

const today = new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });

const embed = new EmbedBuilder()
  .setColor(0x3fd0c9)
  .setTitle(`🛠️ Devlog Dumbeez — ${today}`)
  .setDescription("Grosse session de refonte : stabilité, fluidité, suivi, navigation et branding. 7 domaines touchés.")
  .addFields(
    {
      name: "🔴 Fix critique — Routes cassées (Groupes & Tournois)",
      value: "Les pages Mes Groupes et Mes Tournois du profil envoyaient vers `/groups/...` (route inexistante). Corrigé en `/group/[id]` et `/tournament/[id]`. Stack.Screen manquant pour `tournament/[id]` et `challenge/[id]` — ajoutés.",
      inline: false,
    },
    {
      name: "✅ Bouton SUIVRE dynamique",
      value: "Le bouton dans le feed Explore est maintenant connecté à la BDD. État **SUIVRE / ABONNÉ** en temps réel avec changement visuel instantané. Optimistic update : réponse UI avant même la confirmation serveur. Rollback automatique si erreur.",
      inline: false,
    },
    {
      name: "⚡ Performances générales",
      value: "`React.memo` sur `ExploreFeedItem` et `FeedItem` — plus de rerenders inutiles au scroll. `initialNumToRender=1` sur les FlatLists vidéo. `gcTime` porté à 15 min pour éviter les refetch au retour d'écran.",
      inline: false,
    },
    {
      name: "📱 Android complet",
      value: "`GestureHandlerRootView` ajouté à la racine (fix des gestes dans les modales Android). Keyboard avoidance corrigé dans les BottomSheets : `behavior='height'` sur Android au lieu de `undefined`. Elevation native sur la tab bar.",
      inline: false,
    },
    {
      name: "⚙️ Réglages alignés",
      value: "Section titles alignés avec le bord gauche des Cards (padding uniformisé `SPACING.lg`). Fini les icônes et textes collés à gauche.",
      inline: false,
    },
    {
      name: "🏷️ Branding 100% Dumbeez",
      value: "Toutes les occurrences de *Dumbys* supprimées du code, des commentaires, des assets et des textes UI. L'asset `Dumbys-avatar.png` → `Dumbeez-avatar.png`. L'écran de login affiche maintenant **Dumbeez**.",
      inline: false,
    },
  )
  .setFooter({ text: "Dumbeez · Let's Go !" })
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
