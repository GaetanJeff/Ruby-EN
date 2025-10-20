const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('skip')
        .setDescription('Passer à la chanson suivante'),

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
            
            if (!serverQueue || !serverQueue.songs || serverQueue.songs.length === 0) {
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

            // Arrêter le player actuel (cela déclenchera l'événement idle et passera à la suivante)
            if (serverQueue.player) {
                serverQueue.player.stop();
            }

            return client.succNormal({
                text: `⏭️ **${currentSong.title}** a été passée !`,
                type: 'editreply'
            }, interaction);

        } catch (error) {
            console.error(`Erreur dans la commande skip:`, error);
            return client.errNormal({
                error: `Une erreur est survenue: ${error.message}`,
                type: 'editreply'
            }, interaction);
        }
    }
};
