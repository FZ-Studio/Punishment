const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
} = require('discord.js');

module.exports = {
  name: 'automod',
  description: 'Gerencie o sistema de AutoMod do servidor de forma interativa.',
  async execute(message) {
    if (!message.member.permissions.has('Administrator')) {
      const embed = new EmbedBuilder()
        .setDescription('⚠️ Você precisa de permissões de administrador para usar este comando.')
        .setColor('Red');
      return message.reply({ embeds: [embed] });
    }

    const embed = new EmbedBuilder()
      .setTitle('📋 Gerenciamento de AutoMod')
      .setDescription(
        'Clique nos botões abaixo para gerenciar as regras do AutoMod:\n\n' +
          '🔹 **Criar Regra:** Crie uma nova regra.\n' +
          '🔹 **Adicionar Palavras:** Adicione palavras a uma regra existente.\n' +
          '🔹 **Excluir Regra:** Remova uma regra específica.\n' +
          '🔹 **Excluir Palavras:** Remova palavras de uma regra.\n' +
          '🔹 **Ver Regras:** Veja todas as regras configuradas.'
      )
      .setColor('Blue')
      .setFooter({ text: `Solicitado por ${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
      .setTimestamp();

    const buttons = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('create_rule')
        .setLabel('Criar Regra')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId('add_word')
        .setLabel('Adicionar Palavras')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('delete_rule')
        .setLabel('Excluir Regra')
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId('remove_word')
        .setLabel('Excluir Palavras')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('view_rules')
        .setLabel('Ver Regras')
        .setStyle(ButtonStyle.Primary)
    );

    const sentMessage = await message.channel.send({ embeds: [embed], components: [buttons] });

    const collector = sentMessage.createMessageComponentCollector({
      time: 60000,
    });

    collector.on('collect', async (interaction) => {
      if (interaction.user.id !== message.author.id) {
        const embed = new EmbedBuilder()
          .setDescription('⚠️ Apenas quem executou o comando pode interagir com os botões.')
          .setColor('Red');
        return interaction.reply({ embeds: [embed], ephemeral: true });
      }

      // Defer a interação para evitar o erro InteractionNotReplied
      await interaction.deferReply({ ephemeral: true });

      switch (interaction.customId) {
        case 'create_rule':
          await handleCreateRule(interaction);
          break;

        case 'add_word':
          await handleAddWord(interaction);
          break;

        case 'delete_rule':
          await handleDeleteRule(interaction);
          break;

        case 'remove_word':
          await handleRemoveWord(interaction);
          break;

        case 'view_rules':
          await handleViewRules(interaction);
          break;

        default:
          const errorEmbed = new EmbedBuilder()
            .setDescription('❌ Botão inválido.')
            .setColor('Red');
          await interaction.followUp({ embeds: [errorEmbed] });
      }
    });

    collector.on('end', () => {
      sentMessage.edit({ components: [] }).catch(() => null);
    });
  },
};

async function handleCreateRule(interaction) {
  const embed = new EmbedBuilder()
    .setDescription('📝 Digite o nome da nova regra:')
    .setColor('Yellow');
  await interaction.followUp({ embeds: [embed] });

  const filter = (m) => m.author.id === interaction.user.id;
  const collector = interaction.channel.createMessageCollector({ filter, time: 30000, max: 1 });

  collector.on('collect', async (collected) => {
    const ruleName = collected.content.trim();
    if (!ruleName) {
      const errorEmbed = new EmbedBuilder()
        .setDescription('⚠️ O nome da regra não pode ser vazio.')
        .setColor('Red');
      return interaction.followUp({ embeds: [errorEmbed] });
    }

    try {
      await interaction.guild.autoModerationRules.create({
        name: ruleName,
        creatorId: interaction.user.id,
        eventType: 1,
        triggerType: 1,
        triggerMetadata: { keywordFilter: [] },
        actions: [
          {
            type: 1,
            metadata: { channel: interaction.channel.id },
          },
        ],
        enabled: true,
      });

      const successEmbed = new EmbedBuilder()
        .setDescription(`✅ Regra criada com sucesso: **${ruleName}**.`)
        .setColor('Green');
      await interaction.followUp({ embeds: [successEmbed] });
    } catch (error) {
      console.error(error);
      const errorEmbed = new EmbedBuilder()
        .setDescription('❌ Ocorreu um erro ao criar a regra.')
        .setColor('Red');
      await interaction.followUp({ embeds: [errorEmbed] });
    }
  });
}

async function handleAddWord(interaction) {
  const embed = new EmbedBuilder()
    .setDescription('📝 Digite o ID da regra onde deseja adicionar palavras:')
    .setColor('Yellow');
  await interaction.followUp({ embeds: [embed] });

  const filter = (m) => m.author.id === interaction.user.id;
  const collector = interaction.channel.createMessageCollector({ filter, time: 30000, max: 2 });

  let step = 0;
  let ruleId;

  collector.on('collect', async (collected) => {
    if (step === 0) {
      ruleId = collected.content.trim();
      const embed = new EmbedBuilder()
        .setDescription('📝 Agora, digite as palavras que deseja adicionar (separe por vírgulas):')
        .setColor('Yellow');
      await interaction.followUp({ embeds: [embed] });
      step++;
    } else {
      const words = collected.content.split(',').map((word) => word.trim());
      try {
        const rule = await interaction.guild.autoModerationRules.fetch(ruleId);
        if (!rule) {
          const errorEmbed = new EmbedBuilder()
            .setDescription('⚠️ Regra não encontrada.')
            .setColor('Red');
          return interaction.followUp({ embeds: [errorEmbed] });
        }

        const existingWords = rule.triggerMetadata.keywordFilter || [];
        await rule.edit({
          triggerMetadata: {
            keywordFilter: [...existingWords, ...words],
          },
        });

        const successEmbed = new EmbedBuilder()
          .setDescription(`✅ Palavras adicionadas com sucesso à regra **${rule.name}**.`)
          .setColor('Green');
        await interaction.followUp({ embeds: [successEmbed] });
      } catch (error) {
        console.error(error);
        const errorEmbed = new EmbedBuilder()
          .setDescription('❌ Ocorreu um erro ao adicionar palavras.')
          .setColor('Red');
        await interaction.followUp({ embeds: [errorEmbed] });
      }
    }
  });
}

async function handleViewRules(interaction) {
  try {
    const rules = await interaction.guild.autoModerationRules.fetch();

    if (rules.size === 0) {
      const noRulesEmbed = new EmbedBuilder()
        .setDescription('⚠️ Não há regras de AutoMod configuradas no servidor.')
        .setColor('Yellow');
      return interaction.followUp({ embeds: [noRulesEmbed] });
    }

    const embed = new EmbedBuilder()
      .setTitle('📋 Regras de AutoMod Configuradas')
      .setDescription('Aqui estão as regras configuradas no AutoMod:')
      .setColor('Blue');

    rules.forEach((rule) => {
      const keywords = rule.triggerMetadata.keywordFilter.join(', ') || 'Nenhuma';
      embed.addFields(
        { name: `📜 ${rule.name}`, value: `**ID:** \`${rule.id}\`\n**Palavras-Chave:** ${keywords}` }
      );
    });

    await interaction.followUp({ embeds: [embed] });
  } catch (error) {
    console.error(error);
    const errorEmbed = new EmbedBuilder()
      .setDescription('❌ Ocorreu um erro ao listar as regras.')
      .setColor('Red');
    await interaction.followUp({ embeds: [errorEmbed] });
  }
}