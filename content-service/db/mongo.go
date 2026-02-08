package db

import (
	"context"
	"fmt"
	"time"

	"content-service/config"

	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

var Client *mongo.Client
var ArtistsCollection *mongo.Collection
var AlbumsCollection *mongo.Collection
var SongsCollection *mongo.Collection
var UserRatingsCollection *mongo.Collection

func ConnectMongo() {
	const maxAttempts = 20
	const delay = 2 * time.Second

	var lastErr error

	for attempt := 1; attempt <= maxAttempts; attempt++ {
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)

		fmt.Println("CONTENT-SERVICE MONGO URI:", config.MongoURI)
		fmt.Println("CONTENT-SERVICE DB NAME:", config.ContentDBName)

		client, err := mongo.Connect(ctx, options.Client().ApplyURI(config.MongoURI))
		if err == nil {
			err = client.Ping(ctx, nil)
			if err == nil {
				cancel()
				Client = client

				db := client.Database(config.ContentDBName)

				ArtistsCollection = db.Collection("artists")
				AlbumsCollection = db.Collection("albums")
				SongsCollection = db.Collection("songs")
				UserRatingsCollection = db.Collection("user_ratings")

				fmt.Printf("Connected to MongoDB (content-service) after %d attempt(s)\n", attempt)
				return
			}
		}

		cancel()
		lastErr = err
		fmt.Printf("Mongo not ready (content-service) attempt %d/%d: %v\n", attempt, maxAttempts, err)
		time.Sleep(delay)
	}

	panic(lastErr)
}
