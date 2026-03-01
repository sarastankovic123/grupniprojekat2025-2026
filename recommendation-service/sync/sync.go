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

type mongoArtist struct {
	ID   primitive.ObjectID `bson:"_id"`
	Name string             `bson:"name"`
}

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

func SyncAll() {
	fmt.Println("Starting MongoDB -> Neo4j data sync...")
	start := time.Now()

	ctx := context.Background()

	createConstraints(ctx)
	clearGraphRelationships(ctx)

	artistIDs := syncArtists(ctx)
	songIDs, songGenres, artistIDsFromSongs := syncSongsAndGenres(ctx)
	subUserIDs, subGenres := syncGenreSubscriptions(ctx)
	ratingUserIDs := syncRatings(ctx)

	pruneStaleNodes(
		ctx,
		songIDs,
		uniqueStrings(append(artistIDs, artistIDsFromSongs...)),
		uniqueStrings(append(songGenres, subGenres...)),
		uniqueStrings(append(subUserIDs, ratingUserIDs...)),
	)

	fmt.Printf("Data sync completed in %v\n", time.Since(start))
}

func createConstraints(ctx context.Context) {
	session := db.Neo4jDriver.NewSession(ctx, neo4j.SessionConfig{AccessMode: neo4j.AccessModeWrite})
	defer session.Close(ctx)

	constraints := []string{
		"CREATE CONSTRAINT IF NOT EXISTS FOR (s:Song) REQUIRE s.mongoId IS UNIQUE",
		"CREATE CONSTRAINT IF NOT EXISTS FOR (g:Genre) REQUIRE g.name IS UNIQUE",
		"CREATE CONSTRAINT IF NOT EXISTS FOR (u:User) REQUIRE u.mongoId IS UNIQUE",
		"CREATE CONSTRAINT IF NOT EXISTS FOR (a:Artist) REQUIRE a.mongoId IS UNIQUE",
	}

	for _, cypher := range constraints {
		_, err := session.Run(ctx, cypher, nil)
		if err != nil {
			fmt.Printf("Warning: failed to create constraint: %v\n", err)
		}
	}

	fmt.Println("Neo4j constraints created")
}

func clearGraphRelationships(ctx context.Context) {
	session := db.Neo4jDriver.NewSession(ctx, neo4j.SessionConfig{AccessMode: neo4j.AccessModeWrite})
	defer session.Close(ctx)

	queries := []string{
		"MATCH ()-[r:BELONGS_TO]->() DELETE r",
		"MATCH ()-[r:CREATED_BY]->() DELETE r",
		"MATCH ()-[r:SUBSCRIBED_TO]->() DELETE r",
		"MATCH ()-[r:RATED]->() DELETE r",
	}

	for _, q := range queries {
		if _, err := session.Run(ctx, q, nil); err != nil {
			fmt.Printf("Warning: failed clearing relationships (%s): %v\n", q, err)
		}
	}
}

func syncArtists(ctx context.Context) []string {
	cursor, err := db.ArtistsCollection.Find(ctx, bson.M{})
	if err != nil {
		fmt.Printf("Error fetching artists: %v\n", err)
		return nil
	}
	defer cursor.Close(ctx)

	var rows []map[string]interface{}
	var artistIDs []string
	for cursor.Next(ctx) {
		var artist mongoArtist
		if err := cursor.Decode(&artist); err != nil {
			continue
		}
		id := artist.ID.Hex()
		artistIDs = append(artistIDs, id)
		rows = append(rows, map[string]interface{}{
			"mongoId": id,
			"name":    artist.Name,
		})
	}

	if len(rows) == 0 {
		fmt.Println("No artists to sync")
		return uniqueStrings(artistIDs)
	}

	session := db.Neo4jDriver.NewSession(ctx, neo4j.SessionConfig{AccessMode: neo4j.AccessModeWrite})
	defer session.Close(ctx)

	cypher := `
		UNWIND $artists AS a
		MERGE (artist:Artist {mongoId: a.mongoId})
		SET artist.name = a.name
	`

	if _, err := session.Run(ctx, cypher, map[string]interface{}{"artists": rows}); err != nil {
		fmt.Printf("Error syncing artists to Neo4j: %v\n", err)
		return uniqueStrings(artistIDs)
	}

	fmt.Printf("Synced %d artists to Neo4j\n", len(rows))
	return uniqueStrings(artistIDs)
}

