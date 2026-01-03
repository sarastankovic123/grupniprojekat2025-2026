package repository

import (
	"context"
	"time"

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
func ArtistExistsByID(id primitive.ObjectID) (bool, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	count, err := db.ArtistsCollection.CountDocuments(ctx, bson.M{"_id": id})
	if err != nil {
		return false, err
	}
	return count > 0, nil
}
func CreateAlbum(album models.Album) (models.Album, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if album.ID.IsZero() {
		album.ID = primitive.NewObjectID()
	}

	_, err := db.AlbumsCollection.InsertOne(ctx, album)
	return album, err
}
