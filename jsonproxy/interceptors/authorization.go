package interceptors

import (
	"net/http"
	"regexp"
	"strings"
)

var (
	PublicEndpointPrefixRegex = regexp.MustCompile(`^/v1/public/`)
	OAuthEndpointPrefixRegex  = regexp.MustCompile(`^/v1/oauth/`)
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
			if allowed, status, msg := isRequestAllowed(r); !allowed {
				http.Error(w, msg, status)
				return
			}
			next.ServeHTTP(w, r)
		})
	}
}

func isRequestAllowed(r *http.Request) (bool, int, string) {
	ctx := r.Context()

	userID, _ := ctx.Value(ContextKeyUserID).(string)
	role, _ := ctx.Value(ContextKeyRole).(string)
	status, _ := ctx.Value(ContextKeyStatus).(string)

	if isPublicEndpoint(r.URL.Path) {
		return true, 0, ""
	}
	if isOAuthEndpoint(r.URL.Path) {
		return true, 0, ""
	}
	if !isUserActive(status) {
		return false, http.StatusUnauthorized, "User is inactive"
	}
	if isAdmin(role) {
		return true, 0, ""
	}
	if isAdminEndpoint(r.URL.Path) {
		return false, http.StatusForbidden, "Unauthorized"
	}
	if isAgent(role) {
		return true, 0, ""
	}
	if !isPathValidAndAuthorized(r.URL.Path, userID) {
		return false, http.StatusForbidden, "Unauthorized"
	}

	return true, 0, ""
}

func isPublicEndpoint(path string) bool {
	return PublicEndpointPrefixRegex.MatchString(path)
}

func isOAuthEndpoint(path string) bool {
	return OAuthEndpointPrefixRegex.MatchString(path)
}

func isUserActive(status string) bool {
	return status == UserActiveStatus
}

func isAdmin(role string) bool {
	return role == RoleAdmin
}

func isAgent(role string) bool {
	return role == RoleAgent
}

func isAdminEndpoint(path string) bool {
	return AdminEndpointPrefixRegex.MatchString(path)
}

func isPathValidAndAuthorized(path, userID string) bool {
	parts := strings.Split(path, "/")

	minimumPartsLength := 4

	if len(parts) < minimumPartsLength {
		return false
	}
	return parts[3] == userID
}
