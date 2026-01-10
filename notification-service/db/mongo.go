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
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	client, err := mongo.Connect(ctx, options.Client().ApplyURI(config.MongoURI))
	if err != nil {
		panic(err)
	}

	if err := client.Ping(ctx, nil); err != nil {
		panic(err)
	}

	Client = client

	db := client.Database("notifications_db")
	NotificationsCollection = db.Collection("notifications")

	fmt.Println("Connected to MongoDB (notification-service)")
}
