package handlers

import (
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"content-service/repository"
	"shared-utils/filevalidation"
	"shared-utils/validation"

	"github.com/gin-gonic/gin"
)

const songAudioDir = "./storage/audio"

func UploadSongAudio(c *gin.Context) {
	songID := strings.TrimSpace(c.Param("id"))
	if err := validation.ValidateObjectIDFormat(songID, "song ID"); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	fileHeader, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Missing multipart file field: file"})
		return
	}

	if err := filevalidation.ValidateFileSize(fileHeader.Size); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	src, err := fileHeader.Open()
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to open uploaded file"})
		return
	}
	defer src.Close()

	sniff := make([]byte, 512)
	n, _ := src.Read(sniff)
	contentType := http.DetectContentType(sniff[:n])

	if _, err := src.Seek(0, 0); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to process uploaded file"})
		return
	}

	originalName := fileHeader.Filename
	ext := strings.ToLower(filepath.Ext(originalName))
	if ext == "" {
		switch contentType {
		case "audio/mpeg":
			ext = ".mp3"
		case "audio/wav":
			ext = ".wav"
		case "audio/flac":
			ext = ".flac"
		default:
			ext = ""
		}
	}

	filename := songID + ext
	if err := filevalidation.ValidateFileType(filename, contentType, filevalidation.AllowedAudioTypes); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := os.MkdirAll(songAudioDir, 0o755); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create audio storage directory"})
		return
	}

	dstPath := filepath.Join(songAudioDir, filename)

	if err := c.SaveUploadedFile(fileHeader, dstPath); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save audio file"})
		return
	}

	if err := repository.SetSongAudioFile(songID, filename); err != nil {
		_ = os.Remove(dstPath)
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	Logger.Application.Info().
		Str("song_id", songID).
		Str("audio_file", filename).
		Msg("Song audio uploaded")

	c.JSON(http.StatusOK, gin.H{
		"message":  "Audio uploaded",
		"songId":   songID,
		"audioUrl": fmt.Sprintf("/api/content/songs/%s/audio", songID),
	})
}

func StreamSongAudio(c *gin.Context) {
	songID := strings.TrimSpace(c.Param("id"))
	if err := validation.ValidateObjectIDFormat(songID, "song ID"); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	song, err := repository.GetSongByID(songID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Song not found"})
		return
	}
	if strings.TrimSpace(song.AudioFile) == "" {
		c.JSON(http.StatusNotFound, gin.H{"error": "Audio not uploaded for this song"})
		return
	}

	p := filepath.Join(songAudioDir, song.AudioFile)
	f, err := os.Open(p)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Audio file not found on server"})
		return
	}
	defer f.Close()

	st, err := f.Stat()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to read audio file"})
		return
	}

	c.Writer.Header().Set("Cache-Control", "private, max-age=0, no-store")
	http.ServeContent(c.Writer, c.Request, song.AudioFile, st.ModTime().UTC(), f)
}
