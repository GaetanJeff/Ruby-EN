const { SlashCommandBuilder } = require('discord.js');
const { REST } = require('discord.js');
const { Routes } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('force-sync')
        .setDescription('Force la synchronisation des commandes slash'),

    run: async (client, interaction) => {
        await interaction.deferReply({ ephemeral: true });

        try {
            const rest = new REST({ version: '9' }).setToken(process.env.DISCORD_TOKEN);
            
            // Récupérer toutes les commandes
            const commands = [];
            client.commands.forEach(command => {
                if (command.data) {
                    commands.push(command.data);
                }
            });

            // Forcer la mise à jour
            await rest.put(
                Routes.applicationCommands(client.config.discord.id),
                { body: commands },
            );

            return interaction.editReply({
                content: `✅ **${commands.length} commandes** ont été forcées à se synchroniser avec Discord.\n\nEssayez maintenant les commandes :\n• \`/my-id\`\n• \`/add-developer\`\n• \`/list-developers\`\n\n⏰ Si elles n'apparaissent pas immédiatement, attendez 1-2 minutes.`
            });

        } catch (error) {
            console.error('Erreur lors de la synchronisation forcée:', error);
            return interaction.editReply({
                content: `❌ Erreur lors de la synchronisation : ${error.message}`
            });
        }
    }
};
