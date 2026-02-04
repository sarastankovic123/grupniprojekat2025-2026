package repository

import (
	"context"
	"errors"
	"time"

	"users-service/db"
	"users-service/models"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
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

func UpdateUserProfile(
	ctx context.Context,
	userID primitive.ObjectID,
	username *string,
	firstName *string,
	lastName *string,
) (*models.User, error) {
	setFields := bson.M{}
	if username != nil {
		setFields["username"] = *username
	}
	if firstName != nil {
		setFields["firstName"] = *firstName
	}
	if lastName != nil {
		setFields["lastName"] = *lastName
	}
	if len(setFields) == 0 {
		return nil, errors.New("no fields to update")
	}

	var updated models.User
	err := db.UsersCollection.FindOneAndUpdate(
		ctx,
		bson.M{"_id": userID},
		bson.M{"$set": setFields},
		options.FindOneAndUpdate().SetReturnDocument(options.After),
	).Decode(&updated)
	if err != nil {
		return nil, err
	}
	return &updated, nil
}
