package repository

import (
	"context"
	"time"
	"users-service/db"
	"users-service/models"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

func CreateRefreshToken(token *models.RefreshToken) error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	token.CreatedAt = time.Now()
	token.IsRevoked = false

	_, err := db.RefreshTokensCollection.InsertOne(ctx, token)
	return err
}

func FindRefreshTokenByToken(tokenString string) (*models.RefreshToken, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	var token models.RefreshToken
	err := db.RefreshTokensCollection.FindOne(ctx, bson.M{"token": tokenString}).Decode(&token)
	if err != nil {
		return nil, err
	}

	return &token, nil
}

func RevokeRefreshToken(tokenString string) error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	_, err := db.RefreshTokensCollection.UpdateOne(
		ctx,
		bson.M{"token": tokenString},
		bson.M{"$set": bson.M{"is_revoked": true}},
	)
	return err
}

func RevokeAllUserTokens(userID primitive.ObjectID) error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	_, err := db.RefreshTokensCollection.UpdateMany(
		ctx,
		bson.M{"user_id": userID, "is_revoked": false},
		bson.M{"$set": bson.M{"is_revoked": true}},
	)
	return err
}

func DeleteExpiredTokens() error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	_, err := db.RefreshTokensCollection.DeleteMany(
		ctx,
		bson.M{"expires_at": bson.M{"$lt": time.Now()}},
	)
	return err
}
