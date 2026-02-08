// MongoDB index creation script for user_ratings collection
// Run this script using: mongosh music_db create-rating-indexes.js

use music_db;

// Create compound unique index on userId and songId
// This ensures each user can only have one rating per song
db.user_ratings.createIndex(
  { userId: 1, songId: 1 },
  { unique: true, name: "user_song_unique_rating" }
);

// Create index on songId for faster lookup when calculating average ratings
db.user_ratings.createIndex(
  { songId: 1 },
  { name: "song_ratings_lookup" }
);

// Create index on userId for faster lookup of user's ratings
db.user_ratings.createIndex(
  { userId: 1 },
  { name: "user_ratings_lookup" }
);

print("User ratings indexes created successfully!");
print("");
print("Indexes:");
db.user_ratings.getIndexes().forEach(function(index) {
  print("  - " + index.name + ": " + JSON.stringify(index.key));
});
