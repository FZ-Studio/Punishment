const axios = require('axios');
require('dotenv').config();

const MAX_CHARACTERS = 1500;
const conversationHistory = {};
const TOPIC_TIMEOUT = 10 * 60 * 1000;

module.exports = {
  name: 'ai',
  description: 'Converse com a IA do ChatGPT em um tópico dedicado.',
  async execute(message, args) {
    const userId = message.author.id;
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      console.error('ERRO: A chave da API OpenAI não está configurada no .env!');
      return message.reply('<:no:1122370713932795997> Erro interno: chave da API não configurada.');
    }

    if (!args.length) {
      return message.reply('<:no:1122370713932795997> Você precisa fornecer uma pergunta!');
    }

    const question = args.join(' ');

    if (question.length > MAX_CHARACTERS) {
      return message.reply(`<:no:1122370713932795997> A pergunta é muito longa! Limite de ${MAX_CHARACTERS} caracteres.`);
    }

    try {
      const thread = await message.channel.threads.create({
        name: `Punishment - ${message.author.displayName}`,
        autoArchiveDuration: 60,
        reason: 'Conversa iniciada com a IA',
      });

      if (!thread) {
        return message.reply('<:no:1122370713932795997> Não foi possível criar um tópico. Verifique as permissões do bot.');
      }

      const thinkingMessage = await thread.send(`🤖 **${message.author.displayName} perguntou:**\n> ${question}\n\n⏳ **Aguarde...**`);

      if (!conversationHistory[userId]) {
        conversationHistory[userId] = [];
      }

      conversationHistory[userId].push({ role: 'user', content: question });

      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-3.5-turbo',
          messages: conversationHistory[userId],
        },
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const answer = response.data.choices[0].message.content;
      conversationHistory[userId].push({ role: 'assistant', content: answer });

      if (conversationHistory[userId].length > 10) {
        conversationHistory[userId].shift();
      }

      await thinkingMessage.edit(`\n${answer}`);

      setTimeout(async () => {
        if (thread && !thread.locked) {
          await thread.setLocked(true);
          await thread.send('🔒 **Este tópico foi fechado devido à inatividade.**');
        }
      }, TOPIC_TIMEOUT);

    } catch (error) {
      console.error('Erro ao consultar a OpenAI:', error);
      await message.reply('<:no:1122370713932795997> Não foi possível obter uma resposta no momento.');
    }
  },
};