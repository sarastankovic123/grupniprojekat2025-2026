package repository

import (
	"context"
	"fmt"
	"time"

	"content-service/db"
	"content-service/models"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo/options"
)

func CreateSong(song models.Song) (*models.Song, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if song.ID.IsZero() {
		song.ID = primitive.NewObjectID()
	}

	_, err := db.SongsCollection.InsertOne(ctx, song)
	if err != nil {
		return nil, err
	}

	return &song, nil
}

func GetAllSongs() ([]models.Song, error) {
	cursor, err := db.SongsCollection.Find(context.Background(), bson.M{})
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

func GetSongByID(id string) (*models.Song, error) {
	objID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return nil, err
	}

	var song models.Song
	err = db.SongsCollection.FindOne(
		context.Background(),
		bson.M{"_id": objID},
	).Decode(&song)
	if err != nil {
		return nil, err
	}

	return &song, nil
}

func SetSongAudioFile(id string, audioFile string) error {
	objID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return err
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	result, err := db.SongsCollection.UpdateOne(
		ctx,
		bson.M{"_id": objID},
		bson.M{"$set": bson.M{"audioFile": audioFile}},
	)
	if err != nil {
		return err
	}
	if result.MatchedCount == 0 {
		return fmt.Errorf("song not found")
	}
	return nil
}

func UpdateSong(id string, song models.Song) error {
	objID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return err
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	update := bson.M{
		"$set": bson.M{
			"title":    song.Title,
			"duration": song.Duration,
			"albumId":  song.AlbumID,
			"trackNo":  song.TrackNo,
		},
	}

	result, err := db.SongsCollection.UpdateOne(
		ctx,
		bson.M{"_id": objID},
		update,
	)
	if err != nil {
		return err
	}

	if result.MatchedCount == 0 {
		return fmt.Errorf("song not found")
	}

	return nil
}

func DeleteSong(id string) error {
	objID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return err
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	result, err := db.SongsCollection.DeleteOne(
		ctx,
		bson.M{"_id": objID},
	)
	if err != nil {
		return err
	}

	if result.DeletedCount == 0 {
		return fmt.Errorf("song not found")
	}

	return nil
}

func GetSongsByAlbumID(albumID string) ([]models.Song, error) {
	return SearchSongsByAlbumID(albumID, "")
}

func SearchSongsByAlbumID(albumID string, searchQuery string) ([]models.Song, error) {
	objID, err := primitive.ObjectIDFromHex(albumID)
	if err != nil {
		return nil, err
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	filter := bson.M{"albumId": objID}
	if searchQuery != "" {
		filter["title"] = bson.M{"$regex": searchQuery, "$options": "i"}
	}

	opts := options.Find().SetSort(bson.M{"trackNo": 1})

	cursor, err := db.SongsCollection.Find(
		ctx,
		filter,
		opts,
	)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var songs []models.Song
	if err := cursor.All(ctx, &songs); err != nil {
		return nil, err
	}

	if songs == nil {
		songs = []models.Song{}
	}

	return songs, nil
}

func AlbumExistsByID(id primitive.ObjectID) (bool, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	count, err := db.AlbumsCollection.CountDocuments(ctx, bson.M{"_id": id})
	if err != nil {
		return false, err
	}
	return count > 0, nil
}

func SearchSongs(searchQuery string) ([]models.Song, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	filter := bson.M{}

	if searchQuery != "" {
		filter["title"] = bson.M{"$regex": searchQuery, "$options": "i"}
	}

	cursor, err := db.SongsCollection.Find(ctx, filter)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var songs []models.Song
	if err := cursor.All(ctx, &songs); err != nil {
		return nil, err
	}

	if songs == nil {
		songs = []models.Song{}
	}

	return songs, nil
}
