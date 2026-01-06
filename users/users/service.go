package users

import (
	"bytes"
	"context"
	"database/sql"
	"errors"
	"fmt"
	"math"
	"regexp"
	"strconv"
	"strings"
	"time"

	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/nyaruka/phonenumbers"
	"github.com/phpdave11/gofpdf"
	"github.com/rs/zerolog"
	"golang.org/x/crypto/bcrypt"
	"google.golang.org/genproto/googleapis/api/httpbody"
	"google.golang.org/grpc"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
	"google.golang.org/protobuf/types/known/timestamppb"

	"github.com/foodhouse/foodhouseapp/grpc/go/ordersgrpc"
	"github.com/foodhouse/foodhouseapp/grpc/go/types"
	"github.com/foodhouse/foodhouseapp/grpc/go/usersgrpc"
	"github.com/foodhouse/foodhouseapp/sms"
	"github.com/foodhouse/foodhouseapp/users/db/converters"
	"github.com/foodhouse/foodhouseapp/users/db/repo"
	"github.com/foodhouse/foodhouseapp/users/db/sqlc"
)

const (

	// DailySMSLimit is the maximum number of times a particular phone number can receive SMSs from the service.
	DailySMSLimit = 20

	MinimumPasswordLength = 12

	VerifyEmail = "VERIFY_EMAIL"

	ResetPassword = "RESET_PASSWORD"

	OneMillion = 1000000

	DefaultRating = -1.00

	CENT = 100

	ClaimKeyRole = "role"

	ClaimKeyStatus = "status"

	TWO = 2

	ThirtyTwo = 32
)

// Impl is the implementation of the Users service.
type Impl struct {
	repo                repo.UsersRepo
	logger              zerolog.Logger
	otpGenerator        OtpGenerator
	smsSender           sms.SmsSender
	tokenManagerBuilder TokenManagerBuilder
	devMethodsEndabled  bool
	ordersService       SignupCommissionClient

	usersgrpc.UnsafeUsersServer
}

var _ usersgrpc.UsersServer = (*Impl)(nil)

// SignupCommissionClient is a narrow interface for the only Orders RPC the Users
// service needs for referral signup commissions. Keeping this small makes it
// easy to stub in tests.
type SignupCommissionClient interface {
	CreateSignupCommission(
		ctx context.Context,
		in *ordersgrpc.CreateSignupCommissionRequest,
		opts ...grpc.CallOption,
	) (*ordersgrpc.CreateSignupCommissionResponse, error)
}

// NewUsers returns a new instance of the UsersImpl.
func NewUsers(
	repo repo.UsersRepo,
	logger zerolog.Logger,
	smsSender sms.SmsSender,
	otpGenerator OtpGenerator,
	tokenManagerBuilder TokenManagerBuilder,
	ordersService SignupCommissionClient,
	enableDevMethods bool,
) *Impl {
	return &Impl{
		repo:                repo,
		logger:              logger,
		otpGenerator:        otpGenerator,
		smsSender:           smsSender,
		tokenManagerBuilder: tokenManagerBuilder,
		ordersService:       ordersService,
		devMethodsEndabled:  enableDevMethods,
	}
}

var emailRegex = regexp.MustCompile(`^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$`)

func isValidEmail(email string) bool {
	return emailRegex.MatchString(email)
}

// SendSignupSmsOtp sends an OTP to the user's phone number for signup.
func (i *Impl) SendSignupSmsOtp(ctx context.Context, req *usersgrpc.SendSignupSmsOtpRequest) (
	*usersgrpc.SendSignUpSmsOtpResponse, error) {
	i.logger.Debug().Str("phone_number", req.GetPhoneNumber()).Msg("SendSignupSmsOtp")

	querier, tx, err := i.repo.Begin(ctx)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to begin transaction: %v", err)
	}

	// Proper rollback handling
	defer func() {
		err = tx.Rollback(ctx)
		if err != nil && !errors.Is(err, sql.ErrTxDone) {
			i.logger.Err(err).Msgf("Failed to rollback transaction: %v", req)
		}
	}()

	// Proper rollback handling
	formattedNumber, err := formatPhoneNumber(req.GetPhoneNumber())
	if err != nil {
		return nil, status.Errorf(codes.InvalidArgument, "invalid phone number: %v", err)
	}

	i.logger.Debug().Interface("formarted phone number from helper function",
		formattedNumber).Msg("Formatted phone number")
	// Format the number in E.164 format

	_, err = querier.GetUserByPhoneNumber(ctx, formattedNumber)
	if err == nil {
		// If no error and user exists, return an "already exists" error
		return nil, status.Errorf(codes.AlreadyExists, "user already exists for phone number: %v", req.GetPhoneNumber())
	}

	// Check if the error indicates the user does not exist (success case)
	// This is an error we can't handle, return immediately.
	if !errors.Is(err, sql.ErrNoRows) {
		return nil, fmt.Errorf("failed to check for existing users: %w", err)
	}

	// Success: User does not exist, proceed with action.
	totalSmsRequestsToPhoneNumberToday, err := querier.CountSentOtpsToFactorToday(ctx, formattedNumber)

	if err != nil {
		return nil, status.Errorf(codes.Internal, "Error checking sms requests for today %v", err)
	}

	if totalSmsRequestsToPhoneNumberToday > DailySMSLimit {
		return nil, status.Errorf(codes.ResourceExhausted, "Too many requests to this phone number")
	}

	// Generate a random 6-digit number.
	requestID, otp, err := i.otpGenerator.GenerateOtp(ctx, usersgrpc.FactorType_FACTOR_TYPE_SMS_OTP, formattedNumber)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "Error generating OTP: %v", err)
	}

	i.logger.Debug().Msgf("Request id %v, otp %v", requestID, otp)

	// Send the Message to the formatted number.
	response, err := i.smsSender.SendSms(
		ctx,
		formattedNumber,
		fmt.Sprintf(`Your verification code for FOOD HOUSE is %v`, otp),
	)

	i.logger.Debug().Interface("SMS response: ", response).Msg("Response from sms client")
	if err != nil {
		return nil, fmt.Errorf("error sending SMS: %w", err)
	}

	err = tx.Commit(ctx)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to commit transaction: %v", err)
	}

	return &usersgrpc.SendSignUpSmsOtpResponse{
		RequestId: requestID,
	}, nil
}

// The following block details the steps to hash and salt the password.
func HashPassword(password string) (string, error) {
	bytes, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if !CheckPasswordHash(password, string(bytes)) {
		return "", fmt.Errorf("hashing password failed")
	}
	return string(bytes), err
}

func CheckPasswordHash(password, hash string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))

	return err == nil
}

func formatPhoneNumber(phoneNumber string) (string, error) {
	parsedNumber, err := phonenumbers.Parse(phoneNumber, "+1")
	if err != nil {
		return "", status.Errorf(codes.InvalidArgument, "Error validating phone number: %v", err)
	}

	// Check if the number is valid
	if !phonenumbers.IsValidNumber(parsedNumber) {
		return "", status.Errorf(codes.InvalidArgument, "Invalid phone number: %s", parsedNumber)
	}

	return phonenumbers.Format(parsedNumber, phonenumbers.E164), nil
}

// Signup accepts signup information and registers the user. This method then returns
// the newly created user_id and a pair of tokens the user can user can use subsequently
// to access the API.

