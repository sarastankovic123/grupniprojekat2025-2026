package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type MagicLinkToken struct {
	ID        primitive.ObjectID  `bson:"_id,omitempty"`
	UserID    primitive.ObjectID  `bson:"userId"`
	TokenHash string              `bson:"tokenHash"`
	ExpiresAt time.Time           `bson:"expiresAt"`
	UsedAt    *time.Time          `bson:"usedAt,omitempty"`
	CreatedAt time.Time           `bson:"createdAt"`
}
