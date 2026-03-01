
print("Creating artist subscriptions indexes...");

db.artist_subscriptions.createIndex({ userId: 1, createdAt: -1 });
print("âœ“ Created index: { userId: 1, createdAt: -1 }");

db.artist_subscriptions.createIndex({ userId: 1, artistId: 1 }, { unique: true });
print("âœ“ Created unique index: { userId: 1, artistId: 1 }");

db.artist_subscriptions.createIndex({ artistId: 1 });
print("âœ“ Created index: { artistId: 1 }");

print("\nCreating genre subscriptions indexes...");

db.genre_subscriptions.createIndex({ userId: 1, createdAt: -1 });
print("âœ“ Created index: { userId: 1, createdAt: -1 }");

db.genre_subscriptions.createIndex({ userId: 1, genre: 1 }, { unique: true });
print("âœ“ Created unique index: { userId: 1, genre: 1 }");

db.genre_subscriptions.createIndex({ genre: 1 });
print("âœ“ Created index: { genre: 1 }");

print("\nâœ… All subscription indexes created successfully!");
print("\nTo verify indexes, run:");
print("  db.artist_subscriptions.getIndexes()");
print("  db.genre_subscriptions.getIndexes()");
