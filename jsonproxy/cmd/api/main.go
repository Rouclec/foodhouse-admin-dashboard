package main

import (
	"context"
	"errors"
	"fmt"
	"net/http"
	"os"
	"os/signal"
	"strings"
	"syscall"
	"time"

	firebase "firebase.google.com/go"
	"github.com/ardanlabs/conf/v3"
	"github.com/foodhouse/foodhouseapp/grpc/go/ordersgrpc"
	"github.com/foodhouse/foodhouseapp/grpc/go/productsgrpc"
	"github.com/foodhouse/foodhouseapp/grpc/go/usersgrpc"
	"github.com/foodhouse/foodhouseapp/jsonproxy/interceptors"
	"github.com/grpc-ecosystem/grpc-gateway/v2/runtime"
	"github.com/joho/godotenv"
	"github.com/rs/cors"
	"github.com/rs/zerolog"
	"google.golang.org/api/option"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
)

func main() {
	ctx, _ := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)

	logger := zerolog.New(os.Stderr).With().Timestamp().Caller().Logger()

	err := run(ctx, logger)
	if err != nil {
		logger.Err(err).Msg("Error in main")
		os.Exit(1)
	}
}

type Config struct {
	ListenPort       uint16 `conf:"env:LISTEN_PORT,required"`
	UsersHostPort    string `conf:"env:USERS_HOST_PORT,required"`
	ProductsHostPort string `conf:"env:PRODUCTS_HOST_PORT,required"`
	OrdersHostPort   string `conf:"env:ORDERS_HOST_PORT,required"`

	// FirebaseServiceAccountJSON holds the JSON credentials for the Firebase service account.
	FirebaseServiceAccountJSON string `conf:"env:FIREBASE_SERVICE_ACCOUNT_JSON,required"`
	AllowedOrigins             string `conf:"env:ALLOWED_ORIGINS,required"`
}

func run(ctx context.Context, log zerolog.Logger) error {
	ctx, cancel := context.WithCancel(ctx)
	defer cancel()

	config := Config{}
	err := LoadConfig(&config)
	if err != nil {
		return fmt.Errorf("failed to load config: %w", err)
	}

	// Register gRPC server endpoint
	// Note: Make sure the gRPC server is running properly and accessible
	jsonproxyMux := runtime.NewServeMux()

	healthcheckPattern := runtime.MustPattern(runtime.NewPattern(1, []int{2, 0, 2, 1, 2, 2},
		[]string{"v1", "public", "healthcheck"}, ""))
	jsonproxyMux.Handle("GET", healthcheckPattern, func(w http.ResponseWriter, _ *http.Request, _ map[string]string) {
		w.WriteHeader(http.StatusOK)
		_, writeErr := w.Write([]byte("OK"))
		if writeErr != nil {
			log.Err(writeErr).Msg("Error writing response")
		}
	})

	opts := []grpc.DialOption{grpc.WithTransportCredentials(insecure.NewCredentials())}

	// Register users grpc server.
	err = usersgrpc.RegisterUsersHandlerFromEndpoint(ctx, jsonproxyMux, config.UsersHostPort, opts)
	if err != nil {
		return fmt.Errorf("failed to register users gRPC server: %w", err)
	}

	log.Info().Msgf("Successfully registered usersgrpc on host and port %v", config.UsersHostPort)

	// Register product grpc server.
	err = productsgrpc.RegisterProductsHandlerFromEndpoint(ctx, jsonproxyMux, config.ProductsHostPort, opts)
	if err != nil {
		return fmt.Errorf("failed to register products gRPC server: %w", err)
	}

	log.Info().Msgf("Successfully registered productsgrpc on host and port %v", config.ProductsHostPort)

	// Register orders grpc server.
	err = ordersgrpc.RegisterOrdersHandlerFromEndpoint(ctx, jsonproxyMux, config.OrdersHostPort, opts)
	if err != nil {
		return fmt.Errorf("failed to register ordrers gRPC server: %w", err)
	}

	log.Info().Msgf("Successfully registered ordersgrpc on host and port %v", config.OrdersHostPort)

	opt := option.WithCredentialsJSON([]byte(config.FirebaseServiceAccountJSON))
	app, err := firebase.NewApp(ctx, nil, opt)
	if err != nil {
		return err
	}

	firebaseAdminClient, err := app.Auth(ctx)
	if err != nil {
		return err
	}

	handler := interceptors.WireDefaultInterceptors(firebaseAdminClient, jsonproxyMux)

	log.Info().Msg("Successfully registered firebase app...")

	allowedOrigins := strings.Split(config.AllowedOrigins, ",")

	corsHandler := cors.New(cors.Options{
		AllowedOrigins:   allowedOrigins, // Change this to your allowed domains
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Content-Type", "Authorization"},
		AllowCredentials: true,
	}).Handler(handler)

	log.Info().Msgf("Starting server on port %d", config.ListenPort)

	// Start HTTP server (and proxy calls to gRPC server endpoint.
	bindAddress := fmt.Sprintf(":%d", config.ListenPort)
	server := &http.Server{
		Addr:    bindAddress,
		Handler: corsHandler,
		//nolint:mnd // We set the timeouts here.
		ReadHeaderTimeout: 15 * time.Second,
	}

	// We start the server in a goroutine and wait for a cancellation signal.
	go func() {
		defer cancel()
		shutdownErr := server.ListenAndServe()
		if shutdownErr != nil && shutdownErr != http.ErrServerClosed {
			log.Err(shutdownErr).Msg("Error starting server")
		}
	}()

	// Once the context is canceled we attempt a graceful shutdown.
	<-ctx.Done()
	log.Info().Msg("Shutting down server")
	maxWaitSeconds := 5
	shutdownCtx, cancel := context.WithTimeout(context.Background(), time.Second*time.Duration(maxWaitSeconds))
	defer cancel()
	shutdownErr := server.Shutdown(shutdownCtx)
	if shutdownErr != nil {
		log.Err(shutdownErr).Msg("Error shutting down server")
	}

	return nil
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
