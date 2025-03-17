package interceptors_test

import (
	"io"
	"net/http"
	"net/http/httptest"
	"testing"

	"firebase.google.com/go/auth"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"github.com/foodhouse/foodhouseapp/jsonproxy/interceptors"
	interceptors_mocks "github.com/foodhouse/foodhouseapp/jsonproxy/interceptors/mocks"
	"go.uber.org/mock/gomock"
)

func TestNewFirebaseAuthenticationInterceptor(t *testing.T) {
	type tt struct {
		method             string
		path               string
		body               io.Reader
		userID             string
		role               string
		expectedStatusCode int
	}

	okHandler := http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.Write([]byte("OK"))
	})

	testCases := map[string]tt{
		"GET /v1/public/health-check": {
			method:             "GET",
			path:               "/v1/public/health-check",
			body:               nil,
			userID:             "",
			role:               "",
			expectedStatusCode: http.StatusOK,
		},
		"GET /v1/admin/users/123": {
			method:             "GET",
			path:               "/v1/admin/users/123",
			body:               nil,
			userID:             "123",
			role:               "",
			expectedStatusCode: http.StatusForbidden,
		},
		"GET /v1/admin/users/123 with admin role": {
			method:             "GET",
			path:               "/v1/admin/users/123",
			body:               nil,
			userID:             "123",
			role:               interceptors.RoleAdmin,
			expectedStatusCode: http.StatusOK,
		},
		"GET /v1/users/123": {
			method:             "GET",
			path:               "/v1/users/123",
			body:               nil,
			userID:             "123",
			role:               "",
			expectedStatusCode: http.StatusOK,
		},
		"GET /v1/users/123 wrong user id": {
			method:             "GET",
			path:               "/v1/users/456",
			body:               nil,
			userID:             "123",
			role:               "",
			expectedStatusCode: http.StatusForbidden,
		},
	}

	for name, tc := range testCases {
		t.Run(name, func(tt *testing.T) {
			ctrl := gomock.NewController(tt)
			responseWriter := httptest.NewRecorder()
			req, err := http.NewRequest(tc.method, tc.path, tc.body)
			require.NoErrorf(t, err, "failed to create request")

			tokenVerifier := interceptors_mocks.NewMockTokenVerifier(ctrl)
			if tc.userID != "" {
				claims := map[string]interface{}{
					"role": tc.role,
				}
				tokenVerifier.EXPECT().VerifyIDToken(gomock.Any(), gomock.Any()).Return(&auth.Token{
					UID:    tc.userID,
					Claims: claims,
				}, nil)
				req.Header.Set(interceptors.HeaderAuthentication, interceptors.BearerPrefix+"token")
			}
			handler := interceptors.WireDefaultInterceptors(tokenVerifier, okHandler)

			handler.ServeHTTP(responseWriter, req)
			assert.Equalf(t, tc.expectedStatusCode, responseWriter.Code, "expected status code 200, got %d", responseWriter.Code)
		})
	}
}
