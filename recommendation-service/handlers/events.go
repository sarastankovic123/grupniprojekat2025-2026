package handlers

import (
	"log"
	"net/http"
	"recommendation-service/sync"

	"github.com/gin-gonic/gin"
)

type AsyncEventRequest struct {
	Type   string                 `json:"type" binding:"required,min=3,max=100"`
	Source string                 `json:"source" binding:"omitempty,max=100"`
	Data   map[string]interface{} `json:"data"`
}

func HandleAsyncEvent(c *gin.Context) {
	var req AsyncEventRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid event payload"})
		return
	}

	sync.TriggerAsyncRefresh()

	if Logger != nil {
		Logger.Application.Info().
			Str("event_type", req.Type).
			Str("source", req.Source).
			Msg("Accepted async event")
	}
	log.Printf("Accepted async event type=%s source=%s", req.Type, req.Source)

	c.JSON(http.StatusAccepted, gin.H{
		"message": "Event accepted",
	})
}
