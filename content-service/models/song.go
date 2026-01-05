package models

import "go.mongodb.org/mongo-driver/bson/primitive"

type Song struct {
	ID       primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	Title    string             `bson:"title" json:"title"`
	Duration string             `bson:"duration,omitempty" json:"duration,omitempty"`
	TrackNo  int                `bson:"trackNo,omitempty" json:"trackNo,omitempty"`
	AlbumID  primitive.ObjectID `bson:"albumId" json:"albumId"`
}
