const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('restore-disabled')
        .setDescription('Restaure les commandes qui étaient temporairement désactivées')
        .addBooleanOption(option =>
            option.setName('dry-run')
                .setDescription('Simuler la restauration sans effectuer les changements')
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

        const dryRun = interaction.options.getBoolean('dry-run') || false;
        const results = {
            found: [],
            restored: [],
            errors: [],
            dependencies: {
                canvacord: false,
                canvas: false,
                imageCommands: []
            }
        };

        // Vérifier les dépendances disponibles
        try {
            require('canvacord');
            results.dependencies.canvacord = true;
        } catch (e) {}

        // Chercher les commandes d'images qui utilisent canvacord
        const imageCommands = [
            'src/commands/images/blur.js',
            'src/commands/images/burn.js', 
            'src/commands/images/colorify.js',
            'src/commands/images/darkness.js',
            'src/commands/images/greyscale.js',
            'src/commands/images/facepalm.js',
            'src/commands/images/bed.js',
            'src/commands/images/clyde.js'
        ];

        for (const commandPath of imageCommands) {
            const fullPath = path.join(process.cwd(), commandPath);
            if (fs.existsSync(fullPath)) {
                try {
                    const content = fs.readFileSync(fullPath, 'utf8');
                    
                    // Vérifier si la commande utilise canvacord
                    if (content.includes('canvacord') || content.includes('Canvas.')) {
                        results.dependencies.imageCommands.push(commandPath);
                        
                        // Vérifier si la commande semble fonctionnelle
                        if (content.includes('module.exports') && 
                            content.includes('run:') && 
                            !content.includes('temporairement désactivée')) {
                            results.found.push({
                                path: commandPath,
                                type: 'image',
                                status: 'functional',
                                needsDep: 'canvacord'
                            });
                        }
                    }
                } catch (error) {
                    results.errors.push({
                        path: commandPath,
                        error: error.message
                    });
                }
            }
        }

        // Chercher le fichier temp_disabled.js
        const tempDisabledPath = path.join(process.cwd(), 'temp_disabled.js');
        if (fs.existsSync(tempDisabledPath)) {
            results.found.push({
                path: 'temp_disabled.js',
                type: 'temp_file', 
                status: 'disabled'
            });
        }

        // Chercher d'autres commandes potentiellement désactivées
        const commandDirs = [
            'src/commands/images',
            'src/commands/levels',
            'src/commands/profile'
        ];

        for (const dir of commandDirs) {
            const fullDir = path.join(process.cwd(), dir);
            if (fs.existsSync(fullDir)) {
                const files = fs.readdirSync(fullDir);
                for (const file of files) {
                    if (file.endsWith('.js')) {
                        const filePath = path.join(fullDir, file);
                        try {
                            const content = fs.readFileSync(filePath, 'utf8');
                            if (content.includes('temporairement désactivée') || 
                                content.includes('temporarily disabled') ||
                                content.includes('compatibility issues')) {
                                results.found.push({
                                    path: path.relative(process.cwd(), filePath),
                                    type: 'disabled_command',
                                    status: 'disabled'
                                });
                            }
                        } catch (error) {
                            results.errors.push({
                                path: path.relative(process.cwd(), filePath),
                                error: error.message
                            });
                        }
                    }
                }
            }
        }

        // Effectuer la restauration si pas en mode dry-run
        if (!dryRun) {
            // Supprimer temp_disabled.js s'il existe
            if (fs.existsSync(tempDisabledPath)) {
                try {
                    fs.unlinkSync(tempDisabledPath);
                    results.restored.push('temp_disabled.js supprimé');
                } catch (error) {
                    results.errors.push({
                        path: 'temp_disabled.js',
                        error: `Erreur lors de la suppression: ${error.message}`
                    });
                }
            }
        }

        // Créer l'embed de résultats
        const embed = new EmbedBuilder()
            .setTitle('🔄 Restauration des commandes désactivées')
            .setColor(results.dependencies.canvacord ? '#00FF00' : '#FFA500')
            .setTimestamp();

        if (dryRun) {
            embed.setDescription('🔍 **Mode simulation** - Aucun changement effectué');
        }

        // Statut des dépendances
        embed.addFields({
            name: '📦 État des dépendances',
            value: `Canvacord: ${results.dependencies.canvacord ? '✅ Installé' : '❌ Manquant'}\nCommandes d'images détectées: **${results.dependencies.imageCommands.length}**`,
            inline: false
        });

        // Commandes trouvées
        if (results.found.length > 0) {
            const foundList = results.found.map(item => {
                const status = item.status === 'functional' ? '✅' : 
                              item.status === 'disabled' ? '❌' : '❓';
                return `${status} \`${item.path}\` (${item.type})`;
            }).join('\n');

            embed.addFields({
                name: '🔍 Commandes analysées',
                value: foundList.length > 1024 ? foundList.substring(0, 1020) + '...' : foundList,
                inline: false
            });
        }

        // Actions effectuées
        if (results.restored.length > 0) {
            embed.addFields({
                name: '✅ Actions effectuées',
                value: results.restored.join('\n'),
                inline: false
            });
        }

        // Erreurs
        if (results.errors.length > 0) {
            const errorList = results.errors.map(err => `❌ \`${err.path}\`: ${err.error}`).join('\n');
            embed.addFields({
                name: '❌ Erreurs rencontrées',
                value: errorList.length > 1024 ? errorList.substring(0, 1020) + '...' : errorList,
                inline: false
            });
        }

        // Recommandations
        const recommendations = [];
        
        if (!results.dependencies.canvacord && results.dependencies.imageCommands.length > 0) {
            recommendations.push('📦 Installer canvacord: `npm install canvacord`');
        }

        if (results.found.some(item => item.status === 'functional') && results.dependencies.canvacord) {
            recommendations.push('✅ Les commandes d\'images sont prêtes à être utilisées !');
        }

        if (dryRun && results.found.length > 0) {
            recommendations.push('🔄 Exécutez sans `dry-run: true` pour effectuer les changements');
        }

        if (recommendations.length > 0) {
            embed.addFields({
                name: '💡 Recommandations',
                value: recommendations.join('\n'),
                inline: false
            });
        }

        // Résumé final
        const summary = [
            `**${results.found.length}** éléments analysés`,
            `**${results.restored.length}** actions effectuées`,
            `**${results.errors.length}** erreurs`
        ].join(' • ');

        embed.addFields({
            name: '📊 Résumé',
            value: summary,
            inline: false
        });

        return interaction.editReply({ embeds: [embed] });
    }
};
