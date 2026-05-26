import * as path from "path";
import * as dotenv from "dotenv";
dotenv.config({ path: path.join(__dirname, "..", ".env") });
import {
  Client,
  GatewayIntentBits,
  Events,
  Collection,
  REST,
  Routes,
  ActivityType,
  TextChannel,
  EmbedBuilder,
  ButtonInteraction,
} from "discord.js";
import { supabase } from "./lib/supabase";
import { leaderboard } from "./commands/leaderboard";
import { stats } from "./commands/stats";
import { challenges } from "./commands/challenges";
import { invite } from "./commands/invite";
import { about } from "./commands/about";
import { announce } from "./commands/announce";
import { say } from "./commands/say";
import { setupTickets, handleTicketButton, handleCloseTicket } from "./commands/setup-tickets";
import { suggestion } from "./commands/suggestion";
import { ping } from "./commands/ping";
import { profil } from "./commands/profil";
import { topGroupes } from "./commands/top-groupes";
import { daily } from "./commands/daily";
import { rapport } from "./commands/rapport";
import { devlog } from "./commands/devlog";

// ── Client ────────────────────────────────────────────────────────
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
  ],
});

// ── Commands registry ─────────────────────────────────────────────
const commands = new Collection<string, any>();
const commandList = [leaderboard, stats, challenges, invite, about, announce, say, setupTickets, suggestion, ping, profil, topGroupes, daily, rapport, devlog];
for (const cmd of commandList) commands.set(cmd.data.name, cmd);

// ── Ready ─────────────────────────────────────────────────────────
client.once(Events.ClientReady, async (c) => {
  console.log(`🐝 Dumbeez Bot prêt — connecté en tant que ${c.user.tag}`);
  c.user.setActivity("Dumbeez 🐝", { type: ActivityType.Watching });

  const notifChannelId = process.env.DISCORD_NOTIF_CHANNEL_ID;

  // ── Realtime: nouvelles vidéos ───────────────────────────────
  supabase
    .channel("discord-new-videos")
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "videos" },
      async (payload) => {
        if (!notifChannelId) return;
        const channel = c.channels.cache.get(notifChannelId) as TextChannel | undefined;
        if (!channel) return;

        const video = payload.new as any;

        const [{ data: user }, { data: group }] = await Promise.all([
          supabase.from("users").select("username").eq("id", video.submitter_id).single(),
          video.group_id
            ? supabase.from("groups").select("name").eq("id", video.group_id).single()
            : Promise.resolve({ data: null }),
        ]);

        const embed = new EmbedBuilder()
          .setColor(0x3fd0c9)
          .setTitle("🎬 Nouvelle vidéo postée !")
          .setDescription(video.description || video.title || "*Sans description*")
          .addFields(
            { name: "👤 Par", value: user?.username ?? "Inconnu", inline: true },
            ...(group?.name ? [{ name: "👥 Groupe", value: group.name, inline: true }] : [])
          )
          .setFooter({ text: "Dumbeez 🐝 · Let's Go !" })
          .setTimestamp();

        await channel.send({ embeds: [embed] }).catch(console.error);
      }
    )
    .subscribe();

  // ── Realtime: nouveaux tournois ──────────────────────────────
  supabase
    .channel("discord-new-tournaments")
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "group_tournaments" },
      async (payload) => {
        if (!notifChannelId) return;
        const channel = c.channels.cache.get(notifChannelId) as TextChannel | undefined;
        if (!channel) return;

        const t = payload.new as any;
        const { data: group } = await supabase
          .from("groups")
          .select("name")
          .eq("id", t.group_id)
          .single();

        const embed = new EmbedBuilder()
          .setColor(0xff2d7d)
          .setTitle("🏆 Nouveau tournoi lancé !")
          .addFields(
            { name: "🎯 Nom", value: t.title, inline: true },
            { name: "👥 Groupe", value: group?.name ?? "Inconnu", inline: true },
            ...(t.reward ? [{ name: "🎁 Récompense", value: t.reward, inline: false }] : [])
          )
          .setFooter({ text: "Dumbeez 🐝 · Let's Go !" })
          .setTimestamp();

        await channel.send({ embeds: [embed] }).catch(console.error);
      }
    )
    .subscribe();
});

// ── Bienvenue nouveaux membres ────────────────────────────────────
client.on(Events.GuildMemberAdd, async (member) => {
  const welcomeChannelId = process.env.DISCORD_WELCOME_CHANNEL_ID;
  if (!welcomeChannelId) return;

  // Auto-rôle membre
  const memberRoleId = process.env.DISCORD_MEMBER_ROLE_ID;
  if (memberRoleId) {
    const role = member.guild.roles.cache.get(memberRoleId);
    if (role) await member.roles.add(role).catch(console.error);
  }

  const channel = member.guild.channels.cache.get(welcomeChannelId) as TextChannel | undefined;
  if (!channel) return;

  const embed = new EmbedBuilder()
    .setColor(0x3fd0c9)
    .setTitle(`🐝 Bienvenue ${member.user.username} !`)
    .setDescription(
      [
        `Salut **${member.user.username}** ! Bienvenue dans la communauté **Dumbeez** 🔥`,
        "",
        "Relève des défis, poste tes vidéos et grimpe au classement !",
        "",
        "Utilise `/invite` pour obtenir le lien de l'app.",
      ].join("\n")
    )
    .setThumbnail(member.user.displayAvatarURL())
    .setFooter({ text: "Dumbeez 🐝 · Let's Go !" });

  await channel.send({ embeds: [embed] }).catch(console.error);
});

// ── Slash commands & boutons ──────────────────────────────────────
client.on(Events.InteractionCreate, async (interaction) => {
  if (interaction.isButton()) {
    const btn = interaction as ButtonInteraction;
    if (btn.customId === "open_ticket") return handleTicketButton(btn);
    if (btn.customId === "close_ticket") return handleCloseTicket(btn);
    return;
  }

  if (!interaction.isChatInputCommand()) return;

  const command = commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction, supabase);
  } catch (err) {
    console.error(err);
    const msg = { content: "❌ Une erreur est survenue.", ephemeral: true };
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(msg);
    } else {
      await interaction.reply(msg);
    }
  }
});

// ── Register slash commands & login ──────────────────────────────
async function main() {
  const rest = new REST().setToken(process.env.DISCORD_TOKEN!);
  const body = commandList.map((cmd) => cmd.data.toJSON());

  if (process.env.DISCORD_GUILD_ID) {
    await rest.put(
      Routes.applicationGuildCommands(
        process.env.DISCORD_CLIENT_ID!,
        process.env.DISCORD_GUILD_ID
      ),
      { body }
    );
    console.log("✅ Slash commands enregistrées (guild — instantané)");
  } else {
    await rest.put(Routes.applicationCommands(process.env.DISCORD_CLIENT_ID!), { body });
    console.log("✅ Slash commands enregistrées (global — jusqu'à 1h de délai)");
  }

  await client.login(process.env.DISCORD_TOKEN);
}

main().catch(console.error);