func (i *Impl) Signup(ctx context.Context, req *usersgrpc.SignupRequest) (*usersgrpc.SignupResponse, error) {
	if req.GetPhoneFactor().GetType() != usersgrpc.FactorType_FACTOR_TYPE_SMS_OTP {
		return nil, status.Error(codes.InvalidArgument, "phone factor must be an SMS_OTP")
	}

	userPassword := req.GetPassword()

	if req.GetEmail() != "" {
		ok := isValidEmail(req.GetEmail())

		if !ok {
			return nil, status.Errorf(codes.InvalidArgument, "Invalid email %v", req.GetEmail())
		}
	}

	var password = userPassword

	if password == "" {
		var genErr error
		password, genErr = RandomString(ThirtyTwo)

		if genErr != nil {
			i.logger.Debug().Msgf("generate password error : %v", genErr)
			return nil, status.Errorf(codes.Internal, "error signing up")
		}
	}

	// Check password for minimum length
	if len(password) < MinimumPasswordLength {
		return nil, status.Errorf(codes.InvalidArgument, "Password should be at least %v characters long",
			MinimumPasswordLength)
	}

	// Hash password using bcrypt
	hashedPassword, err := HashPassword(password)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "Failed to hash password: %v", err)
	}

	querier, tx, err := i.repo.Begin(ctx)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to begin transaction: %v", err)
	}

	//nolint:errcheck /// The rollback can return an error if the tx was already commited
	defer tx.Rollback(ctx)

	// Verify request_id and otp code
	otpPhoneNumber, err := i.otpGenerator.VerifyOtpAuthFactor(ctx, req.GetPhoneFactor())
	if err != nil {
		return nil, status.Errorf(codes.Unauthenticated, "Failed to validate OTP: %v", err)
	}

	userType, ok := usersgrpc.UserType_value[req.GetUserType().String()]
	if !ok {
		return nil, status.Errorf(codes.InvalidArgument, "invalid user type in request: %v", req.GetUserType().String())
	}

	userRole, err := getUserRoleFromType(usersgrpc.UserType(userType))

	if err != nil {
		return nil, status.Errorf(codes.Internal, "could not convert user type to role %v", err)
	}

	var email *string

	if req.GetEmail() != "" {
		e := req.GetEmail()
		email = &e
	}

	newUser := sqlc.CreateUserParams{
		PhoneNumber:             otpPhoneNumber,
		Password:                hashedPassword,
		Email:                   email,
		ResidenceCountryIsoCode: req.GetResidenceCountryIsoCode(),
		Role:                    userRole.String(),
	}

	i.logger.Debug().Interface("New user : ", newUser)

	createdDBUser, err := querier.CreateUser(ctx, newUser)
	if err != nil {
		i.logger.Err(err).Msg("Failed to create user")
		return nil, status.Errorf(codes.Internal, "Could not create user in the db: %v", err)
	}

	// Generate an access token and refresh token
	claims := map[string]any{
		ClaimKeyRole:   createdDBUser.Role,
		ClaimKeyStatus: createdDBUser.UserStatus,
	}
	accessTokens, err := i.tokenManagerBuilder.WithQuerier(querier).GenerateAccessToken(ctx, createdDBUser.ID, claims)
	if err != nil {
		i.logger.Debug().Msgf("firebase error %v", err)
		return nil, status.Errorf(codes.Internal, "Failed to generate tokens: %v", err)
	}

	refreshToken, err := i.tokenManagerBuilder.WithQuerier(querier).GenerateRefreshToken(ctx, createdDBUser.ID)
	if err != nil {
		i.logger.Debug().Msgf("firebase error %v", err)
		return nil, status.Errorf(codes.Internal, "Failed to generate tokens: %v", err)
	}

	err = tx.Commit(ctx)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to commit transaction: %v", err)
	}

	return &usersgrpc.SignupResponse{
		UserId: createdDBUser.ID,
		Tokens: &usersgrpc.Tokens{
			AccessToken:  accessTokens,
			RefreshToken: refreshToken,
		},
	}, nil
}

func getUserRoleFromType(userType usersgrpc.UserType) (usersgrpc.UserRole, error) {
	switch userType {
	case usersgrpc.UserType_USER_TYPE_FARMER:
		return usersgrpc.UserRole_USER_ROLE_FARMER, nil
	case usersgrpc.UserType_USER_TYPE_BUYER:
		return usersgrpc.UserRole_USER_ROLE_BUYER, nil
	default:
		return usersgrpc.UserRole_USER_ROLE_UNSPECIFIED, fmt.Errorf("invalid user type passed: %v", userType)
	}
}

// HealthCheck is a health check endpoint.
func (i *Impl) HealthCheck(context.Context, *usersgrpc.HealthCheckRequest) (*usersgrpc.HealthCheckResponse, error) {
	return &usersgrpc.HealthCheckResponse{}, nil
}

// RefreshAccessToken returns a new access token given a valid refresh token.
func (i *Impl) RefreshAccessToken(ctx context.Context, req *usersgrpc.RefreshAccessTokenRequest,
) (*usersgrpc.RefreshAccessTokenResponse, error) {
	isValid, userID, err := i.tokenManagerBuilder.WithQuerier(i.repo.Do()).RefreshTokenIsValid(ctx, req.GetRefreshToken())
	if err != nil {
		return nil, status.Errorf(codes.Internal, "Failed to validate refresh token: %v", err)
	}

	if !isValid {
		return nil, status.Errorf(codes.Unauthenticated, "Refresh token is invalid")
	}

	claims, err := i.getUserClaims(ctx, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to get user claims: %w", err)
	}

	accessToken, err := i.tokenManagerBuilder.WithQuerier(i.repo.Do()).GenerateAccessToken(ctx, userID, claims)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "Failed to generate access token: %v", err)
	}

	return &usersgrpc.RefreshAccessTokenResponse{
		AccessToken: accessToken,
	}, nil
}

// GetUserById accepts the user_id. This method then returns the user object from the db that matches the user_id.
func (i *Impl) GetUserByID(
	ctx context.Context,
	req *usersgrpc.GetUserByIDRequest) (*usersgrpc.GetUserByIDResponse, error) {
	userID := req.GetUserId()

	i.logger.Debug().Msgf("user id in request %v", req.GetUserId())

	foundUser, err := i.repo.Do().GetUser(ctx, userID)
	if err != nil {
		return nil, status.Errorf(codes.NotFound, "User not found: %v", err)
	}

	i.logger.Debug().Interface("User found", foundUser).Msg("User from DB")

	protoUser := converters.SqlcToProtoUser(foundUser)

	return &usersgrpc.GetUserByIDResponse{
		User: protoUser,
	}, nil
}

func safeString(s *string) string {
	if s == nil {
		return ""
	}
	return *s
}

// func getUserRole(role string) usersgrpc.UserRole {
// 	if val, ok := usersgrpc.UserRole_value[role]; ok {
// 		return usersgrpc.UserRole(val)
// 	}
// 	return usersgrpc.UserRole_USER_ROLE_UNSPECIFIED
// }

// func getLocationPoint(loc pgtype.Point) *types.Point {
// 	if !loc.Valid {
// 		return nil
// 	}
// 	return &types.Point{Lon: loc.P.X, Lat: loc.P.Y}
// }

// UpdateRegistrationData implements usersgrpc.UsersServer.
func (i *Impl) CompleteRegistration(
	ctx context.Context,
	req *usersgrpc.CompleteRegistrationRequest) (
	*usersgrpc.CompleteRegistrationResponse, error) {
	userID := req.GetUserId()

	// Initiating Database transaction
	querier, tx, err := i.repo.Begin(ctx)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to begin transaction: %v", err)
	}

	// Proper rollback handling
	defer func() {
		if rollbackErr := tx.Rollback(ctx); rollbackErr != nil && !errors.Is(rollbackErr, sql.ErrTxDone) {
			err = rollbackErr
		}
	}()

	if err != nil {
		return nil, status.Errorf(codes.Internal, "Error rolling back transaction: %v", err)
	}

	i.logger.Debug().Msgf("raw request body: %v", req)

	user, err := querier.GetUserForUpdate(ctx, userID)
	if err != nil {
		return nil, status.Errorf(codes.NotFound, "User not found: %v", err)
	}

	i.logger.Debug().Interface("args", req).Msg("Arguments")

	var email *string

	if req.GetEmail() != "" {
		e := req.GetEmail()
		email = &e
	}

	phoneNumber := user.PhoneNumber
	if req.GetPhoneNumber() != "" {
		formattedNumber, newErr := formatPhoneNumber(req.GetPhoneNumber())
		if newErr != nil {
			return nil, status.Errorf(codes.InvalidArgument, "Invalid phone number: %v", newErr)
		}

		phoneNumber = formattedNumber
	}

	arg := sqlc.UpdateUserParams{
		ID:        userID,
		FirstName: &req.FirstName,
		LastName:  &req.LastName,
		Email:     email,
		LocationCoordinates: pgtype.Point{
			P: pgtype.Vec2{X: float64(req.GetLocationCoordinates().GetLon()),
				Y: float64(req.GetLocationCoordinates().GetLat())}, Valid: true},
		ProfileImage: req.GetProfileImage(),
		Address:      &req.Address,
		PhoneNumber:  phoneNumber,
	}

	i.logger.Debug().Interface("update user params: ", arg)

	referrerID, err := i.CreateReferral(ctx, querier, req.GetReferredBy(), userID)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "error creating referral %v", err)
	}

	// Create flat signup commission for successful referrals.
	// We do this within the same users transaction: if it fails, the whole
	// registration completion is rolled back and can be retried.
	if referrerID != "" && i.ordersService != nil {
		_, commErr := i.ordersService.CreateSignupCommission(ctx, &ordersgrpc.CreateSignupCommissionRequest{
			ReferrerId: referrerID,
			ReferredId: userID,
		})
		if commErr != nil {
			return nil, status.Errorf(codes.Internal, "error creating signup commission %v", commErr)
		}
	}

	_, err = querier.UpdateUser(ctx, arg)
	if err != nil {
		return nil, status.Errorf(codes.InvalidArgument, "User cannot be updated, wrong argument: %v", err)
	}
	err = tx.Commit(ctx)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to commit transaction: %v", err)
	}

	return &usersgrpc.CompleteRegistrationResponse{
		Message: "Registration completed successfully.",
	}, nil
}

