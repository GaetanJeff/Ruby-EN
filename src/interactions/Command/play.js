const { SlashCommandBuilder } = require('discord.js');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus, VoiceConnectionStatus } = require('@discordjs/voice');
const ytdl = require('@distube/ytdl-core');
const yts = require('yt-search');
const SpotifyWebApi = require('spotify-web-api-node');

// Helper function pour obtenir l'ID du shard
function getShardId(client) {
    return client.shard ? client.shard.ids[0] + 1 : 1;
}

// Configuration Spotify (optionnel - pour récupérer les infos des tracks Spotify)
const spotifyApi = new SpotifyWebApi({
    clientId: process.env.SPOTIFY_CLIENT_ID,
    clientSecret: process.env.SPOTIFY_CLIENT_SECRET
});

module.exports = {
    data: new SlashCommandBuilder()
        .setName('play')
        .setDescription('Jouer de la musique depuis YouTube ou Spotify')
        .addStringOption(option =>
            option.setName('song')
                .setDescription('Nom de la chanson, URL YouTube ou URL Spotify')
                .setRequired(true)
        ),

    run: async (client, interaction) => {
        try {
            const shardId = getShardId(client);
            console.log(`[Shard ${shardId}] Commande play exécutée pour: ${interaction.user.tag}`);
            
            const song = interaction.options.getString('song');
            const member = interaction.member;

            // Vérifier si l'utilisateur est dans un canal vocal
            if (!member.voice.channel) {
                console.log(`[Shard ${shardId}] Erreur: L'utilisateur n'est pas dans un canal vocal`);
                return client.errNormal({
                    error: "Vous devez être dans un canal vocal pour utiliser cette commande !",
                    type: 'editreply'
                }, interaction);
            }

            console.log(`[Shard ${shardId}] Utilisateur dans le canal vocal: ${member.voice.channel.name}`);

            // Vérifier les permissions du bot
            if (!member.voice.channel.permissionsFor(interaction.guild.members.me).has(['Connect', 'Speak'])) {
                console.log(`[Shard ${shardId}] Erreur: Permissions insuffisantes`);
                return client.errNormal({
                    error: "Je n'ai pas les permissions pour rejoindre ou parler dans ce canal vocal !",
                    type: 'editreply'
                }, interaction);
            }

            // Déférer la réponse car la recherche peut prendre du temps
            await interaction.deferReply();
            console.log(`[Shard ${shardId}] Recherche de: ${song}`);

            let trackUrl = song;
            let trackTitle = song;

            // Gestion des différents types d'entrée
            if (song.includes('youtube.com/watch') || song.includes('youtu.be/')) {
                // URL YouTube directe
                try {
                    const info = await ytdl.getInfo(song);
                    trackTitle = info.videoDetails.title;
                    console.log(`[Shard ${shardId}] URL YouTube détectée: ${trackTitle}`);
                } catch (error) {
                    return client.errNormal({
                        error: "URL YouTube invalide !",
                        type: 'editreply'
                    }, interaction);
                }
            } else if (song.includes('spotify.com/')) {
                // URL Spotify - supporter tracks, albums et playlists
                console.log(`[Shard ${shardId}] URL Spotify détectée, recherche sur YouTube...`);
                
                try {
                    let searchQuery = '';
                    
                    if (song.includes('/track/')) {
                        // Track individuelle
                        const trackId = song.split('/track/')[1].split('?')[0];
                        
                        if (process.env.SPOTIFY_CLIENT_ID && process.env.SPOTIFY_CLIENT_SECRET) {
                            try {
                                const data = await spotifyApi.clientCredentialsGrant();
                                spotifyApi.setAccessToken(data.body['access_token']);
                                
                                const track = await spotifyApi.getTrack(trackId);
                                const artistName = track.body.artists[0].name;
                                const trackName = track.body.name;
                                searchQuery = `${artistName} ${trackName}`;
                                console.log(`[Shard ${shardId}] Track Spotify trouvée: ${searchQuery}`);
                            } catch (spotifyError) {
                                console.log(`[Shard ${shardId}] Erreur Spotify API pour track`);
                                // Fallback: recherche avec l'URL complète
                                searchQuery = song;
                            }
                        } else {
                            searchQuery = song;
                        }
                    } else if (song.includes('/album/')) {
                        // Album - jouer la première track
                        const albumId = song.split('/album/')[1].split('?')[0];
                        
                        if (process.env.SPOTIFY_CLIENT_ID && process.env.SPOTIFY_CLIENT_SECRET) {
                            try {
                                const data = await spotifyApi.clientCredentialsGrant();
                                spotifyApi.setAccessToken(data.body['access_token']);
                                
                                const album = await spotifyApi.getAlbum(albumId);
                                const firstTrack = album.body.tracks.items[0];
                                const artistName = firstTrack.artists[0].name;
                                const trackName = firstTrack.name;
                                const albumName = album.body.name;
                                searchQuery = `${artistName} ${trackName}`;
                                console.log(`[Shard ${shardId}] Album Spotify: ${albumName} - Première track: ${searchQuery}`);
                            } catch (spotifyError) {
                                console.log(`[Shard ${shardId}] Erreur Spotify API pour album`);
                                // Fallback: essayer de rechercher le nom de l'album
                                searchQuery = song.replace(/.*\/album\//, '').replace(/\?.*/, '');
                            }
                        } else {
                            // Sans API Spotify, essayer une recherche générique
                            searchQuery = song.replace(/.*\/album\//, '').replace(/\?.*/, '');
                        }
                    } else if (song.includes('/playlist/')) {
                        // Playlist Spotify - ajouter toutes les tracks à la queue
                        const playlistId = song.split('/playlist/')[1].split('?')[0];
                        
                        if (process.env.SPOTIFY_CLIENT_ID && process.env.SPOTIFY_CLIENT_SECRET) {
                            try {
                                const data = await spotifyApi.clientCredentialsGrant();
                                spotifyApi.setAccessToken(data.body['access_token']);
                                
                                // Récupérer la playlist
                                const playlist = await spotifyApi.getPlaylist(playlistId);
                                const playlistName = playlist.body.name;
                                const tracks = playlist.body.tracks.items;
                                
                                if (tracks.length === 0) {
                                    return client.errNormal({
                                        error: "Cette playlist Spotify est vide !",
                                        type: 'editreply'
                                    }, interaction);
                                }
                                
                                // Mettre à jour la réponse avec les informations de la playlist
                                await interaction.editReply({
                                    embeds: [{
                                        color: 0x1DB954,
                                        title: '🎵 Chargement de la playlist Spotify',
                                        description: `**${playlistName}**\n${tracks.length} pistes trouvées\n\nRecherche en cours sur YouTube...`,
                                        thumbnail: {
                                            url: playlist.body.images[0]?.url || 'https://via.placeholder.com/300x300?text=Playlist'
                                        }
                                    }]
                                });
                                
                                // Traiter toutes les tracks de la playlist
                                const playlistTracks = [];
                                let successCount = 0;
                                let failCount = 0;
                                
                                for (let i = 0; i < tracks.length; i++) {
                                    const track = tracks[i].track;
                                    if (!track || !track.name) continue;
                                    
                                    try {
                                        const artistName = track.artists[0]?.name || 'Unknown Artist';
                                        const trackName = track.name;
                                        const searchQuery = `${artistName} ${trackName}`;
                                        
                                        // Rechercher chaque track sur YouTube
                                        const searchResults = await yts(searchQuery);
                                        
                                        if (searchResults && searchResults.videos.length > 0) {
                                            const youtubeUrl = searchResults.videos[0].url;
                                            const youtubeTitle = searchResults.videos[0].title;
                                            
                                            // Créer l'objet track
                                            const trackObj = {
                                                title: youtubeTitle,
                                                url: youtubeUrl,
                                                duration: searchResults.videos[0].seconds || 0,
                                                thumbnail: searchResults.videos[0].image,
                                                requestedBy: interaction.user,
                                                addedAt: new Date(),
                                                originalSpotify: `${artistName} - ${trackName}`
                                            };
                                            
                                            playlistTracks.push(trackObj);
                                            successCount++;
                                            
                                            // Mettre à jour le statut toutes les 5 tracks
                                            if (i % 5 === 0 && i > 0) {
                                                await interaction.editReply({
                                                    embeds: [{
                                                        color: 0x1DB954,
                                                        title: '🎵 Chargement de la playlist Spotify',
                                                        description: `**${playlistName}**\n${tracks.length} pistes trouvées\n\nRecherche en cours sur YouTube... (${i}/${tracks.length})`,
                                                        thumbnail: {
                                                            url: playlist.body.images[0]?.url || 'https://via.placeholder.com/300x300?text=Playlist'
                                                        }
                                                    }]
                                                });
                                            }
                                        } else {
                                            failCount++;
                                            console.log(`[Shard ${shardId}] Track non trouvée sur YouTube: ${searchQuery}`);
                                        }
                                        
                                        // Petite pause pour éviter de surcharger l'API YouTube
                                        await new Promise(resolve => setTimeout(resolve, 100));
                                        
                                    } catch (trackError) {
                                        failCount++;
                                        console.error(`[Shard ${shardId}] Erreur pour la track ${i}:`, trackError);
                                    }
                                }
                                
                                if (playlistTracks.length === 0) {
                                    return client.errNormal({
                                        error: "Aucune chanson de cette playlist n'a été trouvée sur YouTube !",
                                        type: 'editreply'
                                    }, interaction);
                                }
                                
                                // Gérer la queue du serveur
                                let serverQueue = client.queue.get(interaction.guild.id);
                                const wasEmpty = !serverQueue || serverQueue.songs.length === 0;
                                
                                if (!serverQueue) {
                                    // Créer une nouvelle queue pour ce serveur
                                    serverQueue = {
                                        textChannel: interaction.channel,
                                        voiceChannel: member.voice.channel,
                                        connection: null,
                                        player: null,
                                        songs: [],
                                        playing: false,
                                        currentSong: null
                                    };
                                    client.queue.set(interaction.guild.id, serverQueue);
                                }
                                
                                // Ajouter toutes les tracks à la queue
                                serverQueue.songs.push(...playlistTracks);
                                
                                // Si la queue était vide, commencer la lecture
                                if (wasEmpty) {
                                    try {
                                        const connection = joinVoiceChannel({
                                            channelId: member.voice.channel.id,
                                            guildId: interaction.guild.id,
                                            adapterCreator: interaction.guild.voiceAdapterCreator,
                                        });

                                        serverQueue.connection = connection;
                                        console.log(`[Shard ${shardId}] Connexion au canal vocal établie pour la playlist`);
                                        
                                        await playMusic(client, interaction.guild, serverQueue.songs[0], shardId);
                                        
                                        return client.succNormal({
                                            text: `🎵 **Playlist ajoutée !**\n**${playlistName}**\n✅ ${successCount} pistes ajoutées${failCount > 0 ? `\n❌ ${failCount} pistes non trouvées` : ''}\n\n🎶 Lecture en cours: **${playlistTracks[0].title}**`,
                                            type: 'editreply'
                                        }, interaction);
                                        
                                    } catch (error) {
                                        console.error(`[Shard ${shardId}] Erreur de connexion pour la playlist:`, error);
                                        client.queue.delete(interaction.guild.id);
                                        return client.errNormal({
                                            error: `Erreur de connexion: ${error.message}`,
                                            type: 'editreply'
                                        }, interaction);
                                    }
                                } else {
                                    // Ajouter à la queue existante
                                    return client.succNormal({
                                        text: `🎵 **Playlist ajoutée à la queue !**\n**${playlistName}**\n✅ ${successCount} pistes ajoutées${failCount > 0 ? `\n❌ ${failCount} pistes non trouvées` : ''}\n\nPosition dans la queue: **${serverQueue.songs.length - playlistTracks.length + 1}** à **${serverQueue.songs.length}**`,
                                        type: 'editreply'
                                    }, interaction);
                                }
                                
                            } catch (spotifyError) {
                                console.log(`[Shard ${shardId}] Erreur Spotify API pour playlist:`, spotifyError);
                                return client.errNormal({
                                    error: "Erreur lors de la récupération de la playlist Spotify ! Vérifiez que la playlist est publique.",
                                    type: 'editreply'
                                }, interaction);
                            }
                        } else {
                            return client.errNormal({
                                error: "Les playlists Spotify nécessitent une configuration API. Contactez un administrateur !",
                                type: 'editreply'
                            }, interaction);
                        }
                    } else {
                        // Autre type de lien Spotify
                        searchQuery = song;
                    }
                    
                    // Rechercher sur YouTube
                    console.log(`[Shard ${shardId}] Recherche YouTube pour: ${searchQuery}`);
                    const searchResults = await yts(searchQuery);
                    if (searchResults && searchResults.videos.length > 0) {
                        trackUrl = searchResults.videos[0].url;
                        trackTitle = searchResults.videos[0].title;
                        console.log(`[Shard ${shardId}] Trouvé sur YouTube: ${trackTitle}`);
                    } else {
                        return client.errNormal({
                            error: "Aucun résultat trouvé sur YouTube pour ce contenu Spotify !",
                            type: 'editreply'
                        }, interaction);
                    }
                    
                } catch (error) {
                    console.error(`[Shard ${shardId}] Erreur lors de la conversion Spotify:`, error);
                    return client.errNormal({
                        error: "Erreur lors de la conversion Spotify ! Essayez avec le nom de la chanson directement.",
                        type: 'editreply'
                    }, interaction);
                }
            } else {
                // Recherche YouTube par nom
                try {
                    console.log(`[Shard ${shardId}] Recherche YouTube pour: ${song}`);
                    const searchResults = await yts(song);
                    if (searchResults && searchResults.videos.length > 0) {
                        trackUrl = searchResults.videos[0].url;
                        trackTitle = searchResults.videos[0].title;
                        console.log(`[Shard ${shardId}] Trouvé: ${trackTitle}`);
                    } else {
                        return client.errNormal({
                            error: "Aucun résultat trouvé !",
                            type: 'editreply'
                        }, interaction);
                    }
                } catch (error) {
                    return client.errNormal({
                        error: "Erreur lors de la recherche !",
                        type: 'editreply'
                    }, interaction);
                }
            }

            try {
                // Vérifier si l'URL YouTube est valide
                if (!ytdl.validateURL(trackUrl)) {
                    return client.errNormal({
                        error: "URL YouTube invalide !",
                        type: 'editreply'
                    }, interaction);
                }

                // Vérifier si la vidéo est disponible
                const info = await ytdl.getInfo(trackUrl);
                if (!info || !info.formats || info.formats.length === 0) {
                    return client.errNormal({
                        error: "Cette vidéo n'est pas disponible !",
                        type: 'editreply'
                    }, interaction);
                }

                // Créer l'objet track
                const track = {
                    title: trackTitle,
                    url: trackUrl,
                    duration: info.videoDetails.lengthSeconds,
                    thumbnail: info.videoDetails.thumbnails[0]?.url,
                    requestedBy: interaction.user,
                    addedAt: new Date()
                };

                // Gérer la queue du serveur
                let serverQueue = client.queue.get(interaction.guild.id);
                
                if (!serverQueue) {
                    // Créer une nouvelle queue pour ce serveur
                    serverQueue = {
                        textChannel: interaction.channel,
                        voiceChannel: member.voice.channel,
                        connection: null,
                        player: null,
                        songs: [],
                        playing: false,
                        currentSong: null
                    };
                    client.queue.set(interaction.guild.id, serverQueue);
                    serverQueue.songs.push(track);

                    // Rejoindre le canal vocal et commencer la lecture
                    try {
                        const connection = joinVoiceChannel({
                            channelId: member.voice.channel.id,
                            guildId: interaction.guild.id,
                            adapterCreator: interaction.guild.voiceAdapterCreator,
                        });

                        serverQueue.connection = connection;
                        console.log(`[Shard ${shardId}] Connexion au canal vocal établie`);
                        
                        await playMusic(client, interaction.guild, serverQueue.songs[0], shardId);
                        
                        return client.succNormal({
                            text: `🎵 **${trackTitle}** a été ajouté à la queue et est en cours de lecture !`,
                            type: 'editreply'
                        }, interaction);
                        
                    } catch (error) {
                        console.error(`[Shard ${shardId}] Erreur de connexion:`, error);
                        client.queue.delete(interaction.guild.id);
                        return client.errNormal({
                            error: `Erreur de connexion: ${error.message}`,
                            type: 'editreply'
                        }, interaction);
                    }
                } else {
                    // Ajouter la chanson à la queue existante
                    serverQueue.songs.push(track);
                    return client.succNormal({
                        text: `🎵 **${trackTitle}** a été ajouté à la queue ! Position: **${serverQueue.songs.length}**`,
                        type: 'editreply'
                    }, interaction);
                }

            } catch (error) {
                console.error(`[Shard ${shardId}] Erreur lors de la recherche/lecture:`, error);
                return client.errNormal({
                    error: `Erreur lors de la lecture: ${error.message}`,
                    type: 'editreply'
                }, interaction);
            }

        } catch (error) {
            const shardId = getShardId(client);
            console.error(`[Shard ${shardId}] Erreur dans la commande play:`, error);
            return client.errNormal({
                error: `Une erreur est survenue: ${error.message}`,
                type: 'editreply'
            }, interaction);
        }
    }
};

// Fonction pour jouer la musique avec queue
global.playMusic = async function playMusic(client, guild, song, shardId) {
    const serverQueue = client.queue.get(guild.id);
    
    if (!song) {
        console.log(`[Shard ${shardId}] Queue vide, déconnexion`);
        if (serverQueue && serverQueue.connection) {
            serverQueue.connection.destroy();
        }
        client.queue.delete(guild.id);
        return;
    }

    try {
        // Créer le player audio
        const player = createAudioPlayer();
        serverQueue.connection.subscribe(player);
        serverQueue.player = player;
        serverQueue.currentSong = song;
        serverQueue.playing = true;

        // Créer la ressource audio depuis YouTube
        console.log(`[Shard ${shardId}] Démarrage de la lecture: ${song.title}`);
        const stream = ytdl(song.url, {
            filter: 'audioonly',
            highWaterMark: 1 << 25,
            quality: 'highestaudio',
            requestOptions: {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                }
            }
        });
        
        const resource = createAudioResource(stream, {
            inputType: 'arbitrary',
            inlineVolume: true
        });

        // Gestion des événements du player
        player.on('error', error => {
            console.error(`[Shard ${shardId}] Erreur du player:`, error);
            if (serverQueue.textChannel) {
                serverQueue.textChannel.send(`❌ Erreur lors de la lecture: ${error.message}`).catch(console.error);
            }
            // Passer à la chanson suivante
            serverQueue.songs.shift();
            global.playMusic(client, guild, serverQueue.songs[0], shardId);
        });

        player.on(AudioPlayerStatus.Playing, () => {
            console.log(`[Shard ${shardId}] Lecture démarrée: ${song.title}`);
        });

        player.on(AudioPlayerStatus.Idle, () => {
            console.log(`[Shard ${shardId}] Lecture terminée: ${song.title}`);
            // Retirer la chanson actuelle et passer à la suivante
            serverQueue.songs.shift();
            global.playMusic(client, guild, serverQueue.songs[0], shardId);
        });

        // Gestion des événements de connexion
        serverQueue.connection.on(VoiceConnectionStatus.Ready, () => {
            console.log(`[Shard ${shardId}] Connexion vocale prête`);
        });

        serverQueue.connection.on(VoiceConnectionStatus.Disconnected, () => {
            console.log(`[Shard ${shardId}] Connexion vocale fermée`);
            client.queue.delete(guild.id);
        });

        // Démarrer la lecture
        player.play(resource);

    } catch (error) {
        console.error(`[Shard ${shardId}] Erreur dans playMusic:`, error);
        serverQueue.songs.shift();
        global.playMusic(client, guild, serverQueue.songs[0], shardId);
    }
};
