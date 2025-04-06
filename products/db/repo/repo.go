// Package repo provides a repository for Products, ie a way to store and retrieve Products.
package repo

import (
	"context"
	"errors"
	"path/filepath"

	"github.com/golang-migrate/migrate/v4"
	_ "github.com/golang-migrate/migrate/v4/database/postgres" // Postgres driver
	_ "github.com/golang-migrate/migrate/v4/source/file"       // File source for migrations
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/rs/zerolog"

	"github.com/foodhouse/foodhouseapp/products/db/sqlc"
)

type ProductsRepo interface {
	Begin(ctx context.Context) (sqlc.Querier, pgx.Tx, error)
	Do() sqlc.Querier
}

type Impl struct {
	db *pgxpool.Pool
}

func NewProductsRepo(db *pgxpool.Pool) *Impl {
	return &Impl{db: db}
}

func (u *Impl) Begin(ctx context.Context) (sqlc.Querier, pgx.Tx, error) {
	tx, err := u.db.Begin(ctx)
	if err != nil {
		return nil, nil, err
	}
	return sqlc.New(tx), tx, nil
}

func (u *Impl) Do() sqlc.Querier {
	return sqlc.New(u.db)
}

// Migrate function applies migrations to the database.
func Migrate(dbURL string, migrationsPath string, logger zerolog.Logger) error {
	absPath, err := filepath.Abs(migrationsPath)
	if err != nil {
		return err
	}

	logger.Info().Msgf("absolute migration path: %v", absPath)

	// Create a new migration instance with the absolute path
	m, err := migrate.New(
		"file://"+absPath,
		dbURL,
	)

	logger.Info().Msgf("migration instance %v", m)
	if err != nil {
		return err
	}
	defer m.Close()

	// Apply migrations
	err = m.Up()
	if err != nil && !errors.Is(err, migrate.ErrNoChange) {
		return err
	}

	logger.Info().Msg("Migrations applied successfully")
	return nil
}

// MigrateDown function rolls back migrations from the database.
func MigrateDown(dbURL string, migrationsPath string, logger zerolog.Logger) error {
	absPath, err := filepath.Abs(migrationsPath)
	if err != nil {
		return err
	}

	// Create a new migration instance with the absolute path
	m, err := migrate.New(
		"file://"+absPath,
		dbURL,
	)
	if err != nil {
		return err
	}
	defer m.Close()

	// Apply migrations
	err = m.Down()
	if err != nil && !errors.Is(err, migrate.ErrNoChange) {
		return err
	}

	logger.Info().Msg("Migrations applied successfully")
	return nil
}
