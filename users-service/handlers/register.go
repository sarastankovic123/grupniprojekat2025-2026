package handlers

import (
	"fmt"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"

	"users-service/models"
	"users-service/repository"
	"users-service/utils"
)


func Register(c *gin.Context) {
	var req RegisterRequest


	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}


	if req.Username == "" || req.Email == "" || req.Password == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Missing required fields"})
		return
	}

	if !utils.IsValidEmail(req.Email) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid email format"})
		return
	}

	if req.Password != req.ConfirmPassword {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Passwords do not match"})
		return
	}

	if !utils.IsStrongPassword(req.Password) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Password is not strong enough"})
		return
	}


	_, err := repository.FindUserByUsername(req.Username)
	if err == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Username already exists"})
		return
	}


	hash, err := utils.HashPassword(req.Password)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Password hashing failed"})
		return
	}


	user := models.User{
		Username:          req.Username,
		Email:             req.Email,
		FirstName:         req.FirstName,
		LastName:          req.LastName,
		PasswordHash:      hash,
		Role:              "USER",
		IsConfirmed:       false,
		PasswordChangedAt: time.Now(),
		CreatedAt:         time.Now(),
	}


	if err := repository.CreateUser(&user); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}



	tokenValue, err := utils.GenerateToken()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Token generation failed"})
		return
	}

	emailToken := models.EmailConfirmationToken{
		UserID:    user.ID,
		Token:     tokenValue,
		ExpiresAt: time.Now().Add(30 * time.Minute),
		CreatedAt: time.Now(),
	}

	if err := repository.SaveEmailToken(emailToken); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Saving email token failed"})
		return
	}


	confirmationLink := "http://localhost:5173/confirm?token=" + tokenValue


	fmt.Println("CONFIRM LINK:", confirmationLink)


	c.JSON(http.StatusCreated, gin.H{
      "message": "Registration successful. Please confirm your email.",
      "token": tokenValue,
    })

}
