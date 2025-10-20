const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const badgeModel = require('../../database/models/badge');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('list-developers')
        .setDescription('Liste tous les développeurs du bot'),

    run: async (client, interaction) => {
        try {
            await interaction.deferReply();

            // Récupérer tous les utilisateurs avec le flag DEVELOPER
            const developers = await badgeModel.find({ FLAGS: { $in: ['DEVELOPER'] } });

            if (developers.length === 0) {
                return client.errNormal({
                    error: "Aucun développeur trouvé dans la base de données !",
                    type: 'editreply'
                }, interaction);
            }

            const embed = new EmbedBuilder()
                .setTitle('👨‍💻 Développeurs du bot')
                .setColor('#0099ff')
                .setTimestamp();

            let description = '';
            let validDevelopers = 0;

            for (const dev of developers) {
                try {
                    const user = await client.users.fetch(dev.User);
                    if (user) {
                        description += `• **${user.tag}** (${user.id})\n`;
                        validDevelopers++;
                    }
                } catch (error) {
                    // Utilisateur introuvable, probablement supprimé
                    description += `• **Utilisateur inconnu** (${dev.User}) - *Compte supprimé*\n`;
                }
            }

            embed.setDescription(description || 'Aucun développeur valide trouvé.');
            embed.addFields({
                name: '📊 Statistiques',
                value: `**Total :** ${developers.length}\n**Valides :** ${validDevelopers}`,
                inline: true
            });

            // Ajouter des informations sur les permissions
            const isAuthorized = developers.some(dev => dev.User === interaction.user.id);
            if (isAuthorized) {
                embed.addFields({
                    name: '✅ Statut',
                    value: 'Vous êtes développeur de ce bot !',
                    inline: true
                });
            } else {
                embed.addFields({
                    name: '❌ Statut',
                    value: 'Vous n\'êtes pas développeur de ce bot.',
                    inline: true
                });
            }

            return interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error('Erreur lors de la récupération des développeurs:', error);
            return client.errNormal({
                error: `Erreur lors de la récupération : ${error.message}`,
                type: 'editreply'
            }, interaction);
        }
    }
};