func (i *Impl) CreateReferral(ctx context.Context, querrier sqlc.Querier, referralCode string, userID string) (string, error) {
	i.logger.Debug().Msgf("referal code %v", referralCode)
	if referralCode == "" {
		return "", nil
	}

	referrer, err := querrier.GetUserByReferralCode(ctx, referralCode)

	i.logger.Debug().Msgf("referrer %v", referrer)

	if err != nil {
		return "", err
	}

	_, err = querrier.CreateReferral(ctx, sqlc.CreateReferralParams{ReferrerID: referrer.ID, ReferredID: userID})
	if err != nil {
		// Idempotency: allow retries of CompleteRegistration without failing if
		// the referral already exists.
		if pgErr, ok := err.(*pgconn.PgError); ok && pgErr.Code == "23505" {
			return referrer.ID, nil
		}
		return "", err
	}

	return referrer.ID, nil
}

// Authenticate implements usersgrpc.UsersServer.
func (i *Impl) Authenticate(ctx context.Context, req *usersgrpc.AuthenticateRequest,
) (*usersgrpc.AuthenticateResponse, error) {
	if len(req.GetFactors()) == 0 {
		i.logger.Info().Msg("No factors provided")
		return nil, status.Error(codes.InvalidArgument, "No factors provided")
	}

	userID, err := i.validateAuthFactor(ctx, req.GetFactors()[0])
	if err != nil {
		i.logger.Info().Err(err).Str("factor", req.GetFactors()[0].GetId()).Msg("Failed to validate auth factor")
		return nil, err
	}

	for _, authFactor := range req.GetFactors() {
		var authFacotrUserID string
		authFacotrUserID, err = i.validateAuthFactor(ctx, authFactor)
		if err != nil {
			i.logger.Info().Err(err).Str("factor", authFactor.GetId()).Msg("Failed to validate auth factor")
			return nil, err
		}

		if authFacotrUserID != userID {
			i.logger.Info().Str("factor", authFactor.GetId()).Msgf("User IDs do not match: %v %v", authFacotrUserID,
				userID)
			return nil, status.Error(codes.Unauthenticated, "User IDs do not match")
		}
	}

	claims, err := i.getUserClaims(ctx, userID)
	if err != nil {
		i.logger.Err(err).Str("user_id", userID).Msg("Failed to get user claims")
		return nil, err
	}

	accessToken, err := i.tokenManagerBuilder.WithQuerier(i.repo.Do()).GenerateAccessToken(ctx, userID, claims)
	if err != nil {
		i.logger.Err(err).Str("user_id", userID).Msg("Failed to generate access token")
		return nil, status.Errorf(codes.Internal, "Failed to generate access token: %v", err)
	}

	refreshToken, err := i.tokenManagerBuilder.WithQuerier(i.repo.Do()).GenerateRefreshToken(ctx, userID)
	if err != nil {
		i.logger.Err(err).Str("user_id", userID).Msg("Failed to generate refresh token")
		return nil, status.Errorf(codes.Internal, "Failed to generate refresh token: %v", err)
	}

	i.logger.Info().Str("factor", req.GetFactors()[0].GetId()).Str("user_id", userID).
		Msg("User authenticated successfully")

	return &usersgrpc.AuthenticateResponse{
		LoginComplete: true,
		Tokens: &usersgrpc.Tokens{
			AccessToken:  accessToken,
			RefreshToken: refreshToken,
		},
		UserId: userID,
	}, nil
}

func (i *Impl) getUserClaims(ctx context.Context, userID string) (map[string]any, error) {
	claims := map[string]any{}

	user, err := i.repo.Do().GetUser(ctx, userID)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "Failed to get user: %v", err)
	}

	claims[ClaimKeyRole] = user.Role
	claims[ClaimKeyStatus] = user.UserStatus

	return claims, nil
}

func (i *Impl) validateAuthFactor(ctx context.Context, authFactor *usersgrpc.AuthFactor) (string, error) {
	switch authFactor.GetType() {
	case usersgrpc.FactorType_FACTOR_TYPE_SMS_OTP:
		phoneNumber, err := i.otpGenerator.VerifyOtpAuthFactor(ctx, authFactor)
		if err != nil {
			return "", err
		}
		user, err := i.repo.Do().GetUserByPhoneNumber(ctx, phoneNumber)
		if errors.Is(err, sql.ErrNoRows) {
			return "", status.Errorf(codes.InvalidArgument, "User not found: %v", err)
		}
		if err != nil {
			return "", status.Errorf(codes.Internal, "Failed to get user: %v", err)
		}
		return user.ID, nil

	case usersgrpc.FactorType_FACTOR_TYPE_EMAIL_OTP:
		email, err := i.otpGenerator.VerifyOtpAuthFactor(ctx, authFactor)
		if err != nil {
			return "", err
		}
		user, err := i.repo.Do().GetUserByEmail(ctx, &email)
		if errors.Is(err, sql.ErrNoRows) {
			return "", status.Errorf(codes.InvalidArgument, "User not found: %v", err)
		}
		if err != nil {
			return "", status.Errorf(codes.Internal, "Failed to get user: %v", err)
		}
		return user.ID, nil

	case usersgrpc.FactorType_FACTOR_TYPE_EMAIL_PASSWORD:
		return i.validateEmailPassword(ctx, authFactor)
	case usersgrpc.FactorType_FACTOR_TYPE_EMAIL_PHONE_PASSWORD:
		if strings.Contains(authFactor.GetId(), "@") {
			i.logger.Debug().Msgf("Email factor from email phone")
			return i.validateEmailPassword(ctx, authFactor)
		}
		i.logger.Debug().Msgf("Phone factor from email phone")
		return i.validatePhonePassword(ctx, authFactor)

	case usersgrpc.FactorType_FACTOR_TYPE_UNSPECIFIED:
		fallthrough
	default:
		return "", status.Errorf(codes.InvalidArgument, "Invalid factor type: %v", authFactor.GetType())
	}
}

func (i *Impl) validateEmailPassword(ctx context.Context, authFactor *usersgrpc.AuthFactor) (string, error) {
	user, err := i.repo.Do().GetUserByEmail(ctx, &authFactor.Id)
	if err != nil {
		return "", status.Errorf(codes.NotFound, "User not found: %v", err)
	}

	i.logger.Debug().Msgf("user password log: %v", user.Password)
	if !CheckPasswordHash(authFactor.GetSecretValue(), user.Password) {
		return "", status.Error(codes.Unauthenticated, "Invalid password")
	}

	return user.ID, nil
}

func (i *Impl) validatePhonePassword(ctx context.Context, authFactor *usersgrpc.AuthFactor) (string, error) {
	user, err := i.repo.Do().GetUserByNationalNumber(ctx, authFactor.GetId())
	if err != nil {
		return "", status.Errorf(codes.NotFound, "User not found: %v", err)
	}

	if !CheckPasswordHash(authFactor.GetSecretValue(), user.Password) {
		return "", status.Error(codes.Unauthenticated, "Invalid password")
	}

	return user.ID, nil
}

// SendSmsOtp sends an OTP to the user's phone number.
func (i *Impl) SendSmsOtp(ctx context.Context, req *usersgrpc.SendSmsOtpRequest,
) (*usersgrpc.SendSmsOtpResponse, error) {
	i.logger.Debug().Str("phone_number", req.GetPhoneNumber()).Msg("SendSmsOtp")

	formattedNumber, err := formatPhoneNumber(req.GetPhoneNumber())
	if err != nil {
		return nil, status.Errorf(codes.InvalidArgument, "Invalid phone number: %v", err)
	}

	i.logger.Debug().Interface("formarted phone number from function", formattedNumber).Msg("Formatted phone number")
	// Format the number in E.164 format

	_, err = i.repo.Do().GetUserByPhoneNumber(ctx, formattedNumber)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, status.Errorf(codes.NotFound, "User not found: %v", err)
		}

		return nil, status.Errorf(codes.Internal, "Failed to check for existing users: %v", err)
	}

	// Success: User exists, proceed with action.
	totalSmsRequestsToPhoneNumberToday, err := i.repo.Do().CountSentOtpsToFactorToday(ctx, formattedNumber)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "Error checking sms requests for today %v", err)
	}

	i.logger.Debug().Interface("Number of requests today: ", totalSmsRequestsToPhoneNumberToday).
		Msg("Number of requests for phone number today")

	if totalSmsRequestsToPhoneNumberToday > DailySMSLimit {
		return nil, status.Errorf(codes.ResourceExhausted, "Too many requests to this phone number")
	}

	// Generate a random 6-digit number
	requestID, otp, err := i.otpGenerator.GenerateOtp(ctx, usersgrpc.FactorType_FACTOR_TYPE_SMS_OTP, formattedNumber)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "Error generating OTP: %v", err)
	}

	// Send the Message to the formatted number
	_, err = i.smsSender.SendSms(ctx, formattedNumber,
		fmt.Sprintf("Your verification code for FOOD HOUSE is %s", otp))
	if err != nil {
		return nil, fmt.Errorf("error sending SMS: %w", err)
	}

	return &usersgrpc.SendSmsOtpResponse{
		RequestId: requestID,
	}, nil
}

