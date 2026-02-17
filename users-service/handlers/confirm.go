package handlers

import (
	"context"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"

	"users-service/db"
	"users-service/repository"
)

func ConfirmEmail(c *gin.Context) {
	token := c.Query("token")
	if token == "" {
		var req struct {
			Token string `json:"token" binding:"required"`
		}

		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Token missing"})
			return
		}
		token = req.Token
	}

	rawToken := token

	// Sometimes users copy/paste the token together with extra text (e.g. "in Docker Desktop").
	// Tokens are 64 hex chars, so we extract the first 64 hex characters and lowercase them.
	token = normalizeHexToken(rawToken, 64)
	if token == "" {
		// Backwards compatibility: accept legacy 56-char hex tokens as well.
		token = normalizeHexToken(rawToken, 56)
	}
	if token == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Token missing or malformed"})
		return
	}

	emailToken, err := repository.FindEmailToken(token)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid or expired confirmation link"})
		return
	}

	if time.Now().After(emailToken.ExpiresAt) {
		_ = repository.DeleteEmailToken(token)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid or expired confirmation link"})
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

func normalizeHexToken(input string, wantLen int) string {
	in := strings.TrimSpace(input)
	if in == "" {
		return ""
	}

	out := make([]byte, 0, wantLen)
	for i := 0; i < len(in) && len(out) < wantLen; i++ {
		b := in[i]
		switch {
		case b >= '0' && b <= '9':
			out = append(out, b)
		case b >= 'a' && b <= 'f':
			out = append(out, b)
		case b >= 'A' && b <= 'F':
			out = append(out, b+('a'-'A'))
		}
	}

	if len(out) != wantLen {
		return ""
	}
	return string(out)
}
