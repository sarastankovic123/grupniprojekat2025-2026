package bootstrap

import (
	"context"
	"fmt"
	"log"
	"os"
	"strings"
	"time"

	"shared-utils/auth"
	"users-service/db"
	"users-service/models"
	"users-service/repository"
	"users-service/utils"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
)

func EnsureAdminFromEnv() {
	email := strings.TrimSpace(os.Getenv("BOOTSTRAP_ADMIN_EMAIL"))
	password := os.Getenv("BOOTSTRAP_ADMIN_PASSWORD")
	if email == "" && password == "" {
		log.Println("Admin bootstrap disabled (BOOTSTRAP_ADMIN_EMAIL/BOOTSTRAP_ADMIN_PASSWORD not set)")
		return
	}
	if email == "" || password == "" {
		log.Println("BOOTSTRAP_ADMIN_EMAIL and BOOTSTRAP_ADMIN_PASSWORD must both be set; skipping admin bootstrap")
		return
	}

	if !utils.IsValidEmail(email) {
		log.Printf("BOOTSTRAP_ADMIN_EMAIL invalid (%q); skipping admin bootstrap\n", email)
		return
	}

	if !utils.IsStrongPassword(password) {
		log.Println("BOOTSTRAP_ADMIN_PASSWORD is not strong enough; skipping admin bootstrap")
		return
	}

	username := strings.TrimSpace(os.Getenv("BOOTSTRAP_ADMIN_USERNAME"))
	if username == "" {
		username = "admin"
	}
	firstName := strings.TrimSpace(os.Getenv("BOOTSTRAP_ADMIN_FIRST_NAME"))
	if firstName == "" {
		firstName = "Admin"
	}
	lastName := strings.TrimSpace(os.Getenv("BOOTSTRAP_ADMIN_LAST_NAME"))
	if lastName == "" {
		lastName = "User"
	}

	existing, err := repository.FindUserByEmail(email)
	if err == nil && existing != nil {
		normalized := auth.NormalizeRole(existing.Role)
		if normalized == auth.RoleAdmin {
			log.Printf("Bootstrap admin exists: %s\n", email)
			return
		}

		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()

		_, err := db.UsersCollection.UpdateOne(
			ctx,
			bson.M{"email": email},
			bson.M{"$set": bson.M{"role": auth.RoleAdmin}},
		)
		if err != nil {
			log.Printf("Failed to update bootstrap admin role for %s: %v\n", email, err)
			return
		}

		log.Printf("Updated user role to admin for %s\n", email)
		return
	}

	if err != nil && err != mongo.ErrNoDocuments {
		log.Printf("Failed to lookup user by email for bootstrap admin (%s): %v\n", email, err)
		return
	}

	// Ensure username is unique.
	if _, err := repository.FindUserByUsername(username); err == nil {
		username = fmt.Sprintf("%s_%d", username, time.Now().Unix())
	}

	hash, err := utils.HashPassword(password)
	if err != nil {
		log.Printf("Failed to hash bootstrap admin password: %v\n", err)
		return
	}

	now := time.Now()
	user := models.User{
		Username:          username,
		Email:             email,
		FirstName:         firstName,
		LastName:          lastName,
		PasswordHash:      hash,
		Role:              auth.RoleAdmin,
		IsConfirmed:       true,
		PasswordChangedAt: now,
		CreatedAt:         now,
	}

	if err := repository.CreateUser(&user); err != nil {
		log.Printf("Failed to create bootstrap admin user (%s): %v\n", email, err)
		return
	}

	log.Printf("Created bootstrap admin user: %s (username=%s)\n", email, username)
}