// SendEmailOtp implements usersgrpc.UsersServer.
func (i *Impl) SendEmailOtp(ctx context.Context,
	req *usersgrpc.SendEmailOtpRequest) (
	*usersgrpc.SendEmailOtpResponse, error) {
	i.logger.Debug().Str("email", req.GetEmail()).Msg("send email otp")

	_, err := i.repo.Do().GetUserByEmail(ctx, &req.Email)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, status.Errorf(codes.NotFound, "User not found: %v", err)
		}

		return nil, status.Errorf(codes.Internal, "Failed to check for existing users: %v", err)
	}

	// Success: User exists, proceed with action.
	totalMailsToEmailToday, err := i.repo.Do().CountSentOtpsToFactorToday(ctx, req.GetEmail())
	if err != nil {
		return nil, status.Errorf(codes.Internal, "Error checking sms requests for today %v", err)
	}

	i.logger.Debug().Interface("Number of requests today: ", totalMailsToEmailToday).
		Msg("Number of requests for phone number today")

	if totalMailsToEmailToday > DailySMSLimit {
		return nil, status.Errorf(codes.ResourceExhausted, "Too many requests to this phone number")
	}

	// Generate a random 6-digit number
	requestID, _, err := i.otpGenerator.GenerateOtp(ctx, usersgrpc.FactorType_FACTOR_TYPE_EMAIL_OTP, req.GetEmail())
	if err != nil {
		return nil, status.Errorf(codes.Internal, "Error generating OTP: %v", err)
	}

	// TODO: Send the Message to the formatted number
	// _, err = i.smsSender.SendSms(ctx, formattedNumber,
	// 	fmt.Sprintf("Your verification code for FOOD HOUSE is %s", otp))
	// if err != nil {
	// 	return nil, fmt.Errorf("error sending SMS: %w", err)
	// }

	return &usersgrpc.SendEmailOtpResponse{
		RequestId: requestID,
	}, nil
}

func (i *Impl) ChangePassword(ctx context.Context, req *usersgrpc.ChangePasswordRequest) (
	*usersgrpc.ChangePasswordResponse, error) {
	// Verify the auth factor here
	userID, err := i.validateAuthFactor(ctx, req.GetEmailFactor())
	if err != nil {
		return nil, status.Errorf(codes.Unauthenticated, "Failed to validate factor: %v", err)
	}

	// Checking the password for minimum length
	newUserPassword := req.GetNewPassword()

	if len(newUserPassword) < MinimumPasswordLength {
		return nil, status.Errorf(codes.Internal, "Password should be at least %v characters long", MinimumPasswordLength)
	}

	// Hash password using bcrypt
	hashedNewPassword, err := HashPassword(newUserPassword)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "Failed to hash password: %v", err)
	}

	// Declaring query to use for db transactions
	querier, tx, err := i.repo.Begin(ctx)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "Failed to begin transaction: %v", err)
	}

	// Proper rollback handling
	defer func() {
		if rollbackErr := tx.Rollback(ctx); rollbackErr != nil && !errors.Is(rollbackErr, sql.ErrTxDone) {
			i.logger.Err(err).Msg("failed to rollback transaction")
		}
	}()

	// Fetching the user by email
	foundUser, err := querier.GetUser(ctx, userID)
	if err != nil {
		return nil, status.Errorf(codes.NotFound, "Could not fetch the user by id: %v", err)
	}

	arg := sqlc.UpdateUserPasswordParams{
		ID:       foundUser.ID,
		Password: hashedNewPassword,
	}

	err = querier.UpdateUserPassword(ctx, arg)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "Could not update the user with new password: %v", err)
	}

	err = tx.Commit(ctx)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "Failed to commit the transaction: %v", err)
	}

	return &usersgrpc.ChangePasswordResponse{
		Message: "User successfully updated.",
	}, nil
}

// RevokeRefreshToken implements usersgrpc.UsersServer.
func (i *Impl) RevokeRefreshToken(ctx context.Context, req *usersgrpc.RevokeRefreshTokenRequest) (
	*usersgrpc.RevokeRefreshTokenResponse, error) {
	err := i.tokenManagerBuilder.WithQuerier(i.repo.Do()).RevokeRefreshToken(ctx, req.GetRefreshToken())
	if err != nil {
		return nil, fmt.Errorf("failed to revoke refresh token: %w", err)
	}
	return &usersgrpc.RevokeRefreshTokenResponse{
		Message: "Token revoked successfully",
	}, nil
}

// VerifyOtp implements usersgrpc.UsersServer.
func (i *Impl) VerifyOtp(ctx context.Context, req *usersgrpc.VerifyOtpRequest) (*usersgrpc.VerifyOtpResponse, error) {
	i.logger.Info().Interface("request", req).Msg("VerifyOtp")

	_, err := i.otpGenerator.VerifyOtpAuthFactor(ctx, req.GetAuthFactor())
	if err != nil {
		if errors.Is(err, ErrOtpMismatch) {
			return nil, status.Errorf(codes.Unauthenticated, "OTP does not match")
		}
		return nil, err
	}

	return &usersgrpc.VerifyOtpResponse{}, nil
}

func formatFactor(factor string) string {
	factor = strings.TrimSpace(factor) // Remove leading & trailing spaces
	if strings.Contains(factor, "@") {
		return factor // It's an email, return as is
	}
	return fmt.Sprintf("+%s", factor) // Otherwise, assume it's a phone number
}

// LastOtpForFactor implements usersgrpc.UsersServer.
func (i *Impl) LastOtpForFactor(ctx context.Context, req *usersgrpc.LastOtpForFactorRequest) (
	*usersgrpc.LastOtpForFactorResponse, error) {
	if !i.devMethodsEndabled {
		return nil, status.Error(codes.Unimplemented, "this method has been disabled")
	}

	i.logger.Debug().Msgf("factor for getting otps %v", formatFactor(req.GetFactor()))
	otps, err := i.repo.Do().GetLatestSentOtpByFactor(ctx, sqlc.GetLatestSentOtpByFactorParams{
		Factor: formatFactor(req.GetFactor()),
		Limit:  DailySMSLimit,
	})
	if err != nil {
		return nil, err
	}

	i.logger.Debug().Msgf("last otps: %v", otps)

	if len(otps) == 0 {
		return nil, status.Errorf(codes.NotFound, "No OTP found")
	}

	return &usersgrpc.LastOtpForFactorResponse{
		Otp: otps[0].SecretValue,
	}, nil
}

func (i *Impl) GrantAdmin(
	ctx context.Context,
	req *usersgrpc.GrantAdminRequest) (
	*usersgrpc.GrantAdminResponse,
	error) {
	newAgentPhoneNumber := req.GetPhoneNumber()

	// fetch the user via email from the db.
	// If there is no user then we want to create one.
	// We shall generate a random password and hash it too.
	foundUser, err := i.repo.Do().GetUserByPhoneNumber(ctx, newAgentPhoneNumber)
	if err != nil && !errors.Is(err, sql.ErrNoRows) {
		return nil, status.Errorf(codes.Internal, "Failed to check for existing users: %v", err)
	}
	if err == nil {
		userRole, ok := usersgrpc.UserRole_value[foundUser.Role]
		if !ok {
			return nil, status.Errorf(codes.Internal, "Invalid user role in database: %v", foundUser.Role)
		}
		if userRole == int32(usersgrpc.UserRole_USER_ROLE_ADMIN) {
			return nil, status.
				Errorf(codes.AlreadyExists, "This phone number is already assigned to an admin: %v", newAgentPhoneNumber)
		}

		arg := sqlc.UpdateUserRoleParams{
			ID:   foundUser.ID,
			Role: usersgrpc.UserRole_USER_ROLE_ADMIN.String(),
		}

		err = i.repo.Do().UpdateUserRole(ctx, arg)
		if err != nil {
			return nil, status.Errorf(codes.Internal, "Could not make user admin: %v", err)
		}

		return &usersgrpc.GrantAdminResponse{
			Message: "New admin successfully created.",
		}, nil
	}

	// Generate random user password.
	newHashedPassword, newErr := GeneratePassword(ctx)
	if newErr != nil {
		return nil, status.Errorf(codes.Internal, "Could not generate password for new user: %v", newErr)
	}

	// Create new user with hashed password in the db.
	arg := sqlc.CreateUserParams{
		PhoneNumber:             req.GetPhoneNumber(),
		Password:                newHashedPassword,
		ResidenceCountryIsoCode: req.GetResidenceCountryIsoCode(),
		Role:                    usersgrpc.UserRole_USER_ROLE_ADMIN.String(),
	}

	_, newErr = i.repo.Do().CreateUser(ctx, arg)
	if newErr != nil {
		return nil, status.
			Errorf(codes.Internal, "Could not create a new admin user with phone number: %v: %v", newAgentPhoneNumber, newErr)
	}

	return &usersgrpc.GrantAdminResponse{
		Message: "New admin successfully created.",
	}, nil
}

