const Discord = require('discord.js');
const chalk = require('chalk');
const { random } = require('mathjs');

// Helper function pour gérer les shards
function getShardId(client) {
    return client.shard ? client.shard.ids[0] + 1 : 1;
}

function getShardInfo(client) {
    if (client.shard) {
        return `${client.shard.ids[0] + 1}/${client.options.shardCount}`;
    }
    return "1/1";
}

module.exports = async (client) => {
    const startLogs = new Discord.WebhookClient({
        id: client.webhooks.startLogs.id,
        token: client.webhooks.startLogs.token,
    });

    console.log(chalk.blue(chalk.bold(`System`)), (chalk.white(`>>`)), chalk.red(`Shard #${getShardId(client)}`), chalk.green(`is ready!`));

    const embed = new Discord.EmbedBuilder()
        .setTitle('Shard Ready!')
        .setThumbnail(client.user.displayAvatarURL())
        .addFields(
            { name: "🆔┆ID", value: getShardInfo(client), inline: true },
            { name: "🏷️┆Tag", value: `${client.user.tag}`, inline: true },
            { name: "📊┆Guilds", value: `${client.guilds.cache.size}`, inline: true }
        )
        .setTimestamp()
        .setColor(client.config.colors.normal);

    startLogs.send({
        username: 'Shard Logs',
        avatarURL: client.user.displayAvatarURL(),
        embeds: [embed]
    });

    // Initialisation du nouveau système de musique YouTube/Spotify
    console.log(chalk.blue(chalk.bold(`Music`)), (chalk.white(`>>`)), chalk.green(`Nouveau système de musique YouTube/Spotify initialisé`));

    // Chargement des fonctions essentielles uniquement (en sécurité)
    try {
        require('../../handlers/functions/birthdays')(client);
        console.log(chalk.blue(chalk.bold(`System`)), (chalk.white(`>>`)), chalk.green(`Birthday handler loaded`));
    } catch (err) {
        console.log(chalk.yellow(chalk.bold(`System`)), (chalk.white(`>>`)), chalk.yellow(`Birthday handler not found, skipping...`));
    }

    console.log(`\u001b[0m`);
    console.log(chalk.blue(chalk.bold(`System`)), (chalk.white(`>>`)), chalk.green(`Shard`), chalk.red(`#${getShardId(client)}`), chalk.green(`is online and ready!`));

    // Gestion du statut du bot
    setInterval(async function () {
        const promises = [
            client.shard ? client.shard.fetchClientValues('guilds.cache.size') : Promise.resolve([client.guilds.cache.size]),
        ];
        return Promise.all(promises)
            .then(results => {
                const totalGuilds = results[0].reduce((acc, guildCount) => acc + guildCount, 0);
                let statuttext;
                if (process.env.DISCORD_STATUS) {
                    statuttext = process.env.DISCORD_STATUS.split(', ');
                } else {
                    statuttext = [
                        `・❓┆/help`,
                        `・💻┆${totalGuilds} servers`,
                        `・📨┆discord.gg/corwindev`,
                        `・🏷️┆Version ${require(`${process.cwd()}/package.json`).version}`
                    ];
                }
                const randomText = statuttext[Math.floor(Math.random() * statuttext.length)];
                client.user.setPresence({ activities: [{ name: randomText, type: Discord.ActivityType.Playing }], status: 'online' });
            });
    }, 50000);
};
