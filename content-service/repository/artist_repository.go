package repository

import (
	"context"

	"content-service/db"
	"content-service/models"
	"go.mongodb.org/mongo-driver/bson"
)

func GetAllArtists() ([]models.Artist, error) {
	cursor, err := db.ArtistsCollection.Find(context.Background(), bson.M{})
	if err != nil {
		return nil, err
	}
	defer cursor.Close(context.Background())

	var artists []models.Artist
	if err := cursor.All(context.Background(), &artists); err != nil {
		return nil, err
	}

	return artists, nil
}