// ListUsers implements usersgrpc.UsersServer.
func (i *Impl) ListUsers(ctx context.Context,
	req *usersgrpc.ListUsersRequest) (
	*usersgrpc.ListUsersResponse, error) {
	var err error
	startKey := time.Now().Add(time.Hour)

	count := req.GetCount()
	if count == 0 {
		count = 10
	}

	if req.GetStartKey() != "" {
		startKey, err = time.Parse(time.RFC3339, req.GetStartKey())
		if err != nil {
			return nil, status.Errorf(codes.InvalidArgument, "Invalid start key")
		}
	}

	i.logger.Debug().Msgf("Start key %v", startKey)

	args := sqlc.ListUsersParams{
		UserStatus: req.GetUserStatus().String(),
		SearchKey:  req.GetSearch(),
		Limit:      count,
		Before:     startKey,
		UserRole:   req.GetUserRole().String(),
	}
	sqlcUsers, err := i.repo.Do().ListUsers(ctx, args)

	if err != nil {
		return nil, status.Errorf(codes.Internal, "error fetching users: %v", err)
	}

	protoUsers, err := converters.SqlcToProtoUsers(sqlcUsers)

	if err != nil {
		return nil, status.Errorf(codes.Internal, "error converting sqlc to proto reviews %v", err)
	}

	nextKey := ""

	if len(protoUsers) >= int(count) {
		nextKey = protoUsers[len(protoUsers)-1].GetCreatedAt().AsTime().Format(time.RFC3339)
	}

	return &usersgrpc.ListUsersResponse{
		Users:   protoUsers,
		NextKey: nextKey,
	}, nil
	// panic("unimplemented")
}

// ExportUsersPdf implements usersgrpc.UsersServer.
//
//nolint:gocognit // PDF export generation is inherently imperative and clearer as a single flow.
func (i *Impl) ExportUsersPdf(ctx context.Context, req *usersgrpc.ExportUsersPdfRequest) (*httpbody.HttpBody, error) {
	role := req.GetUserRole()
	if role == usersgrpc.UserRole_USER_ROLE_UNSPECIFIED {
		return nil, status.Error(codes.InvalidArgument, "user_role is required")
	}

	// NOTE: This method contains a lot of PDF layout / styling constants (millimeters, font sizes, colors),
	// which are intentionally "magic numbers" dictated by the PDF library and desired visual output.
	// Keep them centralized here.
	const (
		exportUsersPageSize    = int32(500) // PDF export paging constant (tuned for server-side export)
		exportUsersMaxLoops    = 200        // hard safety cap to prevent infinite paging loops
		exportUsersPreallocCap = 1024       // preallocation to reduce allocations for typical exports

		pdfMarginLeft   = 10.0 // PDF layout constant (mm)
		pdfMarginTop    = 12.0 // PDF layout constant (mm)
		pdfMarginRight  = 10.0 // PDF layout constant (mm)
		pdfMarginBottom = 12.0 // PDF layout constant (mm)

		pdfHeaderBarHeight = 18.0 // PDF header bar height (mm)
		pdfHeaderTextY     = 6.0  // PDF header baseline Y offset (mm)
		pdfHeaderLineH     = 6.0  // PDF header line height (mm)
		pdfHeaderLn        = 10.0 // PDF header spacing after header (mm)

		pdfMetaFontSize = 10.0 // PDF font size
		pdfMetaLineH    = 6.0  // PDF line height (mm)
		pdfMetaLn       = 2.0  // PDF spacing between meta lines (mm)

		pdfTitleFontSize    = 14.0 // PDF title font size
		pdfSubtitleFontSize = 11.0 // PDF subtitle font size

		brandGreenR = 0   // FoodHouse brand color
		brandGreenG = 153 // FoodHouse brand color
		brandGreenB = 74  // FoodHouse brand color

		colorWhite = 255 // RGB white component for gofpdf
		colorBlack = 0   // RGB black component for gofpdf

		tableHeaderFill = 240 // light gray fill for header row

		tableHeaderFontSz = 10.0 // table header font size
		tableHeaderRowH   = 7.0  // table header row height (mm)
		tableBodyFontSz   = 9.0  // table body font size
		tableLineH        = 5.0  // table line height (mm)
		tableHeaderLn     = -1.0 // gofpdf Ln(-1) resets to the beginning of the next line

		colWName    = 55.0 // column width (mm)
		colWPhone   = 35.0 // column width (mm)
		colWEmail   = 62.0 // column width (mm)
		colWAddress = 85.0 // column width (mm)
		colWStatus  = 20.0 // column width (mm)
		colWJoined  = 20.0 // column width (mm)
	)

	// Fetch all users by paging server-side.
	before := time.Now().Add(time.Hour)
	all := make([]sqlc.User, 0, exportUsersPreallocCap)

	for range exportUsersMaxLoops { // hard safety cap
		rows, err := i.repo.Do().ListUsers(ctx, sqlc.ListUsersParams{
			UserStatus: req.GetUserStatus().String(),
			SearchKey:  req.GetSearch(),
			Limit:      exportUsersPageSize,
			Before:     before,
			UserRole:   role.String(),
		})
		if err != nil {
			return nil, status.Errorf(codes.Internal, "error fetching users: %v", err)
		}
		if len(rows) == 0 {
			break
		}

		all = append(all, rows...)

		// If we got fewer than a page, we're done.
		if len(rows) < int(exportUsersPageSize) {
			break
		}

		// Advance cursor.
		last := rows[len(rows)-1]
		if !last.CreatedAt.Valid {
			break
		}
		// Prevent infinite loops if timestamps are identical.
		if !last.CreatedAt.Time.Before(before) {
			before = before.Add(-time.Millisecond)
		} else {
			before = last.CreatedAt.Time
		}
	}

	// Build PDF.
	// Use landscape A4 so the table has enough horizontal space.
	pdf := gofpdf.New("L", "mm", "A4", "")
	pdf.SetTitle("FoodHouse Users Export", false)
	pdf.SetAuthor("FoodHouse", false)
	leftMargin, topMargin, rightMargin := pdfMarginLeft, pdfMarginTop, pdfMarginRight
	bottomMargin := pdfMarginBottom
	pdf.SetMargins(leftMargin, topMargin, rightMargin)
	pdf.SetAutoPageBreak(true, bottomMargin)

	// Simple branded header (no custom font needed).
	brandGreen := struct{ r, g, b int }{r: brandGreenR, g: brandGreenG, b: brandGreenB}
	roleLabel := strings.TrimPrefix(role.String(), "USER_ROLE_")
	pageW, pageH := pdf.GetPageSize()

	pdf.SetHeaderFunc(func() {
		// Green bar
		pdf.SetFillColor(brandGreen.r, brandGreen.g, brandGreen.b)
		pdf.Rect(0, 0, pageW, pdfHeaderBarHeight, "F")

		pdf.SetTextColor(colorWhite, colorWhite, colorWhite)
		pdf.SetFont("Arial", "B", pdfTitleFontSize)
		pdf.SetXY(leftMargin, pdfHeaderTextY)
		pdf.CellFormat(0, pdfHeaderLineH, "FoodHouse", "", 0, "L", false, 0, "")

		pdf.SetFont("Arial", "", pdfSubtitleFontSize)
		pdf.SetXY(leftMargin, pdfHeaderTextY)
		pdf.CellFormat(pageW-leftMargin-rightMargin, pdfHeaderLineH, "Users Export - "+roleLabel, "", 0, "R", false, 0, "")

		// Reset for body
		pdf.SetTextColor(colorBlack, colorBlack, colorBlack)
		pdf.Ln(pdfHeaderLn)
	})

	pdf.AddPage()

	pdf.SetFont("Arial", "", pdfMetaFontSize)
	generated := fmt.Sprintf("Generated: %s", time.Now().Format(time.RFC1123))
	pdf.CellFormat(0, pdfMetaLineH, generated, "", 1, "L", false, 0, "")
	total := fmt.Sprintf("Total: %d", len(all))
	pdf.CellFormat(0, pdfMetaLineH, total, "", 1, "L", false, 0, "")
	pdf.Ln(pdfMetaLn)

	// Table header
	// Column widths must fit within printable width.
	// Printable width on A4 landscape is ~297mm minus margins.
	// Name, Phone, Email, Address, Status, Joined.
	colW := []float64{
		colWName,
		colWPhone,
		colWEmail,
		colWAddress,
		colWStatus,
		colWJoined,
	}
	headers := []string{"Name", "Phone", "Email", "Address", "Status", "Joined"}

	drawHeader := func() {
		pdf.SetFont("Arial", "B", tableHeaderFontSz)
		pdf.SetFillColor(tableHeaderFill, tableHeaderFill, tableHeaderFill)
		for i := range headers {
			pdf.CellFormat(colW[i], tableHeaderRowH, headers[i], "1", 0, "L", true, 0, "")
		}
		pdf.Ln(tableHeaderLn)
		pdf.SetFont("Arial", "", tableBodyFontSz)
		pdf.SetFillColor(colorWhite, colorWhite, colorWhite)
	}
	drawHeader()

	lineH := tableLineH

	drawRow := func(values []string) {
		// Split each cell into lines so we can compute row height.
		lines := make([][][]byte, len(values))
		maxLines := 1
		for i, v := range values {
			lines[i] = pdf.SplitLines([]byte(v), colW[i])
			if len(lines[i]) > maxLines {
				maxLines = len(lines[i])
			}
		}
		rowH := float64(maxLines) * lineH

		// Add a new page if this row would overflow.
		if pdf.GetY()+rowH > pageH-bottomMargin {
			pdf.AddPage()
			drawHeader()
		}

		x0 := pdf.GetX()
		y0 := pdf.GetY()

		for i := range values {
			x := x0
			for j := range i {
				x += colW[j]
			}
			pdf.SetXY(x, y0)
			pdf.MultiCell(colW[i], lineH, values[i], "1", "L", false)
		}
		pdf.SetXY(x0, y0+rowH)
	}

	for _, u := range all {
		name := strings.TrimSpace(fmt.Sprintf("%s %s", safeString(u.FirstName), safeString(u.LastName)))
		if name == "" {
			name = u.ID
		}
		phone := u.PhoneNumber
		email := safeString(u.Email)
		address := safeString(u.Address)
		statusStr := strings.TrimPrefix(u.UserStatus, "UserStatus_")
		joined := ""
		if u.CreatedAt.Valid {
			joined = u.CreatedAt.Time.Format("2006-01-02")
		}

		values := []string{name, phone, email, address, statusStr, joined}
		drawRow(values)
	}

	buf := bytes.NewBuffer(nil)
	if err := pdf.Output(buf); err != nil {
		return nil, status.Errorf(codes.Internal, "failed to render pdf: %v", err)
	}

	return &httpbody.HttpBody{
		ContentType: "application/pdf",
		Data:        buf.Bytes(),
	}, nil
}

