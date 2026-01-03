package models

import "go.mongodb.org/mongo-driver/bson/primitive"

type Song struct {
	ID       primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	Title    string             `bson:"title" json:"title"`
	Duration int                `bson:"duration,omitempty" json:"duration,omitempty"`
	Genres   []string           `bson:"genres,omitempty" json:"genres,omitempty"`
	AlbumID  primitive.ObjectID `bson:"albumId" json:"albumId"`
}

