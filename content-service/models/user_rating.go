package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type UserRating struct {
	ID        primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	UserID    primitive.ObjectID `bson:"userId" json:"userId"`
	SongID    primitive.ObjectID `bson:"songId" json:"songId"`
	Rating    int                `bson:"rating" json:"rating"` // 1-5
	CreatedAt time.Time          `bson:"createdAt" json:"createdAt"`
	UpdatedAt time.Time          `bson:"updatedAt" json:"updatedAt"`
}
