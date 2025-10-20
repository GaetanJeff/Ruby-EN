// Script pour ajouter un développeur manuellement dans MongoDB
// Remplacez "VOTRE_ID_DISCORD" par votre vrai ID Discord

const { MongoClient } = require('mongodb');

// Remplacez par votre URL MongoDB (dans votre .env)
const MONGODB_URL = process.env.MONGO_TOKEN || "mongodb+srv://gaetanjeff:2607@cluster0.ycn8xnu.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
const DATABASE_NAME = "Test"; // Remplacez par le nom de votre database

async function addDeveloper() {
    const client = new MongoClient(MONGODB_URL);
    
    try {
        await client.connect();
        const db = client.db(DATABASE_NAME);
        const collection = db.collection('badges');
        
        // Remplacez "VOTRE_ID_DISCORD" par votre vrai ID Discord
        const developerId = "273511175151550470";
        
        // Vérifiez si l'utilisateur existe déjà
        const existing = await collection.findOne({ _id: developerId });
        
        if (existing) {
            // Ajoutez le flag DEVELOPER s'il n'existe pas
            if (!existing.FLAGS.includes("DEVELOPER")) {
                await collection.updateOne(
                    { _id: developerId },
                    { $push: { FLAGS: "DEVELOPER" } }
                );
                console.log("✅ Flag DEVELOPER ajouté à l'utilisateur existant");
            } else {
                console.log("❌ L'utilisateur est déjà développeur");
            }
        } else {
            // Créez un nouvel utilisateur avec le flag DEVELOPER
            await collection.insertOne({
                _id: developerId,
                FLAGS: ["DEVELOPER"]
            });
            console.log("✅ Nouvel utilisateur développeur créé");
        }
        
    } catch (error) {
        console.error("❌ Erreur:", error);
    } finally {
        await client.close();
    }
}

addDeveloper();
