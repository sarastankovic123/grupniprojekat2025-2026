package db

import (
	"context"
	"fmt"
	"log"
	"time"

	"users-service/config"

	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
	"go.mongodb.org/mongo-driver/bson"
)

var Client *mongo.Client
var UsersCollection *mongo.Collection
var EmailTokensCollection *mongo.Collection
var MagicLinkTokensCollection *mongo.Collection
var RefreshTokensCollection *mongo.Collection
var PasswordResetTokensCollection *mongo.Collection

func ConnectMongo() {
	const maxAttempts = 20
	const delay = 2 * time.Second

	var lastErr error

	for attempt := 1; attempt <= maxAttempts; attempt++ {
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)

		client, err := mongo.Connect(ctx, options.Client().ApplyURI(config.MongoURI))
		if err == nil {
			err = client.Ping(ctx, nil)
			if err == nil {
				cancel()
				Client = client

				db := client.Database("users_db")
				UsersCollection = db.Collection("users")
				EmailTokensCollection = db.Collection("email_tokens")
				MagicLinkTokensCollection = db.Collection("magic_link_tokens")
				RefreshTokensCollection = db.Collection("refresh_tokens")
				PasswordResetTokensCollection = db.Collection("password_reset_tokens")

				ensureIndexes()

				fmt.Printf("Connected to MongoDB (users-service) after %d attempt(s)\n", attempt)
				return
			}
		}

		cancel()
		lastErr = err
		fmt.Printf("Mongo not ready (users-service) attempt %d/%d: %v\n", attempt, maxAttempts, err)
		time.Sleep(delay)
	}

	panic(lastErr)
}

func ensureIndexes() {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Users: enforce uniqueness at DB level (avoids race conditions).
	_, err := UsersCollection.Indexes().CreateMany(ctx, []mongo.IndexModel{
		{
			Keys:    bson.D{{Key: "username", Value: 1}},
			Options: options.Index().SetUnique(true).SetName("users_username_unique"),
		},
		{
			Keys:    bson.D{{Key: "email", Value: 1}},
			Options: options.Index().SetUnique(true).SetName("users_email_unique"),
		},
	})
	if err != nil {
		log.Printf("Warning: failed to create users indexes: %v\n", err)
	}

	// Token collections: ensure single-use/lookup performance.
	_, _ = EmailTokensCollection.Indexes().CreateOne(ctx, mongo.IndexModel{
		Keys:    bson.D{{Key: "token", Value: 1}},
		Options: options.Index().SetUnique(true).SetName("email_tokens_token_unique"),
	})
	_, _ = MagicLinkTokensCollection.Indexes().CreateOne(ctx, mongo.IndexModel{
		Keys:    bson.D{{Key: "tokenHash", Value: 1}},
		Options: options.Index().SetUnique(true).SetName("magic_link_tokens_hash_unique"),
	})
	_, _ = PasswordResetTokensCollection.Indexes().CreateOne(ctx, mongo.IndexModel{
		Keys:    bson.D{{Key: "tokenHash", Value: 1}},
		Options: options.Index().SetUnique(true).SetName("password_reset_tokens_hash_unique"),
	})
	_, _ = RefreshTokensCollection.Indexes().CreateOne(ctx, mongo.IndexModel{
		Keys:    bson.D{{Key: "token", Value: 1}},
		Options: options.Index().SetUnique(true).SetName("refresh_tokens_token_unique"),
	})
}