func syncSongsAndGenres(ctx context.Context) ([]string, []string, []string) {
	albumCursor, err := db.AlbumsCollection.Find(ctx, bson.M{})
	if err != nil {
		fmt.Printf("Error fetching albums: %v\n", err)
		return nil, nil, nil
	}
	defer albumCursor.Close(ctx)

	type albumMeta struct {
		genres   []string
		artistID string
	}
	albumData := make(map[string]albumMeta)
	artistIDsSet := make(map[string]struct{})
	genreSet := make(map[string]struct{})

	for albumCursor.Next(ctx) {
		var album mongoAlbum
		if err := albumCursor.Decode(&album); err != nil {
			continue
		}

		artistID := album.ArtistID.Hex()
		artistIDsSet[artistID] = struct{}{}

		for _, g := range album.Genres {
			if g != "" {
				genreSet[g] = struct{}{}
			}
		}

		albumData[album.ID.Hex()] = albumMeta{
			genres:   album.Genres,
			artistID: artistID,
		}
	}

	songCursor, err := db.SongsCollection.Find(ctx, bson.M{})
	if err != nil {
		fmt.Printf("Error fetching songs: %v\n", err)
		return nil, mapKeys(genreSet), mapKeys(artistIDsSet)
	}
	defer songCursor.Close(ctx)

	var songs []map[string]interface{}
	var songIDs []string
	for songCursor.Next(ctx) {
		var song mongoSong
		if err := songCursor.Decode(&song); err != nil {
			continue
		}

		songID := song.ID.Hex()
		songIDs = append(songIDs, songID)

		meta, ok := albumData[song.AlbumID.Hex()]
		genres := []string{}
		artistID := ""
		if ok {
			genres = meta.genres
			artistID = meta.artistID
		}

		songs = append(songs, map[string]interface{}{
			"mongoId":  songID,
			"title":    song.Title,
			"duration": song.Duration,
			"trackNo":  song.TrackNo,
			"albumId":  song.AlbumID.Hex(),
			"genres":   genres,
			"artistId": artistID,
		})
	}

	if len(songs) == 0 {
		fmt.Println("No songs to sync")
		return uniqueStrings(songIDs), mapKeys(genreSet), mapKeys(artistIDsSet)
	}

	session := db.Neo4jDriver.NewSession(ctx, neo4j.SessionConfig{AccessMode: neo4j.AccessModeWrite})
	defer session.Close(ctx)

	cypher := `
		UNWIND $songs AS s
		MERGE (song:Song {mongoId: s.mongoId})
		SET song.title = s.title, song.duration = s.duration,
		    song.trackNo = s.trackNo, song.albumId = s.albumId
		WITH song, s
		FOREACH (_ IN CASE WHEN s.artistId <> '' THEN [1] ELSE [] END |
			MERGE (a:Artist {mongoId: s.artistId})
			MERGE (song)-[:CREATED_BY]->(a)
		)
		WITH song, s
		UNWIND s.genres AS genreName
		MERGE (g:Genre {name: genreName})
		MERGE (song)-[:BELONGS_TO]->(g)
	`

	if _, err := session.Run(ctx, cypher, map[string]interface{}{"songs": songs}); err != nil {
		fmt.Printf("Error syncing songs to Neo4j: %v\n", err)
		return uniqueStrings(songIDs), mapKeys(genreSet), mapKeys(artistIDsSet)
	}

	fmt.Printf("Synced %d songs with genres/artists to Neo4j\n", len(songs))
	return uniqueStrings(songIDs), mapKeys(genreSet), mapKeys(artistIDsSet)
}

