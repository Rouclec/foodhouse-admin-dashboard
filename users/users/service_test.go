package users_test

import (
	"context"
	"database/sql"

	"fmt"
	"os"

	"testing"

	"github.com/foodhouse/foodhouseapp/grpc/go/types"
	"github.com/foodhouse/foodhouseapp/grpc/go/usersgrpc"

	smsMock "github.com/foodhouse/foodhouseapp/sms/mocks"
	"github.com/foodhouse/foodhouseapp/users/db/repo/mocks"
	"github.com/foodhouse/foodhouseapp/users/db/sqlc"
	sqlc_mocks "github.com/foodhouse/foodhouseapp/users/db/sqlc/mocks"
	"github.com/foodhouse/foodhouseapp/users/users"
	usersMocks "github.com/foodhouse/foodhouseapp/users/users/mocks"
	"github.com/google/uuid"
	"github.com/rs/zerolog"

	"github.com/stretchr/testify/require"
	"go.uber.org/mock/gomock"
)

func TestSendSignupSmsOtp(t *testing.T) {
	ctrl := gomock.NewController(t)
	defer ctrl.Finish()

	// Common variables for all test cases
	phoneNumberStr := "+15413334444"
	otpStr := "123456"
	requestID := uuid.NewString()
	logger := zerolog.New(os.Stdout)

	testCases := map[string]struct {
		setupMocks func(
			mockRepo *mocks.MockUsersRepo,
			mockQuerier *sqlc_mocks.MockQuerier,
			mockSmsSender *smsMock.MockSmsSender,
			mockOtpGenerator *usersMocks.MockOtpGenerator,
		)
		request       *usersgrpc.SendSignupSmsOtpRequest
		expectedError error
		expectedResp  *usersgrpc.SendSignUpSmsOtpResponse
	}{
		"Created": {
			setupMocks: func(
				mockRepo *mocks.MockUsersRepo,
				mockQuerier *sqlc_mocks.MockQuerier,
				mockSmsSender *smsMock.MockSmsSender,
				mockOtpGenerator *usersMocks.MockOtpGenerator,
			) {
				// Mock Repo behavior
				mockRepo.EXPECT().Begin(gomock.Any()).Times(1).Return(mockQuerier, &sqlc_mocks.TxMock{}, nil)
				mockRepo.EXPECT().Do().Return(mockQuerier).AnyTimes()

				// Mock Querier behavior
				mockQuerier.EXPECT().
					GetUserByPhoneNumber(gomock.Any(), phoneNumberStr).
					Return(sqlc.User{}, sql.ErrNoRows).
					Times(1)

				mockQuerier.EXPECT().
					CountSentOtpsToFactorToday(gomock.Any(), gomock.Any()).
					Return(int64(0), nil).
					Times(1)

				// Mock OTP Generator behavior
				mockOtpGenerator.EXPECT().GenerateOtp(gomock.Any(), gomock.Any(), gomock.Any()).Return(
					requestID, otpStr, nil).Times(1)

				// Mock SMS Sender behavior
				smsResponse := uuid.NewString()
				mockSmsSender.EXPECT().SendSms(gomock.Any(), phoneNumberStr, gomock.Any()).
					Return(&smsResponse, nil).Times(1)
			},
			request: &usersgrpc.SendSignupSmsOtpRequest{
				PhoneNumber: phoneNumberStr,
			},
			expectedError: nil,
			expectedResp: &usersgrpc.SendSignUpSmsOtpResponse{
				RequestId: requestID,
			},
		},
		"UserAlreadyExists": {
			setupMocks: func(
				mockRepo *mocks.MockUsersRepo,
				mockQuerier *sqlc_mocks.MockQuerier,
				_ *smsMock.MockSmsSender,
				_ *usersMocks.MockOtpGenerator,
			) {
				mockRepo.EXPECT().Begin(gomock.Any()).Times(1).Return(mockQuerier, &sqlc_mocks.TxMock{}, nil)
				mockRepo.EXPECT().Do().Return(mockQuerier).AnyTimes()

				// User exists in the database
				mockQuerier.EXPECT().
					GetUserByPhoneNumber(gomock.Any(), phoneNumberStr).
					Return(sqlc.User{PhoneNumber: phoneNumberStr}, nil).
					Times(1)
			},
			request: &usersgrpc.SendSignupSmsOtpRequest{
				PhoneNumber: phoneNumberStr,
			},
			expectedError: fmt.
				Errorf("rpc error: code = AlreadyExists desc = user already exists for phone number: %v",
					phoneNumberStr),
			expectedResp: nil,
		},
		"Invalid phone number": {
			setupMocks: func(
				mockRepo *mocks.MockUsersRepo,
				mockQuerier *sqlc_mocks.MockQuerier,
				_ *smsMock.MockSmsSender,
				_ *usersMocks.MockOtpGenerator,
			) {
				mockRepo.EXPECT().Begin(gomock.Any()).Times(1).Return(mockQuerier, &sqlc_mocks.TxMock{}, nil)
				mockRepo.EXPECT().Do().Return(mockQuerier).AnyTimes()
				mockQuerier.EXPECT().GetUserByPhoneNumber(gomock.Any(), gomock.Any()).Return(sqlc.User{}, nil).Times(0)
				// mockQuerier.EXPECT().CreateSentOtp(gomock.Any(), gomock.Any()).Return(sqlc.SentOtp{}, nil).Times(0)
			},
			request: &usersgrpc.SendSignupSmsOtpRequest{
				PhoneNumber: "1060915017410",
			},
			expectedError: fmt.Errorf("rpc error: code = InvalidArgument desc = Error validating phone number"),
			expectedResp:  nil,
		},
		"ExceededOtpLimit": {
			setupMocks: func(
				mockRepo *mocks.MockUsersRepo,
				mockQuerier *sqlc_mocks.MockQuerier,
				_ *smsMock.MockSmsSender,
				_ *usersMocks.MockOtpGenerator,
			) {
				mockRepo.EXPECT().Begin(gomock.Any()).Times(1).Return(mockQuerier, &sqlc_mocks.TxMock{}, nil)
				mockRepo.EXPECT().Do().Return(mockQuerier).AnyTimes()

				// OTP limit exceeded
				mockQuerier.EXPECT().GetUserByPhoneNumber(gomock.Any(), phoneNumberStr).
					Return(sqlc.User{}, sql.ErrNoRows).Times(1)
				mockQuerier.EXPECT().CountSentOtpsToFactorToday(gomock.Any(), gomock.Any()).
					Return(int64(21), nil).Times(1)
			},
			request: &usersgrpc.SendSignupSmsOtpRequest{
				PhoneNumber: phoneNumberStr,
			},
			expectedError: fmt.Errorf("rpc error: code = ResourceExhausted desc = Too many requests to this phone number"),
			expectedResp:  nil,
		},
	}

	for name, tc := range testCases {
		t.Run(name, func(t *testing.T) {
			// Create mocks for each dependency
			mockRepo := mocks.NewMockUsersRepo(ctrl)
			mockQuerier := sqlc_mocks.NewMockQuerier(ctrl)
			mockSmsSender := smsMock.NewMockSmsSender(ctrl)
			mockOtpGenerator := usersMocks.NewMockOtpGenerator(ctrl)

			// Set up mocks specific to this test case
			tc.setupMocks(mockRepo, mockQuerier, mockSmsSender, mockOtpGenerator)

			// Create the service
			usersService := users.NewUsers(mockRepo, logger, mockSmsSender, mockOtpGenerator, nil, false)

			// Call the method
			resp, err := usersService.SendSignupSmsOtp(context.Background(), tc.request)

			// Assertions
			if tc.expectedError != nil {
				require.Error(t, err)
				require.ErrorContains(t, err, tc.expectedError.Error())
				require.Nil(t, resp)
			} else {
				require.NoError(t, err)
				require.NotNil(t, resp)
				require.Equal(t, tc.expectedResp.GetRequestId(), resp.GetRequestId())
			}
		})
	}
}

