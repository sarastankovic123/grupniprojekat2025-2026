package sync

import (
	"context"
	"fmt"
	"time"

	"recommendation-service/db"

	"github.com/neo4j/neo4j-go-driver/v5/neo4j"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type mongoAlbum struct {
	ID       primitive.ObjectID `bson:"_id"`
	Title    string             `bson:"title"`
	Genres   []string           `bson:"genres"`
	ArtistID primitive.ObjectID `bson:"artistId"`
}

type mongoSong struct {
	ID       primitive.ObjectID `bson:"_id"`
	Title    string             `bson:"title"`
	Duration string             `bson:"duration"`
	TrackNo  int                `bson:"trackNo"`
	AlbumID  primitive.ObjectID `bson:"albumId"`
}

type mongoRating struct {
	UserID primitive.ObjectID `bson:"userId"`
	SongID primitive.ObjectID `bson:"songId"`
	Rating int                `bson:"rating"`
}

type mongoGenreSubscription struct {
	UserID primitive.ObjectID `bson:"userId"`
	Genre  string             `bson:"genre"`
}

type songData struct {
	MongoID  string   `json:"mongoId"`
	Title    string   `json:"title"`
	Duration string   `json:"duration"`
	TrackNo  int      `json:"trackNo"`
	AlbumID  string   `json:"albumId"`
	Genres   []string `json:"genres"`
}

type subData struct {
	UserID string `json:"userId"`
	Genre  string `json:"genre"`
}

type ratingData struct {
	UserID string `json:"userId"`
	SongID string `json:"songId"`
	Rating int    `json:"rating"`
}

func SyncAll() {
	fmt.Println("Starting MongoDB -> Neo4j data sync...")
	start := time.Now()

	ctx := context.Background()

	createConstraints(ctx)

	syncSongsAndGenres(ctx)

	syncGenreSubscriptions(ctx)

	syncRatings(ctx)

	fmt.Printf("Data sync completed in %v\n", time.Since(start))
}

func createConstraints(ctx context.Context) {
	session := db.Neo4jDriver.NewSession(ctx, neo4j.SessionConfig{AccessMode: neo4j.AccessModeWrite})
	defer session.Close(ctx)

	constraints := []string{
		"CREATE CONSTRAINT IF NOT EXISTS FOR (s:Song) REQUIRE s.mongoId IS UNIQUE",
		"CREATE CONSTRAINT IF NOT EXISTS FOR (g:Genre) REQUIRE g.name IS UNIQUE",
		"CREATE CONSTRAINT IF NOT EXISTS FOR (u:User) REQUIRE u.mongoId IS UNIQUE",
	}

	for _, cypher := range constraints {
		_, err := session.Run(ctx, cypher, nil)
		if err != nil {
			fmt.Printf("Warning: failed to create constraint: %v\n", err)
		}
	}

	fmt.Println("Neo4j constraints created")
}

func syncSongsAndGenres(ctx context.Context) {
	albumCursor, err := db.AlbumsCollection.Find(ctx, bson.M{})
	if err != nil {
		fmt.Printf("Error fetching albums: %v\n", err)
		return
	}
	defer albumCursor.Close(ctx)

	albumGenres := make(map[string][]string)
	for albumCursor.Next(ctx) {
		var album mongoAlbum
		if err := albumCursor.Decode(&album); err != nil {
			continue
		}
		albumGenres[album.ID.Hex()] = album.Genres
	}

	songCursor, err := db.SongsCollection.Find(ctx, bson.M{})
	if err != nil {
		fmt.Printf("Error fetching songs: %v\n", err)
		return
	}
	defer songCursor.Close(ctx)

	var songs []map[string]interface{}
	for songCursor.Next(ctx) {
		var song mongoSong
		if err := songCursor.Decode(&song); err != nil {
			continue
		}

		genres := albumGenres[song.AlbumID.Hex()]
		if len(genres) == 0 {
			genres = []string{}
		}

		songs = append(songs, map[string]interface{}{
			"mongoId":  song.ID.Hex(),
			"title":    song.Title,
			"duration": song.Duration,
			"trackNo":  song.TrackNo,
			"albumId":  song.AlbumID.Hex(),
			"genres":   genres,
		})
	}

	if len(songs) == 0 {
		fmt.Println("No songs to sync")
		return
	}

	session := db.Neo4jDriver.NewSession(ctx, neo4j.SessionConfig{AccessMode: neo4j.AccessModeWrite})
	defer session.Close(ctx)

	cypher := `
		UNWIND $songs AS s
		MERGE (song:Song {mongoId: s.mongoId})
		SET song.title = s.title, song.duration = s.duration,
		    song.trackNo = s.trackNo, song.albumId = s.albumId
		WITH song, s
		UNWIND s.genres AS genreName
		MERGE (g:Genre {name: genreName})
		MERGE (song)-[:BELONGS_TO]->(g)
	`

	_, err = session.Run(ctx, cypher, map[string]interface{}{"songs": songs})
	if err != nil {
		fmt.Printf("Error syncing songs to Neo4j: %v\n", err)
		return
	}

	fmt.Printf("Synced %d songs with genres to Neo4j\n", len(songs))
}

func syncGenreSubscriptions(ctx context.Context) {
	cursor, err := db.GenreSubscriptionsCollection.Find(ctx, bson.M{})
	if err != nil {
		fmt.Printf("Error fetching genre subscriptions: %v\n", err)
		return
	}
	defer cursor.Close(ctx)

	var subs []map[string]interface{}
	for cursor.Next(ctx) {
		var sub mongoGenreSubscription
		if err := cursor.Decode(&sub); err != nil {
			continue
		}
		subs = append(subs, map[string]interface{}{
			"userId": sub.UserID.Hex(),
			"genre":  sub.Genre,
		})
	}

	if len(subs) == 0 {
		fmt.Println("No genre subscriptions to sync")
		return
	}

	session := db.Neo4jDriver.NewSession(ctx, neo4j.SessionConfig{AccessMode: neo4j.AccessModeWrite})
	defer session.Close(ctx)

	cypher := `
		UNWIND $subs AS sub
		MERGE (u:User {mongoId: sub.userId})
		MERGE (g:Genre {name: sub.genre})
		MERGE (u)-[:SUBSCRIBED_TO]->(g)
	`

	_, err = session.Run(ctx, cypher, map[string]interface{}{"subs": subs})
	if err != nil {
		fmt.Printf("Error syncing genre subscriptions to Neo4j: %v\n", err)
		return
	}

	fmt.Printf("Synced %d genre subscriptions to Neo4j\n", len(subs))
}

func syncRatings(ctx context.Context) {
	cursor, err := db.UserRatingsCollection.Find(ctx, bson.M{})
	if err != nil {
		fmt.Printf("Error fetching ratings: %v\n", err)
		return
	}
	defer cursor.Close(ctx)

	var ratings []map[string]interface{}
	for cursor.Next(ctx) {
		var r mongoRating
		if err := cursor.Decode(&r); err != nil {
			continue
		}
		ratings = append(ratings, map[string]interface{}{
			"userId": r.UserID.Hex(),
			"songId": r.SongID.Hex(),
			"rating": r.Rating,
		})
	}

	if len(ratings) == 0 {
		fmt.Println("No ratings to sync")
		return
	}

	session := db.Neo4jDriver.NewSession(ctx, neo4j.SessionConfig{AccessMode: neo4j.AccessModeWrite})
	defer session.Close(ctx)

	cypher := `
		UNWIND $ratings AS r
		MERGE (u:User {mongoId: r.userId})
		MERGE (s:Song {mongoId: r.songId})
		MERGE (u)-[rel:RATED]->(s)
		SET rel.rating = r.rating
	`

	_, err = session.Run(ctx, cypher, map[string]interface{}{"ratings": ratings})
	if err != nil {
		fmt.Printf("Error syncing ratings to Neo4j: %v\n", err)
		return
	}

	fmt.Printf("Synced %d ratings to Neo4j\n", len(ratings))
}
