package handlers

import (
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"users-service/models"
	"users-service/repository"
	"users-service/utils"
)

type MagicLinkRequest struct {
	Email string `json:"email"`
}

func RequestMagicLink(c *gin.Context) {
	var req MagicLinkRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusOK, gin.H{
			"message": "If the email exists, a magic link has been sent.",
		})
		return
	}

	user, err := repository.FindUserByEmail(req.Email)
	if err == nil {

		rawToken := make([]byte, 32)
		_, _ = rand.Read(rawToken)
		token := hex.EncodeToString(rawToken)

		hash := sha256.Sum256([]byte(token))

		magicToken := models.MagicLinkToken{
			ID:        primitive.NewObjectID(),
			UserID:    user.ID,
			TokenHash: hex.EncodeToString(hash[:]),
			ExpiresAt: time.Now().Add(15 * time.Minute),
			CreatedAt: time.Now(),
		}

		_ = repository.CreateMagicLinkToken(magicToken)

		frontendURL := strings.TrimRight(os.Getenv("FRONTEND_URL"), "/")
		if frontendURL == "" {
			frontendURL = "http://localhost:5173"
		}

		link := frontendURL + "/magic-login?token=" + token
		_ = utils.SendMagicLinkEmail(user.Email, link)
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "If the email exists, a magic link has been sent.",
	})
}
