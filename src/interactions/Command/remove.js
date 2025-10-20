const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('remove')
        .setDescription('Supprimer une chanson de la queue')
        .addIntegerOption(option =>
            option.setName('position')
                .setDescription('Position de la chanson à supprimer')
                .setRequired(true)
                .setMinValue(1)
        ),

    run: async (client, interaction) => {
        try {
            const member = interaction.member;
            const position = interaction.options.getInteger('position');

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
                    error: 'Il n\'y a aucune musique dans la file d\'attente actuellement.',
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

            // Vérifier si la position est valide (ne peut pas supprimer la chanson en cours)
            if (position === 1) {
                return client.errNormal({
                    error: 'Vous ne pouvez pas supprimer la chanson en cours de lecture. Utilisez `/skip` à la place.',
                    type: 'editreply'
                }, interaction);
            }

            if (position > serverQueue.songs.length) {
                return client.errNormal({
                    error: `Position invalide ! La queue contient seulement **${serverQueue.songs.length}** chanson(s).`,
                    type: 'editreply'
                }, interaction);
            }

            // Supprimer la chanson (position - 1 car array commence à 0)
            const removedSong = serverQueue.songs.splice(position - 1, 1)[0];

            return client.succNormal({
                text: `🗑️ **${removedSong.title}** a été supprimée de la queue !`,
                type: 'editreply'
            }, interaction);

        } catch (error) {
            console.error(`Erreur dans la commande remove:`, error);
            return client.errNormal({
                error: `Une erreur est survenue: ${error.message}`,
                type: 'editreply'
            }, interaction);
        }
    }
};
