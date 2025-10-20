const { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('test-commands')
        .setDescription('Teste toutes les commandes du bot pour vérifier leur fonctionnement')
        .addBooleanOption(option =>
            option.setName('detailed')
                .setDescription('Afficher les détails des erreurs pour chaque commande')
                .setRequired(false)
        )
        .addStringOption(option =>
            option.setName('category')
                .setDescription('Tester uniquement une catégorie spécifique')
                .setRequired(false)
                .addChoices(
                    { name: 'Images', value: 'images' },
                    { name: 'Music', value: 'music' },
                    { name: 'Moderation', value: 'moderation' },
                    { name: 'Fun', value: 'fun' },
                    { name: 'Economy', value: 'economy' },
                    { name: 'Games', value: 'games' },
                    { name: 'Profile', value: 'profile' },
                    { name: 'Levels', value: 'levels' },
                    { name: 'All', value: 'all' }
                )
        ),

    run: async (client, interaction) => {
        const detailed = interaction.options.getBoolean('detailed') || false;
        const category = interaction.options.getString('category') || 'all';

        // Vérifier si l'utilisateur est développeur
        const developerId = process.env.DEVELOPER_ID || '1069709263125098498';
        if (interaction.user.id !== developerId) {
            return client.errNormal({
                error: "Cette commande est réservée aux développeurs !",
                type: 'editreply'
            }, interaction);
        }

        await interaction.deferReply();

        const results = {
            total: 0,
            success: 0,
            failed: 0,
            errors: []
        };

        const startTime = Date.now();

        // Obtenir toutes les commandes
        const commands = client.commands;
        
        const embed = new EmbedBuilder()
            .setTitle('🧪 Test des commandes en cours...')
            .setDescription(`Démarrage des tests${category !== 'all' ? ` pour la catégorie: **${category}**` : ''}`)
            .setColor(client.config.colors.normal)
            .setTimestamp();

        await interaction.editReply({ embeds: [embed] });

        // Filtrer les commandes par catégorie si spécifié
        const commandsToTest = Array.from(commands.entries()).filter(([name, command]) => {
            if (category === 'all') return true;
            
            // Déterminer la catégorie basée sur le chemin du fichier ou le nom
            const commandCategories = {
                'images': ['blur', 'burn', 'colorify', 'darkness', 'greyscale', 'facepalm', 'bed', 'clyde'],
                'music': ['play', 'skip', 'stop', 'queue', 'pause', 'resume'],
                'moderation': ['ban', 'kick', 'mute', 'warn', 'timeout'],
                'fun': ['meme', '8ball', 'joke', 'fact'],
                'economy': ['balance', 'daily', 'weekly', 'work', 'shop'],
                'games': ['blackjack', 'roulette', 'slots', 'crash'],
                'profile': ['profile', 'avatar', 'banner'],
                'levels': ['rank', 'leaderboard', 'level']
            };

            const categoryCommands = commandCategories[category] || [];
            return categoryCommands.some(cmd => name.includes(cmd));
        });

        results.total = commandsToTest.length;

        // Tester chaque commande
        for (const [commandName, command] of commandsToTest) {
            try {
                // Vérification de base de la structure de la commande
                if (!command.data || !command.run) {
                    throw new Error('Structure de commande invalide (manque data ou run)');
                }

                // Vérification du nom de la commande
                if (!command.data.name) {
                    throw new Error('Nom de commande manquant');
                }

                // Vérification de la description
                if (!command.data.description) {
                    throw new Error('Description de commande manquante');
                }

                // Vérification que la fonction run est bien une fonction
                if (typeof command.run !== 'function') {
                    throw new Error('La propriété run n\'est pas une fonction');
                }

                // Test de simulation (sans exécuter réellement la commande)
                const mockInteraction = {
                    options: {
                        getString: () => null,
                        getUser: () => interaction.user,
                        getBoolean: () => false,
                        getInteger: () => 1,
                        getChannel: () => interaction.channel,
                        getRole: () => null
                    },
                    user: interaction.user,
                    member: interaction.member,
                    channel: interaction.channel,
                    guild: interaction.guild,
                    reply: () => Promise.resolve(),
                    editReply: () => Promise.resolve(),
                    followUp: () => Promise.resolve(),
                    deferReply: () => Promise.resolve()
                };

                // Vérification des dépendances spécifiques
                if (commandName.includes('image') || ['blur', 'burn', 'colorify', 'darkness', 'greyscale', 'facepalm', 'bed', 'clyde'].some(img => commandName.includes(img))) {
                    try {
                        require('canvacord');
                    } catch (err) {
                        throw new Error('Dépendance canvacord manquante');
                    }
                }

                if (commandName.includes('music') || ['play', 'skip', 'stop', 'queue'].some(music => commandName.includes(music))) {
                    try {
                        require('@distube/ytdl-core');
                        require('yt-search');
                        require('@discordjs/voice');
                    } catch (err) {
                        throw new Error('Dépendances musicales manquantes');
                    }
                }

                results.success++;
                
            } catch (error) {
                results.failed++;
                results.errors.push({
                    command: commandName,
                    error: error.message
                });
            }
        }

        const endTime = Date.now();
        const duration = endTime - startTime;

        // Créer l'embed de résultats
        const resultEmbed = new EmbedBuilder()
            .setTitle('🧪 Résultats des tests de commandes')
            .setColor(results.failed === 0 ? '#00FF00' : results.failed > (results.total / 2) ? '#FF0000' : '#FFA500')
            .addFields(
                { name: '📊 Statistiques', value: `**Total:** ${results.total}\n**✅ Succès:** ${results.success}\n**❌ Échecs:** ${results.failed}\n**⏱️ Durée:** ${duration}ms`, inline: true },
                { name: '📈 Pourcentage de réussite', value: `${((results.success / results.total) * 100).toFixed(1)}%`, inline: true }
            )
            .setTimestamp()
            .setFooter({ text: `Testé par ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() });

        if (category !== 'all') {
            resultEmbed.setDescription(`Catégorie testée: **${category}**`);
        }

        // Ajouter les erreurs si demandé ou s'il y en a peu
        if (detailed || results.errors.length <= 10) {
            if (results.errors.length > 0) {
                const errorList = results.errors
                    .slice(0, 10) // Limiter à 10 erreurs pour éviter les messages trop longs
                    .map((err, index) => `**${index + 1}.** \`${err.command}\`\n${err.error}`)
                    .join('\n\n');

                resultEmbed.addFields({
                    name: '❌ Erreurs détectées',
                    value: errorList.length > 1024 ? errorList.substring(0, 1020) + '...' : errorList,
                    inline: false
                });

                if (results.errors.length > 10) {
                    resultEmbed.addFields({
                        name: '⚠️ Note',
                        value: `Seules les 10 premières erreurs sont affichées. Total: ${results.errors.length}`,
                        inline: false
                    });
                }
            }
        } else if (results.errors.length > 0) {
            resultEmbed.addFields({
                name: '❌ Erreurs',
                value: `${results.errors.length} erreur(s) détectée(s). Utilisez \`detailed: true\` pour voir les détails.`,
                inline: false
            });
        }

        // Créer un rapport détaillé en fichier si beaucoup d'erreurs
        if (results.errors.length > 10 && detailed) {
            const reportContent = [
                `RAPPORT DE TEST DES COMMANDES`,
                `=================================`,
                `Date: ${new Date().toLocaleString()}`,
                `Catégorie: ${category}`,
                `Total testé: ${results.total}`,
                `Succès: ${results.success}`,
                `Échecs: ${results.failed}`,
                `Pourcentage de réussite: ${((results.success / results.total) * 100).toFixed(1)}%`,
                `Durée: ${duration}ms`,
                ``,
                `ERREURS DÉTAILLÉES:`,
                `==================`
            ];

            results.errors.forEach((err, index) => {
                reportContent.push(`${index + 1}. Commande: ${err.command}`);
                reportContent.push(`   Erreur: ${err.error}`);
                reportContent.push('');
            });

            const attachment = new AttachmentBuilder(
                Buffer.from(reportContent.join('\n'), 'utf-8'),
                { name: `command-test-report-${Date.now()}.txt` }
            );

            return interaction.editReply({ 
                embeds: [resultEmbed], 
                files: [attachment] 
            });
        }

        // Ajouter des recommandations
        if (results.failed > 0) {
            const recommendations = [];
            
            if (results.errors.some(err => err.error.includes('canvacord'))) {
                recommendations.push('📦 Installer canvacord: `npm install canvacord`');
            }
            if (results.errors.some(err => err.error.includes('ytdl-core'))) {
                recommendations.push('🎵 Vérifier les dépendances musicales');
            }
            if (results.errors.some(err => err.error.includes('Structure'))) {
                recommendations.push('🔧 Vérifier la structure des commandes');
            }

            if (recommendations.length > 0) {
                resultEmbed.addFields({
                    name: '💡 Recommandations',
                    value: recommendations.join('\n'),
                    inline: false
                });
            }
        }

        return interaction.editReply({ embeds: [resultEmbed] });
    }
};
