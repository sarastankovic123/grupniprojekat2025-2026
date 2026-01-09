package db

import (
	"context"
	"fmt"
	"time"

	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)
var MagicLinkTokensCollection *mongo.Collection
var Client *mongo.Client
var UsersCollection *mongo.Collection
var EmailTokensCollection *mongo.Collection

func ConnectMongo() {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	client, err := mongo.Connect(ctx, options.Client().ApplyURI("mongodb://localhost:27017"))
	if err != nil {
		panic(err)
	}

	err = client.Ping(ctx, nil)
	if err != nil {
		panic(err)
	}

	Client = client

	db := client.Database("users_db")
	UsersCollection = db.Collection("users")
	EmailTokensCollection = db.Collection("email_tokens")
	MagicLinkTokensCollection = db.Collection("magic_link_tokens")

	fmt.Println("Connected to MongoDB")
}
