const { EmbedBuilder } = require('discord.js');
const os = require('os');

module.exports = {
  name: 'stats',
  description: 'Exibe as estatísticas do bot.',
  usage: '.stats',
  permissions: 'Nenhuma',
  execute: async (message) => {
    const uptime = process.uptime();
    const days = Math.floor(uptime / 86400);
    const hours = Math.floor((uptime % 86400) / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    const seconds = Math.floor(uptime % 60);

    const embed = new EmbedBuilder()
      .setColor(0x00aaff)
      .setTitle(`${message.client.user.username} • Estatísticas`)
      .addFields(
        {
          name: '<:1000042770:1335945568136069233> Servidores',
          value: `\`${message.client.guilds.cache.size}\``,
          inline: true,
        },
        {
          name: '<:1000042775:1335945455560818750> Usuários',
          value: `\`${message.client.users.cache.size}\``,
          inline: true,
        },
        {
          name: '<:1000042782:1335948193795412000> Uso de Memória',
          value: `\`${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB\``,
          inline: true,
        },
        {
          name: '<:1000042780:1335947560321421312> Uptime',
          value: `\`${days}d ${hours}h ${minutes}m ${seconds}s\``,
          inline: true,
        },
        {
          name: '⚙️ Plataforma',
          value: `\`${os.platform()}\``,
          inline: true,
        }
      )
      .setFooter({
        text: message.client.user.username,
        iconURL: message.client.user.displayAvatarURL(),
      });

    return message.reply({ embeds: [embed] });
  },
};