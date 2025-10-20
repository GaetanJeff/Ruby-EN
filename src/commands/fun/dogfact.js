const Discord = require('discord.js');
const fetch = require("../../utils/fetch.js");

module.exports = async (client, interaction, args) => {

    fetch(
        `https://some-random-api.ml/facts/dog`
    )
        .then((res) => res.json()).catch({})
        .then(async (json) => {
            client.embed({
                title: `💡・Random dog fact`,
                desc: json.fact,
                type: 'editreply',
            }, interaction);
        }).catch({})
}

 