package repository

import (
	"context"
	"time"

	"users-service/db"
	"users-service/models"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

func CreateMagicLinkToken(token models.MagicLinkToken) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	_, err := db.MagicLinkTokensCollection.InsertOne(ctx, token)
	return err
}

func FindMagicLinkByHash(hash string) (*models.MagicLinkToken, error) {
	var token models.MagicLinkToken

	err := db.MagicLinkTokensCollection.
		FindOne(context.Background(), bson.M{"tokenHash": hash}).
		Decode(&token)

	if err != nil {
		return nil, err
	}

	return &token, nil
}

func MarkMagicLinkUsed(id primitive.ObjectID) error {
	now := time.Now()

	_, err := db.MagicLinkTokensCollection.UpdateOne(
		context.Background(),
		bson.M{"_id": id},
		bson.M{
			"$set": bson.M{
				"usedAt": now,
			},
		},
	)

	return err
}
