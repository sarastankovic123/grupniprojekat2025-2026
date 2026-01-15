package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type User struct {
	ID                primitive.ObjectID `bson:"_id,omitempty"`
	Username          string             `bson:"username"`
	Email             string             `bson:"email"`
	FirstName         string             `bson:"firstName"`
	LastName          string             `bson:"lastName"`
	PasswordHash      string             `bson:"passwordHash"`
	Role              string             `bson:"role"`
	IsConfirmed       bool               `bson:"isConfirmed"`
	PasswordChangedAt time.Time          `bson:"passwordChangedAt"`
	PasswordLockUntil *time.Time         `bson:"passwordLockUntil,omitempty"`
	CreatedAt         time.Time          `bson:"createdAt"`
}
