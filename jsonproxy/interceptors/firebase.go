package interceptors

import (
	"context"
	"net/http"
	"strings"

	"firebase.google.com/go/auth"
)

//go:generate go run go.uber.org/mock/mockgen@v0.5.0 -destination=mocks/mock_token_verifier.go -package=mocks . TokenVerifier

// TokenVerifier is an interface for verifying Firebase ID tokens.
type TokenVerifier interface {
	VerifyIDToken(ctx context.Context, idToken string) (*auth.Token, error)
}

func NewFirebaseAuthenticationInterceptor(client TokenVerifier) HTTPInterceptor {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			
			// Skip token verification for public routes
			if strings.HasPrefix(r.URL.Path, "/v1/public") {
				next.ServeHTTP(w, r)
				return
			}
			
			// Extract the Firebase ID token from the Authorization header
			idToken := r.Header.Get(HeaderAuthentication)

			// If the authorization header is empty, continue to the next handler
			if len(idToken) <= len(BearerPrefix) {
				next.ServeHTTP(w, r)
				return
			}

			idToken = idToken[len(BearerPrefix):]

			// Verify the ID token
			token, err := client.VerifyIDToken(r.Context(), idToken)
			if err != nil {
				http.Error(w, "Invalid ID token:"+err.Error(), http.StatusUnauthorized)
				return
			}

			userRole, _ := token.Claims["role"].(string)

			// Set the user role in the request context
			ctx := context.WithValue(r.Context(), ContextKeyRole, userRole)
			// Set the user ID in the request context
			ctx = context.WithValue(ctx, ContextKeyUserID, token.UID)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}
