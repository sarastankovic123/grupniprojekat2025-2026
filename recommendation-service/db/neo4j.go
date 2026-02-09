package db

import (
	"context"
	"fmt"
	"time"

	"recommendation-service/config"

	"github.com/neo4j/neo4j-go-driver/v5/neo4j"
)

var Neo4jDriver neo4j.DriverWithContext

func ConnectNeo4j() {
	const maxAttempts = 20
	const delay = 2 * time.Second

	var lastErr error

	for attempt := 1; attempt <= maxAttempts; attempt++ {
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)

		fmt.Println("RECOMMENDATION-SERVICE NEO4J URI:", config.Neo4jURI)

		driver, err := neo4j.NewDriverWithContext(
			config.Neo4jURI,
			neo4j.BasicAuth(config.Neo4jUser, config.Neo4jPassword, ""),
		)
		if err == nil {
			err = driver.VerifyConnectivity(ctx)
			if err == nil {
				cancel()
				Neo4jDriver = driver
				fmt.Printf("Connected to Neo4j (recommendation-service) after %d attempt(s)\n", attempt)
				return
			}
		}

		cancel()
		lastErr = err
		fmt.Printf("Neo4j not ready (recommendation-service) attempt %d/%d: %v\n", attempt, maxAttempts, err)
		time.Sleep(delay)
	}

	panic(lastErr)
}

func CloseNeo4j() {
	if Neo4jDriver != nil {
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()
		Neo4jDriver.Close(ctx)
	}
}
