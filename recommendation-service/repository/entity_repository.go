package repository

import (
	"context"
	"time"

	"recommendation-service/db"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

func SongExistsByID(id string) (bool, error) {
	objID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return false, err
	}

	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()

	count, err := db.SongsCollection.CountDocuments(ctx, bson.M{"_id": objID})
	if err != nil {
		return false, err
	}

	return count > 0, nil
}

func ArtistExistsByID(id string) (bool, error) {
	objID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return false, err
	}

	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()

	count, err := db.ArtistsCollection.CountDocuments(ctx, bson.M{"_id": objID})
	if err != nil {
		return false, err
	}

	return count > 0, nil
}
