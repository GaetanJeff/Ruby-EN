const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('now-playing')
        .setDescription('Affiche la chanson en cours de lecture'),

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
                    error: 'Il n\'y a aucune musique en cours de lecture actuellement.',
                    type: 'editreply'
                }, interaction);
            }

            const currentSong = serverQueue.currentSong || serverQueue.songs[0];
            
            // Créer l'embed pour la chanson en cours
            const embed = new EmbedBuilder()
                .setTitle('🎶 En cours de lecture')
                .setDescription(`**${currentSong.title}**`)
                .setColor(client.config.colors.normal)
                .addFields(
                    {
                        name: '🎤 Demandée par',
                        value: currentSong.requestedBy.toString(),
                        inline: true
                    },
                    {
                        name: '⏱️ Durée',
                        value: formatDuration(currentSong.duration),
                        inline: true
                    },
                    {
                        name: '🔊 Canal vocal',
                        value: serverQueue.voiceChannel.name,
                        inline: true
                    }
                )
                .setTimestamp(currentSong.addedAt);

            // Ajouter la thumbnail si disponible
            if (currentSong.thumbnail) {
                embed.setThumbnail(currentSong.thumbnail);
            }

            // Ajouter le statut de lecture
            let statusText = '';
            if (serverQueue.playing) {
                statusText = '▶️ En cours de lecture';
            } else {
                statusText = '⏸️ En pause';
            }

            embed.addFields({
                name: '📊 Statut',
                value: statusText,
                inline: true
            });

            // Ajouter le lien YouTube
            embed.addFields({
                name: '🔗 Lien',
                value: `[Écouter sur YouTube](${currentSong.url})`,
                inline: true
            });

            return interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error(`Erreur dans la commande now-playing:`, error);
            return client.errNormal({
                error: `Une erreur est survenue: ${error.message}`,
                type: 'editreply'
            }, interaction);
        }
    }
};

// Fonction helper pour formater la durée
function formatDuration(seconds) {
    if (!seconds || isNaN(seconds)) return 'N/A';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    
    if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    } else {
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
}
