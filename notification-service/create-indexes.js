// Run this script with: mongosh < create-indexes.js
// Or manually in mongosh: use notifications_db; db.notifications.createIndex({ userId: 1, createdAt: -1 });

use notifications_db;

// Create compound index for efficient queries sorted by date
db.notifications.createIndex({ userId: 1, createdAt: -1 });

print("MongoDB indexes created successfully for notifications_db");
