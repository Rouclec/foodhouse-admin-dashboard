package interceptors

import (
	"net/http"
)

const (
	// HeaderAuthentication is the header key for the Authorization header.
	// this header contains the JWT access token.
	HeaderAuthentication = "Authorization"
	// ContextKeyUserID is the key for the user ID in the request context.
	// The Authorization interceptor relies on this being set, and it should
	// be set by an upstream interceptor (most likely a trusted authentication interceptor).
	ContextKeyUserID = contextKey("userID")
	// ContextKeyRole is the key for the user role in the request context.
	ContextKeyRole = contextKey("role")
	// ContextKeyStatus is the key for the user status in the request context.
	ContextKeyStatus = contextKey("status")
	// BearerPrefix is the prefix for the Authorization header value.
	// The Authorization header value should be in the format "Bearer <JWT access token>".
	BearerPrefix = "Bearer "
	// RoleAdmin is the role for an admin user.
	RoleAdmin = "USER_ROLE_ADMIN"
	//RoleAgent is the role for agent users
	RoleAgent = "USER_ROLE_AGENT"
	//UserActiveStatus is the status for active users
	UserActiveStatus = "UserStatus_ACTIVE"
)

// HTTPInterceptor is a type for HTTP middleware.
// An interceptor accepts a http.Handler, wraps it with some logic, and returns a new http.Handler.
type HTTPInterceptor func(next http.Handler) http.Handler

// contextKey is a type used for keys in the context.
// Specifically, this is used for setting the userID and role in the request context.
type contextKey string

// WireDefaultInterceptors wires the default interceptors for the JSON proxy.
// Currently this is the Firebase authentication interceptor and the authorization interceptor.
func WireDefaultInterceptors(client TokenVerifier, handler http.Handler) http.Handler {
	return NewFirebaseAuthenticationInterceptor(client)(
		NewAuthorizationInterceptor()(handler),
	)
}
