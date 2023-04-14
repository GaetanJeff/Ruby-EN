const Discord = require('discord.js');

const webhookClient = new Discord.WebhookClient({
    id: "1093231530178007100",
    token: "_qfvsTPKbdj_MFls4VYVML45_ljhPpHYniqn7szTPSNl3eGdS7RhXjqkmC60mF9HnIZ-",
});

module.exports = async (client, interaction, args) => {
    const feedback = interaction.options.getString('feedback');

    const embed = new Discord.EmbedBuilder()
        .setTitle(`📝・New feedback!`)
        .addFields(
            { name: "User", value: `${interaction.user} (${interaction.user.tag})`, inline: true },
        )
        .setDescription(`${feedback}`)
        .setColor(client.config.colors.normal)
    webhookClient.send({
        username: 'Bot Feedback',
        embeds: [embed],
    });

    client.succNormal({ 
        text: `Feedback successfully sent to the developers`,
        type: 'editreply'
    }, interaction);
}

 