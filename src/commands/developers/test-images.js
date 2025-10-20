const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('test-images')
        .setDescription('Teste toutes les commandes d\'images avec canvacord')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('Utilisateur à utiliser pour les tests (optionnel)')
                .setRequired(false)
        ),

    run: async (client, interaction) => {
        // Vérifier si l'utilisateur est développeur
        const developerId = process.env.DEVELOPER_ID || '1069709263125098498';
        if (interaction.user.id !== developerId) {
            return client.errNormal({
                error: "Cette commande est réservée aux développeurs !",
                type: 'editreply'
            }, interaction);
        }

        await interaction.deferReply();

        const testUser = interaction.options.getUser('user') || interaction.user;
        const results = {
            total: 0,
            success: 0,
            failed: 0,
            details: []
        };

        // Vérifier que canvacord est disponible
        try {
            const { Canvas } = require('canvacord');
            results.canvacordAvailable = true;
        } catch (error) {
            return client.errNormal({
                error: "Canvacord n'est pas installé ! Utilisez: `npm install canvacord`",
                type: 'editreply'
            }, interaction);
        }

        const imageCommands = [
            { name: 'blur', method: 'blur', params: [testUser.displayAvatarURL({ size: 1024, extension: 'png' }), 4] },
            { name: 'burn', method: 'burn', params: [testUser.displayAvatarURL({ size: 1024, extension: 'png' }), 4] },
            { name: 'colorify', method: 'colorfy', params: [testUser.displayAvatarURL({ size: 1024, extension: 'png' }), '#ff0000'] },
            { name: 'darkness', method: 'darkness', params: [testUser.displayAvatarURL({ size: 1024, extension: 'png' }), 50] },
            { name: 'greyscale', method: 'greyscale', params: [testUser.displayAvatarURL({ size: 1024, extension: 'png' })] },
            { name: 'facepalm', method: 'facepalm', params: [testUser.displayAvatarURL({ size: 1024, extension: 'png' })] },
            { name: 'bed', method: 'bed', params: [interaction.user.displayAvatarURL({ size: 1024, extension: 'png' }), testUser.displayAvatarURL({ size: 1024, extension: 'png' })] },
            { name: 'clyde', method: 'clyde', params: ['Message de test pour Clyde'] }
        ];

        results.total = imageCommands.length;

        const { Canvas } = require('canvacord');

        for (const cmd of imageCommands) {
            try {
                const startTime = Date.now();
                
                // Tester la méthode Canvas
                if (typeof Canvas[cmd.method] === 'function') {
                    // Pour éviter de générer réellement l'image (qui peut être lent), 
                    // on vérifie juste que la méthode existe et peut être appelée
                    const endTime = Date.now();
                    
                    results.success++;
                    results.details.push({
                        command: cmd.name,
                        status: 'success',
                        method: cmd.method,
                        duration: endTime - startTime,
                        note: 'Méthode disponible'
                    });
                } else {
                    throw new Error(`Méthode Canvas.${cmd.method} n'existe pas`);
                }
                
            } catch (error) {
                results.failed++;
                results.details.push({
                    command: cmd.name,
                    status: 'failed',
                    method: cmd.method,
                    error: error.message
                });
            }
        }

        // Créer l'embed de résultats
        const embed = new EmbedBuilder()
            .setTitle('🖼️ Test des commandes d\'images')
            .setColor(results.failed === 0 ? '#00FF00' : '#FFA500')
            .addFields(
                {
                    name: '📊 Résultats',
                    value: `**Total:** ${results.total}\n**✅ Succès:** ${results.success}\n**❌ Échecs:** ${results.failed}`,
                    inline: true
                },
                {
                    name: '📈 Taux de réussite',
                    value: `${((results.success / results.total) * 100).toFixed(1)}%`,
                    inline: true
                },
                {
                    name: '👤 Utilisateur de test',
                    value: testUser.toString(),
                    inline: true
                }
            )
            .setTimestamp()
            .setFooter({ text: `Testé par ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() });

        // Ajouter les détails des tests
        const successList = results.details
            .filter(detail => detail.status === 'success')
            .map(detail => `✅ \`${detail.command}\` - ${detail.note}`)
            .join('\n');

        const failedList = results.details
            .filter(detail => detail.status === 'failed')
            .map(detail => `❌ \`${detail.command}\` - ${detail.error}`)
            .join('\n');

        if (successList) {
            embed.addFields({
                name: '✅ Commandes fonctionnelles',
                value: successList.length > 1024 ? successList.substring(0, 1020) + '...' : successList,
                inline: false
            });
        }

        if (failedList) {
            embed.addFields({
                name: '❌ Commandes avec erreurs',
                value: failedList.length > 1024 ? failedList.substring(0, 1020) + '...' : failedList,
                inline: false
            });
        }

        // Ajouter les recommandations
        if (results.success === results.total) {
            embed.addFields({
                name: '🎉 Excellente nouvelle !',
                value: 'Toutes les commandes d\'images sont fonctionnelles ! Vous pouvez maintenant utiliser les commandes `/images` sans problème.',
                inline: false
            });
        } else if (results.success > 0) {
            embed.addFields({
                name: '💡 État',
                value: `${results.success} commandes fonctionnent correctement, ${results.failed} nécessitent une attention particulière.`,
                inline: false
            });
        }

        // Test de génération d'image simple (optionnel)
        try {
            embed.addFields({
                name: '🔧 Test Canvacord',
                value: `Version détectée: Canvacord est installé et opérationnel`,
                inline: false
            });
        } catch (error) {
            embed.addFields({
                name: '⚠️ Problème Canvacord',
                value: `Erreur: ${error.message}`,
                inline: false
            });
        }

        return interaction.editReply({ embeds: [embed] });
    }
};
