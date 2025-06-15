package interceptors

import (
	"net/http"
	"regexp"
	"strings"
)

var (
	PublicEndpointPrefixRegex = regexp.MustCompile(`^/v1/public/`)
	AdminEndpointPrefixRegex  = regexp.MustCompile(`^/v1/admin/`)
)

// NewAuthorizationInterceptor creates a new authorization interceptor.
// The interceptor caller has the required permissions to access the endpoint.
// This interceptor assumes that the "userID" and "role" of the caller have already been
// set in the request context.
// The interceptor does the following in order:
//  1. Allows all requests to public endpoints.
//  2. If the caller's role is "admin", allows all requests.
//  3. If the endpoint is prefixed with "/v1/admin/", deny access (admin users ere already
//     allowed in step 2).
//  4. If the endpoint is prefixed with "/v1/users/{userID}/", check if the user ID in the
//     path matches the user ID in the token. If they match, allow access.
func NewAuthorizationInterceptor() HTTPInterceptor {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			path := r.URL.Path

			// Public endpoints don't need any authorization
			if PublicEndpointPrefixRegex.MatchString(path) {
				next.ServeHTTP(w, r)
				return
			}

			ctx := r.Context()
			userID, _ := ctx.Value(ContextKeyUserID).(string)
			role, _ := ctx.Value(ContextKeyRole).(string)
			status, _ := ctx.Value(ContextKeyStatus).(string)

			if status != UserActiveStatus {
				http.Error(w, "User is inactive", http.StatusUnauthorized)
				return
			}

			// Admins can access all endpoints
			if role == RoleAdmin {
				next.ServeHTTP(w, r)
				return
			}

			// Non-admins can't access admin endpoints
			if AdminEndpointPrefixRegex.MatchString(path) {
				http.Error(w, "Unauthorized", http.StatusForbidden)
				return
			}

			pathParts := strings.Split(path, "/")
			minPathParts := 4
			if len(pathParts) < minPathParts {
				http.Error(w, "Bad Request", http.StatusBadRequest)
				return
			}

			// Check if the user ID in the path matches the user ID in the token
			userIDFromPath := pathParts[3]
			if userID != userIDFromPath {
				http.Error(w, "Unauthorized", http.StatusForbidden)
				return
			}

			next.ServeHTTP(w, r)
		})
	}
}
