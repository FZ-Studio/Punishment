const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'test',
  description: 'Exibe todos os comandos disponíveis e suas informações.',
  usage: '${currentPrefix}help [comando]',
  permissions: 'Enviar Mensagens',
  execute: async (message, args) => {
    try {
      const commands = message.client.commands;

      // Se um comando específico for solicitado
      if (args[0]) {
        const commandName = args[0].toLowerCase();
        const command = commands.get(commandName);

        if (!command) {
          return message.reply({
            content: `❌ O comando \`${commandName}\` não foi encontrado.`,
            allowedMentions: { repliedUser: false },
          });
        }

        const embed = new EmbedBuilder()
          .setColor('#3498DB')
          .setTitle(`📖 Detalhes do Comando: \`${command.name}\``)
          .addFields(
            { name: 'Descrição', value: command.description || 'Sem descrição disponível.' },
            { name: 'Uso', value: command.usage || 'Sem informações de uso disponíveis.' },
            { name: 'Permissões Necessárias', value: command.permissions || 'Nenhuma' }
          )
          .setFooter({
            text: `Solicitado por ${message.author.tag}`,
            iconURL: message.author.displayAvatarURL({ dynamic: true }),
          })
          .setTimestamp();

        return message.channel.send({ embeds: [embed], allowedMentions: { repliedUser: false } });
      }

      // Agrupa os comandos por categorias
      const categories = {};
      commands.forEach((command) => {
        const category = command.category || 'Outros';
        if (!categories[category]) categories[category] = [];
        categories[category].push(command);
      });

      // Cria o embed principal
      const embed = new EmbedBuilder()
        .setColor('#3498DB')
        .setTitle('📚 Lista de Comandos')
        .setDescription(
          'Use `${currentPrefix}help [comando]` para obter mais detalhes sobre um comando específico.'
        )
        .setFooter({
          text: `Solicitado por ${message.author.tag}`,
          iconURL: message.author.displayAvatarURL({ dynamic: true }),
        })
        .setTimestamp();

      // Adiciona os comandos ao embed, organizados por categoria
      for (const [category, cmds] of Object.entries(categories)) {
        embed.addFields({
          name: `**${category}**`,
          value: cmds.map((cmd) => `\`${cmd.name}\`: ${cmd.description || 'Sem descrição'}`).join('\n'),
        });
      }

      return message.channel.send({ embeds: [embed], allowedMentions: { repliedUser: false } });
    } catch (error) {
      console.error('[ERROR] Falha ao executar o comando help:', error);
      return message.reply({
        content: '❌ Ocorreu um erro ao tentar exibir os comandos.',
        allowedMentions: { repliedUser: false },
      });
    }
  },
};