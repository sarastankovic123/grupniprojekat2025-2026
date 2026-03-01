package handlers

import "shared-utils/logging"

var Logger *logging.Logger

func SetLogger(l *logging.Logger) {
	Logger = l
}
