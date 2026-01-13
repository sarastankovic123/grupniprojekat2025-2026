package db

import (
	"context"
	"fmt"
	"time"

	"users-service/config"

	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

var Client *mongo.Client
var UsersCollection *mongo.Collection
var EmailTokensCollection *mongo.Collection
var MagicLinkTokensCollection *mongo.Collection
var RefreshTokensCollection *mongo.Collection

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

