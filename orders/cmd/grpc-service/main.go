package main

import (
	"context"
	"errors"
	"fmt"
	"net"
	"net/url"
	"os"
	"os/signal"
	"sync"
	"syscall"

	"github.com/ardanlabs/conf/v3"
	"github.com/foodhouse/foodhouseapp/grpc/go/ordersgrpc"
	"github.com/foodhouse/foodhouseapp/orders/db/repo"
	"github.com/foodhouse/foodhouseapp/orders/orders"
	grpc_recovery "github.com/grpc-ecosystem/go-grpc-middleware/recovery"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/joho/godotenv"
	_ "github.com/lib/pq"
	"github.com/rs/zerolog"
	"google.golang.org/grpc"
	"google.golang.org/grpc/reflection"
)

// Config stores all configuration of the application.
// The values are read by viper from a config file or environment variable.
type Config struct {
	DB DBConfig

	ListenPort uint `conf:"env:LISTEN_PORT,required"`

	MigrationPath string `conf:"env:MIGRATION_PATH,required"`

	// EnableDevMethods is a flag that enables development methods in the gRPC server.
	// These methods can leak sensitive data and should not be enabled in production.
	EnableDevMethods bool `conf:"env:ENABLE_DEV_METHODS,default:false"`
}

type DBConfig struct {
	DBUser      string `conf:"env:DB_USER,required"`
	DBPassword  string `conf:"env:DB_PASSWORD,required,mask"`
	DBHost      string `conf:"env:DB_HOST,required"`
	DBPort      uint16 `conf:"env:DB_PORT,required"`
	DBName      string `conf:"env:DB_Name,required"`
	TLSDisabled bool   `conf:"env:DB_TLS_DISABLED"`
}

func main() {
	ctx, _ := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)

	logger := zerolog.New(os.Stderr).With().Timestamp().Caller().Logger()

	err := run(ctx, logger)
	if err != nil {
		logger.Err(err).Msg("Error in main")
		os.Exit(1)
	}
}

func run(ctx context.Context, logger zerolog.Logger) error {
	logger.Info().Msg("Starting server...")

	config := Config{}

	err := LoadConfig(&config)
	if err != nil {
		logger.Err(err).Msg("cannot load config")
		return err
	}

	logger.Info().Msgf("Successfully loaded config... : %v", config)

	dbConnectionURL := getPostgresConnectionURL(config.DB)
	db, err := pgxpool.New(ctx, dbConnectionURL)
	if err != nil {
		return fmt.Errorf("failed to open database: %w", err)
	}

	defer db.Close()

	err = repo.Migrate(dbConnectionURL, config.MigrationPath, logger)
	if err != nil {
		logger.Err(err).Msg("Migration not successful...")
		return fmt.Errorf("failed to migrate: %w", err)
	}

	ordersRepo := repo.NewOrdersRepo(db)

	// First Start the gRPC server
	svrOpts := []grpc.ServerOption{
		grpc.ChainUnaryInterceptor(
			grpc_recovery.UnaryServerInterceptor(),
		),
	}

	grpcServer := grpc.NewServer(svrOpts...)
	reflection.Register(grpcServer)

	ordersgrpc.RegisterOrdersServer(grpcServer, orders.NewOrders(ordersRepo, logger, config.EnableDevMethods))

	logger.Info().Msg("Successfully registered ordersgrpc...")

	listener, err := net.Listen("tcp", fmt.Sprintf(":%d", config.ListenPort))
	if err != nil {
		return fmt.Errorf("net.Listen: %w", err)
	}

	logger.Info().Msgf(`grpc listener running on %s`, listener.Addr().String())

	var startupErr error
	wg := &sync.WaitGroup{}
	wg.Add(1)
	go func() {
		defer wg.Done()
		err = grpcServer.Serve(listener)
		if err != nil {
			startupErr = fmt.Errorf("error starting gRPC server: %w", err)
		}
	}()

	// Do a graceful shutdown if the context is canceled
	go func() {
		<-ctx.Done()
		logger.Info().Msg("Shutting down gRPC server...")
		grpcServer.GracefulStop()
		logger.Info().Msg("gRPC server stopped...")
	}()

	logger.Info().Msgf(`HTTP server running on %s`, listener.Addr().String())

	// Graceful shutdown
	// wait for the context to finish
	wg.Wait()
	logger.Info().Msg("Server stopped...")

	return startupErr
}

// LoadConfig reads configuration from file or environment variables.
func LoadConfig(cfg *Config) error {
	if _, err := os.Stat(".env"); err == nil {
		err = godotenv.Load()
		if err != nil {
			return fmt.Errorf("failed to load env file: %w", err)
		}
	}

	_, err := conf.Parse("", cfg)
	if err != nil {
		if errors.Is(err, conf.ErrHelpWanted) {
			return err
		}

		return err
	}

	return nil
}

func getPostgresConnectionURL(config DBConfig) string {
	queryValues := url.Values{}
	if config.TLSDisabled {
		queryValues.Add("sslmode", "disable")
	} else {
		queryValues.Add("sslmode", "require")
	}

	dbURL := url.URL{
		Scheme:   "postgres",
		User:     url.UserPassword(config.DBUser, config.DBPassword),
		Host:     fmt.Sprintf("%s:%d", config.DBHost, config.DBPort),
		Path:     config.DBName,
		RawQuery: queryValues.Encode(),
	}

	return dbURL.String()
}
