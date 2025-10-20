const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('shuffle')
        .setDescription('Mélanger l\'ordre des chansons dans la queue'),

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
            
            if (!serverQueue || !serverQueue.songs || serverQueue.songs.length <= 2) {
                return client.errNormal({
                    error: 'Il faut au moins 3 chansons dans la queue pour la mélanger.',
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

            // Garder la première chanson (en cours) et mélanger le reste
            const currentSong = serverQueue.songs[0];
            const remainingSongs = serverQueue.songs.slice(1);
            
            // Algorithme de Fisher-Yates pour mélanger
            for (let i = remainingSongs.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [remainingSongs[i], remainingSongs[j]] = [remainingSongs[j], remainingSongs[i]];
            }

            // Reconstruire la queue avec la chanson actuelle en premier
            serverQueue.songs = [currentSong, ...remainingSongs];

            return client.succNormal({
                text: `🔀 Queue mélangée ! **${remainingSongs.length}** chansons ont été mélangées.`,
                type: 'editreply'
            }, interaction);

        } catch (error) {
            console.error(`Erreur dans la commande shuffle:`, error);
            return client.errNormal({
                error: `Une erreur est survenue: ${error.message}`,
                type: 'editreply'
            }, interaction);
        }
    }
};
