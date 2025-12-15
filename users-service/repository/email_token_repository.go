package repository

import (
	"context"
	"time"

	"go.mongodb.org/mongo-driver/bson"

	"users-service/db"
	"users-service/models"
)

func SaveEmailToken(token models.EmailConfirmationToken) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	_, err := db.EmailTokensCollection.InsertOne(ctx, token)
	return err
}

func FindEmailToken(token string) (*models.EmailConfirmationToken, error) {
	var result models.EmailConfirmationToken

	err := db.EmailTokensCollection.FindOne(
		context.Background(),
		bson.M{"token": token},
	).Decode(&result)

	if err != nil {
		return nil, err
	}

	return &result, nil
}

func DeleteEmailToken(token string) error {
	_, err := db.EmailTokensCollection.DeleteOne(
		context.Background(),
		bson.M{"token": token},
	)
	return err
}