func syncGenreSubscriptions(ctx context.Context) ([]string, []string) {
	cursor, err := db.GenreSubscriptionsCollection.Find(ctx, bson.M{})
	if err != nil {
		fmt.Printf("Error fetching genre subscriptions: %v\n", err)
		return nil, nil
	}
	defer cursor.Close(ctx)

	var subs []map[string]interface{}
	userIDSet := make(map[string]struct{})
	genreSet := make(map[string]struct{})

	for cursor.Next(ctx) {
		var sub mongoGenreSubscription
		if err := cursor.Decode(&sub); err != nil {
			continue
		}

		userID := sub.UserID.Hex()
		userIDSet[userID] = struct{}{}
		if sub.Genre != "" {
			genreSet[sub.Genre] = struct{}{}
		}

		subs = append(subs, map[string]interface{}{
			"userId": userID,
			"genre":  sub.Genre,
		})
	}

	if len(subs) == 0 {
		fmt.Println("No genre subscriptions to sync")
		return mapKeys(userIDSet), mapKeys(genreSet)
	}

	session := db.Neo4jDriver.NewSession(ctx, neo4j.SessionConfig{AccessMode: neo4j.AccessModeWrite})
	defer session.Close(ctx)

	cypher := `
		UNWIND $subs AS sub
		MERGE (u:User {mongoId: sub.userId})
		MERGE (g:Genre {name: sub.genre})
		MERGE (u)-[:SUBSCRIBED_TO]->(g)
	`

	if _, err := session.Run(ctx, cypher, map[string]interface{}{"subs": subs}); err != nil {
		fmt.Printf("Error syncing genre subscriptions to Neo4j: %v\n", err)
		return mapKeys(userIDSet), mapKeys(genreSet)
	}

	fmt.Printf("Synced %d genre subscriptions to Neo4j\n", len(subs))
	return mapKeys(userIDSet), mapKeys(genreSet)
}

func syncRatings(ctx context.Context) []string {
	cursor, err := db.UserRatingsCollection.Find(ctx, bson.M{})
	if err != nil {
		fmt.Printf("Error fetching ratings: %v\n", err)
		return nil
	}
	defer cursor.Close(ctx)

	var ratings []map[string]interface{}
	userIDSet := make(map[string]struct{})

	for cursor.Next(ctx) {
		var r mongoRating
		if err := cursor.Decode(&r); err != nil {
			continue
		}

		userID := r.UserID.Hex()
		userIDSet[userID] = struct{}{}

		ratings = append(ratings, map[string]interface{}{
			"userId": userID,
			"songId": r.SongID.Hex(),
			"rating": r.Rating,
		})
	}

	if len(ratings) == 0 {
		fmt.Println("No ratings to sync")
		return mapKeys(userIDSet)
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

	if _, err := session.Run(ctx, cypher, map[string]interface{}{"ratings": ratings}); err != nil {
		fmt.Printf("Error syncing ratings to Neo4j: %v\n", err)
		return mapKeys(userIDSet)
	}

	fmt.Printf("Synced %d ratings to Neo4j\n", len(ratings))
	return mapKeys(userIDSet)
}

func pruneStaleNodes(ctx context.Context, songIDs []string, artistIDs []string, genreNames []string, userIDs []string) {
	pruneNodesByValues(ctx, "Song", "mongoId", songIDs)
	pruneNodesByValues(ctx, "Artist", "mongoId", artistIDs)
	pruneNodesByValues(ctx, "Genre", "name", genreNames)
	pruneNodesByValues(ctx, "User", "mongoId", userIDs)
}

func pruneNodesByValues(ctx context.Context, label string, key string, values []string) {
	session := db.Neo4jDriver.NewSession(ctx, neo4j.SessionConfig{AccessMode: neo4j.AccessModeWrite})
	defer session.Close(ctx)

	var (
		cypher string
		params map[string]interface{}
	)
	if len(values) == 0 {
		cypher = fmt.Sprintf("MATCH (n:%s) DETACH DELETE n", label)
		params = nil
	} else {
		cypher = fmt.Sprintf("MATCH (n:%s) WHERE NOT n.%s IN $values DETACH DELETE n", label, key)
		params = map[string]interface{}{"values": values}
	}

	if _, err := session.Run(ctx, cypher, params); err != nil {
		fmt.Printf("Warning: failed pruning %s nodes: %v\n", label, err)
	}
}

func mapKeys(m map[string]struct{}) []string {
	out := make([]string, 0, len(m))
	for k := range m {
		out = append(out, k)
	}
	return out
}

func uniqueStrings(values []string) []string {
	seen := make(map[string]struct{}, len(values))
	out := make([]string, 0, len(values))
	for _, v := range values {
		if v == "" {
			continue
		}
		if _, ok := seen[v]; ok {
			continue
		}
		seen[v] = struct{}{}
		out = append(out, v)
	}
	return out
}
