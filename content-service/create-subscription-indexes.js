// MongoDB index creation script for subscription collections
// Run with: mongosh music_db create-subscription-indexes.js

// Artist Subscriptions Indexes
print("Creating artist subscriptions indexes...");

// Index for querying user's subscriptions sorted by date
db.artist_subscriptions.createIndex({ userId: 1, createdAt: -1 });
print("✓ Created index: { userId: 1, createdAt: -1 }");

// Unique compound index to prevent duplicate subscriptions
db.artist_subscriptions.createIndex({ userId: 1, artistId: 1 }, { unique: true });
print("✓ Created unique index: { userId: 1, artistId: 1 }");

// Index for finding all subscribers of an artist (for notifications)
db.artist_subscriptions.createIndex({ artistId: 1 });
print("✓ Created index: { artistId: 1 }");

// Genre Subscriptions Indexes
print("\nCreating genre subscriptions indexes...");

// Index for querying user's genre subscriptions sorted by date
db.genre_subscriptions.createIndex({ userId: 1, createdAt: -1 });
print("✓ Created index: { userId: 1, createdAt: -1 }");

// Unique compound index to prevent duplicate genre subscriptions
db.genre_subscriptions.createIndex({ userId: 1, genre: 1 }, { unique: true });
print("✓ Created unique index: { userId: 1, genre: 1 }");

// Index for finding all subscribers of a genre (for notifications)
db.genre_subscriptions.createIndex({ genre: 1 });
print("✓ Created index: { genre: 1 }");

print("\n✅ All subscription indexes created successfully!");
print("\nTo verify indexes, run:");
print("  db.artist_subscriptions.getIndexes()");
print("  db.genre_subscriptions.getIndexes()");
