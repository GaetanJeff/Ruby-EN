module.exports = async (client, queue, track) => {
    try {
        const channel = queue.metadata.channel;
        if (!channel) return;

        client.embed({
            title: `${client.emotes.normal.music}・En cours de lecture`,
            desc: `[${track.title}](${track.url})`,
            thumbnail: track.thumbnail,
            fields: [
                {
                    name: `👤┆Demandé par`,
                    value: `${track.requestedBy}`,
                    inline: true
                },
                {
                    name: `${client.emotes.normal.clock}┆Durée`,
                    value: `${track.duration}`,
                    inline: true
                },
                {
                    name: `🎬┆Auteur`,
                    value: `${track.author}`,
                    inline: true
                }
            ],
            type: 'editreply'
        }, queue.metadata);
    } catch (error) {
        console.error(`Error in playerStart event: ${error}`);
    }
}; 