package repository

import (
	"context"
	"fmt"
	"time"

	"notification-service/db"
	"notification-service/models"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo/options"
)

func CreateNotification(notification models.Notification) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if notification.ID.IsZero() {
		notification.ID = primitive.NewObjectID()
	}
	if notification.CreatedAt.IsZero() {
		notification.CreatedAt = time.Now()
	}

	_, err := db.NotificationsCollection.InsertOne(ctx, notification)
	return err
}

func GetNotificationsByUserID(userID string) ([]models.Notification, error) {
	objID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return nil, err
	}

	// Sort by createdAt descending (newest first)
	opts := options.Find().SetSort(bson.M{"createdAt": -1})

	cursor, err := db.NotificationsCollection.Find(
		context.Background(),
		bson.M{"userId": objID},
		opts,
	)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(context.Background())

	var notifications []models.Notification
	if err := cursor.All(context.Background(), &notifications); err != nil {
		return nil, err
	}

	if notifications == nil {
		notifications = []models.Notification{}
	}

	return notifications, nil
}

func GetNotificationByID(id string) (*models.Notification, error) {
	objID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return nil, err
	}

	var notification models.Notification
	err = db.NotificationsCollection.FindOne(
		context.Background(),
		bson.M{"_id": objID},
	).Decode(&notification)

	if err != nil {
		return nil, err
	}

	return &notification, nil
}

func UpdateNotificationReadStatus(id string, isRead bool) error {
	objID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return err
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	result, err := db.NotificationsCollection.UpdateOne(
		ctx,
		bson.M{"_id": objID},
		bson.M{"$set": bson.M{"isRead": isRead}},
	)

	if err != nil {
		return err
	}

	if result.MatchedCount == 0 {
		return fmt.Errorf("notification not found")
	}

	return nil
}
