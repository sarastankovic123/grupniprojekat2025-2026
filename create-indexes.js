// Connect to music_db and create subscription indexes
const conn = new Mongo();
const db = conn.getDB("music_db");

print("Creating artist subscriptions indexes...");

// Artist Subscriptions Indexes
db.artist_subscriptions.createIndex({ userId: 1, createdAt: -1 });
print("✓ Created index: { userId: 1, createdAt: -1 }");

db.artist_subscriptions.createIndex({ userId: 1, artistId: 1 }, { unique: true });
print("✓ Created unique index: { userId: 1, artistId: 1 }");

db.artist_subscriptions.createIndex({ artistId: 1 });
print("✓ Created index: { artistId: 1 }");

print("\nCreating genre subscriptions indexes...");

// Genre Subscriptions Indexes
db.genre_subscriptions.createIndex({ userId: 1, createdAt: -1 });
print("✓ Created index: { userId: 1, createdAt: -1 }");

db.genre_subscriptions.createIndex({ userId: 1, genre: 1 }, { unique: true });
print("✓ Created unique index: { userId: 1, genre: 1 }");

db.genre_subscriptions.createIndex({ genre: 1 });
print("✓ Created index: { genre: 1 }");

print("\n✅ All subscription indexes created successfully!");
