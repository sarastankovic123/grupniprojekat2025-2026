
use music_db;

db.user_ratings.createIndex(
  { userId: 1, songId: 1 },
  { unique: true, name: "user_song_unique_rating" }
);

db.user_ratings.createIndex(
  { songId: 1 },
  { name: "song_ratings_lookup" }
);

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
