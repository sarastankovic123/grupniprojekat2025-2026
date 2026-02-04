package middleware

import "shared-utils/logging"

// Logger is the package-level logger instance
// Set by main.go during service initialization
var Logger *logging.Logger

// SetLogger sets the package-level logger
func SetLogger(l *logging.Logger) {
	Logger = l
}
