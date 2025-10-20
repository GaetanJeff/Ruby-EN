const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('health-check')
        .setDescription('Vérification rapide de la santé du bot et de ses dépendances')
        .addBooleanOption(option =>
            option.setName('full')
                .setDescription('Effectuer une vérification complète incluant les fichiers')
                .setRequired(false)
        ),

    run: async (client, interaction) => {
        await interaction.deferReply();

        const full = interaction.options.getBoolean('full') || false;
        const results = {
            dependencies: { working: [], missing: [], errors: [] },
            commands: { total: 0, working: 0, broken: 0 },
            system: { bot: true, database: true, voice: true }
        };

        const startTime = Date.now();

        // Test des dépendances critiques
        const criticalDeps = [
            { name: 'discord.js', module: 'discord.js' },
            { name: '@discordjs/voice', module: '@discordjs/voice' },
            { name: '@distube/ytdl-core', module: '@distube/ytdl-core' },
            { name: 'yt-search', module: 'yt-search' },
            { name: 'mongoose', module: 'mongoose' },
            { name: 'canvacord', module: 'canvacord' },
            { name: 'opusscript', module: 'opusscript' },
            { name: 'spotify-web-api-node', module: 'spotify-web-api-node' }
        ];

        for (const dep of criticalDeps) {
            try {
                require(dep.module);
                results.dependencies.working.push(dep.name);
            } catch (error) {
                results.dependencies.missing.push(dep.name);
                results.dependencies.errors.push(`${dep.name}: ${error.message}`);
            }
        }

        // Test des commandes
        results.commands.total = client.commands.size;
        
        for (const [name, command] of client.commands) {
            try {
                // Vérifications de base
                if (!command.data || !command.run || typeof command.run !== 'function') {
                    throw new Error('Structure invalide');
                }
                results.commands.working++;
            } catch (error) {
                results.commands.broken++;
            }
        }

        // Test du système
        try {
            // Test de la base de données
            if (client.readyAt) {
                results.system.bot = true;
            }
            
            // Test de la connexion MongoDB (si disponible)
            const mongoose = require('mongoose');
            results.system.database = mongoose.connection.readyState === 1;
            
        } catch (error) {
            results.system.bot = false;
        }

        // Vérification des fichiers si demandé
        let fileCheck = null;
        if (full) {
            fileCheck = {
                commands: 0,
                events: 0,
                handlers: 0,
                missing: []
            };

            const checkPaths = [
                'src/commands',
                'src/events', 
                'src/handlers',
                'src/config',
                'src/database'
            ];

            for (const checkPath of checkPaths) {
                const fullPath = path.join(process.cwd(), checkPath);
                if (fs.existsSync(fullPath)) {
                    const files = fs.readdirSync(fullPath, { recursive: true });
                    const jsFiles = files.filter(file => file.endsWith('.js'));
                    
                    if (checkPath.includes('commands')) fileCheck.commands += jsFiles.length;
                    else if (checkPath.includes('events')) fileCheck.events += jsFiles.length;
                    else if (checkPath.includes('handlers')) fileCheck.handlers += jsFiles.length;
                } else {
                    fileCheck.missing.push(checkPath);
                }
            }
        }

        const endTime = Date.now();
        const duration = endTime - startTime;

        // Déterminer le statut global
        const isHealthy = results.dependencies.missing.length === 0 && 
                         results.commands.broken === 0 && 
                         results.system.bot && 
                         results.system.database;

        const embed = new EmbedBuilder()
            .setTitle('🏥 Health Check du Bot')
            .setColor(isHealthy ? '#00FF00' : results.dependencies.missing.length > 0 ? '#FF0000' : '#FFA500')
            .addFields(
                {
                    name: '📦 Dépendances',
                    value: `✅ **${results.dependencies.working.length}** fonctionnelles\n❌ **${results.dependencies.missing.length}** manquantes`,
                    inline: true
                },
                {
                    name: '🤖 Commandes',
                    value: `✅ **${results.commands.working}** fonctionnelles\n❌ **${results.commands.broken}** cassées\n📊 **${results.commands.total}** total`,
                    inline: true
                },
                {
                    name: '⚙️ Système',
                    value: `Bot: ${results.system.bot ? '✅' : '❌'}\nBDD: ${results.system.database ? '✅' : '❌'}\nVoix: ${results.dependencies.working.includes('opusscript') ? '✅' : '❌'}`,
                    inline: true
                }
            )
            .setFooter({ text: `Vérification terminée en ${duration}ms` })
            .setTimestamp();

        // Ajouter les détails des dépendances manquantes
        if (results.dependencies.missing.length > 0) {
            embed.addFields({
                name: '❌ Dépendances manquantes',
                value: results.dependencies.missing.map(dep => `• ${dep}`).join('\n'),
                inline: false
            });

            const installCmd = `npm install ${results.dependencies.missing.join(' ')}`;
            embed.addFields({
                name: '💡 Solution',
                value: `\`\`\`bash\n${installCmd}\`\`\``,
                inline: false
            });
        }

        // Ajouter les détails des fichiers si demandé
        if (full && fileCheck) {
            embed.addFields({
                name: '📁 Structure des fichiers',
                value: `Commandes: **${fileCheck.commands}** fichiers\nÉvénements: **${fileCheck.events}** fichiers\nHandlers: **${fileCheck.handlers}** fichiers`,
                inline: false
            });

            if (fileCheck.missing.length > 0) {
                embed.addFields({
                    name: '❌ Dossiers manquants',
                    value: fileCheck.missing.map(dir => `• ${dir}`).join('\n'),
                    inline: false
                });
            }
        }

        // Statut global
        embed.setDescription(isHealthy ? 
            '🟢 **Le bot est en parfaite santé !**' : 
            '🟡 **Le bot a quelques problèmes qui nécessitent votre attention.**'
        );

        return interaction.editReply({ embeds: [embed] });
    }
};
