package repository

import (
	"context"
	"time"

	"content-service/db"
	"content-service/models"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

// ============ ARTIST SUBSCRIPTIONS ============

// SubscribeToArtist subscribes a user to an artist (idempotent operation)
// If the subscription already exists, it returns the existing subscription
func SubscribeToArtist(userID, artistID primitive.ObjectID) (*models.ArtistSubscription, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	filter := bson.M{"userId": userID, "artistId": artistID}
	update := bson.M{
		"$setOnInsert": bson.M{
			"userId":    userID,
			"artistId":  artistID,
			"createdAt": time.Now(),
		},
	}
	opts := options.FindOneAndUpdate().SetUpsert(true).SetReturnDocument(options.After)

	var sub models.ArtistSubscription
	err := db.ArtistSubscriptionsCollection.FindOneAndUpdate(ctx, filter, update, opts).Decode(&sub)
	if err != nil && err != mongo.ErrNoDocuments {
		return nil, err
	}
	return &sub, nil
}

// UnsubscribeFromArtist removes a user's subscription to an artist
func UnsubscribeFromArtist(userID, artistID primitive.ObjectID) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	filter := bson.M{"userId": userID, "artistId": artistID}
	_, err := db.ArtistSubscriptionsCollection.DeleteOne(ctx, filter)
	return err
}

// GetUserArtistSubscriptionsWithDetails returns a user's artist subscriptions
// enriched with artist details (name, genres) via MongoDB aggregation
func GetUserArtistSubscriptionsWithDetails(userID primitive.ObjectID) ([]models.ArtistSubscriptionDetail, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	pipeline := mongo.Pipeline{
		{{Key: "$match", Value: bson.M{"userId": userID}}},
		{{Key: "$sort", Value: bson.M{"createdAt": -1}}},
		{{Key: "$lookup", Value: bson.M{
			"from":         "artists",
			"localField":   "artistId",
			"foreignField": "_id",
			"as":           "artist",
		}}},
		{{Key: "$unwind", Value: "$artist"}},
		{{Key: "$project", Value: bson.M{
			"_id":          1,
			"userId":       1,
			"artistId":     1,
			"artistName":   "$artist.name",
			"artistGenres": "$artist.genres",
			"createdAt":    1,
		}}},
	}

	cursor, err := db.ArtistSubscriptionsCollection.Aggregate(ctx, pipeline)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var results []models.ArtistSubscriptionDetail
	if err := cursor.All(ctx, &results); err != nil {
		return nil, err
	}

	// Return empty array instead of nil for consistent frontend handling
	if results == nil {
		results = []models.ArtistSubscriptionDetail{}
	}

	return results, nil
}

// IsSubscribedToArtist checks if a user is subscribed to a specific artist
func IsSubscribedToArtist(userID, artistID primitive.ObjectID) (bool, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	filter := bson.M{"userId": userID, "artistId": artistID}
	count, err := db.ArtistSubscriptionsCollection.CountDocuments(ctx, filter)
	if err != nil {
		return false, err
	}
	return count > 0, nil
}

// GetArtistSubscribers returns all user IDs subscribed to a specific artist
// Used for sending notifications when new content is created
func GetArtistSubscribers(artistID primitive.ObjectID) ([]primitive.ObjectID, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	filter := bson.M{"artistId": artistID}
	cursor, err := db.ArtistSubscriptionsCollection.Find(ctx, filter)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var subs []models.ArtistSubscription
	if err := cursor.All(ctx, &subs); err != nil {
		return nil, err
	}

	userIDs := make([]primitive.ObjectID, len(subs))
	for i, sub := range subs {
		userIDs[i] = sub.UserID
	}
	return userIDs, nil
}

// ============ GENRE SUBSCRIPTIONS ============

// SubscribeToGenre subscribes a user to a genre (idempotent operation)
// If the subscription already exists, it returns the existing subscription
func SubscribeToGenre(userID primitive.ObjectID, genre string) (*models.GenreSubscription, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	filter := bson.M{"userId": userID, "genre": genre}
	update := bson.M{
		"$setOnInsert": bson.M{
			"userId":    userID,
			"genre":     genre,
			"createdAt": time.Now(),
		},
	}
	opts := options.FindOneAndUpdate().SetUpsert(true).SetReturnDocument(options.After)

	var sub models.GenreSubscription
	err := db.GenreSubscriptionsCollection.FindOneAndUpdate(ctx, filter, update, opts).Decode(&sub)
	if err != nil && err != mongo.ErrNoDocuments {
		return nil, err
	}
	return &sub, nil
}

// UnsubscribeFromGenre removes a user's subscription to a genre
func UnsubscribeFromGenre(userID primitive.ObjectID, genre string) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	filter := bson.M{"userId": userID, "genre": genre}
	_, err := db.GenreSubscriptionsCollection.DeleteOne(ctx, filter)
	return err
}

// GetUserGenreSubscriptions returns all of a user's genre subscriptions
// sorted by creation date (newest first)
func GetUserGenreSubscriptions(userID primitive.ObjectID) ([]models.GenreSubscription, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	filter := bson.M{"userId": userID}
	opts := options.Find().SetSort(bson.M{"createdAt": -1})
	cursor, err := db.GenreSubscriptionsCollection.Find(ctx, filter, opts)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var subs []models.GenreSubscription
	if err := cursor.All(ctx, &subs); err != nil {
		return nil, err
	}

	// Return empty array instead of nil for consistent frontend handling
	if subs == nil {
		subs = []models.GenreSubscription{}
	}

	return subs, nil
}

// IsSubscribedToGenre checks if a user is subscribed to a specific genre
func IsSubscribedToGenre(userID primitive.ObjectID, genre string) (bool, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	filter := bson.M{"userId": userID, "genre": genre}
	count, err := db.GenreSubscriptionsCollection.CountDocuments(ctx, filter)
	if err != nil {
		return false, err
	}
	return count > 0, nil
}

// GetGenreSubscribers returns all user IDs subscribed to a specific genre
// Used for sending notifications when new content matching the genre is created
func GetGenreSubscribers(genre string) ([]primitive.ObjectID, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	filter := bson.M{"genre": genre}
	cursor, err := db.GenreSubscriptionsCollection.Find(ctx, filter)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var subs []models.GenreSubscription
	if err := cursor.All(ctx, &subs); err != nil {
		return nil, err
	}

	userIDs := make([]primitive.ObjectID, len(subs))
	for i, sub := range subs {
		userIDs[i] = sub.UserID
	}
	return userIDs, nil
}
