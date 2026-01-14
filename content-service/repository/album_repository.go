package repository

import (
	"context"
	"fmt"
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

func UpdateAlbum(id string, album models.Album) error {
	objID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return err
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	update := bson.M{
		"$set": bson.M{
			"title":       album.Title,
			"releaseDate": album.ReleaseDate,
			"genres":      album.Genres,
			"artistId":    album.ArtistID,
		},
	}

	result, err := db.AlbumsCollection.UpdateOne(
		ctx,
		bson.M{"_id": objID},
		update,
	)
	if err != nil {
		return err
	}

	if result.MatchedCount == 0 {
		return fmt.Errorf("album not found")
	}

	return nil
}

func DeleteAlbum(id string) error {
	objID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return err
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	result, err := db.AlbumsCollection.DeleteOne(
		ctx,
		bson.M{"_id": objID},
	)
	if err != nil {
		return err
	}

	if result.DeletedCount == 0 {
		return fmt.Errorf("album not found")
	}

	return nil
}

func CountSongsByAlbumID(albumID primitive.ObjectID) (int64, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	count, err := db.SongsCollection.CountDocuments(ctx, bson.M{"albumId": albumID})
	if err != nil {
		return 0, err
	}
	return count, nil
}
