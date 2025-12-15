package repository

import (
	"context"
	"time"

	"users-service/db"
	"users-service/models"

	"go.mongodb.org/mongo-driver/bson"
)

func FindUserByUsername(username string) (*models.User, error) {
	var user models.User
	err := db.UsersCollection.FindOne(
		context.Background(),
		bson.M{"username": username},
	).Decode(&user)

	if err != nil {
		return nil, err
	}

	return &user, nil
}


func CreateUser(user models.User) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	_, err := db.UsersCollection.InsertOne(ctx, user)
	return err
}
