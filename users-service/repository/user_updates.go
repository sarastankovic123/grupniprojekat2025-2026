package repository

import (
	"context"
	"time"

	"users-service/db"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

func UpdateUserPasswordAndUnlock(ctx context.Context, userID primitive.ObjectID, passwordHash string, changedAt time.Time) (*mongo.UpdateResult, error) {
	res, err := db.UsersCollection.UpdateOne(
		ctx,
		bson.M{"_id": userID},
		bson.M{
			"$set": bson.M{
				"passwordHash":      passwordHash,
				"passwordChangedAt": changedAt,
			},
			"$unset": bson.M{
				"passwordLockUntil": "",
			},
		},
	)
	if err != nil {
		return nil, err
	}
	if res.MatchedCount == 0 {
		return nil, mongo.ErrNoDocuments
	}
	return res, nil
}
