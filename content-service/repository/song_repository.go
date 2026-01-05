package repository

import (
	"context"

	"content-service/db"
	"content-service/models"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo/options"
)

func GetSongsByAlbumID(albumID string) ([]models.Song, error) {
	objID, err := primitive.ObjectIDFromHex(albumID)
	if err != nil {
		return nil, err
	}

	opts := options.Find().SetSort(bson.M{"trackNo": 1})

	cursor, err := db.SongsCollection.Find(
		context.Background(),
		bson.M{"albumId": objID},
		opts,
	)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(context.Background())

	var songs []models.Song
	if err := cursor.All(context.Background(), &songs); err != nil {
		return nil, err
	}

	if songs == nil {
		songs = []models.Song{}
	}

	return songs, nil
}