// GetFarmerByID implements usersgrpc.UsersServer.
func (i *Impl) GetFarmerByID(
	ctx context.Context,
	req *usersgrpc.GetFarmerByIDRequest) (*usersgrpc.GetFarmerByIDResponse, error) {
	i.logger.Debug().Msgf("farmer id in request %v", req.GetFarmerId())

	foundUser, err := i.repo.Do().GetFarmer(ctx, req.GetFarmerId())
	if err != nil {
		return nil, status.Errorf(codes.NotFound, "User not found: %v", err)
	}

	i.logger.Debug().Interface("User found", foundUser).Msg("User from DB")

	farmerRating, err := i.repo.Do().GetFarmerRating(ctx, req.GetFarmerId())

	if err != nil {
		return nil, status.Errorf(codes.Internal, "error getting farmer's rating %v", err)
	}

	return &usersgrpc.GetFarmerByIDResponse{
		User: &usersgrpc.User{
			UserId:                  foundUser.ID,
			PhoneNumber:             foundUser.PhoneNumber,
			Email:                   safeString(foundUser.Email),
			FirstName:               safeString(foundUser.FirstName),
			LastName:                safeString(foundUser.LastName),
			ResidenceCountryIsoCode: foundUser.ResidenceCountryIsoCode,
			ProfileImage:            safeString(&foundUser.ProfileImage),
			Address:                 safeString(foundUser.Address),
			CreatedAt:               timestamppb.New(foundUser.CreatedAt.Time),
			UpdatedAt:               timestamppb.New(foundUser.UpdatedAt.Time),
			LocationCoordinates: &types.Point{
				Lon: foundUser.LocationCoordinates.P.X,
				Lat: foundUser.LocationCoordinates.P.Y,
			},
		},
		Rating: farmerRating,
	}, nil
}

// GetPublicUser implements usersgrpc.UsersServer.
func (i *Impl) GetPublicUser(ctx context.Context,
	req *usersgrpc.GetPublicUserRequest) (
	*usersgrpc.GetPublicUserResponse, error) {
	i.logger.Debug().Msgf("user id in request %v", req.GetUserId())

	foundUser, err := i.repo.Do().GetUser(ctx, req.GetUserId())
	if err != nil {
		return nil, status.Errorf(codes.NotFound, "User not found: %v", err)
	}

	return &usersgrpc.GetPublicUserResponse{
		Name:         *foundUser.FirstName + " " + *foundUser.LastName,
		ProfileImage: foundUser.ProfileImage,
	}, nil
}

// ListFarmersReivews implements usersgrpc.UsersServer.
func (i *Impl) ListFarmersReivews(ctx context.Context,
	req *usersgrpc.ListFarmersReviewsRequest) (
	*usersgrpc.ListFarmersReivewsResponse, error) {
	var err error
	startKey := time.Now().Add(time.Hour)

	count := req.GetCount()
	if count == 0 {
		count = 10
	}

	if req.GetStartKey() != "" {
		startKey, err = time.Parse(time.RFC3339, req.GetStartKey())
		if err != nil {
			return nil, status.Errorf(codes.InvalidArgument, "Invalid start key")
		}
	}

	i.logger.Debug().Msgf("Start key %v", startKey)

	args := sqlc.ListFarmerReviewsParams{
		FarmerID:      req.GetFarmerId(),
		CreatedBefore: startKey,
		Count:         count,
	}
	sqlcReviews, err := i.repo.Do().ListFarmerReviews(ctx, args)

	if err != nil {
		return nil, status.Errorf(codes.Internal, "error fetching farmer reviews: %v", err)
	}

	protoReviews, err := converters.SqlcToProtoReviews(sqlcReviews)

	if err != nil {
		return nil, status.Errorf(codes.Internal, "error converting sqlc to proto reviews %v", err)
	}

	nextKey := ""

	if len(protoReviews) >= int(count) {
		nextKey = protoReviews[len(protoReviews)-1].GetCreatedAt().AsTime().Format(time.RFC3339)
	}

	return &usersgrpc.ListFarmersReivewsResponse{
		Reviews: protoReviews,
		NextKey: nextKey,
	}, nil
}

// ReviewFarmer implements usersgrpc.UsersServer.
func (i *Impl) ReviewFarmer(ctx context.Context,
	req *usersgrpc.ReviewFarmerRequest) (
	*usersgrpc.ReviewFarmerResponse, error) {
	_, err := i.repo.Do().CreateReview(ctx, sqlc.CreateReviewParams{
		FarmerID:  req.GetFarmerId(),
		OrderID:   req.GetOrderId(),
		ProductID: req.GetProductId(),
		Rating:    req.GetRating(),
		Comment:   req.GetComment(),
		CreatedBy: &req.UserId,
	})

	if err != nil {
		return nil, status.Errorf(codes.Internal, "error creating review: %v", err)
	}

	return &usersgrpc.ReviewFarmerResponse{}, nil
}

// encodes the nextkey for ListFarmers by concatenating the rating and createdAt in a string.
func encodeCursor(rating float64, createdAt time.Time) string {
	return fmt.Sprintf("%f|%s", rating, createdAt.UTC().Format(time.RFC3339Nano))
}

// decodes the concatenated string into a number and a time.
func decodeCursor(cursor string) (float64, time.Time, error) {
	parts := strings.Split(cursor, "|")
	if len(parts) != TWO {
		return 0, time.Time{}, fmt.Errorf("invalid cursor format")
	}

	rating, err := strconv.ParseFloat(parts[0], 64)
	if err != nil {
		return 0, time.Time{}, fmt.Errorf("invalid rating in cursor")
	}

	createdAt, err := time.Parse(time.RFC3339Nano, parts[1])
	if err != nil {
		return 0, time.Time{}, fmt.Errorf("invalid createdAt in cursor")
	}

	return rating, createdAt, nil
}

// ListFarmers implements usersgrpc.UsersServer.
func (i *Impl) ListFarmers(ctx context.Context,
	req *usersgrpc.ListFarmersRequest) (
	*usersgrpc.ListFarmersResponse, error) {
	var startRating float64
	var startCreatedAt time.Time

	if req.GetStartKey() == "" {
		startRating = 6.0 // sentinel > max rating
		if req.GetSortCreatedAtDesc() {
			startCreatedAt = time.Now()
		} else {
			startCreatedAt = time.Time{}
		}
	} else {
		var err error
		startRating, startCreatedAt, err = decodeCursor(req.GetStartKey())
		if err != nil {
			return nil, status.Errorf(codes.InvalidArgument, "invalid start key")
		}
	}

	count := req.GetCount()
	if count == 0 {
		count = 10
	}

	var sortDesc = false

	if req.GetSortCreatedAtDesc() {
		sortDesc = req.GetSortCreatedAtDesc()
	}

	args := sqlc.ListFarmersByRatingParams{
		CursorAverageRating: startRating,
		CursorCreatedAt:     startCreatedAt,
		Count:               count,
		SearchKey:           req.GetSearchKey(),
		UserStatus:          req.GetUserStatus().String(),
		SortCreatedAtDesc:   sortDesc,
	}

	farmers, err := i.repo.Do().ListFarmersByRating(ctx, args)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "error fetching farmers: %v", err)
	}

	protoFarmers, err := converters.SqlcToProtoFarmers(farmers)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "error converting sqlc to proto farmers: %v", err)
	}

	nextKey := ""
	if len(protoFarmers) >= int(count) {
		lastFarmer := protoFarmers[len(protoFarmers)-1]
		nextKey = encodeCursor(lastFarmer.GetRating(), lastFarmer.GetUser().GetCreatedAt().AsTime())
	}

	return &usersgrpc.ListFarmersResponse{
		Farmers: protoFarmers,
		NextKey: nextKey,
	}, nil
}

