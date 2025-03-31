const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const db = require('../data/database');

async function checkTerms(context) {
  const user = context.author || context.user;

  if (!user) {
    console.warn('INFO: Contexto sem usuário associado no checkTerms.');
    return false;
  }

  const userId = user.id;

  const userAccepted = db.prepare('SELECT * FROM terms WHERE user_id = ?').get(userId);
  if (userAccepted) return true;

  const embed = new EmbedBuilder()
    .setColor('#FE3838')
    .setTitle('Termos de Uso')
    .setDescription(
      'Antes de seguir, precisamos que você aceite nossos Termos de Uso. Leia-os clicando em **Ler Termos** e, se estiver de acordo, clique em **Aceitar Termos** para continuar aproveitando o Punishment!'
    )
    .setFooter({ text: 'Punishment', iconURL: context.client.user.displayAvatarURL() });

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('accept_terms')
      .setLabel('Aceitar Termos')
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setLabel('Ler Termos')
      .setStyle(ButtonStyle.Link)
      .setURL('https://bit.ly/4c9U9lo')
  );

  if (context.reply) {
    await context.reply({ embeds: [embed], components: [row], ephemeral: true });
  } else if (context.channel) {
    await context.channel.send({ embeds: [embed], components: [row] });
  }

  return false;
}

module.exports = { checkTerms };