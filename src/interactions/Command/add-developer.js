const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const badgeModel = require('../../database/models/badge');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('add-developer')
        .setDescription('Ajoute un utilisateur comme développeur du bot')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('Utilisateur à ajouter comme développeur')
                .setRequired(true)
        ),

    run: async (client, interaction) => {
        try {
            // Liste des IDs autorisés à utiliser cette commande (propriétaire du bot)
            const authorizedIds = [
                '273511175151550470', // ID existant
                process.env.OWNER_ID,   // Si défini dans .env
                // Ajoutez d'autres IDs autorisés ici si nécessaire
            ].filter(Boolean);

            if (!authorizedIds.includes(interaction.user.id)) {
                return client.errNormal({
                    error: "Seul le propriétaire du bot peut ajouter des développeurs !",
                    type: 'editreply'
                }, interaction);
            }

            await interaction.deferReply();

            const targetUser = interaction.options.getUser('user');

            // Vérifier si l'utilisateur existe déjà dans la base de données
            let userData = await badgeModel.findOne({ User: targetUser.id });

            if (userData) {
                // L'utilisateur existe, vérifier s'il a déjà le flag DEVELOPER
                if (userData.FLAGS.includes('DEVELOPER')) {
                    return client.errNormal({
                        error: `${targetUser.tag} est déjà développeur !`,
                        type: 'editreply'
                    }, interaction);
                }

                // Ajouter le flag DEVELOPER
                userData.FLAGS.push('DEVELOPER');
                await userData.save();
            } else {
                // Créer un nouvel utilisateur avec le flag DEVELOPER
                userData = new badgeModel({
                    User: targetUser.id,
                    FLAGS: ['DEVELOPER']
                });
                await userData.save();
            }

            const embed = new EmbedBuilder()
                .setTitle('✅ Développeur ajouté avec succès !')
                .setDescription(`${targetUser} a été ajouté comme développeur du bot.`)
                .addFields(
                    {
                        name: '👤 Utilisateur',
                        value: `${targetUser.tag} (${targetUser.id})`,
                        inline: true
                    },
                    {
                        name: '🏷️ Flags actuels',
                        value: userData.FLAGS.join(', ') || 'Aucun',
                        inline: true
                    }
                )
                .setColor('#00FF00')
                .setTimestamp()
                .setFooter({ text: `Ajouté par ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() });

            return interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error('Erreur lors de l\'ajout du développeur:', error);
            return client.errNormal({
                error: `Erreur lors de l'ajout : ${error.message}`,
                type: 'editreply'
            }, interaction);
        }
    }
};
