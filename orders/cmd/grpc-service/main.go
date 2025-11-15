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
	"github.com/foodhouse/foodhouseapp/email"
	"github.com/foodhouse/foodhouseapp/grpc/go/ordersgrpc"
	"github.com/foodhouse/foodhouseapp/grpc/go/productsgrpc"
	"github.com/foodhouse/foodhouseapp/grpc/go/usersgrpc"
	"github.com/foodhouse/foodhouseapp/orders/db/repo"
	"github.com/foodhouse/foodhouseapp/orders/orders"
	"github.com/foodhouse/foodhouseapp/payment"
	grpc_recovery "github.com/grpc-ecosystem/go-grpc-middleware/recovery"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/joho/godotenv"
	_ "github.com/lib/pq"
	"github.com/rs/zerolog"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
	"google.golang.org/grpc/reflection"
)

// Config stores all configuration of the application.
// The values are read by viper from a config file or environment variable.
type Config struct {
	DB DBConfig

	ListenPort       uint   `conf:"env:LISTEN_PORT,required"`
	UsersHostPort    string `conf:"env:USERS_HOST_PORT,required"`
	ProductsHostPort string `conf:"env:PRODUCTS_HOST_PORT,required"`

	MigrationPath string `conf:"env:MIGRATION_PATH,required"`

	// EnableDevMethods is a flag that enables development methods in the gRPC server.
	// These methods can leak sensitive data and should not be enabled in production.
	EnableDevMethods bool `conf:"env:ENABLE_DEV_METHODS,default:false"`

	CampayConfig CampayConfig

	TrustPayWay struct {
		SecretKey string `conf:"env:TRUST_PAY_WAY_SECRET_KEY,required"`
		BaseUrl   string `conf:"env:TRUST_PAY_WAY_BASE_URL,required"`
		AppToken  string `conf:"env:TRUST_PAY_WAY_APP_TOKEN,required"`
		WebHook   string `conf:"env:TRUST_PAY_WAY_WEBHOOK,required"`
	}

	NkwaPay struct {
		BaseUrl string `conf:"env:NKWA_PAY_BASE_URL,required"`
		ApiKey  string `conf:"env:NKWA_PAY_API_KEY,required"`
	}

	Email struct {
		Smtp struct {
			Host     string `conf:"env:SMTP_HOST,required"`
			Port     string `conf:"env:SMTP_PORT,required"`
			Username string `conf:"env:SMTP_USERNAME,required"`
			Password string `conf:"env:SMTP_PASSWORD,required"`
		}
	}

	CompanyEmail      string `conf:"env:COMPANY_EMAIL,required"`
	CompanyPhone      string `conf:"env:COMPANY_PHONE,required"`
	EmailTemplatePath string `conf:"env:EMAIL_TEMPLATE_PATH,required"`
}

type DBConfig struct {
	DBUser      string `conf:"env:DB_USER,required"`
	DBPassword  string `conf:"env:DB_PASSWORD,required,mask"`
	DBHost      string `conf:"env:DB_HOST,required"`
	DBPort      uint16 `conf:"env:DB_PORT,required"`
	DBName      string `conf:"env:DB_Name,required"`
	TLSDisabled bool   `conf:"env:DB_TLS_DISABLED"`
}

type CampayConfig struct {
	CampayUsername string `conf:"env:CAMPAY_USERNAME,required"`
	CampayPassword string `conf:"env:CAMPAY_PASSWORD,required"`
	CampayBaseUrl  string `conf:"env:CAMPAY_BASE_URL,required"`
	CampayWebHook  string `conf:"env:CAMPAY_WEBHOOK,required"`
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

	usersConn, err := grpc.NewClient(config.UsersHostPort, grpc.WithTransportCredentials(insecure.NewCredentials()))
	if err != nil {
		return fmt.Errorf("failed to create gRPC connection: %w", err)
	}
	defer usersConn.Close()
	usersClient := usersgrpc.NewUsersClient(usersConn)

	productsConn, err := grpc.NewClient(config.ProductsHostPort, grpc.WithTransportCredentials(insecure.NewCredentials()))
	if err != nil {
		return fmt.Errorf("failed to create gRPC connection: %w", err)
	}
	defer productsConn.Close()
	productsClient := productsgrpc.NewProductsClient(productsConn)

	// First Start the gRPC server.
	svrOpts := []grpc.ServerOption{
		grpc.ChainUnaryInterceptor(
			grpc_recovery.UnaryServerInterceptor(),
		),
	}

	grpcServer := grpc.NewServer(svrOpts...)
	reflection.Register(grpcServer)

	// paymentService, err := payment.NewCampayProvider(config.CampayConfig.CampayUsername, config.CampayConfig.CampayPassword, config.CampayConfig.CampayBaseUrl, config.CampayConfig.CampayWebHook)
	// paymentService, err := payment.NewTPWProvider(config.TrustPayWay.SecretKey, config.TrustPayWay.AppToken, config.TrustPayWay.BaseUrl, config.TrustPayWay.WebHook, logger)
	paymentService, err := payment.NewNkwaPayProvider(config.NkwaPay.ApiKey, config.NkwaPay.BaseUrl, logger)

	if err != nil {
		return fmt.Errorf("error initializing campay provider: %w", err)
	}

	emailSender, err := email.NewSMTPService(config.Email.Smtp.Host,
		config.Email.Smtp.Port,
		config.Email.Smtp.Username,
		config.Email.Smtp.Password, config.EmailTemplatePath)

	if err != nil {
		return fmt.Errorf("error initializing email client: %w", err)
	}

	ordersgrpc.RegisterOrdersServer(grpcServer, orders.NewOrders(ordersRepo, logger,
		config.EnableDevMethods, paymentService,
		usersClient, productsClient, emailSender, config.CompanyEmail, config.CompanyPhone))

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
			return fmt.Errorf("failed to load the env file: %w", err)
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
