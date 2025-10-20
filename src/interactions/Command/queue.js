const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('queue')
        .setDescription('Affiche la file d\'attente musicale'),

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
                    error: 'Il n\'y a aucune musique dans la file d\'attente actuellement.',
                    type: 'editreply'
                }, interaction);
            }

            // Créer l'embed pour afficher la queue
            const embed = new EmbedBuilder()
                .setTitle('🎵 File d\'attente musicale')
                .setColor(client.config.colors.normal)
                .setTimestamp();

            // Chanson en cours
            const current = serverQueue.currentSong || serverQueue.songs[0];
            if (current) {
                embed.addFields({
                    name: '🎶 En cours de lecture',
                    value: `**${current.title}**\nDemandée par: ${current.requestedBy}\nDurée: ${formatDuration(current.duration)}`,
                    inline: false
                });
            }

            // Prochaines chansons (en ignorant la première si elle est en cours)
            const upcoming = serverQueue.songs.slice(serverQueue.currentSong ? 0 : 1);
            if (upcoming.length > 0) {
                let queueList = '';
                const maxToShow = 10; // Limiter à 10 chansons pour éviter un embed trop long
                
                for (let i = 0; i < Math.min(upcoming.length, maxToShow); i++) {
                    const song = upcoming[i];
                    queueList += `**${i + 1}.** ${song.title}\n`;
                    queueList += `*Demandée par: ${song.requestedBy} • ${formatDuration(song.duration)}*\n\n`;
                }

                if (upcoming.length > maxToShow) {
                    queueList += `*... et ${upcoming.length - maxToShow} autres chansons*`;
                }

                embed.addFields({
                    name: `⏭️ Prochaines (${upcoming.length})`,
                    value: queueList || 'Aucune chanson en attente',
                    inline: false
                });
            }

            // Informations supplémentaires
            embed.addFields(
                { name: '🔊 Canal vocal', value: serverQueue.voiceChannel.name, inline: true },
                { name: '👥 Utilisateurs connectés', value: serverQueue.voiceChannel.members.size.toString(), inline: true },
                { name: '📊 Total dans la queue', value: serverQueue.songs.length.toString(), inline: true }
            );

            // Ajouter une thumbnail si disponible
            if (current && current.thumbnail) {
                embed.setThumbnail(current.thumbnail);
            }

            return interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error(`Erreur dans la commande queue:`, error);
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
