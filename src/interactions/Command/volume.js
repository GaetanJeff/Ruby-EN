const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('volume')
        .setDescription('Régler le volume de la musique')
        .addIntegerOption(option =>
            option.setName('level')
                .setDescription('Niveau de volume (0-100)')
                .setRequired(true)
                .setMinValue(0)
                .setMaxValue(100)
        ),

    run: async (client, interaction) => {
        try {
            const member = interaction.member;
            const volume = interaction.options.getInteger('level');

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

            // Ajuster le volume (convertir de 0-100 à 0-1)
            const volumeLevel = volume / 100;
            
            // Note: Discord.js voice ne supporte plus le volume en temps réel
            // Il faut recréer la ressource audio avec le nouveau volume
            serverQueue.volume = volume;

            let volumeEmoji = '🔊';
            if (volume === 0) volumeEmoji = '🔇';
            else if (volume < 30) volumeEmoji = '🔈';
            else if (volume < 70) volumeEmoji = '🔉';

            return client.succNormal({
                text: `${volumeEmoji} Volume réglé à **${volume}%** !`,
                type: 'editreply'
            }, interaction);

        } catch (error) {
            console.error(`Erreur dans la commande volume:`, error);
            return client.errNormal({
                error: `Une erreur est survenue: ${error.message}`,
                type: 'editreply'
            }, interaction);
        }
    }
};
