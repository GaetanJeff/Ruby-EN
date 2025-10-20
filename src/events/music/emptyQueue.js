module.exports = async (client, queue) => {
    try {
        const channel = queue.metadata.channel;
        if (!channel) return;

        client.embed({
            title: `${client.emotes.normal.music}・File d'attente vide`,
            desc: `La file d'attente est vide. Je quitte le canal vocal dans 5 minutes si aucune musique n'est ajoutée.`,
            type: 'editreply'
        }, queue.metadata);

        // Arrêter la lecture après 5 minutes d'inactivité
        setTimeout(() => {
            if (queue && !queue.playing) {
                queue.destroy();
            }
        }, 300000);
    } catch (error) {
        console.error(`Error in emptyQueue event: ${error}`);
    }
}; 