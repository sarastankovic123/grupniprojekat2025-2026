package utils

import "log"

func SendOTPEmail(email string, otp string) error {
	log.Printf("[DEV OTP] Send OTP to %s: %s\n", email, otp)
	return nil
}
