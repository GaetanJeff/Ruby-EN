const { SlashCommandBuilder } = require('discord.js');
const { AudioPlayerStatus } = require('@discordjs/voice');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('pause')
        .setDescription('Mettre en pause ou reprendre la musique'),

    run: async (client, interaction) => {
        try {
            const member = interaction.member;

            // Vérifier si l'utilisateur est dans un canal vocal
            if (!member.voice.channel) {
                return client.errNormal({
                    error: 'Vous devez être dans un canal vocal pour utiliser cette commande.',
                    type: 'editreply'
                }, interaction);
            }

            await interaction.deferReply();

            // Récupérer la queue du serveur
            const serverQueue = client.queue.get(interaction.guild.id);
            
            if (!serverQueue || !serverQueue.player) {
                return client.errNormal({
                    error: 'Il n\'y a aucune musique en cours de lecture.',
                    type: 'editreply'
                }, interaction);
            }

            // Vérifier si l'utilisateur est dans le même canal vocal que le bot
            if (member.voice.channel.id !== serverQueue.voiceChannel.id) {
                return client.errNormal({
                    error: 'Vous devez être dans le même canal vocal que le bot.',
                    type: 'editreply'
                }, interaction);
            }

            const currentSong = serverQueue.currentSong || serverQueue.songs[0];
            
            if (serverQueue.player.state.status === AudioPlayerStatus.Playing) {
                // Mettre en pause
                serverQueue.player.pause();
                serverQueue.playing = false;
                
                return client.succNormal({
                    text: `⏸️ **${currentSong.title}** mis en pause !`,
                    type: 'editreply'
                }, interaction);
            } else if (serverQueue.player.state.status === AudioPlayerStatus.Paused) {
                // Reprendre
                serverQueue.player.unpause();
                serverQueue.playing = true;
                
                return client.succNormal({
                    text: `▶️ **${currentSong.title}** reprend !`,
                    type: 'editreply'
                }, interaction);
            } else {
                return client.errNormal({
                    error: 'Aucune musique n\'est en cours de lecture.',
                    type: 'editreply'
                }, interaction);
            }

        } catch (error) {
            console.error(`Erreur dans la commande pause:`, error);
            return client.errNormal({
                error: `Une erreur est survenue: ${error.message}`,
                type: 'editreply'
            }, interaction);
        }
    }
};
