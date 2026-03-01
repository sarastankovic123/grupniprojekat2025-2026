package filevalidation

import (
	"errors"
	"io"
	"mime"
	"path/filepath"
)

const (
	MaxFileSize = 10 * 1024 * 1024 // 10 MB
)

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

func ValidateFileType(filename string, contentType string, allowedTypes map[string]bool) error {
	ext := filepath.Ext(filename)
	expectedType := mime.TypeByExtension(ext)

	if !allowedTypes[contentType] {
		return errors.New("file type not allowed")
	}

	if expectedType != "" && expectedType != contentType {
		return errors.New("file extension does not match content type")
	}

	return nil
}

func ValidateFileSize(size int64) error {
	if size > MaxFileSize {
		return errors.New("file size exceeds maximum allowed (10 MB)")
	}
	if size == 0 {
		return errors.New("file is empty")
	}
	return nil
}

func CalculateChecksum(file io.Reader) (string, error) {
	return "", errors.New("checksum calculation not implemented")
}

func ValidateImageDimensions(file io.Reader, maxWidth, maxHeight int) error {
	return errors.New("image dimension validation not implemented")
}