func TestSignup(t *testing.T) {
	ctrl := gomock.NewController(t)
	defer ctrl.Finish()

	testOtpStr := "123456"
	testEmail := "testuser@foodhouse.com"
	failedPassword := "foodh2025"
	validPassword := "F00Dh0u532025"
	requestID := uuid.NewString()
	logger := zerolog.New(os.Stdout)

	testCases := map[string]struct {
		setupMocks func(mockRepo *mocks.MockUsersRepo,
			mockQuerier *sqlc_mocks.MockQuerier,
			mockTokenManager *usersMocks.MockTokenManager,
			mockOtpGenerator *usersMocks.MockOtpGenerator)
		request       *usersgrpc.SignupRequest
		expectedError error
		expectedResp  *usersgrpc.SignupResponse
	}{
		"invalidEmail": {
			setupMocks: func(mockRepo *mocks.MockUsersRepo,
				_ *sqlc_mocks.MockQuerier,
				_ *usersMocks.MockTokenManager,
				_ *usersMocks.MockOtpGenerator) {
				mockRepo.EXPECT().Begin(gomock.Any()).Times(0)
			},
			request: &usersgrpc.SignupRequest{
				PhoneFactor: &usersgrpc.AuthFactor{
					Type:        usersgrpc.FactorType_FACTOR_TYPE_SMS_OTP,
					Id:          requestID,
					SecretValue: testOtpStr,
				},
				UserType: usersgrpc.UserType_USER_TYPE_FARMER,
				Password: failedPassword,
			},
			expectedError: fmt.Errorf("Invalid email"),
			expectedResp:  nil,
		},
		"PasswordLengthBelowMinimum": {
			setupMocks: func(mockRepo *mocks.MockUsersRepo,
				_ *sqlc_mocks.MockQuerier,
				_ *usersMocks.MockTokenManager,
				_ *usersMocks.MockOtpGenerator) {
				mockRepo.EXPECT().Begin(gomock.Any()).Times(0)
			},
			request: &usersgrpc.SignupRequest{
				PhoneFactor: &usersgrpc.AuthFactor{
					Type:        usersgrpc.FactorType_FACTOR_TYPE_SMS_OTP,
					Id:          requestID,
					SecretValue: testOtpStr,
				},
				Email:    testEmail,
				UserType: usersgrpc.UserType_USER_TYPE_FARMER,
				Password: failedPassword,
			},
			expectedError: fmt.Errorf("Password should be at least %v characters long", users.MinimumPasswordLength),
			expectedResp:  nil,
		},
		"Invalid OTP": {
			setupMocks: func(mockRepo *mocks.MockUsersRepo,
				mockQuerier *sqlc_mocks.MockQuerier,
				_ *usersMocks.MockTokenManager,
				mockOtpGenerator *usersMocks.MockOtpGenerator) {
				mockRepo.EXPECT().Begin(gomock.Any()).Times(1).Return(mockQuerier, &sqlc_mocks.TxMock{}, nil)
				mockOtpGenerator.EXPECT().VerifyOtpAuthFactor(gomock.Any(), gomock.Any()).Return("", fmt.Errorf("Invalid OTP"))
			},
			request: &usersgrpc.SignupRequest{
				PhoneFactor: &usersgrpc.AuthFactor{
					Type:        usersgrpc.FactorType_FACTOR_TYPE_SMS_OTP,
					Id:          requestID,
					SecretValue: "wrongOTP",
				},
				Email:    testEmail,
				UserType: usersgrpc.UserType_USER_TYPE_FARMER,
				Password: validPassword,
			},
			expectedError: fmt.Errorf("Failed to validate OTP: Invalid OTP"),
			expectedResp:  nil,
		},
		"Successful Signup": {
			setupMocks: func(mockRepo *mocks.MockUsersRepo,
				mockQuerier *sqlc_mocks.MockQuerier,
				mockTokenManager *usersMocks.MockTokenManager,
				mockOtpGenerator *usersMocks.MockOtpGenerator) {
				mockRepo.EXPECT().Begin(gomock.Any()).Times(1).Return(mockQuerier, &sqlc_mocks.TxMock{}, nil)
				mockOtpGenerator.EXPECT().VerifyOtpAuthFactor(gomock.Any(), gomock.Any()).Return("+1234567890", nil)
				mockQuerier.EXPECT().CreateUser(gomock.Any(), gomock.Any()).Return(sqlc.User{ID: "newUserId"}, nil)
				mockTokenManager.EXPECT().GenerateAccessToken(gomock.Any(), "newUserId", gomock.Any()).Return("accessToken", nil)
				mockTokenManager.EXPECT().GenerateRefreshToken(gomock.Any(), "newUserId").Return("refreshToken", nil)
			},
			request: &usersgrpc.SignupRequest{
				PhoneFactor: &usersgrpc.AuthFactor{
					Type:        usersgrpc.FactorType_FACTOR_TYPE_SMS_OTP,
					Id:          requestID,
					SecretValue: testOtpStr,
				},
				Email:    testEmail,
				UserType: usersgrpc.UserType_USER_TYPE_FARMER,
				Password: validPassword,
			},
			expectedError: nil,
			expectedResp: &usersgrpc.SignupResponse{
				UserId: "newUserId",
				Tokens: &usersgrpc.Tokens{
					AccessToken:  "accessToken",
					RefreshToken: "refreshToken",
				},
			},
		},
	}

	for name, tc := range testCases {
		t.Run(name, func(t *testing.T) {
			mockRepo := mocks.NewMockUsersRepo(ctrl)
			mockQuerier := sqlc_mocks.NewMockQuerier(ctrl)
			mockTokenManager := usersMocks.NewMockTokenManager(ctrl)
			mockOtpGenerator := usersMocks.NewMockOtpGenerator(ctrl)
			mockTokenManagerBuilder := usersMocks.NewMockTokenManagerBuilder(ctrl)
			mockTokenManagerBuilder.EXPECT().WithQuerier(gomock.Any()).Return(mockTokenManager).AnyTimes()

			tc.setupMocks(mockRepo, mockQuerier, mockTokenManager, mockOtpGenerator)

			usersService := users.NewUsers(mockRepo, logger, nil, mockOtpGenerator, mockTokenManagerBuilder, false)

			resp, err := usersService.Signup(context.Background(), tc.request)

			if tc.expectedError != nil {
				require.Error(t, err)
				require.ErrorContains(t, err, tc.expectedError.Error())
				require.Nil(t, resp)
			} else {
				require.NoError(t, err)
				require.NotNil(t, resp)
				require.Equal(t, tc.expectedResp.GetUserId(), resp.GetUserId())
				require.Equal(t, tc.expectedResp.GetTokens().GetAccessToken(), resp.GetTokens().GetAccessToken())
				require.Equal(t, tc.expectedResp.GetTokens().GetRefreshToken(), resp.GetTokens().GetRefreshToken())
			}
		})
	}
}

