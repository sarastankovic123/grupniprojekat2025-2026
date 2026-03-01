package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type ArtistSubscription struct {
	ID        primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	UserID    primitive.ObjectID `bson:"userId" json:"userId"`
	ArtistID  primitive.ObjectID `bson:"artistId" json:"artistId"`
	CreatedAt time.Time          `bson:"createdAt" json:"createdAt"`
}

type GenreSubscription struct {
	ID        primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	UserID    primitive.ObjectID `bson:"userId" json:"userId"`
	Genre     string             `bson:"genre" json:"genre"` // e.g., "Rock", "Jazz"
	CreatedAt time.Time          `bson:"createdAt" json:"createdAt"`
}

type ArtistSubscriptionDetail struct {
	ID           primitive.ObjectID `json:"id"`
	UserID       primitive.ObjectID `json:"userId"`
	ArtistID     primitive.ObjectID `json:"artistId"`
	ArtistName   string             `json:"artistName"`
	ArtistGenres []string           `json:"artistGenres"`
	CreatedAt    time.Time          `json:"createdAt"`
}
