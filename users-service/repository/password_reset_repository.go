package repository

import (
	"context"
	"time"

	"users-service/db"
	"users-service/models"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
)

func CreatePasswordResetToken(token models.PasswordResetToken) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	_, err := db.PasswordResetTokensCollection.InsertOne(ctx, token)
	return err
}

func FindPasswordResetTokenByHash(tokenHash string) (*models.PasswordResetToken, error) {
	var t models.PasswordResetToken
	err := db.PasswordResetTokensCollection.FindOne(
		context.Background(),
		bson.M{"tokenHash": tokenHash},
	).Decode(&t)
	if err != nil {
		return nil, err
	}
	return &t, nil
}

func MarkPasswordResetTokenUsed(tokenHash string) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	now := time.Now()
	res, err := db.PasswordResetTokensCollection.UpdateOne(
		ctx,
		bson.M{"tokenHash": tokenHash, "usedAt": bson.M{"$exists": false}},
		bson.M{"$set": bson.M{"usedAt": now}},
	)
	if err != nil {
		return err
	}
	if res.MatchedCount == 0 {
		return mongo.ErrNoDocuments
	}
	return nil
}

