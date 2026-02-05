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

// SearchAndFilterArtists searches artists by name and filters by genres
func SearchAndFilterArtists(searchQuery string, genres []string) ([]models.Artist, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	filter := bson.M{}

	// Add name search if provided
	if searchQuery != "" {
		filter["name"] = bson.M{"$regex": searchQuery, "$options": "i"}
	}

	// Add genre filter if provided
	if len(genres) > 0 {
		filter["genres"] = bson.M{"$in": genres}
	}

	cursor, err := db.ArtistsCollection.Find(ctx, filter)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var artists []models.Artist
	if err := cursor.All(ctx, &artists); err != nil {
		return nil, err
	}

	return artists, nil
}

// GetAllGenres retrieves unique genres from all artists
func GetAllGenres() ([]string, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	pipeline := []bson.M{
		{"$unwind": "$genres"},
		{"$group": bson.M{"_id": "$genres"}},
		{"$sort": bson.M{"_id": 1}},
	}

	cursor, err := db.ArtistsCollection.Aggregate(ctx, pipeline)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var results []struct {
		ID string `bson:"_id"`
	}
	if err := cursor.All(ctx, &results); err != nil {
		return nil, err
	}

	genres := make([]string, len(results))
	for i, result := range results {
		genres[i] = result.ID
	}

	return genres, nil
}
