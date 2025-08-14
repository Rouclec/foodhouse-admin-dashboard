package repo_test

import (
	"context"
	"fmt"
	"log"
	"os"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
	_ "github.com/jackc/pgx/v5/stdlib"
	"github.com/ory/dockertest"
	"github.com/ory/dockertest/docker"
	"github.com/rs/zerolog"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"github.com/foodhouse/foodhouseapp/users/db/repo"
	"github.com/foodhouse/foodhouseapp/users/db/sqlc"
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
	dbName := "users"
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

func TestUserLifecycle(t *testing.T) {
	migrationPath := "../migrations"

	// Variables
	firstName := "Beloa"
	lastName := "Forcha"
	email := "testuser@foodhouse.com"

	logger := zerolog.New(os.Stderr).With().Timestamp().Caller().Logger()

	err := repo.Migrate(databaseURL, migrationPath, logger)
	handleFatalError(err, "Could not migrate database")
	defer repo.MigrateDown(databaseURL, migrationPath, logger)

	userRepo := repo.NewUsersRepo(pool)
	ctx := context.Background()
	user := sqlc.CreateUserParams{
		Role:        "USER_ROLE_FARMER",
		PhoneNumber: "+23767777777",
	}

	// Create a user
	createdUser, err := userRepo.Do().CreateUser(ctx, user)
	require.NoErrorf(t, err, "failed to create user: %v", err)
	assert.NotEmptyf(t, createdUser.ID, "user ID should not be empty")
	assert.Equalf(t, user.PhoneNumber, createdUser.PhoneNumber, "phone number should be equal")
	assert.NotEmptyf(t, createdUser.ReferralCode, "referal code must exist")

	// Get the user
	fetchedUser, err := userRepo.Do().GetUser(ctx, createdUser.ID)
	require.NoErrorf(t, err, "failed to get user: %v", err)
	assert.Equalf(t, createdUser.ID, fetchedUser.ID, "user ID should be equal")
	assert.Equalf(t, createdUser.PhoneNumber, fetchedUser.PhoneNumber, "phone number should be equal")

	// Update User
	updateUser := sqlc.UpdateUserParams{
		ID:        fetchedUser.ID,
		FirstName: &firstName,
		LastName:  &lastName,
		Email:     &email,
	}

	updatedUser, err := userRepo.Do().UpdateUser(ctx, updateUser)
	require.NoErrorf(t, err, "failed to update user: %v", err)
	assert.NotEmptyf(t, updatedUser.ID, "user ID should not be empty")
	assert.Equalf(t, updateUser.FirstName, updatedUser.FirstName, "first name should be equal")
	assert.Equalf(t, updateUser.LastName, updatedUser.LastName, "last name should be equal")
	assert.Equalf(t, updateUser.Email, updatedUser.Email, "user email should be equal")

	count, err := userRepo.Do().CountUsers(ctx, sqlc.CountUsersParams{
		StartDate: pgtype.Timestamptz{
			Time:  time.Now().AddDate(0, 0, -1),
			Valid: true,
		},
		EndDate: pgtype.Timestamptz{
			Time:  time.Now().AddDate(0, 0, 1),
			Valid: true,
		},
	})
	require.NoErrorf(t, err, "failed to count users: %v", err)
	assert.Equalf(t, int64(1), count, "count should be 1")
}

func TestSentOtpLifeCycle(t *testing.T) {
	migrationPath := "../migrations"

	logger := zerolog.New(os.Stderr).With().Timestamp().Caller().Logger()

	err := repo.Migrate(databaseURL, migrationPath, logger)
	handleFatalError(err, "Could not migrate database")
	defer repo.MigrateDown(databaseURL, migrationPath, logger)

	userRepo := repo.NewUsersRepo(pool)
	ctx := context.Background()

	phoneNumber := "+237650184172"
	secretValue := "012345"

	createSentOtpArg := sqlc.CreateSentOtpParams{
		Factor:      phoneNumber,
		SecretValue: secretValue,
		FactorType:  "FACTOR_TYPE_PHONE",
		MaxAttempts: 5,
	}

	// Test that the CreateSentOtp method works
	createdSentOtp, err := userRepo.Do().CreateSentOtp(ctx, createSentOtpArg)

	logger.Debug().Msgf("created sent otp: %v", createSentOtpArg)

	require.NoErrorf(t, err, "Error creating sent otp: %v", err)
	require.NotEmptyf(t, createdSentOtp.RequestID, "Request id cannot be empty %v", createdSentOtp.RequestID)

	// Test the GetSentOtpByRequestId method
	_, err = userRepo.Do().GetSentOtpByRequestId(ctx, "1234567")

	require.Error(t, err)
	require.EqualError(t, err, "no rows in result set")

	fetchedSentOtp, err := userRepo.Do().GetSentOtpByRequestId(ctx, createdSentOtp.RequestID)

	require.NoErrorf(t, err, "Error fetching sent otp: %v", err)
	require.NotEmptyf(t, fetchedSentOtp.RequestID, "Request id cannot be empty %v", fetchedSentOtp.RequestID)
	require.Equal(t, createdSentOtp, fetchedSentOtp)

	// Test the CountSentOtpsToPhonenumberToday method
	count, err := userRepo.Do().CountSentOtpsToFactorToday(ctx, createdSentOtp.Factor)

	require.Equal(t, int64(1), count)
	require.NoError(t, err)
}

func TestRefreshTokens(t *testing.T) {
	migrationPath := "../migrations"

	logger := zerolog.New(os.Stderr).With().Timestamp().Caller().Logger()

	err := repo.Migrate(databaseURL, migrationPath, logger)
	handleFatalError(err, "Could not migrate database")
	defer repo.MigrateDown(databaseURL, migrationPath, logger)

	userRepo := repo.NewUsersRepo(pool)
	ctx := context.Background()

	user := sqlc.CreateUserParams{
		Role:                    "USER_ROLE_USER",
		PhoneNumber:             "+237677777777",
		ResidenceCountryIsoCode: "CM",
	}

	// Create a user
	createdUser, err := userRepo.Do().CreateUser(ctx, user)
	// This is a work around for the fact that dropping and recreating the same enum (in our
	// migrations can cause a cache error in postgres). This is not a issue in production because
	// we won't drop and recreate enum types, but it would be nice to fix this eventually.
	// see: https://stackoverflow.com/questions/27035669/postgres-drop-type-xx000-cache-lookup-failed-for-type
	if err != nil {
		createdUser, err = userRepo.Do().CreateUser(ctx, user)
	}
	require.NoErrorf(t, err, "failed to create user for setup: %v", err)

	refreshToken := uuid.NewString()
	userID := createdUser.ID
	expiresAt := pgtype.Timestamptz{
		Time:  time.Now().Add(time.Hour * 24),
		Valid: true,
	}
	// 1. Create refrsh token
	err = userRepo.Do().CreateRefreshToken(ctx, sqlc.CreateRefreshTokenParams{
		Token:     refreshToken,
		UserID:    userID,
		ExpiresAt: expiresAt,
	})
	require.NoErrorf(t, err, "Error creating refresh token")

	// 2. Get refresh token
	fetchedRefreshToken, err := userRepo.Do().GetRefreshToken(ctx, refreshToken)
	require.NoErrorf(t, err, "Error fetching refresh token")
	assert.Equal(t, refreshToken, fetchedRefreshToken.Token)
	assert.Falsef(t, fetchedRefreshToken.RevokedAt.Valid,
		"RevokedAt should be invalid (ie the token should not be revoked yet)")

	// 3. Revoke refresh token
	err = userRepo.Do().RevokeRefreshToken(ctx, refreshToken)
	require.NoErrorf(t, err, "Error revoking refresh token")

	// 4. Get refresh token
	fetchedRefreshToken, err = userRepo.Do().GetRefreshToken(ctx, refreshToken)
	require.NoErrorf(t, err, "Error fetching refresh token")
	assert.Truef(t, fetchedRefreshToken.RevokedAt.Valid,
		"RevokedAt should be valid (ie the token should be revoked)")
}

func TestSubscriptionLifecycle(t *testing.T) {
	migrationPath := "../migrations"

	logger := zerolog.New(os.Stderr).With().Timestamp().Caller().Logger()

	err := repo.Migrate(databaseURL, migrationPath, logger)
	handleFatalError(err, "Could not migrate database")
	defer repo.MigrateDown(databaseURL, migrationPath, logger)

	subscriptionRepo := repo.NewUsersRepo(pool)
	ctx := context.Background()

	// Variables for subscription
	title := "Premium Plan"
	description := "Access to premium features"
	amount := float64(1999)
	currency := "USD"

	// Create a subscription
	createdSubscription, err := subscriptionRepo.Do().CreateSubscription(ctx, sqlc.CreateSubscriptionParams{
		Title:       title,
		Description: description,
		Duration: pgtype.Interval{
			Microseconds: 30 * 24 * time.Hour.Microseconds(), // 30 days in microseconds
			Valid:        true,                               // Mark it as valid
		}, // Convert "1 month" to microseconds
		Amount:          amount,
		CurrencyIsoCode: currency,
	})
	require.NoErrorf(t, err, "failed to create subscription: %v", err)
	assert.NotEmptyf(t, createdSubscription.ID, "subscription ID should not be empty")
	assert.Equalf(t, title, createdSubscription.Title, "title should be equal")
	assert.InDeltaf(t, amount, createdSubscription.Amount, 0.01, "amount should be equal")

	// Get subscription by ID
	fetchedSubscription, err := subscriptionRepo.Do().GetSubscriptionByID(ctx, createdSubscription.ID)
	require.NoErrorf(t, err, "failed to fetch subscription by ID: %v", err)
	assert.Equalf(t, createdSubscription.ID, fetchedSubscription.ID, "subscription ID should be equal")

	// Update subscription
	updatedSubscription, err := subscriptionRepo.Do().UpdateSubscription(ctx, sqlc.UpdateSubscriptionParams{
		ID:          createdSubscription.ID,
		Title:       "Updated Premium Plan",
		Description: "Updated access to premium features",
		Duration: pgtype.Interval{
			Microseconds: 30 * 24 * time.Hour.Microseconds(), // 30 days in microseconds
			Valid:        true,                               // Mark it as valid
		}, // Convert "3 months" to microseconds
		Amount:          2999,
		CurrencyIsoCode: "EUR",
	})
	require.NoErrorf(t, err, "failed to update subscription: %v", err)
	assert.Equalf(t, "Updated Premium Plan", updatedSubscription.Title, "updated title should be equal")
	assert.InDeltaf(t, float64(2999), updatedSubscription.Amount, 0.01, "updated amount should be equal")

	// Delete subscription
	err = subscriptionRepo.Do().DeleteSubscription(ctx, createdSubscription.ID)
	require.NoErrorf(t, err, "failed to delete subscription: %v", err)

	// Attempt to fetch deleted subscription
	_, err = subscriptionRepo.Do().GetSubscriptionByID(ctx, createdSubscription.ID)
	require.Error(t, err, "expected error when fetching deleted subscription")
}

func TestUserSubscriptionLifecycle(t *testing.T) {
	migrationPath := "../migrations"

	logger := zerolog.New(os.Stderr).With().Timestamp().Caller().Logger()

	err := repo.Migrate(databaseURL, migrationPath, logger)
	handleFatalError(err, "Could not migrate database")
	defer repo.MigrateDown(databaseURL, migrationPath, logger)

	repo := repo.NewUsersRepo(pool)
	ctx := context.Background()

	// Variables for user and subscription
	user := sqlc.CreateUserParams{
		Role:        "USER_ROLE_FARMER",
		PhoneNumber: "+23767777777",
	}
	createdUser, err := repo.Do().CreateUser(ctx, user)
	require.NoErrorf(t, err, "failed to create user: %v", err)

	logger.Debug().Msgf("Duration: %v", pgtype.Interval{
		Microseconds: 30 * 24 * time.Hour.Microseconds(), // 30 days in microseconds
		Valid:        true,                               // Mark it as valid
	})

	subscription := sqlc.CreateSubscriptionParams{
		Title:       "Basic Plan",
		Description: "Basic access",
		Duration: pgtype.Interval{
			Microseconds: 30 * 24 * time.Hour.Microseconds(), // 30 days in microseconds
			Valid:        true,                               // Mark it as valid
		}, // Convert "1 month" to microseconds
		Amount:          1000,
		CurrencyIsoCode: "USD",
	}
	createdSubscription, err := repo.Do().CreateSubscription(ctx, subscription)
	require.NoErrorf(t, err, "failed to create subscription: %v", err)

	// Assuming the subscription duration is in days (microseconds)
	subscriptionDuration := createdSubscription.Duration

	// Convert the microseconds in the interval to time.Duration
	duration := time.Duration(subscriptionDuration.Microseconds) * time.Microsecond

	// Calculate the expiration date: current time + interval (30 days in this case)
	expirationDate := time.Now().Add(duration)

	logger.Debug().Msgf("Expiration date %v", expirationDate)
	// Create user subscription
	userSubscription, err := repo.Do().CreateUserSubscription(ctx, sqlc.CreateUserSubscriptionParams{
		UserID:         createdUser.ID,
		SubscriptionID: createdSubscription.ID,
		Active:         true,
		ExpiresAt:      expirationDate,
	})
	require.NoErrorf(t, err, "failed to create user subscription: %v", err)
	assert.NotEmptyf(t, userSubscription.ID, "user subscription ID should not be empty")
	assert.Equalf(t, createdUser.ID, userSubscription.UserID, "user ID should be equal")
	assert.Equalf(t, createdSubscription.ID, userSubscription.SubscriptionID, "subscription ID should be equal")

	// Get user subscriptions
	allUserSubscriptions, err := repo.Do().GetAllUserSubscriptions(ctx)
	require.NoErrorf(t, err, "failed to fetch all user subscriptions: %v", err)
	assert.NotEmptyf(t, allUserSubscriptions, "should have at least one user subscription")

	// Get user subscription by ID
	fetchedUserSubscription, err := repo.Do().GetUserSubscriptionByID(ctx, userSubscription.ID)
	require.NoErrorf(t, err, "failed to fetch user subscription by ID: %v", err)
	assert.Equalf(t, userSubscription.ID, fetchedUserSubscription.ID, "user subscription ID should be equal")

	// Activate user subscription
	err = repo.Do().ActivateUserSubscription(ctx, userSubscription.ID)
	require.NoErrorf(t, err, "failed to activate user subscription: %v", err)
	activatedUserSubscription, err := repo.Do().GetUserSubscriptionByID(ctx, userSubscription.ID)
	require.NoErrorf(t, err, "failed to fetch activated user subscription: %v", err)
	assert.Truef(t, activatedUserSubscription.Active, "user subscription should be active")
}

func TestUsersPaymentMethodsLifecycle(t *testing.T) {
	migrationPath := "../migrations"

	logger := zerolog.New(os.Stderr).With().Timestamp().Caller().Logger()

	err := repo.Migrate(databaseURL, migrationPath, logger)
	handleFatalError(err, "Could not migrate database")
	defer repo.MigrateDown(databaseURL, migrationPath, logger)

	ctx := context.Background()

	// Setup: Variables for the test
	method := "Credit Card"
	methodID := "cc-12345"

	// Initialize repo and logger
	userRepo := repo.NewUsersRepo(pool)

	// Variables for user and subscription
	user := sqlc.CreateUserParams{
		Role:        "USER_ROLE_FARMER",
		PhoneNumber: "+23767777777",
	}
	createdUser, err := userRepo.Do().CreateUser(ctx, user)
	require.NoErrorf(t, err, "failed to create user: %v", err)

	// Step 1: Create a user payment method
	createRequest := sqlc.CreateUserPaymentMethodParams{
		UserID:   createdUser.ID,
		Method:   method,
		MethodID: &methodID,
	}
	createdUserPaymentMethod, err := userRepo.Do().CreateUserPaymentMethod(ctx, createRequest)
	require.NoErrorf(t, err, "failed to create user payment method: %v", err)
	assert.NotEmptyf(t, createdUserPaymentMethod.ID, "user payment method ID should not be empty")
	assert.Equalf(t, createdUser.ID, createdUserPaymentMethod.UserID, "user ID should match")
	assert.Equalf(t, method, createdUserPaymentMethod.Method, "payment method should match")
	assert.Equalf(t, &methodID, createdUserPaymentMethod.MethodID, "method ID should match")

	// Step 2: Get the user payment methods by user ID
	userPaymentMethods, err := userRepo.Do().GetUserPaymentMethodsByUserID(ctx, createdUser.ID)
	require.NoErrorf(t, err, "failed to get user payment methods: %v", err)
	assert.NotEmptyf(t, userPaymentMethods, "should get at least one payment method")
	assert.Equalf(t, createdUser.ID, userPaymentMethods[0].UserID, "user ID should match")

	// Step 3: Delete the user payment method by ID
	err = userRepo.Do().DeleteUserPaymentMethod(ctx, createdUserPaymentMethod.ID)
	require.NoErrorf(t, err, "failed to delete user payment method: %v", err)

	// Step 4: Try fetching the user payment methods again to confirm deletion
	userPaymentMethods, err = userRepo.Do().GetUserPaymentMethodsByUserID(ctx, createdUser.ID)
	require.NoErrorf(t, err, "failed to get user payment methods: %v", err)
	assert.Emptyf(t, userPaymentMethods, "user payment methods should be empty after deletion")
}
