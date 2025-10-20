const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const badgeModel = require('../../database/models/badge');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('list-developers')
        .setDescription('Affiche la liste de tous les développeurs du bot'),

    run: async (client, interaction) => {
        try {
            await interaction.deferReply();

            // Récupérer tous les utilisateurs avec le flag DEVELOPER
            const developers = await badgeModel.find({
                FLAGS: { $in: ["DEVELOPER"] }
            });

            if (developers.length === 0) {
                return client.errNormal({
                    error: "Aucun développeur trouvé dans la base de données !",
                    type: 'editreply'
                }, interaction);
            }

            const embed = new EmbedBuilder()
                .setTitle('👨‍💻 Liste des développeurs du bot')
                .setDescription(`**${developers.length}** développeur(s) trouvé(s)`)
                .setColor('#0099ff')
                .setTimestamp();

            let devList = '';
            let validDevs = 0;

            for (const dev of developers) {
                try {
                    const user = await client.users.fetch(dev.User);
                    devList += `• **${user.tag}** \`${user.id}\`\n`;
                    validDevs++;
                } catch (error) {
                    // Utilisateur introuvable
                    devList += `• **Utilisateur inconnu** \`${dev.User}\` ❌\n`;
                }
            }

            embed.addFields({
                name: `📋 Développeurs (${validDevs}/${developers.length})`,
                value: devList || 'Aucun développeur valide trouvé',
                inline: false
            });

            // Ajouter information sur l'utilisateur actuel
            const currentUserData = await badgeModel.findOne({ User: interaction.user.id });
            const isCurrentUserDev = currentUserData && currentUserData.FLAGS.includes('DEVELOPER');

            embed.addFields({
                name: '👤 Vous',
                value: isCurrentUserDev ? '✅ Vous êtes développeur' : '❌ Vous n\'êtes pas développeur',
                inline: true
            });

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
