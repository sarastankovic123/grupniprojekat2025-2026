package email

import (
	"time"
	"users-service/config"

	"gopkg.in/gomail.v2"
)

type SMTPProvider struct {
	dialer *gomail.Dialer
}

func NewSMTPProvider() *SMTPProvider {
	d := gomail.NewDialer(
		config.SMTPHost,
		config.SMTPPort,
		config.SMTPUsername,
		config.SMTPPassword,
	)

	// Use STARTTLS instead of SSL
	if config.SMTPUseTLS {
		d.SSL = false
	}

	return &SMTPProvider{dialer: d}
}

func (p *SMTPProvider) Send(msg *EmailMessage) error {
	m := gomail.NewMessage()
	m.SetHeader("From", config.EmailFrom)
	m.SetHeader("To", msg.To...)
	m.SetHeader("Subject", msg.Subject)

	if msg.HTMLBody != "" {
		m.SetBody("text/html", msg.HTMLBody)
		m.AddAlternative("text/plain", msg.TextBody)
	} else {
		m.SetBody("text/plain", msg.TextBody)
	}

	if msg.ReplyTo != "" {
		m.SetHeader("Reply-To", msg.ReplyTo)
	}

	// Retry logic with exponential backoff
	var lastErr error
	for attempt := 0; attempt < config.EmailRetryAttempts; attempt++ {
		err := p.dialer.DialAndSend(m)
		if err == nil {
			return nil
		}
		lastErr = err

		// Wait before retry with exponential backoff
		if attempt < config.EmailRetryAttempts-1 {
			backoff := time.Duration(1<<uint(attempt)) * time.Second
			time.Sleep(backoff)
		}
	}

	return lastErr
}
