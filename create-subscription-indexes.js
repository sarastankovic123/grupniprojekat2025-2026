// MongoDB Index Creation Script for Subscription Collections
// Run with: mongosh music_db create-subscription-indexes.js

const conn = new Mongo();
const db = conn.getDB('music_db');

print('========================================');
print('Creating Subscription Indexes');
print('========================================\n');

// Artist subscriptions indexes
print('Creating artist subscriptions indexes...');
db.artist_subscriptions.createIndex({ userId: 1, createdAt: -1 });
print('  ✓ Created index: { userId: 1, createdAt: -1 }');

db.artist_subscriptions.createIndex({ userId: 1, artistId: 1 }, { unique: true });
print('  ✓ Created unique index: { userId: 1, artistId: 1 }');

db.artist_subscriptions.createIndex({ artistId: 1 });
print('  ✓ Created index: { artistId: 1 }');

// Genre subscriptions indexes
print('\nCreating genre subscriptions indexes...');
db.genre_subscriptions.createIndex({ userId: 1, createdAt: -1 });
print('  ✓ Created index: { userId: 1, createdAt: -1 }');

db.genre_subscriptions.createIndex({ userId: 1, genre: 1 }, { unique: true });
print('  ✓ Created unique index: { userId: 1, genre: 1 }');

db.genre_subscriptions.createIndex({ genre: 1 });
print('  ✓ Created index: { genre: 1 }');

print('\n========================================');
print('✅ All subscription indexes created!');
print('========================================');
