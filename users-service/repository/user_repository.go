package repository

import (
	"context"
	"time"

	"users-service/db"
	"users-service/models"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
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

func CreateUser(user *models.User) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	res, err := db.UsersCollection.InsertOne(ctx, user)
	if err != nil {
		return err
	}

	if oid, ok := res.InsertedID.(primitive.ObjectID); ok {
		user.ID = oid
	}

	return nil
}

func FindUserByEmail(email string) (*models.User, error) {
	var user models.User
	err := db.UsersCollection.
		FindOne(context.Background(), bson.M{"email": email}).
		Decode(&user)
	if err != nil {
		return nil, err
	}
	return &user, nil
}

func FindUserByID(id primitive.ObjectID) (*models.User, error) {
	var user models.User
	err := db.UsersCollection.
		FindOne(context.Background(), bson.M{"_id": id}).
		Decode(&user)

	if err != nil {
		return nil, err
	}
	return &user, nil
}
