package models

import "go.mongodb.org/mongo-driver/bson/primitive"

type Song struct {
	ID       primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	Name     string             `bson:"name" json:"name"`
	Duration int                `bson:"duration" json:"duration"`
	Genre    string             `bson:"genre" json:"genre"`
	AlbumID  primitive.ObjectID `bson:"albumId" json:"albumId"`
}
