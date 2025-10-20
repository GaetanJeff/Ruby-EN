module.exports = async (client, queue, error) => {
    try {
        // Vérifier si la queue et le canal existent
        if (!queue || !queue.metadata || !queue.metadata.channel) {
            console.error(`Erreur de lecture sans canal défini: ${error.message}`);
            return;
        }

        const channel = queue.metadata.channel;

        // Envoyer le message d'erreur
        client.embed({
            title: `${client.emotes.normal.error}・Erreur de lecture`,
            desc: `Une erreur est survenue lors de la lecture: ${error.message}`,
            type: 'editreply'
        }, queue.metadata);

        console.error(`Erreur dans le lecteur de musique: ${error}`);
    } catch (err) {
        console.error(`Erreur dans le gestionnaire d'erreur: ${err}`);
    }
}; 