package repository

import (
	"context"
	"fmt"

	"recommendation-service/db"
	"recommendation-service/models"

	"github.com/neo4j/neo4j-go-driver/v5/neo4j"
)

func GetSubscribedGenreSongs(ctx context.Context, userID string, limit int) ([]models.RecommendedSong, error) {
	session := db.Neo4jDriver.NewSession(ctx, neo4j.SessionConfig{AccessMode: neo4j.AccessModeRead})
	defer session.Close(ctx)

	cypher := `
		MATCH (u:User {mongoId: $userId})-[:SUBSCRIBED_TO]->(g:Genre)<-[:BELONGS_TO]-(s:Song)
		WHERE NOT EXISTS {
			MATCH (u)-[r:RATED]->(s) WHERE r.rating < 4
		}
		RETURN DISTINCT s.mongoId AS id, s.title AS title, s.duration AS duration,
		       s.trackNo AS trackNo, s.albumId AS albumId, g.name AS genre
		LIMIT $limit
	`

	result, err := session.Run(ctx, cypher, map[string]interface{}{
		"userId": userID,
		"limit":  limit,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to query subscribed genre songs: %w", err)
	}

	var songs []models.RecommendedSong
	for result.Next(ctx) {
		record := result.Record()
		song := models.RecommendedSong{
			ID:       getStringValue(record, "id"),
			Title:    getStringValue(record, "title"),
			Duration: getStringValue(record, "duration"),
			TrackNo:  getIntValue(record, "trackNo"),
			AlbumID:  getStringValue(record, "albumId"),
			Genre:    getStringValue(record, "genre"),
		}
		songs = append(songs, song)
	}

	if err := result.Err(); err != nil {
		return nil, fmt.Errorf("error iterating subscribed genre songs: %w", err)
	}

	return songs, nil
}

func GetDiscoverNewSongs(ctx context.Context, userID string, limit int) ([]models.RecommendedSong, error) {
	session := db.Neo4jDriver.NewSession(ctx, neo4j.SessionConfig{AccessMode: neo4j.AccessModeRead})
	defer session.Close(ctx)

	cypher := `
		MATCH (s:Song)-[:BELONGS_TO]->(g:Genre)
		WHERE NOT EXISTS {
			MATCH (:User {mongoId: $userId})-[:SUBSCRIBED_TO]->(g)
		}
		WITH s, g
		OPTIONAL MATCH ()-[r:RATED]->(s)
		WITH s, g, count(r) AS totalRatings
		WHERE totalRatings <= 5
		RETURN DISTINCT s.mongoId AS id, s.title AS title, s.duration AS duration,
		       s.trackNo AS trackNo, s.albumId AS albumId, g.name AS genre
		LIMIT $limit
	`

	result, err := session.Run(ctx, cypher, map[string]interface{}{
		"userId": userID,
		"limit":  limit,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to query discover new songs: %w", err)
	}

	var songs []models.RecommendedSong
	for result.Next(ctx) {
		record := result.Record()
		song := models.RecommendedSong{
			ID:       getStringValue(record, "id"),
			Title:    getStringValue(record, "title"),
			Duration: getStringValue(record, "duration"),
			TrackNo:  getIntValue(record, "trackNo"),
			AlbumID:  getStringValue(record, "albumId"),
			Genre:    getStringValue(record, "genre"),
		}
		songs = append(songs, song)
	}

	if err := result.Err(); err != nil {
		return nil, fmt.Errorf("error iterating discover new songs: %w", err)
	}

	return songs, nil
}

func getStringValue(record *neo4j.Record, key string) string {
	val, ok := record.Get(key)
	if !ok || val == nil {
		return ""
	}
	s, ok := val.(string)
	if !ok {
		return ""
	}
	return s
}

func getIntValue(record *neo4j.Record, key string) int {
	val, ok := record.Get(key)
	if !ok || val == nil {
		return 0
	}
	switch v := val.(type) {
	case int64:
		return int(v)
	case int:
		return v
	case float64:
		return int(v)
	default:
		return 0
	}
}
