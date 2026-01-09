package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type Notification struct {
	ID        primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	UserID    primitive.ObjectID `bson:"userId" json:"userId"`
	Message   string             `bson:"message" json:"message"`
	CreatedAt time.Time          `bson:"createdAt" json:"createdAt"`
	IsRead    bool               `bson:"isRead" json:"isRead"`
}
