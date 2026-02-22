package repository

import (
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"time"

	"notification-service/db"
	"notification-service/models"

	"github.com/gocql/gocql"
)

func CreateNotification(notification models.Notification) error {
	if notification.CreatedAt.IsZero() {
		notification.CreatedAt = time.Now().UTC()
	}

	if notification.ID == "" {
		id, err := newHexID24()
		if err != nil {
			return err
		}
		notification.ID = id
	}

	batch := db.Session.NewBatch(gocql.LoggedBatch)
	batch.Query(
		`INSERT INTO notifications_by_id (id, user_id, created_at, message, is_read) VALUES (?, ?, ?, ?, ?)`,
		notification.ID, notification.UserID, notification.CreatedAt, notification.Message, notification.IsRead,
	)
	batch.Query(
		`INSERT INTO notifications_by_user (user_id, created_at, id, message, is_read) VALUES (?, ?, ?, ?, ?)`,
		notification.UserID, notification.CreatedAt, notification.ID, notification.Message, notification.IsRead,
	)

	return db.Session.ExecuteBatch(batch)
}

func GetNotificationsByUserID(userID string) ([]models.Notification, error) {
	const limit = 200

	iter := db.Session.Query(
		`SELECT id, user_id, created_at, message, is_read FROM notifications_by_user WHERE user_id = ? LIMIT ?`,
		userID, limit,
	).Iter()

	notifications := make([]models.Notification, 0)
	var n models.Notification
	for iter.Scan(&n.ID, &n.UserID, &n.CreatedAt, &n.Message, &n.IsRead) {
		notifications = append(notifications, n)
	}
	if err := iter.Close(); err != nil {
		return nil, err
	}

	return notifications, nil
}

func GetNotificationByID(id string) (*models.Notification, error) {
	var notification models.Notification
	err := db.Session.Query(
		`SELECT id, user_id, created_at, message, is_read FROM notifications_by_id WHERE id = ?`,
		id,
	).Scan(&notification.ID, &notification.UserID, &notification.CreatedAt, &notification.Message, &notification.IsRead)
	if err != nil {
		return nil, err
	}

	return &notification, nil
}

func UpdateNotificationReadStatus(id string, isRead bool) error {
	var userID string
	var createdAt time.Time
	if err := db.Session.Query(
		`SELECT user_id, created_at FROM notifications_by_id WHERE id = ?`,
		id,
	).Scan(&userID, &createdAt); err != nil {
		if err == gocql.ErrNotFound {
			return fmt.Errorf("notification not found")
		}
		return err
	}

	batch := db.Session.NewBatch(gocql.LoggedBatch)
	batch.Query(`UPDATE notifications_by_id SET is_read = ? WHERE id = ?`, isRead, id)
	batch.Query(
		`UPDATE notifications_by_user SET is_read = ? WHERE user_id = ? AND created_at = ? AND id = ?`,
		isRead, userID, createdAt, id,
	)
	return db.Session.ExecuteBatch(batch)
}

func newHexID24() (string, error) {
	b := make([]byte, 12)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	return hex.EncodeToString(b), nil
}
