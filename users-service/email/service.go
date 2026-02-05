package email

import (
	"sync"
	"users-service/config"

	"shared-utils/logging"
)

type emailService struct {
	provider        EmailProvider
	templateManager *TemplateManager
	logger          *logging.Logger
}

var instance *emailService
var once sync.Once

func InitEmailService(logger *logging.Logger) error {
	var err error
	once.Do(func() {
		var provider EmailProvider
		if config.EmailProvider == "smtp" {
			provider = NewSMTPProvider()
		}

		tm, tmErr := NewTemplateManager()
		if tmErr != nil {
			err = tmErr
			return
		}

		instance = &emailService{
			provider:        provider,
			templateManager: tm,
			logger:          logger,
		}
	})
	return err
}

func GetEmailService() *emailService {
	return instance
}

func (s *emailService) SendOTP(to, otp string, expiryMinutes int) error {
	data := OTPTemplateData{
		OTP:           otp,
		ExpiryMinutes: expiryMinutes,
	}

	htmlBody, err := s.templateManager.Render("otp.html", data)
	if err != nil {
		return err
	}

	textBody, err := s.templateManager.Render("otp.txt", data)
	if err != nil {
		return err
	}

	msg := &EmailMessage{
		To:       []string{to},
		Subject:  "Your Login Code",
		HTMLBody: htmlBody,
		TextBody: textBody,
	}

	return s.send(msg, "OTP")
}

func (s *emailService) SendMagicLink(to, link string, expiryMinutes int) error {
	data := LinkTemplateData{
		Link:          link,
		ExpiryMinutes: expiryMinutes,
	}

	htmlBody, err := s.templateManager.Render("magic_link.html", data)
	if err != nil {
		return err
	}

	textBody, err := s.templateManager.Render("magic_link.txt", data)
	if err != nil {
		return err
	}

	msg := &EmailMessage{
		To:       []string{to},
		Subject:  "Your Login Link",
		HTMLBody: htmlBody,
		TextBody: textBody,
	}

	return s.send(msg, "MagicLink")
}

func (s *emailService) SendPasswordReset(to, link string, expiryMinutes int) error {
	data := LinkTemplateData{
		Link:          link,
		ExpiryMinutes: expiryMinutes,
	}

	htmlBody, err := s.templateManager.Render("password_reset.html", data)
	if err != nil {
		return err
	}

	textBody, err := s.templateManager.Render("password_reset.txt", data)
	if err != nil {
		return err
	}

	msg := &EmailMessage{
		To:       []string{to},
		Subject:  "Reset Your Password",
		HTMLBody: htmlBody,
		TextBody: textBody,
	}

	return s.send(msg, "PasswordReset")
}

func (s *emailService) SendEmailConfirmation(to, link string, expiryMinutes int) error {
	data := LinkTemplateData{
		Link:          link,
		ExpiryMinutes: expiryMinutes,
	}

	htmlBody, err := s.templateManager.Render("email_confirmation.html", data)
	if err != nil {
		return err
	}

	textBody, err := s.templateManager.Render("email_confirmation.txt", data)
	if err != nil {
		return err
	}

	msg := &EmailMessage{
		To:       []string{to},
		Subject:  "Confirm Your Email Address",
		HTMLBody: htmlBody,
		TextBody: textBody,
	}

	return s.send(msg, "EmailConfirmation")
}

func (s *emailService) send(msg *EmailMessage, emailType string) error {
	// Development mode: override recipient or just log
	if config.EmailDevMode {
		if config.EmailDevRecipient != "" {
			msg.To = []string{config.EmailDevRecipient}
		} else {
			s.logger.Application.Info().
				Str("email_type", emailType).
				Str("original_to", msg.To[0]).
				Str("subject", msg.Subject).
				Str("text_body", msg.TextBody).
				Msg("Email not sent (dev mode, no dev recipient configured)")
			return nil
		}
	}

	// Send email
	err := s.provider.Send(msg)

	// Log result
	if err != nil {
		s.logger.Application.Error().
			Err(err).
			Str("email_type", emailType).
			Str("to", msg.To[0]).
			Msg("Failed to send email")
	} else {
		s.logger.Application.Info().
			Str("email_type", emailType).
			Str("to", msg.To[0]).
			Msg("Email sent successfully")
	}

	return err
}
