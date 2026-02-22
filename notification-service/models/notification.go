package models

import (
	"time"
)

type Notification struct {
	ID        string    `json:"id"`
	UserID    string    `json:"userId"`
	Message   string    `json:"message"`
	CreatedAt time.Time `json:"createdAt"`
	IsRead    bool      `json:"isRead"`
}
