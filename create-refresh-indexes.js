
use users_db;

print("Creating indexes for refresh_tokens collection...");

db.refresh_tokens.createIndex(
    { "user_id": 1, "is_revoked": 1 },
    { name: "user_id_is_revoked_idx" }
);
print("âœ“ Created index: user_id_is_revoked_idx");

db.refresh_tokens.createIndex(
    { "token": 1 },
    { unique: true, name: "token_unique_idx" }
);
print("âœ“ Created index: token_unique_idx");

db.refresh_tokens.createIndex(
    { "expires_at": 1 },
    { expireAfterSeconds: 0, name: "expires_at_ttl_idx" }
);
print("âœ“ Created TTL index: expires_at_ttl_idx");

print("\nAll indexes created successfully!");
print("\nVerifying indexes:");
db.refresh_tokens.getIndexes().forEach(function(index) {
    print("  - " + index.name);
});
