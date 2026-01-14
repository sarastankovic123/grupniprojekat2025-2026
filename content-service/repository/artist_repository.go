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

func UpdateArtist(id string, artist models.Artist) error {
	objID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return err
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	update := bson.M{
		"$set": bson.M{
			"name":      artist.Name,
			"biography": artist.Biography,
			"genres":    artist.Genres,
		},
	}

	result, err := db.ArtistsCollection.UpdateOne(
		ctx,
		bson.M{"_id": objID},
		update,
	)
	if err != nil {
		return err
	}

	if result.MatchedCount == 0 {
		return fmt.Errorf("artist not found")
	}

	return nil
}

func DeleteArtist(id string) error {
	objID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return err
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	result, err := db.ArtistsCollection.DeleteOne(
		ctx,
		bson.M{"_id": objID},
	)
	if err != nil {
		return err
	}

	if result.DeletedCount == 0 {
		return fmt.Errorf("artist not found")
	}

	return nil
}

func CountAlbumsByArtistID(artistID primitive.ObjectID) (int64, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	count, err := db.AlbumsCollection.CountDocuments(ctx, bson.M{"artistId": artistID})
	if err != nil {
		return 0, err
	}
	return count, nil
}
