package db

import (
	"context"
	"fmt"
	"time"

	"recommendation-service/config"

	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

var MongoClient *mongo.Client
var SongsCollection *mongo.Collection
var AlbumsCollection *mongo.Collection
var ArtistsCollection *mongo.Collection
var UserRatingsCollection *mongo.Collection
var GenreSubscriptionsCollection *mongo.Collection

func ConnectMongo() {
	const maxAttempts = 20
	const delay = 2 * time.Second

	var lastErr error

	for attempt := 1; attempt <= maxAttempts; attempt++ {
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)

		fmt.Println("RECOMMENDATION-SERVICE MONGO URI:", config.MongoURI)
		fmt.Println("RECOMMENDATION-SERVICE DB NAME:", config.ContentDBName)

		client, err := mongo.Connect(ctx, options.Client().ApplyURI(config.MongoURI))
		if err == nil {
			err = client.Ping(ctx, nil)
			if err == nil {
				cancel()
				MongoClient = client

				db := client.Database(config.ContentDBName)

				SongsCollection = db.Collection("songs")
				AlbumsCollection = db.Collection("albums")
				ArtistsCollection = db.Collection("artists")
				UserRatingsCollection = db.Collection("user_ratings")
				GenreSubscriptionsCollection = db.Collection("genre_subscriptions")

				fmt.Printf("Connected to MongoDB (recommendation-service) after %d attempt(s)\n", attempt)
				return
			}
		}

		cancel()
		lastErr = err
		fmt.Printf("Mongo not ready (recommendation-service) attempt %d/%d: %v\n", attempt, maxAttempts, err)
		time.Sleep(delay)
	}

	panic(lastErr)
}