func getMonthRanges() (time.Time, time.Time, time.Time, time.Time) {
	now := time.Now()

	// Truncate to the start of this month
	startOfThisMonth := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, now.Location())

	// Start of next month, minus 1 second gives end of this month
	endOfThisMonth := startOfThisMonth.AddDate(0, 1, 0).Add(-time.Second)

	// Start of last month
	startOfLastMonth := startOfThisMonth.AddDate(0, -1, 0)

	// End of last month = start of this month - 1 second
	endOfLastMonth := startOfThisMonth.Add(-time.Second)

	return startOfThisMonth, endOfThisMonth, startOfLastMonth, endOfLastMonth
}

func percentageChange(oldValue, newValue float64) *float64 {
	if oldValue == 0 {
		change := 100.0
		return &change
	}
	change := ((newValue - oldValue) / math.Abs(oldValue)) * CENT
	return &change
}

// GetUserStats implements usersgrpc.UsersServer.
func (i *Impl) GetUserStats(ctx context.Context,
	_ *usersgrpc.GetUserStatsRequest) (
	*usersgrpc.GetUserStatsResponse, error) {
	startThis, endThis, startLast, endLast := getMonthRanges()

	statsThisMonth, err := i.repo.Do().GetUserStatsBetweenDates(ctx, sqlc.GetUserStatsBetweenDatesParams{
		StartDate: startThis,
		EndDate:   endThis,
	})

	if err != nil {
		return nil, err
	}

	statsLastMonth, err := i.repo.Do().GetUserStatsBetweenDates(ctx, sqlc.GetUserStatsBetweenDatesParams{
		StartDate: startLast,
		EndDate:   endLast,
	})

	if err != nil {
		return nil, err
	}

	const statItemCapacity = 2
	stats := make([]*usersgrpc.StatItem, 0, statItemCapacity)

	stats = append(stats, &usersgrpc.StatItem{
		Title:       "Total Users",
		Value:       float64(statsThisMonth.TotalUsers),
		Change:      *percentageChange(float64(statsLastMonth.TotalUsers), float64(statsThisMonth.TotalUsers)),
		Description: "New users this month",
	})

	stats = append(stats, &usersgrpc.StatItem{
		Title:       "Total Farmers",
		Value:       float64(statsThisMonth.TotalFarmers),
		Change:      *percentageChange(float64(statsLastMonth.TotalFarmers), float64(statsThisMonth.TotalFarmers)),
		Description: "Total active farmers",
	})

	return &usersgrpc.GetUserStatsResponse{
		Data: stats,
	}, nil
}

// SuspendUser implements usersgrpc.UsersServer.
func (i *Impl) SuspendUser(ctx context.Context,
	req *usersgrpc.SuspendUserRequest) (
	*usersgrpc.SuspendUserResponse, error) {
	err := i.repo.Do().SuspendUser(ctx, req.GetUserId())

	if err != nil {
		return nil, status.Errorf(codes.Internal, "error suspending user %v", err)
	}
	return &usersgrpc.SuspendUserResponse{}, nil
}

// ReactivateUser implements usersgrpc.UsersServer.
func (i *Impl) ReactivateUser(ctx context.Context,
	req *usersgrpc.ReactivateUserRequest) (
	*usersgrpc.ReactivateUserResponse, error) {
	err := i.repo.Do().ReactivateUser(ctx, req.GetUserId())

	if err != nil {
		return nil, status.Errorf(codes.Internal, "error re-activating user %v", err)
	}
	return &usersgrpc.ReactivateUserResponse{}, nil
}

// DeleteAgent implements usersgrpc.UsersServer.
func (i *Impl) DeleteAgent(ctx context.Context,
	req *usersgrpc.DeleteAgentRequest) (
	*usersgrpc.DeleteAgentResponse, error) {
	user, err := i.repo.Do().GetUser(ctx, req.GetUserId())

	if err != nil {
		return nil, status.Errorf(codes.Internal, "error fetching user %v", err)
	}

	if user.Role != usersgrpc.UserRole_USER_ROLE_AGENT.String() {
		return nil, status.Errorf(codes.Internal, "cannot delete user with role %v", user.Role)
	}

	err = i.repo.Do().DeleteUser(ctx, req.GetUserId())

	if err != nil {
		return nil, status.Errorf(codes.Internal, "error deleting agent %v", err)
	}

	return &usersgrpc.DeleteAgentResponse{}, nil
}

// GrantAgent implements usersgrpc.UsersServer.
func (i *Impl) GrantAgent(ctx context.Context,
	req *usersgrpc.GrantAgentRequest) (
	*usersgrpc.GrantAgentResponse, error) {
	newAgentPhoneNumber := req.GetPhoneNumber()
	if req.GetRole() != usersgrpc.UserRole_USER_ROLE_AGENT &&
		req.GetRole() != usersgrpc.UserRole_USER_ROLE_MARKETING_AGENT {
		return nil, status.Errorf(codes.PermissionDenied, "cannot create user with role %v", req.GetRole())
	}

	// fetch the user via email from the db.
	// If there is no user then we want to create one.
	// We shall generate a random password and hash it too.
	foundUser, err := i.repo.Do().GetUserByPhoneNumber(ctx, newAgentPhoneNumber)
	if err != nil && !errors.Is(err, sql.ErrNoRows) {
		return nil, status.Errorf(codes.Internal, "Failed to check for existing users: %v", err)
	}
	if err == nil {
		userRole, ok := usersgrpc.UserRole_value[foundUser.Role]
		if !ok {
			return nil, status.Errorf(codes.Internal, "Invalid user role in database: %v", foundUser.Role)
		}
		if userRole != int32(usersgrpc.UserRole_USER_ROLE_BUYER) {
			return nil, status.
				Errorf(codes.AlreadyExists, "Phone number belongs to a user who is not a buyer: %v",
					newAgentPhoneNumber)
		}

		arg := sqlc.UpdateUserRoleParams{
			ID:   foundUser.ID,
			Role: req.GetRole().String(),
		}

		err = i.repo.Do().UpdateUserRole(ctx, arg)
		if err != nil {
			return nil, status.Errorf(codes.Internal, "Could not make user an agent: %v", err)
		}

		return &usersgrpc.GrantAgentResponse{
			Message: "New agent successfully created.",
		}, nil
	}

	var password string
	var newErr error

	agentPassword := req.GetPassword()

	if agentPassword != "" {
		// Check password for minimum length
		if len(agentPassword) < MinimumPasswordLength {
			return nil, status.Errorf(codes.InvalidArgument, "Password should be at least %v characters long",
				MinimumPasswordLength)
		}

		// Hash password using bcrypt
		password, newErr = HashPassword(agentPassword)
		if newErr != nil {
			return nil, status.Errorf(codes.Internal, "Failed to hash password: %v", newErr)
		}
	} else {
		// Generate random user password.
		password, newErr = GeneratePassword(ctx)
		if newErr != nil {
			return nil, status.Errorf(codes.Internal, "Could not generate password for new user: %v", newErr)
		}
	}

	var email *string

	if req.GetEmail() != "" {
		e := req.GetEmail()
		email = &e
	}

	// Create new user with hashed password in the db.
	arg := sqlc.CreateUserParams{
		PhoneNumber:             req.GetPhoneNumber(),
		Password:                password,
		ResidenceCountryIsoCode: req.GetResidenceCountryIsoCode(),
		Email:                   email,
		Role:                    req.GetRole().String(),
	}

	_, err = i.repo.Do().CreateUser(ctx, arg)
	if err != nil {
		return nil, status.
			Errorf(codes.Internal, "Could not create a new admin user with phone number: %v: %v", newAgentPhoneNumber, err)
	}

	return &usersgrpc.GrantAgentResponse{
		Message: "New agent successfully created.",
	}, nil
}

func checkIsOAuth(authFactor *usersgrpc.AuthFactor) bool {
	switch authFactor.GetType() {
	case usersgrpc.FactorType_FACTOR_TYPE_GOOGLE:
		return true
	case usersgrpc.FactorType_FACTOR_TYPE_APPLE:
		return true
	default:
		return false
	}
}

