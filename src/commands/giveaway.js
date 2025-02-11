const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const db = require('../data/database');

module.exports = {
  name: 'giveaway',
  description: 'Gerencia sorteios no servidor.',
  usage: '${currentPrefix}giveaway start <tempo> <ganhadores> <prêmio>',
  permissions: 'Gerenciar Servidor',

  async execute(message, args) {
    if (!message.member.permissions.has('ManageGuild')) {
      const embedErro = new EmbedBuilder()
        .setColor('#FF4C4C')
        .setAuthor({ name: 'Você não tem permissão para iniciar um sorteio!', iconURL: 'http://bit.ly/4aIyY9j' });

      return message.reply({ embeds: [embedErro] });
    }

    if (args[0] !== 'start') return;

    const timeInput = args[1];
    const winnerCount = parseInt(args[2]);
    const prize = args.slice(3).join(' ');

    if (!timeInput || !winnerCount || !prize) {
      const embedErro = new EmbedBuilder()
        .setColor('#FF4C4C')
        .setAuthor({ name: 'Uso correto: .giveaway start <tempo> <ganhadores> <prêmio>', iconURL: 'http://bit.ly/4aIyY9j' });

      return message.reply({ embeds: [embedErro] });
    }

    const durationMs = convertTimeToMs(timeInput);
    if (!durationMs) {
      return message.reply({ content: 'Formato de tempo inválido! Use `1m`, `1h`, `1d`.' });
    }

    const endTime = Date.now() + durationMs;

    const embed = new EmbedBuilder()
      .setTitle('🎉 Novo Sorteio!')
      .setDescription(`🔹 **Prêmio:** ${prize}\n🎟 **Vencedores:** ${winnerCount}\n⏳ **Termina em:** <t:${Math.floor(endTime / 1000)}:R>`)
      .setColor('#00FF00')
      .setFooter({ text: 'Clique no botão para participar!' });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('participar').setLabel('Participar 🎟').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('ver_participantes').setLabel('👥 Participantes: 0').setStyle(ButtonStyle.Secondary).setDisabled(true)
    );

    const giveawayMessage = await message.channel.send({ embeds: [embed], components: [row] });

    db.prepare(`
      INSERT INTO giveaways (guild_id, channel_id, message_id, prize, duration, winners, end_time, participants)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      message.guild.id,
      message.channel.id,
      giveawayMessage.id,
      prize,
      durationMs,
      winnerCount,
      endTime,
      JSON.stringify([])
    );

    message.delete().catch(() => null);

    setTimeout(() => {
      finalizeGiveaway(giveawayMessage.id, message.guild.id, message.client);
    }, durationMs);
  },
};

function convertTimeToMs(time) {
  const regex = /^(\d+)([smhd])$/;
  const match = time.match(regex);
  if (!match) return null;

  const value = parseInt(match[1]);
  const unit = match[2];

  switch (unit) {
    case 's': return value * 1000;
    case 'm': return value * 60000;
    case 'h': return value * 3600000;
    case 'd': return value * 86400000;
    default: return null;
  }
}

async function finalizeGiveaway(messageId, guildId, client) {
  const giveaway = db.prepare('SELECT * FROM giveaways WHERE message_id = ?').get(messageId);
  if (!giveaway) return;

  let participants = JSON.parse(giveaway.participants);
  let winnerCount = giveaway.winners;

  try {
    const channel = await client.channels.fetch(giveaway.channel_id);
    if (!channel) return;

    const message = await channel.messages.fetch(giveaway.message_id);
    if (!message) return;

    let winners = [];
    if (participants.length > 0) {
      for (let i = 0; i < winnerCount && participants.length > 0; i++) {
        const randomIndex = Math.floor(Math.random() * participants.length);
        winners.push(`<@${participants[randomIndex]}>`);
        participants.splice(randomIndex, 1);
      }
    }

    const embed = new EmbedBuilder()
      .setTitle('🎉 Sorteio Finalizado!')
      .setDescription(
        `🔹 **Prêmio:** ${giveaway.prize}\n` +
        `🎟 **Participantes:** ${giveaway.participants.length}\n` +
        `🏆 **Vencedores:** ${winners.length > 0 ? winners.join(', ') : 'Nenhum vencedor'}`
      )
      .setColor('#FFD700')
      .setFooter({ text: 'Sorteio encerrado!' });

    await message.edit({ embeds: [embed], components: [] });

    if (winners.length > 0) {
      await channel.send(`🎉 Parabéns ${winners.join(', ')}! Vocês ganharam **${giveaway.prize}**!`);
    } else {
      await channel.send('😢 Nenhum vencedor foi escolhido porque ninguém participou.');
    }

    db.prepare('DELETE FROM giveaways WHERE message_id = ?').run(messageId);
  } catch (error) {
    console.error(`[ERROR] Erro ao finalizar o sorteio: ${error}`);
  }
}
