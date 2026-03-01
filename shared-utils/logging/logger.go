package logging

import (
	"io"
	"os"
	"path/filepath"
	"time"

	"github.com/rs/zerolog"
	"gopkg.in/natefinch/lumberjack.v2"
)

type Logger struct {
	Security    zerolog.Logger
	Application zerolog.Logger
	serviceName string
}

type LogConfig struct {
	ServiceName   string // e.g., "users-service", "content-service"
	LogDir        string // Directory to store log files (default: "./logs")
	MaxSize       int    // Maximum size in MB before rotation (default: 50)
	MaxBackups    int    // Maximum number of old log files to keep (default: 30)
	MaxAge        int    // Maximum days to retain old log files (default: 90)
	Compress      bool   // Compress rotated files with gzip (default: true)
	ConsoleOutput bool   // Also output to console (useful for development)
}

func NewLogger(config LogConfig) (*Logger, error) {
	if config.LogDir == "" {
		config.LogDir = "./logs"
	}
	if config.MaxSize == 0 {
		config.MaxSize = 50
	}
	if config.MaxBackups == 0 {
		config.MaxBackups = 30
	}
	if config.MaxAge == 0 {
		config.MaxAge = 90
	}

	if err := os.MkdirAll(config.LogDir, 0750); err != nil {
		return nil, err
	}

	securityLogFile := filepath.Join(config.LogDir, "security.log")
	securityWriter := &lumberjack.Logger{
		Filename:   securityLogFile,
		MaxSize:    config.MaxSize,
		MaxBackups: config.MaxBackups,
		MaxAge:     config.MaxAge,
		Compress:   config.Compress,
	}

	appLogFile := filepath.Join(config.LogDir, "application.log")
	appWriter := &lumberjack.Logger{
		Filename:   appLogFile,
		MaxSize:    config.MaxSize,
		MaxBackups: config.MaxBackups,
		MaxAge:     30, // Application logs kept for 30 days (not 90)
		Compress:   config.Compress,
	}

	var securityOut, appOut io.Writer
	if config.ConsoleOutput {
		securityOut = zerolog.MultiLevelWriter(securityWriter, zerolog.ConsoleWriter{Out: os.Stdout, TimeFormat: time.RFC3339})
		appOut = zerolog.MultiLevelWriter(appWriter, zerolog.ConsoleWriter{Out: os.Stdout, TimeFormat: time.RFC3339})
	} else {
		securityOut = securityWriter
		appOut = appWriter
	}

	securityLogger := zerolog.New(securityOut).With().
		Timestamp().
		Str("service", config.ServiceName).
		Logger()

	appLogger := zerolog.New(appOut).With().
		Timestamp().
		Str("service", config.ServiceName).
		Logger()

	return &Logger{
		Security:    securityLogger,
		Application: appLogger,
		serviceName: config.ServiceName,
	}, nil
}

func (l *Logger) WithContext(requestID, userID, email, ip, endpoint, method string) zerolog.Logger {
	return l.Security.With().
		Str("request_id", requestID).
		Str("user_id", userID).
		Str("email", email).
		Str("ip_address", ip).
		Str("endpoint", endpoint).
		Str("method", method).
		Logger()
}

func (l *Logger) Close() error {
	return nil
}
