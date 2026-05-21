import {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  ButtonInteraction,
  ChannelType,
  OverwriteType,
} from "discord.js";

export const setupTickets = {
  data: new SlashCommandBuilder()
    .setName("setup-tickets")
    .setDescription("[ADMIN] Initialise le système de tickets dans ce channel")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction: ChatInputCommandInteraction) {
    const embed = new EmbedBuilder()
      .setColor(0x3fd0c9)
      .setTitle("🎫 Support Dumbeez")
      .setDescription(
        [
          "Tu as une question, un bug ou besoin d'aide ?",
          "",
          "Clique sur le bouton ci-dessous pour ouvrir un ticket privé avec l'équipe.",
          "",
          "🔒 Ton ticket sera visible uniquement par toi et le staff.",
        ].join("\n")
      )
      .setFooter({ text: "Dumbeez 🐝 · Let's Go !" });

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId("open_ticket")
        .setLabel("Ouvrir un ticket")
        .setStyle(ButtonStyle.Primary)
        .setEmoji("🎫")
    );

    await interaction.reply({ embeds: [embed], components: [row] });
  },
};

export async function handleTicketButton(interaction: ButtonInteraction) {
  if (interaction.customId !== "open_ticket") return;

  await interaction.deferReply({ ephemeral: true });

  const guild = interaction.guild!;
  const user = interaction.user;

  const existing = guild.channels.cache.find(
    (c) => c.name === `ticket-${user.username.toLowerCase()}`
  );
  if (existing) {
    return interaction.editReply(`❌ Tu as déjà un ticket ouvert : <#${existing.id}>`);
  }

  const staffRoleId = process.env.DISCORD_STAFF_ROLE_ID;

  const channel = await guild.channels.create({
    name: `ticket-${user.username.toLowerCase()}`,
    type: ChannelType.GuildText,
    permissionOverwrites: [
      { id: guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel], type: OverwriteType.Role },
      { id: user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages], type: OverwriteType.Member },
      ...(staffRoleId
        ? [{ id: staffRoleId, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages], type: OverwriteType.Role as typeof OverwriteType.Role }]
        : []),
    ],
  });

  const closeRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId("close_ticket")
      .setLabel("Fermer le ticket")
      .setStyle(ButtonStyle.Danger)
      .setEmoji("🔒")
  );

  const ticketEmbed = new EmbedBuilder()
    .setColor(0x3fd0c9)
    .setTitle(`🎫 Ticket de ${user.username}`)
    .setDescription(
      "Décris ton problème ou ta question, le staff te répondra dès que possible.\n\nClique sur **Fermer** quand ton problème est résolu."
    )
    .setFooter({ text: "Dumbeez 🐝 · Support" })
    .setTimestamp();

  await channel.send({ content: `<@${user.id}>`, embeds: [ticketEmbed], components: [closeRow] });
  await interaction.editReply(`✅ Ton ticket a été créé : <#${channel.id}>`);
}

export async function handleCloseTicket(interaction: ButtonInteraction) {
  if (interaction.customId !== "close_ticket") return;
  if (!interaction.channel) return;

  await interaction.reply({ content: "🔒 Fermeture du ticket dans 5 secondes...", ephemeral: false });
  setTimeout(() => interaction.channel?.delete().catch(console.error), 5000);
}
