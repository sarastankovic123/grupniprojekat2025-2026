package repository

import (
	"context"

	"content-service/db"
	"content-service/models"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
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

func GetArtistByID(id string) (*models.Artist, error) {
	objID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return nil, err
	}

	var artist models.Artist
	err = db.ArtistsCollection.FindOne(
		context.Background(),
		bson.M{"_id": objID},
	).Decode(&artist)

	if err != nil {
		return nil, err
	}

	return &artist, nil
}
func CreateArtist(artist models.Artist) error {
	_, err := db.ArtistsCollection.InsertOne(context.Background(), artist)
	return err
}

