package filevalidation

import (
	"errors"
	"io"
	"mime"
	"path/filepath"
)

// File upload constants
const (
	MaxFileSize = 10 * 1024 * 1024 // 10 MB
)

// Allowed MIME types for different file categories
var (
	AllowedImageTypes = map[string]bool{
		"image/jpeg": true,
		"image/png":  true,
		"image/gif":  true,
		"image/webp": true,
	}

	AllowedAudioTypes = map[string]bool{
		"audio/mpeg": true,
		"audio/mp3":  true,
		"audio/wav":  true,
		"audio/flac": true,
	}
)

// ValidateFileType checks if file extension and MIME type are allowed
func ValidateFileType(filename string, contentType string, allowedTypes map[string]bool) error {
	// Check extension
	ext := filepath.Ext(filename)
	expectedType := mime.TypeByExtension(ext)

	if !allowedTypes[contentType] {
		return errors.New("file type not allowed")
	}

	// Check MIME type matches extension
	if expectedType != "" && expectedType != contentType {
		return errors.New("file extension does not match content type")
	}

	return nil
}

// ValidateFileSize checks if file size is within limits
func ValidateFileSize(size int64) error {
	if size > MaxFileSize {
		return errors.New("file size exceeds maximum allowed (10 MB)")
	}
	if size == 0 {
		return errors.New("file is empty")
	}
	return nil
}

// CalculateChecksum computes SHA256 checksum for file integrity
// This is a stub for future implementation
func CalculateChecksum(file io.Reader) (string, error) {
	// Implementation for future use
	// This would use crypto/sha256 to compute file hash
	return "", errors.New("checksum calculation not implemented")
}

// ValidateImageDimensions checks image dimensions
// This is a stub for future implementation
func ValidateImageDimensions(file io.Reader, maxWidth, maxHeight int) error {
	// Implementation for future use
	// This would use image package to decode and check dimensions
	return errors.New("image dimension validation not implemented")
}