// OAuth implements usersgrpc.UsersServer.
func (i *Impl) OAuth(ctx context.Context, req *usersgrpc.OAuthRequest) (*usersgrpc.AuthenticateResponse, error) {
	if ok := checkIsOAuth(req.GetFactor()); !ok {
		return nil, status.Errorf(codes.Unauthenticated, "unauthorized request")
	}

	querier, tx, err := i.repo.Begin(ctx)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to begin transaction: %v", err)
	}

	// Proper rollback handling
	defer func() {
		err = tx.Rollback(ctx)
		if err != nil && !errors.Is(err, sql.ErrTxDone) {
			i.logger.Err(err).Msgf("Failed to rollback transaction: %v", req)
		}
	}()

	user, err := querier.GetUserByEmail(ctx, &req.GetUser().Email)
	if err == nil {
		// If no error and user exists, generate token for this user and return
		claims, newErr := i.getUserClaims(ctx, user.ID)
		if newErr != nil {
			i.logger.Err(err).Str("user_id", user.ID).Msg("Failed to get user claims")
			return nil, newErr
		}

		accessToken, newErr := i.tokenManagerBuilder.WithQuerier(i.repo.Do()).GenerateAccessToken(ctx, user.ID, claims)
		if newErr != nil {
			i.logger.Err(err).Str("user_id", user.ID).Msg("Failed to generate access token")
			return nil, status.Errorf(codes.Internal, "Failed to generate access token: %v", newErr)
		}

		refreshToken, newErr := i.tokenManagerBuilder.WithQuerier(i.repo.Do()).GenerateRefreshToken(ctx, user.ID)
		if newErr != nil {
			i.logger.Err(err).Str("user_id", user.ID).Msg("Failed to generate refresh token")
			return nil, status.Errorf(codes.Internal, "Failed to generate refresh token: %v", newErr)
		}

		return &usersgrpc.AuthenticateResponse{
			LoginComplete: true,
			Tokens: &usersgrpc.Tokens{
				AccessToken:  accessToken,
				RefreshToken: refreshToken,
			},
			UserId: user.ID,
		}, nil
	}

	// Check if the error indicates the user does not exist (success case)
	// This is an error we can't handle, return immediately.
	if !errors.Is(err, sql.ErrNoRows) {
		return nil, fmt.Errorf("failed to check for existing users: %w", err)
	}

	// if user does not exits, grab the user info from the request and create a new user.

	// check if the user type does not exist in the request
	if req.GetUserType() == usersgrpc.UserType_USER_TYPE_UNSPECIFIED {
		return &usersgrpc.AuthenticateResponse{
			LoginComplete: false,
			AdditionalFactor: &usersgrpc.AdditionalFactor{
				FactorType: req.GetFactor().GetType(),
				FactorHint: "include user type",
			},
		}, nil
	}

	// Generate random user password.
	newHashedPassword, err := GeneratePassword(ctx)

	if err != nil {
		return nil, status.Errorf(codes.Internal, "error generating user password: %v", err)
	}

	var email *string

	if req.GetUser().GetEmail() != "" {
		email = &req.GetUser().Email
	}

	userType, ok := usersgrpc.UserType_value[req.GetUserType().String()]
	if !ok {
		return nil, status.Errorf(codes.InvalidArgument, "invalid user type in request: %v", req.GetUserType().String())
	}

	userRole, err := getUserRoleFromType(usersgrpc.UserType(userType))

	// Create new user with hashed password in the db.
	arg := sqlc.CreateUserParams{
		PhoneNumber: req.GetUser().GetPhoneNumber(),
		Email:       email,
		FirstName:   &req.GetUser().FirstName,
		LastName:    &req.GetUser().LastName,
		Password:    newHashedPassword,
		Role:        userRole.String(),
	}

	createdDBUser, err := querier.CreateUser(ctx, arg)

	// Generate an access token and refresh token
	claims := map[string]any{
		ClaimKeyRole:   createdDBUser.Role,
		ClaimKeyStatus: createdDBUser.UserStatus,
	}

	accessToken, err := i.tokenManagerBuilder.WithQuerier(querier).GenerateAccessToken(ctx, createdDBUser.ID, claims)
	if err != nil {
		i.logger.Debug().Msgf("firebase error %v", err)
		return nil, status.Errorf(codes.Internal, "Failed to generate tokens: %v", err)
	}

	refreshToken, err := i.tokenManagerBuilder.WithQuerier(querier).GenerateRefreshToken(ctx, createdDBUser.ID)
	if err != nil {
		i.logger.Debug().Msgf("firebase error %v", err)
		return nil, status.Errorf(codes.Internal, "Failed to generate tokens: %v", err)
	}

	err = tx.Commit(ctx)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to commit transaction: %v", err)
	}

	return &usersgrpc.AuthenticateResponse{
		LoginComplete: true,
		Tokens: &usersgrpc.Tokens{
			AccessToken:  accessToken,
			RefreshToken: refreshToken,
		},
		UserId: createdDBUser.ID,
	}, nil
}

// GetReferralByReferredId implements usersgrpc.UsersServer.
func (i *Impl) GetReferralByReferredID(
	ctx context.Context,
	req *usersgrpc.GetReferralByReferredIdRequest) (
	*usersgrpc.GetReferralByReferredIdResponse, error) {
	referral, err := i.repo.Do().GetReferralByReferredID(ctx, req.GetReferredId())
	if err != nil {
		// if it is a not found error
		if errors.Is(err, sql.ErrNoRows) {
			return nil, status.Errorf(codes.NotFound, "no referral found for user with id %v", req.GetReferredId())
		}
		// Otherwise, some other error occurred
		return nil, status.Errorf(codes.Internal, "error getting referral %v", err)
	}
	return &usersgrpc.GetReferralByReferredIdResponse{
		Referral: &usersgrpc.Referral{
			Id:         referral.ID,
			ReferrerId: referral.ReferrerID,
			ReferredId: referral.ReferredID,
			CreatedAt:  timestamppb.New(referral.CreatedAt.Time),
		},
	}, nil
}

func (i *Impl) NotifyFarmer(
	ctx context.Context,
	req *usersgrpc.NotifyFarmerRequest,
) (*usersgrpc.NotifyFarmerResponse, error) {
	farmer, err := i.repo.Do().GetUser(ctx, req.GetFarmerUserId())

	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			i.logger.Warn().Str("farmer_id", req.GetFarmerUserId()).Msg("Farmer not found for notification")
			return nil, status.Errorf(codes.NotFound, "farmer not found with ID %s", req.GetFarmerUserId())
		}
		i.logger.Err(err).Str("farmer_id", req.GetFarmerUserId()).Msg("Database error fetching farmer")
		return nil, status.Errorf(codes.Internal, "error fetching farmer data: %v", err)
	}

	phoneNumber := farmer.PhoneNumber

	//  Composing the SMS

	var farmerName string
	if farmer.FirstName != nil {
		farmerName = *farmer.FirstName
	} else {
		farmerName = "Farmer"
	}

	message := fmt.Sprintf(
		"Hello %s, you have received an order for %d of %s from a buyer in %s.",
		farmerName,
		req.GetQuantity(),
		req.GetProductName(),
		req.GetBuyerLocation(),
	)

	// Send the SMS

	_, smsErr := i.smsSender.SendSms(ctx, phoneNumber, message)

	if smsErr != nil {
		i.logger.Warn().Err(smsErr).Str("phone_number", phoneNumber).Msg("Failed to send SMS to farmer")
		return nil, status.Errorf(codes.Internal, "failed to send SMS: %v", smsErr)
	}

	i.logger.Info().Str("farmer_id", req.GetFarmerUserId()).Msg("Successfully sent order notification SMS")
	return &usersgrpc.NotifyFarmerResponse{Success: true}, nil
}

// DeleteUserAccount implements usersgrpc.UsersServer.
func (i *Impl) DeleteUserAccount(ctx context.Context,
	req *usersgrpc.DeleteUserAccountRequest) (
	*usersgrpc.DeleteUserAccountResponse, error) {
	querier, tx, err := i.repo.Begin(ctx)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to begin transaction: %v", err)
	}

	// Proper rollback handling
	defer func() {
		err = tx.Rollback(ctx)
		if err != nil && !errors.Is(err, sql.ErrTxDone) {
			i.logger.Err(err).Msgf("Failed to rollback transaction: %v", req)
		}
	}()

	_, err = querier.GetUserForUpdate(ctx, req.GetUserId())

	if err != nil {
		return nil, status.Error(codes.NotFound, "user not found")
	}

	err = querier.DeleteUser(ctx, req.GetUserId())

	if err != nil {
		return nil, status.Errorf(codes.NotFound, "cannot deleted user. reason: %v", err)
	}

	err = tx.Commit(ctx)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to commit transaction: %v", err)
	}

	return &usersgrpc.DeleteUserAccountResponse{}, nil
}
