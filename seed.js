import { MongoClient, ObjectId } from "mongodb";

const MONGO_URI = "mongodb://localhost:27017";

const ARTISTS = [
  { name: "The Velvet Echo", genre: "Indie", bio: "Indie band from dev seed." },
  { name: "Neon Skyline", genre: "Electronic", bio: "Electronic project from dev seed." },
  { name: "Stone & Fire", genre: "Rock", bio: "Rock trio from dev seed." },
];

async function main() {
  console.log("ðŸš€ Simple seeding started...");

  const client = new MongoClient(MONGO_URI);
  await client.connect();

  const contentDb = client.db("content_db");
  const artistsCol = contentDb.collection("artists");

  for (const artist of ARTISTS) {
    const exists = await artistsCol.findOne({ name: artist.name });
    if (exists) {
      console.log(`â„¹ï¸ Artist already exists: ${artist.name}`);
      continue;
    }

    await artistsCol.insertOne({
      _id: new ObjectId(),
      ...artist,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    console.log(`âœ… Inserted artist: ${artist.name}`);
  }

  console.log("ðŸŽ‰ Seeding done!");
  await client.close();
}

main().catch((err) => {
  console.error("âŒ Seed failed:", err);
  process.exit(1);
});
