package models

import "go.mongodb.org/mongo-driver/bson/primitive"

type Artist struct {
	ID        primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	Name      string             `bson:"name" json:"name"`
	Image     string             `bson:"image,omitempty" json:"image,omitempty"`
	Biography string             `bson:"biography" json:"biography"`
	Genres    []string           `bson:"genres" json:"genres"`
}
