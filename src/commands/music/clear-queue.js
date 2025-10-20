const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('clear-queue')
        .setDescription('Vide la file d\'attente musicale'),

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

            // Récupérer la queue du serveur
            const serverQueue = client.queue.get(interaction.guild.id);
            
            if (!serverQueue || !serverQueue.songs || serverQueue.songs.length === 0) {
                return client.errNormal({
                    error: 'Il n\'y a aucune musique dans la file d\'attente actuellement.',
                    type: 'reply'
                }, interaction);
            }

            // Vérifier si l'utilisateur est dans le même canal vocal que le bot
            if (member.voice.channel.id !== serverQueue.voiceChannel.id) {
                return client.errNormal({
                    error: 'Vous devez être dans le même canal vocal que le bot.',
                    type: 'reply'
                }, interaction);
            }

            // Garder seulement la chanson en cours (première de la liste)
            const currentSong = serverQueue.songs[0];
            const clearedCount = serverQueue.songs.length - 1;
            
            serverQueue.songs = [currentSong];

            return client.succNormal({
                text: `🗑️ **${clearedCount}** chanson(s) ont été supprimées de la file d'attente !`,
                type: 'reply'
            }, interaction);

        } catch (error) {
            console.error(`Erreur dans la commande clear-queue:`, error);
            return client.errNormal({
                error: `Une erreur est survenue: ${error.message}`,
                type: 'reply'
            }, interaction);
        }
    }
};
