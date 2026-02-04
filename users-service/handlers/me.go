package handlers

import (
	"context"
	"errors"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"

	"users-service/repository"
	"users-service/utils"
)

func GetMe(c *gin.Context) {
	userIDHex := c.GetString("userID")
	userID, err := primitive.ObjectIDFromHex(userIDHex)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid user id"})
		return
	}

	user, err := repository.FindUserByID(userID)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"user": gin.H{
			"id":          user.ID.Hex(),
			"username":    user.Username,
			"email":       user.Email,
			"firstName":   user.FirstName,
			"lastName":    user.LastName,
			"role":        user.Role,
			"isConfirmed": user.IsConfirmed,
			"createdAt":   user.CreatedAt,
		},
	})
}

type UpdateMeRequest struct {
	Username  *string `json:"username" binding:"omitempty,min=3,max=50,alphanumund"`
	FirstName *string `json:"firstName" binding:"omitempty,min=1,max=100"`
	LastName  *string `json:"lastName" binding:"omitempty,min=1,max=100"`
}

func UpdateMe(c *gin.Context) {
	userIDHex := c.GetString("userID")
	userID, err := primitive.ObjectIDFromHex(userIDHex)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid user id"})
		return
	}

	var req UpdateMeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	if req.Username != nil && strings.TrimSpace(*req.Username) == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Username cannot be empty"})
		return
	}
	if req.FirstName != nil && strings.TrimSpace(*req.FirstName) == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "First name cannot be empty"})
		return
	}
	if req.LastName != nil && strings.TrimSpace(*req.LastName) == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Last name cannot be empty"})
		return
	}

	trimOrNil := func(s *string) *string {
		if s == nil {
			return nil
		}
		v := strings.TrimSpace(*s)
		if v == "" {
			return nil
		}
		return &v
	}

	username := trimOrNil(req.Username)
	firstName := trimOrNil(req.FirstName)
	lastName := trimOrNil(req.LastName)

	if username == nil && firstName == nil && lastName == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No fields to update"})
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	updated, err := repository.UpdateUserProfile(ctx, userID, username, firstName, lastName)
	if err != nil {
		var writeErr mongo.WriteException
		if errors.As(err, &writeErr) {
			for _, we := range writeErr.WriteErrors {
				if we.Code == 11000 {
					c.JSON(http.StatusBadRequest, gin.H{"error": "Username already exists"})
					return
				}
			}
		}

		if errors.Is(err, mongo.ErrNoDocuments) {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found"})
			return
		}

		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update profile"})
		return
	}

	jwtToken, err := utils.GenerateJWT(updated)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"access_token": jwtToken,
		"user": gin.H{
			"id":          updated.ID.Hex(),
			"username":    updated.Username,
			"email":       updated.Email,
			"firstName":   updated.FirstName,
			"lastName":    updated.LastName,
			"role":        updated.Role,
			"isConfirmed": updated.IsConfirmed,
			"createdAt":   updated.CreatedAt,
		},
	})
}