func TestRefreshAccessToken(t *testing.T) {
	ctrl := gomock.NewController(t)
	defer ctrl.Finish()

	logger := zerolog.New(os.Stdout)
	testRefreshToken := "validRefreshToken"
	invalidRefreshToken := "invalidRefreshToken"
	testUserID := "testUserId"
	testCases := map[string]struct {
		setupMocks func(mockRepo *mocks.MockUsersRepo,
			mockQuerier *sqlc_mocks.MockQuerier,
			mockTokenManager *usersMocks.MockTokenManager)
		request       *usersgrpc.RefreshAccessTokenRequest
		expectedError error
		expectedResp  *usersgrpc.RefreshAccessTokenResponse
	}{
		"Invalid Refresh Token": {
			setupMocks: func(mockRepo *mocks.MockUsersRepo,
				mockQuerier *sqlc_mocks.MockQuerier,
				mockTokenManager *usersMocks.MockTokenManager) {
				mockRepo.EXPECT().Do().Return(mockQuerier).AnyTimes()
				mockTokenManager.EXPECT().RefreshTokenIsValid(gomock.Any(), invalidRefreshToken).Return(false, "", nil)
			},
			request: &usersgrpc.RefreshAccessTokenRequest{
				RefreshToken: invalidRefreshToken,
			},
			expectedError: fmt.Errorf("Refresh token is invalid"),
			expectedResp:  nil,
		},
		"Valid Refresh Token - Access Token Generation Failure": {
			setupMocks: func(mockRepo *mocks.MockUsersRepo,
				mockQuerier *sqlc_mocks.MockQuerier,
				mockTokenManager *usersMocks.MockTokenManager) {
				mockRepo.EXPECT().Do().Return(mockQuerier).AnyTimes()
				mockTokenManager.EXPECT().
					RefreshTokenIsValid(gomock.Any(), testRefreshToken).
					Return(true, testUserID, nil)
				mockQuerier.EXPECT().GetUser(gomock.Any(), testUserID).Times(1)
				mockTokenManager.EXPECT().
					GenerateAccessToken(gomock.Any(), testUserID, gomock.Any()).
					Return("", fmt.Errorf("Token generation failed"))
			},
			request: &usersgrpc.RefreshAccessTokenRequest{
				RefreshToken: testRefreshToken,
			},
			expectedError: fmt.Errorf("Failed to generate access token: Token generation failed"),
			expectedResp:  nil,
		},
		"Successful Token Refresh": {
			setupMocks: func(mockRepo *mocks.MockUsersRepo,
				mockQuerier *sqlc_mocks.MockQuerier,
				mockTokenManager *usersMocks.MockTokenManager) {
				mockRepo.EXPECT().Do().Return(mockQuerier).AnyTimes()
				mockTokenManager.EXPECT().RefreshTokenIsValid(gomock.Any(), testRefreshToken).Return(true, testUserID, nil)
				mockQuerier.EXPECT().GetUser(gomock.Any(), testUserID).Times(1)
				mockTokenManager.EXPECT().GenerateAccessToken(gomock.Any(), testUserID, gomock.Any()).Return("newAccessToken", nil)
			},
			request: &usersgrpc.RefreshAccessTokenRequest{
				RefreshToken: testRefreshToken,
			},
			expectedError: nil,
			expectedResp: &usersgrpc.RefreshAccessTokenResponse{
				AccessToken: "newAccessToken",
			},
		},
	}

	for name, tc := range testCases {
		t.Run(name, func(t *testing.T) {
			mockRepo := mocks.NewMockUsersRepo(ctrl)
			mockQuerier := sqlc_mocks.NewMockQuerier(ctrl)
			mockTokenManager := usersMocks.NewMockTokenManager(ctrl)
			mockTokenManagerBuilder := usersMocks.NewMockTokenManagerBuilder(ctrl)

			mockRepo.EXPECT().Do().Return(mockQuerier).AnyTimes()
			mockTokenManagerBuilder.EXPECT().WithQuerier(gomock.Any()).Return(mockTokenManager).AnyTimes()

			tc.setupMocks(mockRepo, mockQuerier, mockTokenManager)

			usersService := users.NewUsers(mockRepo, logger, nil, nil, mockTokenManagerBuilder, false)

			resp, err := usersService.RefreshAccessToken(context.Background(), tc.request)

			if tc.expectedError != nil {
				require.Error(t, err)
				require.ErrorContains(t, err, tc.expectedError.Error())
				require.Nil(t, resp)
			} else {
				require.NoError(t, err)
				require.NotNil(t, resp)
				require.Equal(t, tc.expectedResp.GetAccessToken(), resp.GetAccessToken())
			}
		})
	}
}

