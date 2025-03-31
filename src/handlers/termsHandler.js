const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const db = require('../data/database');

async function checkTerms(message) {
  const userId = message.author.id;

  const userAccepted = db.prepare('SELECT * FROM terms WHERE user_id = ?').get(userId);
  if (userAccepted) return true;

  const embed = new EmbedBuilder()
    .setColor('#FE3838')
    .setTitle('Termos de Uso')
    .setDescription(
      'Para usar este bot, você precisa aceitar os Termos de Uso.\n\n' +
      '**Termos:**\n' +
      '1. Você concorda em não abusar das funcionalidades do bot.\n' +
      '2. Você concorda que suas ações podem ser registradas para fins de moderação.\n\n' +
      'Clique no botão abaixo para aceitar os Termos de Uso.'
    )
    .setFooter({ text: 'Punishment', iconURL: message.client.user.displayAvatarURL() });

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('accept_terms')
      .setLabel('Aceitar Termos')
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId('decline_terms')
      .setLabel('Recusar Termos')
      .setStyle(ButtonStyle.Danger)
  );

  await message.reply({ embeds: [embed], components: [row], allowedMentions: { repliedUser: false } });
  return false;
}

module.exports = { checkTerms };