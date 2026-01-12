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
	var req struct {
		Token string `json:"token" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Token missing"})
		return
	}

	token := req.Token

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
