package handlers

import (
	"context"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"

	"users-service/db"
	"users-service/repository"
)

func ConfirmEmail(c *gin.Context) {
	token := c.Query("token")
	if token == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Token missing"})
		return
	}

	emailToken, err := repository.FindEmailToken(token)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid token"})
		return
	}

	if time.Now().After(emailToken.ExpiresAt) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Token expired"})
		return
	}

	ctx := context.Background()

	_, err = db.UsersCollection.UpdateOne(
		ctx,
		bson.M{"_id": emailToken.UserID},
		bson.M{"$set": bson.M{"isConfirmed": true}},
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "User update failed"})
		return
	}

	_ = repository.DeleteEmailToken(token)

	c.JSON(http.StatusOK, gin.H{"message": "Account confirmed successfully"})
}
