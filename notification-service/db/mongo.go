package db

import (
	"context"
	"fmt"
	"time"

	"notification-service/config"

	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

var Client *mongo.Client
var NotificationsCollection *mongo.Collection

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

				db := client.Database("notifications_db")
				NotificationsCollection = db.Collection("notifications")

				fmt.Printf("Connected to MongoDB (notification-service) after %d attempt(s)\n", attempt)
				return
			}
		}

		cancel()
		lastErr = err
		fmt.Printf("Mongo not ready (notification-service) attempt %d/%d: %v\n", attempt, maxAttempts, err)
		time.Sleep(delay)
	}

	panic(lastErr)
}

