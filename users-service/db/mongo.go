package db

import (
	"context"
	"fmt"
	"os"
	"time"

	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

var Client *mongo.Client
var UsersCollection *mongo.Collection
var EmailTokensCollection *mongo.Collection
var MagicLinkTokensCollection *mongo.Collection

func ConnectMongo() {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// U Dockeru dolazi iz docker-compose.yml
	// Lokalno fallback na localhost
	mongoURI := os.Getenv("MONGO_URI")
	if mongoURI == "" {
		mongoURI = "mongodb://localhost:27017"
	}

	client, err := mongo.Connect(ctx, options.Client().ApplyURI(mongoURI))
	if err != nil {
		panic(err)
	}

	if err := client.Ping(ctx, nil); err != nil {
		panic(err)
	}

	Client = client

	db := client.Database("users_db")
	UsersCollection = db.Collection("users")
	EmailTokensCollection = db.Collection("email_tokens")
	MagicLinkTokensCollection = db.Collection("magic_link_tokens")

	fmt.Println("Connected to MongoDB (users-service)")
}
