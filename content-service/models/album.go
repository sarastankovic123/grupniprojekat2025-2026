package models

import "go.mongodb.org/mongo-driver/bson/primitive"

type Album struct {
	ID         primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	Title      string             `bson:"title" json:"title"`
	ReleaseDate string            `bson:"releaseDate" json:"releaseDate"`
	Genres     []string           `bson:"genres" json:"genres"`
	ArtistID   primitive.ObjectID `bson:"artistId" json:"artistId"`
}
