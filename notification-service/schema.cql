-- Cassandra schema for notification-service

CREATE KEYSPACE IF NOT EXISTS notifications
WITH replication = {'class': 'SimpleStrategy', 'replication_factor': 1};

CREATE TABLE IF NOT EXISTS notifications.notifications_by_user (
  user_id text,
  created_at timestamp,
  id text,
  message text,
  is_read boolean,
  PRIMARY KEY ((user_id), created_at, id)
) WITH CLUSTERING ORDER BY (created_at DESC);

CREATE TABLE IF NOT EXISTS notifications.notifications_by_id (
  id text PRIMARY KEY,
  user_id text,
  created_at timestamp,
  message text,
  is_read boolean
);

