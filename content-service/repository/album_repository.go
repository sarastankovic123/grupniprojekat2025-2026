package repository

import (
	"context"

	"content-service/db"
	"content-service/models"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

func GetAlbumsByArtistID(artistID string) ([]models.Album, error) {
	objID, err := primitive.ObjectIDFromHex(artistID)
	if err != nil {
		return nil, err
	}

	cursor, err := db.AlbumsCollection.Find(
		context.Background(),
		bson.M{"artistId": objID},
	)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(context.Background())

	var albums []models.Album
	if err := cursor.All(context.Background(), &albums); err != nil {
		return nil, err
	}

	if albums == nil {
		albums = []models.Album{}
	}

	return albums, nil
}

func GetAlbumByID(albumID string) (*models.Album, error) {
	objID, err := primitive.ObjectIDFromHex(albumID)
	if err != nil {
		return nil, err
	}

	var album models.Album
	err = db.AlbumsCollection.FindOne(
		context.Background(),
		bson.M{"_id": objID},
	).Decode(&album)
	if err != nil {
		return nil, err
	}

	return &album, nil
}
