const Discord = require('discord.js');
const fetch = require("../../utils/fetch.js");

module.exports = async (client, interaction, args) => {

    fetch(
        `https://some-random-api.ml/bottoken?id=${interaction.user.id}`
    )
        .then((res) => res.json()).catch({})
        .then(async (json) => {

            client.embed({
                title: `🤖・Bot token`,
                desc: json.token,
                type: 'editreply',
            }, interaction);
        }).catch({})

}

 