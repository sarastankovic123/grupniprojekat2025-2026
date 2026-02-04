package email

type EmailMessage struct {
	To       []string
	Subject  string
	TextBody string
	HTMLBody string
	ReplyTo  string
}

type EmailService interface {
	SendOTP(to, otp string, expiryMinutes int) error
	SendMagicLink(to, link string, expiryMinutes int) error
	SendPasswordReset(to, link string, expiryMinutes int) error
	SendEmailConfirmation(to, link string, expiryMinutes int) error
}

type EmailProvider interface {
	Send(msg *EmailMessage) error
}

// Template data structures
type OTPTemplateData struct {
	OTP           string
	ExpiryMinutes int
}

type LinkTemplateData struct {
	Link          string
	ExpiryMinutes int
}
