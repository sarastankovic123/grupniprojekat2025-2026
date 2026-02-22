package db

import (
	"fmt"
	"regexp"
	"time"

	"notification-service/config"

	"github.com/gocql/gocql"
)

var Session *gocql.Session

func ConnectCassandra() {
	const maxAttempts = 30
	const delay = 2 * time.Second

	validateIdentifierOrPanic(config.CassandraKeyspace, "CASSANDRA_KEYSPACE")

	cluster := gocql.NewCluster(config.CassandraHosts...)
	cluster.Port = config.CassandraPort
	cluster.Consistency = gocql.Quorum
	cluster.Timeout = 5 * time.Second
	cluster.ConnectTimeout = 5 * time.Second

	if config.CassandraUsername != "" {
		cluster.Authenticator = gocql.PasswordAuthenticator{
			Username: config.CassandraUsername,
			Password: config.CassandraPassword,
		}
	}

	var lastErr error
	for attempt := 1; attempt <= maxAttempts; attempt++ {
		sysSession, err := cluster.CreateSession()
		if err == nil {
			if err := ensureSchema(sysSession, config.CassandraKeyspace); err == nil {
				sysSession.Close()

				cluster.Keyspace = config.CassandraKeyspace
				ksSession, err := cluster.CreateSession()
				if err == nil {
					Session = ksSession
					fmt.Printf("Connected to Cassandra (notification-service) after %d attempt(s)\n", attempt)
					return
				}
				lastErr = err
			} else {
				lastErr = err
			}
			sysSession.Close()
		} else {
			lastErr = err
		}

		fmt.Printf("Cassandra not ready (notification-service) attempt %d/%d: %v\n", attempt, maxAttempts, lastErr)
		time.Sleep(delay)
	}

	panic(lastErr)
}

func Close() {
	if Session != nil {
		Session.Close()
	}
}

func ensureSchema(session *gocql.Session, keyspace string) error {
	createKeyspace := fmt.Sprintf(
		"CREATE KEYSPACE IF NOT EXISTS %s WITH replication = {'class': 'SimpleStrategy', 'replication_factor': 1}",
		keyspace,
	)
	if err := session.Query(createKeyspace).Exec(); err != nil {
		return err
	}

	createByUser := fmt.Sprintf(
		`CREATE TABLE IF NOT EXISTS %s.notifications_by_user (
			user_id text,
			created_at timestamp,
			id text,
			message text,
			is_read boolean,
			PRIMARY KEY ((user_id), created_at, id)
		) WITH CLUSTERING ORDER BY (created_at DESC)`,
		keyspace,
	)
	if err := session.Query(createByUser).Exec(); err != nil {
		return err
	}

	createByID := fmt.Sprintf(
		`CREATE TABLE IF NOT EXISTS %s.notifications_by_id (
			id text PRIMARY KEY,
			user_id text,
			created_at timestamp,
			message text,
			is_read boolean
		)`,
		keyspace,
	)
	return session.Query(createByID).Exec()
}

var cassandraIdentifierPattern = regexp.MustCompile(`^[a-zA-Z_][a-zA-Z0-9_]*$`)

func validateIdentifierOrPanic(v string, envName string) {
	if v == "" || !cassandraIdentifierPattern.MatchString(v) {
		panic(fmt.Sprintf("%s must be a valid Cassandra identifier (letters/numbers/underscore), got: %q", envName, v))
	}
}

