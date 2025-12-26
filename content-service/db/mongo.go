package db

import (
	"context"
	"fmt"
	"time"

	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

var Client *mongo.Client
var ArtistsCollection *mongo.Collection
var AlbumsCollection *mongo.Collection
var SongsCollection *mongo.Collection

func ConnectMongo() {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	client, err := mongo.Connect(ctx, options.Client().ApplyURI("mongodb://localhost:27017"))
	if err != nil {
		panic(err)
	}

	if err := client.Ping(ctx, nil); err != nil {
		panic(err)
	}

	Client = client

	db := client.Database("music_db")
	ArtistsCollection = db.Collection("artists")
	AlbumsCollection = db.Collection("albums")
	SongsCollection = db.Collection("songs")

	fmt.Println("Connected to MongoDB (content-service)")
}
