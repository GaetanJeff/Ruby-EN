module.exports = async (client, queue) => {
    try {
        const channel = queue.metadata.channel;
        if (!channel) return;

        client.embed({
            title: `${client.emotes.normal.music}・Canal vide`,
            desc: `Je quitte le canal vocal car il est vide.`,
            type: 'editreply'
        }, queue.metadata);

        // Arrêter la lecture après 5 minutes d'inactivité
        setTimeout(() => {
            if (queue && !queue.playing) {
                queue.destroy();
            }
        }, 300000);
    } catch (error) {
        console.error(`Error in emptyChannel event: ${error}`);
    }
}; 