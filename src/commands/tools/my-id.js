const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('my-id')
        .setDescription('Affiche votre ID utilisateur Discord')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('Utilisateur dont afficher l\'ID (optionnel)')
                .setRequired(false)
        ),

    run: async (client, interaction) => {
        const targetUser = interaction.options.getUser('user') || interaction.user;

        const embed = new EmbedBuilder()
            .setTitle('🆔 Informations utilisateur')
            .setDescription(`Voici les informations pour ${targetUser}`)
            .addFields(
                {
                    name: '👤 Nom d\'utilisateur',
                    value: targetUser.tag,
                    inline: true
                },
                {
                    name: '🔢 ID utilisateur',
                    value: `\`${targetUser.id}\``,
                    inline: true
                },
                {
                    name: '📅 Compte créé',
                    value: `<t:${Math.floor(targetUser.createdTimestamp / 1000)}:F>`,
                    inline: false
                }
            )
            .setColor('#0099ff')
            .setThumbnail(targetUser.displayAvatarURL({ size: 256 }))
            .setTimestamp();

        // Vérifier si l'utilisateur est déjà développeur
        try {
            const badgeModel = require('../../database/models/badge');
            const userData = await badgeModel.findOne({ User: targetUser.id });
            
            if (userData && userData.FLAGS.includes('DEVELOPER')) {
                embed.addFields({
                    name: '👨‍💻 Statut',
                    value: '✅ Développeur du bot',
                    inline: true
                });
            } else {
                embed.addFields({
                    name: '👨‍💻 Statut',
                    value: '❌ Pas développeur',
                    inline: true
                });
            }
        } catch (error) {
            // Ignorer les erreurs de base de données
        }

        return interaction.reply({ embeds: [embed] });
    }
};
