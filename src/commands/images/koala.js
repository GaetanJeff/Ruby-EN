const Discord = require('discord.js');
const fetch = require("../../utils/fetch.js");

module.exports = async (client, interaction, args) => {

    fetch(
        `https://some-random-api.ml/img/koala`
    )
        .then((res) => res.json()).catch({})
        .then(async (json) => {
            client.embed({
                title: `🐨・Random Koala`,
                image: json.link,
                type: 'editreply'
            }, interaction)
        }).catch({})
}

 