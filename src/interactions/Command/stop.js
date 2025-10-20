const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('stop')
        .setDescription('Arrêter la musique et vider la queue'),

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
            
            if (!serverQueue) {
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

            // Arrêter le player et détruire la connexion
            if (serverQueue.player) {
                serverQueue.player.stop(true);
            }
            
            if (serverQueue.connection) {
                serverQueue.connection.destroy();
            }

            // Supprimer la queue
            client.queue.delete(interaction.guild.id);

            return client.succNormal({
                text: `⏹️ Musique arrêtée et queue vidée ! Au revoir 👋`,
                type: 'editreply'
            }, interaction);

        } catch (error) {
            console.error(`Erreur dans la commande stop:`, error);
            return client.errNormal({
                error: `Une erreur est survenue: ${error.message}`,
                type: 'editreply'
            }, interaction);
        }
    }
};
