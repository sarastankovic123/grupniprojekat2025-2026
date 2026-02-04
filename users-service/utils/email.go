package utils

import "users-service/email"

func SendOTPEmail(to, otp string) error {
	emailService := email.GetEmailService()
	return emailService.SendOTP(to, otp, 5) // 5 minutes expiry
}

func SendMagicLinkEmail(to, link string) error {
	emailService := email.GetEmailService()
	return emailService.SendMagicLink(to, link, 15) // 15 minutes expiry
}

func SendPasswordResetEmail(to, link string) error {
	emailService := email.GetEmailService()
	return emailService.SendPasswordReset(to, link, 15) // 15 minutes expiry
}

func SendEmailConfirmationEmail(to, link string) error {
	emailService := email.GetEmailService()
	return emailService.SendEmailConfirmation(to, link, 30) // 30 minutes expiry
}
