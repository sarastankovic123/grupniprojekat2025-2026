package utils

import "log"

func SendOTPEmail(email string, otp string) error {
	log.Printf("[DEV OTP] Send OTP to %s: %s\n", email, otp)
	return nil
}

func SendMagicLinkEmail(email string, link string) error {
	log.Printf("[DEV MAGIC LINK] Send magic link to %s: %s\n", email, link)
	return nil
}

func SendPasswordResetEmail(email string, link string) error {
	log.Printf("[DEV PASSWORD RESET] Send reset link to %s: %s\n", email, link)
	return nil
}
