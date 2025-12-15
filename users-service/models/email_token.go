package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type EmailConfirmationToken struct {
	ID        primitive.ObjectID `bson:"_id,omitempty"`
	UserID    primitive.ObjectID `bson:"userId"`
	Token     string             `bson:"token"`
	ExpiresAt time.Time          `bson:"expiresAt"`
	CreatedAt time.Time          `bson:"createdAt"`
}
