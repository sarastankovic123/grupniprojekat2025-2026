package repository

import (
	"content-service/db"
	"content-service/models"
	"context"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

// GetUserRating retrieves a user's rating for a specific song
func GetUserRating(userID, songID primitive.ObjectID) (*models.UserRating, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var rating models.UserRating
	filter := bson.M{"userId": userID, "songId": songID}

	err := db.UserRatingsCollection.FindOne(ctx, filter).Decode(&rating)
	if err == mongo.ErrNoDocuments {
		return nil, nil // No rating found - not an error
	}
	if err != nil {
		return nil, err
	}

	return &rating, nil
}

// UpsertRating creates or updates a user's rating for a song
func UpsertRating(userID, songID primitive.ObjectID, ratingValue int) (*models.UserRating, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	now := time.Now()
	filter := bson.M{"userId": userID, "songId": songID}
	update := bson.M{
		"$set": bson.M{
			"userId":    userID,
			"songId":    songID,
			"rating":    ratingValue,
			"updatedAt": now,
		},
		"$setOnInsert": bson.M{
			"createdAt": now,
		},
	}

	opts := options.FindOneAndUpdate().
		SetUpsert(true).
		SetReturnDocument(options.After)

	var rating models.UserRating
	err := db.UserRatingsCollection.FindOneAndUpdate(ctx, filter, update, opts).Decode(&rating)
	if err != nil {
		return nil, err
	}

	return &rating, nil
}

// DeleteRating removes a user's rating for a song
func DeleteRating(userID, songID primitive.ObjectID) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	filter := bson.M{"userId": userID, "songId": songID}
	result, err := db.UserRatingsCollection.DeleteOne(ctx, filter)
	if err != nil {
		return err
	}

	if result.DeletedCount == 0 {
		return mongo.ErrNoDocuments // No rating to delete
	}

	return nil
}

// GetAverageRating calculates the average rating and count for a song
func GetAverageRating(songID primitive.ObjectID) (float64, int, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	filter := bson.M{"songId": songID}
	count, err := db.UserRatingsCollection.CountDocuments(ctx, filter)
	if err != nil {
		return 0, 0, err
	}

	if count == 0 {
		return 0, 0, nil
	}

	// Calculate average using aggregation
	pipeline := []bson.M{
		{"$match": filter},
		{
			"$group": bson.M{
				"_id": nil,
				"avg": bson.M{"$avg": "$rating"},
			},
		},
	}

	cursor, err := db.UserRatingsCollection.Aggregate(ctx, pipeline)
	if err != nil {
		return 0, 0, err
	}
	defer cursor.Close(ctx)

	var result struct {
		Avg float64 `bson:"avg"`
	}

	if cursor.Next(ctx) {
		if err := cursor.Decode(&result); err != nil {
			return 0, 0, err
		}
	}

	return result.Avg, int(count), nil
}
