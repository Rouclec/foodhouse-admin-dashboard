package repo_test

import (
	"context"
	"fmt"
	"log"
	"os"
	"testing"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	_ "github.com/jackc/pgx/v5/stdlib"
	"github.com/ory/dockertest"
	"github.com/ory/dockertest/docker"
)

var (
	//nolint:gochecknoglobals // all the tests bepepend on this connection pool
	pool *pgxpool.Pool
	//nolint:gochecknoglobals // multiple tests require this connection string to the test db.
	databaseURL string
)

// this is the entry point for all tests.
func TestMain(m *testing.M) {
	os.Exit(testMain(m))
}

func testMain(m *testing.M) int {
	ctx := context.Background()
	// Create Docker pool

	dockerPool, err := dockertest.NewPool("")
	handleFatalError(err, "Could not connect to docker")

	// Initialize Docker container
	var resource *dockertest.Resource
	resource, databaseURL = initializePostgresContainer(dockerPool)
	log.Println("Connecting to database on url:", databaseURL)

	// Set container expiration time
	handleFatalError(resource.Expire(120), "Could not set container expiration")

	// Set Docker pool wait time
	dockerPool.MaxWait = 60 * time.Second

	pool, err = connectToDatabase(ctx, dockerPool, databaseURL)
	handleFatalError(err, "Could not connect to database")

	defer pool.Close() // Close the pool after tests

	return m.Run()
}

func initializePostgresContainer(pool *dockertest.Pool) (*dockertest.Resource, string) {
	dbName := "products"
	resource, err := pool.RunWithOptions(&dockertest.RunOptions{
		Repository: "postgres",
		Tag:        "16",
		Env: []string{
			"POSTGRES_PASSWORD=postgres",
			"POSTGRES_USER=postgres",
			"POSTGRES_DB=" + dbName,
			"listen_addresses=5432",
		},
	}, func(config *docker.HostConfig) {
		config.AutoRemove = true
		config.RestartPolicy = docker.RestartPolicy{Name: "no"}
	})
	handleFatalError(err, "Could not start resource")

	hostAndPort := resource.GetHostPort("5432/tcp")
	dbURL := fmt.Sprintf("postgres://postgres:postgres@%s/%s?sslmode=disable", hostAndPort, dbName)
	return resource, dbURL
}

func handleFatalError(err error, message string) {
	if err != nil {
		log.Fatalf("%s: %v", message, err)
	}
}

func connectToDatabase(ctx context.Context, dockerPool *dockertest.Pool, databaseURL string) (*pgxpool.Pool, error) {
	var pgPool *pgxpool.Pool
	var dbErr error
	var err error
	err = dockerPool.Retry(func() error {
		pgPool, dbErr = pgxpool.New(ctx, databaseURL)
		if err != nil {
			return dbErr
		}

		dbErr = pgPool.Ping(ctx)
		if dbErr != nil {
			return dbErr
		}

		return nil
	})

	if err != nil {
		return nil, fmt.Errorf("failed to connect using sourceStr:%s: %w", databaseURL, dbErr)
	}

	return pgPool, nil
}
