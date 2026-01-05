package models

import "go.mongodb.org/mongo-driver/bson/primitive"

type Song struct {
	ID       primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	Title    string             `bson:"title" json:"title"`
	Duration string             `bson:"duration" json:"duration"`
	TrackNo  int                `bson:"trackNo" json:"trackNo"`
	AlbumID  primitive.ObjectID `bson:"albumId" json:"albumId"`
}