func TestGetUserByID(t *testing.T) {
	ctrl := gomock.NewController(t)
	defer ctrl.Finish()

	logger := zerolog.New(os.Stdout)
	testUserID := "testUserId"
	testUser := sqlc.User{ID: testUserID} // Ensure struct is not nil

	testCases := map[string]struct {
		setupMocks    func(mockRepo *mocks.MockUsersRepo, mockQuerier *sqlc_mocks.MockQuerier)
		request       *usersgrpc.GetUserByIDRequest
		expectedError error
		expectedResp  *usersgrpc.GetUserByIDResponse
	}{
		"User Not Found": {
			setupMocks: func(mockRepo *mocks.MockUsersRepo, mockQuerier *sqlc_mocks.MockQuerier) {
				mockRepo.EXPECT().Do().Return(mockQuerier).AnyTimes()
				mockQuerier.EXPECT().GetUser(gomock.Any(), testUserID).Return(sqlc.User{}, fmt.Errorf("User not found"))
			},
			request:       &usersgrpc.GetUserByIDRequest{UserId: testUserID},
			expectedError: fmt.Errorf("User not found"),
			expectedResp:  nil,
		},
		"Successful User Retrieval": {
			setupMocks: func(mockRepo *mocks.MockUsersRepo, mockQuerier *sqlc_mocks.MockQuerier) {
				mockRepo.EXPECT().Do().Return(mockQuerier).AnyTimes()
				mockQuerier.EXPECT().GetUser(gomock.Any(), testUserID).Return(testUser, nil)
			},
			request:       &usersgrpc.GetUserByIDRequest{UserId: testUserID},
			expectedError: nil,
			expectedResp: &usersgrpc.GetUserByIDResponse{
				User: &usersgrpc.User{UserId: testUserID},
			},
		},
	}

	for name, tc := range testCases {
		t.Run(name, func(t *testing.T) {
			mockRepo := mocks.NewMockUsersRepo(ctrl)
			mockQuerier := sqlc_mocks.NewMockQuerier(ctrl)

			mockRepo.EXPECT().Do().Return(mockQuerier).AnyTimes()
			tc.setupMocks(mockRepo, mockQuerier)

			usersService := users.NewUsers(mockRepo, logger, nil, nil, nil, false)

			resp, err := usersService.GetUserByID(context.Background(), tc.request)

			if tc.expectedError != nil {
				require.Error(t, err)
				require.ErrorContains(t, err, tc.expectedError.Error())
				require.Nil(t, resp)
			} else {
				require.NoError(t, err)
				require.NotNil(t, resp)
				require.Equal(t, tc.expectedResp.GetUser().GetUserId(), resp.GetUser().GetUserId())
			}
		})
	}
}

