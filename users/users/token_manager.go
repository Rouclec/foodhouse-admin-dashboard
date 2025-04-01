package users

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"time"

	"github.com/foodhouse/foodhouseapp/users/db/sqlc"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

const (
	// DefaultRefreshTokenValidity is the default validity period for a refresh token.
	DefaultRefreshTokenValidity = time.Hour * 24 * 30
)

//go:generate go run go.uber.org/mock/mockgen@v0.5.0 -destination=mocks/mock_token_manager.go -package=mocks -source=./token_manager.go TokenManager
type TokenManager interface {

	// GenerateAccessToken generates a new access token and refresh token for the given user.
	GenerateAccessToken(ctx context.Context, userID string, claims map[string]any) (string, error)

	// GenerateRefreshToken generates a new refresh token for the given user.
	GenerateRefreshToken(ctx context.Context, userID string) (string, error)

	// RefreshTokenIsValid checks if the given refresh token is valid.
	// If the token is valid, it also returns the user id associated with the token.
	RefreshTokenIsValid(ctx context.Context, refreshToken string) (bool, string, error)

	// RevokeToken revokes the given refresh token.
	RevokeRefreshToken(ctx context.Context, refreshToken string) error
}

type TokenManagerBuilder interface {
	WithQuerier(querier sqlc.Querier) TokenManager
}

type FirebaseTokenManagerBuilder struct {
	tokenGenerator TokenGenerator
	apiKey         string
	httpClient     HTTPDoer
}

func NewFirebaseTokenManagerBuilder(tokenGenerator TokenGenerator, apiKey string, httpClient HTTPDoer,
) *FirebaseTokenManagerBuilder {
	return &FirebaseTokenManagerBuilder{
		tokenGenerator: tokenGenerator,
		apiKey:         apiKey,
		httpClient:     httpClient,
	}
}

func (b *FirebaseTokenManagerBuilder) WithQuerier(querier sqlc.Querier) TokenManager {
	return NewFirebaseTokenManager(b.tokenGenerator, b.apiKey, b.httpClient, querier)
}

type FirebaseTokenManager struct {
	tokenGenerator TokenGenerator
	apiKey         string
	httpClient     HTTPDoer
	querier        sqlc.Querier
}

type HTTPDoer interface {
	Do(req *http.Request) (*http.Response, error)
}

type TokenGenerator interface {
	CustomTokenWithClaims(ctx context.Context, uid string, devClaims map[string]interface{}) (string, error)
}

var _ TokenManager = (*FirebaseTokenManager)(nil) // Ensure FirebaseTokenManager implements TokenManager.

func NewFirebaseTokenManager(adminClient TokenGenerator, apiKey string, httpClient HTTPDoer,
	querier sqlc.Querier) *FirebaseTokenManager {
	return &FirebaseTokenManager{
		tokenGenerator: adminClient,
		apiKey:         apiKey,
		httpClient:     httpClient,
		querier:        querier,
	}
}

func (f *FirebaseTokenManager) GenerateAccessToken(ctx context.Context,
	userID string, claims map[string]any) (string, error) {
	customToken, err := f.tokenGenerator.CustomTokenWithClaims(ctx, userID, claims)
	if err != nil {
		return "", fmt.Errorf("failed to generate custom token: %w", err)
	}

	signinURL, _ := url.Parse("https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken")
	q := signinURL.Query()
	q.Set("key", f.apiKey)
	signinURL.RawQuery = q.Encode()

	// Preparing the request payload
	reqPayload := map[string]interface{}{
		"token":             customToken,
		"returnSecureToken": true,
	}

	// Convert the payload to JSON
	jsonData, err := json.Marshal(reqPayload)
	if err != nil {
		return "", status.Errorf(codes.Internal, "Error unmarshaling JSON: %v\n", err)
	}

	// Create the HTTP request
	tokenRequest, err := http.NewRequestWithContext(ctx, http.MethodPost, signinURL.String(), bytes.NewBuffer(jsonData))
	if err != nil {
		return "", status.Errorf(codes.Internal, "Could not create a new request for the token %v\n", err)
	}

	// Set headers
	tokenRequest.Header.Set("Content-Type", "application/json")

	// Send the HTTP request
	response, err := f.httpClient.Do(tokenRequest)
	if err != nil {
		return "", status.Errorf(codes.Internal, "Error making request: %v\n", err)
	}
	defer response.Body.Close()

	//nolint:mnd // 400 or 500 status codes are errors
	if response.StatusCode >= 400 {
		bodyStr, _ := io.ReadAll(response.Body)
		return "", status.Errorf(codes.Internal, "Error response from Firebase: %v body=%s", response.Status,
			string(bodyStr))
	}

	// Read and process the response
	body, err := io.ReadAll(response.Body)
	if err != nil {
		return "", status.Errorf(codes.Internal, "Error reading response body: %v\n", err)
	}

	resp := struct {
		IDToken      string `json:"idToken"`
		RefreshToken string `json:"refreshToken"`
	}{}
	err = json.Unmarshal(body, &resp)
	if err != nil {
		return "", status.Errorf(codes.Internal, "Error unmarshaling response: %v\n", err)
	}

	return resp.IDToken, nil
}

// GenerateRefreshToken implements TokenManager.
func (f *FirebaseTokenManager) GenerateRefreshToken(ctx context.Context, userID string) (string, error) {
	refreshToken := uuid.NewString()
	expiresAt := time.Now().Add(DefaultRefreshTokenValidity)
	err := f.querier.CreateRefreshToken(ctx, sqlc.CreateRefreshTokenParams{
		Token:  refreshToken,
		UserID: userID,
		ExpiresAt: pgtype.Timestamptz{
			Time:  expiresAt,
			Valid: true,
		},
	})
	if err != nil {
		return "", fmt.Errorf("failed to create refresh token: %w", err)
	}

	return refreshToken, nil
}

// RefreshTokenIsValid implements TokenManager.
func (f *FirebaseTokenManager) RefreshTokenIsValid(ctx context.Context, refreshToken string) (bool, string, error) {
	refreshTokenRow, err := f.querier.GetRefreshToken(ctx, refreshToken)
	if err != nil {
		return false, "", fmt.Errorf("failed to get refresh token: %w", err)
	}

	// Check if the refresh token has expired
	if refreshTokenRow.ExpiresAt.Time.Before(time.Now()) {
		return false, "", nil
	}

	// Check if the refresh token has been revoked
	if refreshTokenRow.RevokedAt.Valid {
		return false, "", nil
	}

	return true, refreshTokenRow.UserID, nil
}

func (f *FirebaseTokenManager) RevokeRefreshToken(ctx context.Context, refreshToken string) error {
	err := f.querier.RevokeRefreshToken(ctx, refreshToken)
	if err != nil {
		return fmt.Errorf("failed to revoke refresh token: %w", err)
	}

	return nil
}
