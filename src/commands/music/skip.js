const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    structure: new SlashCommandBuilder()
        .setName('skip')
        .setDescription('Passe à la musique suivante ou arrête si c\'est la dernière'),

    options: {
        cooldown: 3,
        isEphemeral: false,
    },

    run: async (client, interaction) => {
        try {
            const member = interaction.member;

            // Vérifier si l'utilisateur est dans un canal vocal
            if (!member.voice.channel) {
                return client.errNormal({
                    error: 'Vous devez être dans un canal vocal pour utiliser cette commande.',
                    type: 'reply'
                }, interaction);
            }

            // Vérifier si le bot est dans un canal vocal
            const botVoiceChannel = interaction.guild.members.me.voice.channel;
            if (!botVoiceChannel) {
                return client.errNormal({
                    error: 'Je ne joue aucune musique actuellement.',
                    type: 'reply'
                }, interaction);
            }

            // Vérifier si l'utilisateur est dans le même canal vocal que le bot
            if (member.voice.channel.id !== botVoiceChannel.id) {
                return client.errNormal({
                    error: 'Vous devez être dans le même canal vocal que moi.',
                    type: 'reply'
                }, interaction);
            }

            // Arrêter la musique actuelle (dans notre système simple, cela équivaut à skip)
            if (interaction.guild.members.me.voice.connection) {
                interaction.guild.members.me.voice.connection.destroy();
            }

            return client.succNormal({
                text: '⏭️ Musique passée !',
                type: 'reply'
            }, interaction);

        } catch (error) {
            console.error(`Erreur dans la commande skip:`, error);
            return client.errNormal({
                error: `Une erreur est survenue: ${error.message}`,
                type: 'reply'
            }, interaction);
        }
    }
};