func TestCompleteRegistration(t *testing.T) {
	ctrl := gomock.NewController(t)
	defer ctrl.Finish()

	logger := zerolog.New(os.Stdout)
	testUserID := "testUserId"
	testFirstName := "John"
	testLastName := "Doe"
	testEmail := "john.doe@example.com"
	testLat := 40.7128
	testLon := -74.0060

	testCases := map[string]struct {
		setupMocks    func(mockRepo *mocks.MockUsersRepo, mockQuerier *sqlc_mocks.MockQuerier)
		request       *usersgrpc.CompleteRegistrationRequest
		expectedError error
		expectedResp  *usersgrpc.CompleteRegistrationResponse
	}{
		"Successful Registration": {
			setupMocks: func(mockRepo *mocks.MockUsersRepo, mockQuerier *sqlc_mocks.MockQuerier) {
				mockRepo.EXPECT().Begin(gomock.Any()).Times(1).Return(mockQuerier, &sqlc_mocks.TxMock{}, nil)
				mockQuerier.EXPECT().GetUserForUpdate(gomock.Any(), testUserID).Return(sqlc.User{ID: testUserID}, nil)
				mockQuerier.EXPECT().UpdateUser(gomock.Any(), gomock.Any()).Return(sqlc.User{}, nil)
			},
			request: &usersgrpc.CompleteRegistrationRequest{
				UserId:              testUserID,
				FirstName:           testFirstName,
				LastName:            testLastName,
				Email:               testEmail,
				LocationCoordinates: &types.Point{Lat: testLat, Lon: testLon},
			},
			expectedError: nil,
			expectedResp:  &usersgrpc.CompleteRegistrationResponse{Message: "Registration completed successfully."},
		},
		"User Not Found": {
			setupMocks: func(mockRepo *mocks.MockUsersRepo, mockQuerier *sqlc_mocks.MockQuerier) {
				mockRepo.EXPECT().Begin(gomock.Any()).Times(1).Return(mockQuerier, &sqlc_mocks.TxMock{}, nil)
				mockQuerier.EXPECT().GetUserForUpdate(gomock.Any(), testUserID).Return(sqlc.User{}, fmt.Errorf("User not found"))
			},
			request: &usersgrpc.CompleteRegistrationRequest{
				UserId: testUserID,
			},
			expectedError: fmt.Errorf("User not found"),
			expectedResp:  nil,
		},
	}

	for name, tc := range testCases {
		t.Run(name, func(t *testing.T) {
			mockRepo := mocks.NewMockUsersRepo(ctrl)
			mockQuerier := sqlc_mocks.NewMockQuerier(ctrl)

			mockRepo.EXPECT().Do().Return(mockQuerier).AnyTimes()
			tc.setupMocks(mockRepo, mockQuerier)

			usersService := users.NewUsers(mockRepo, logger, nil, nil, nil, false)

			resp, err := usersService.CompleteRegistration(context.Background(), tc.request)

			if tc.expectedError != nil {
				require.Error(t, err)
				require.ErrorContains(t, err, tc.expectedError.Error())
				require.Nil(t, resp)
			} else {
				require.NoError(t, err)
				require.NotNil(t, resp)
				require.Equal(t, tc.expectedResp.GetMessage(), resp.GetMessage())
			}
		})
	}
}
