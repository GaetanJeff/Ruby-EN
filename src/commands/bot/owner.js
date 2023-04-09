const Discord = require('discord.js');

module.exports = async (client, interaction, args) => {
    client.embed({
        title: `📘・Owner information`,
        desc: `____________________________`,
        thumbnail: client.user.avatarURL({ dynamic: true, size: 1024 }),
        fields: [{
            name: "👑┆Owner name",
            value: `GaetanJeff`,
            inline: true,
        },
        {
            name: "🏷┆Discord tag",
            value: `</GaetanJeff>#7228`,
            inline: true,
        },
        {
            name: "🏢┆Organization",
            value: `Ruby`,
            inline: true,
        },
        {
            name: "🌐┆Website",
            value: `[https://gaetanjeff.tk](https://gaetanjeff.tk)`,
            inline: true,
        }],
        type: 'editreply'
    }, interaction)
}

 