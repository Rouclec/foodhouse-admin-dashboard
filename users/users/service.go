package users

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"regexp"
	"strings"
	"time"

	"github.com/foodhouse/foodhouseapp/grpc/go/types"
	"github.com/foodhouse/foodhouseapp/grpc/go/usersgrpc"
	"github.com/foodhouse/foodhouseapp/sms"
	"github.com/foodhouse/foodhouseapp/users/db/converters"
	"github.com/foodhouse/foodhouseapp/users/db/repo"
	"github.com/foodhouse/foodhouseapp/users/db/sqlc"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/nyaruka/phonenumbers"
	"github.com/rs/zerolog"
	"golang.org/x/crypto/bcrypt"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
	"google.golang.org/protobuf/types/known/timestamppb"
)

const (

	// DailySMSLimit is the maximum number of times a particular phone number can receive SMSs from the service.
	DailySMSLimit = 20

	MinimumPasswordLength = 12

	VerifyEmail = "VERIFY_EMAIL"

	ResetPassword = "RESET_PASSWORD"

	OneMillion = 1000000
)

// Impl is the implementation of the Users service.
type Impl struct {
	repo                repo.UsersRepo
	logger              zerolog.Logger
	otpGenerator        OtpGenerator
	smsSender           sms.SmsSender
	tokenManagerBuilder TokenManagerBuilder
	devMethodsEndabled  bool

	usersgrpc.UnsafeUsersServer
}

var _ usersgrpc.UsersServer = (*Impl)(nil)

// NewUsers returns a new instance of the UsersImpl.
func NewUsers(
	repo repo.UsersRepo,
	logger zerolog.Logger,
	smsSender sms.SmsSender,
	otpGenerator OtpGenerator,
	tokenManagerBuilder TokenManagerBuilder,
	enableDevMethods bool,
) *Impl {
	return &Impl{
		repo:                repo,
		logger:              logger,
		otpGenerator:        otpGenerator,
		smsSender:           smsSender,
		tokenManagerBuilder: tokenManagerBuilder,
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
		return nil, status.Errorf(codes.InvalidArgument, "Invalid phone number: %v", err)
	}

	i.logger.Debug().Interface("formarted phone number from function", formattedNumber).Msg("Formatted phone number")
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

	i.logger.Debug().Interface("Number of requests today: ", totalSmsRequestsToPhoneNumberToday).
		Msg("Number of requests for phone number today")

	if err != nil {
		return nil, status.Errorf(codes.Internal, "Error checking sms requests for today %v", err)
	}

	if totalSmsRequestsToPhoneNumberToday > DailySMSLimit {
		return nil, status.Errorf(codes.ResourceExhausted, "Too many requests to this phone number")
	}

	// Generate a random 6-digit number
	requestID, otp, err := i.otpGenerator.GenerateOtp(ctx, usersgrpc.FactorType_FACTOR_TYPE_SMS_OTP, formattedNumber)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "Error generating OTP: %v", err)
	}

	i.logger.Debug().Msgf("Request id %v, otp %v", requestID, otp)

	// Send the Message to the formatted number
	response, err := i.smsSender.SendSms(
		ctx,
		formattedNumber,
		fmt.Sprintf(`Your verification code for Foodhouse is %v`, otp),
	)

	i.logger.Debug().Interface("SMS response: ", response).Msg("Response from sms client")
	if err != nil {
		return nil, fmt.Errorf("error sending SMS: %w", err)
	}

	i.logger.Debug().Interface("standard number: ", formattedNumber).Msg("Standadized phone number")

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

	ok := isValidEmail(req.GetEmail())

	if !ok {
		return nil, status.Errorf(codes.InvalidArgument, "Invalid email %v", req.GetEmail())
	}

	// Check password for minimum length
	if len(userPassword) < MinimumPasswordLength {
		return nil, status.Errorf(codes.InvalidArgument, "Password should be at least %v characters long",
			MinimumPasswordLength)
	}

	// Hash password using bcrypt
	hashedPassword, err := HashPassword(userPassword)
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

	newUser := sqlc.CreateUserParams{
		PhoneNumber:             otpPhoneNumber,
		Password:                hashedPassword,
		Email:                   &req.Email,
		ResidenceCountryIsoCode: req.GetResidenceCountryIsoCode(),
		Role:                    userRole.String(),
	}

	i.logger.Debug().Interface("New user : ", newUser)

	createdDBUser, err := querier.CreateUser(ctx, newUser)
	if err != nil {
		i.logger.Err(err).Msg("Failed to create user")
		return nil, status.Errorf(codes.Internal, "Could not create user in the db")
	}

	// Generate an access token and refresh token
	claims := map[string]any{}
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

	claims := map[string]any{}
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

	return &usersgrpc.GetUserByIDResponse{
		User: &usersgrpc.User{
			UserId:                  foundUser.ID,
			PhoneNumber:             foundUser.PhoneNumber,
			Email:                   safeString(foundUser.Email),
			Role:                    getUserRole(foundUser.Role),
			FirstName:               safeString(foundUser.FirstName),
			LastName:                safeString(foundUser.LastName),
			ResidenceCountryIsoCode: foundUser.ResidenceCountryIsoCode,
			ProfileImage:            safeString(&foundUser.ProfileImage),
			LocationCoordinates:     getLocationPoint(foundUser.LocationCoordinates),
			Address:                 safeString(foundUser.Address),
			CreatedAt:               timestamppb.New(foundUser.CreatedAt.Time),
			UpdatedAt:               timestamppb.New(foundUser.UpdatedAt.Time),
		},
	}, nil
}

func safeString(s *string) string {
	if s == nil {
		return ""
	}
	return *s
}

func getUserRole(role string) usersgrpc.UserRole {
	if val, ok := usersgrpc.UserRole_value[role]; ok {
		return usersgrpc.UserRole(val)
	}
	return usersgrpc.UserRole_USER_ROLE_UNSPECIFIED
}

func getLocationPoint(loc pgtype.Point) *types.Point {
	if !loc.Valid {
		return nil
	}
	return &types.Point{Lon: loc.P.X, Lat: loc.P.Y}
}

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

	_, err = querier.GetUserForUpdate(ctx, userID)
	if err != nil {
		return nil, status.Errorf(codes.NotFound, "User not found: %v", err)
	}

	i.logger.Debug().Interface("args", req).Msg("Arguments")

	arg := sqlc.UpdateUserParams{
		ID:        userID,
		FirstName: &req.FirstName,
		LastName:  &req.LastName,
		Email:     &req.Email,
		LocationCoordinates: pgtype.Point{
			P: pgtype.Vec2{X: float64(req.GetLocationCoordinates().GetLon()),
				Y: float64(req.GetLocationCoordinates().GetLat())}, Valid: true},
		ProfileImage: req.GetProfileImage(),
		Address:      &req.Address,
	}

	i.logger.Debug().Interface("update user params: ", arg)

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

	claims["role"] = user.Role

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
		fmt.Sprintf("Your verification code for VsorPay is %s", otp))
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
	// 	fmt.Sprintf("Your verification code for VsorPay is %s", otp))
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
	newadminPhoneNumber := req.GetPhoneNumber()

	// fetch the user via email from the db.
	// If there is no user then we want to create one.
	// We shall generate a random password and hash it too.
	foundUser, err := i.repo.Do().GetUserByPhoneNumber(ctx, newadminPhoneNumber)
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
				Errorf(codes.AlreadyExists, "This phone number is already assigned to an admin: %v", newadminPhoneNumber)
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
			Errorf(codes.Internal, "Could not create a new admin user with phone number: %v: %v", newadminPhoneNumber, newErr)
	}

	return &usersgrpc.GrantAdminResponse{
		Message: "New admin successfully created.",
	}, nil
}

// CreateSubscription implements usersgrpc.UsersServer.
func (i *Impl) CreateSubscription(ctx context.Context,
	req *usersgrpc.CreateSubscriptionRequest) (
	*usersgrpc.CreateSubscriptionResponse, error) {
	arg := sqlc.CreateSubscriptionParams{
		Title:           req.GetTitle(),
		Description:     req.GetDescription(),
		Duration:        pgtype.Interval{Microseconds: req.GetDuration() * 24 * 60 * 60 * OneMillion, Valid: true},
		Amount:          req.GetAmount(),
		CurrencyIsoCode: req.GetCurrencyIsoCode(),
	}

	subscription, err := i.repo.Do().CreateSubscription(ctx, arg)

	if err != nil {
		return nil, status.Errorf(codes.Internal, "Erro creating subscription: %v", err)
	}

	return &usersgrpc.CreateSubscriptionResponse{
		Subscription: &usersgrpc.Subscription{
			Id:          subscription.ID,
			Title:       subscription.Title,
			Description: subscription.Description,
			// Convert microseconds back to days
			Duration: subscription.Duration.Microseconds / (24 * 60 * 60 * OneMillion),
			Amount: &types.Amount{
				Value:           subscription.Amount,
				CurrencyIsoCode: subscription.CurrencyIsoCode,
			},
		},
	}, nil
}

// DeleteSubscription implements usersgrpc.UsersServer.
func (i *Impl) DeleteSubscription(ctx context.Context,
	req *usersgrpc.DeleteSubscriptionRequst) (
	*usersgrpc.DeleteSubscriptionResponse, error) {
	err := i.repo.Do().DeleteSubscription(ctx, req.GetSubscriptionId())

	if err != nil {
		return nil, status.Errorf(codes.Internal, "Erro deleting subscription: %v", err)
	}

	return &usersgrpc.DeleteSubscriptionResponse{
		Message: fmt.Sprintf("Subscription with id %v deleted successfully", req.GetSubscriptionId()),
	}, nil
}

// UpdateSubscription implements usersgrpc.UsersServer.
func (i *Impl) UpdateSubscription(ctx context.Context,
	req *usersgrpc.UpdateSubscriptionRequest) (
	*usersgrpc.UpdateSubscriptionResponse, error) {
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

	// GET the subscription for update
	foundSubscription, err := querier.GetSubscriptionForUpdate(ctx, req.GetSubscriptionId())

	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, status.Error(codes.NotFound, fmt.Sprint("No subscription found with id: %w", req.GetSubscriptionId()))
		}
		return nil, status.Errorf(codes.Internal, "Error fetching subscription: %v", err)
	}

	arg := sqlc.UpdateSubscriptionParams{
		Title:           req.GetTitle(),
		Description:     req.GetDescription(),
		Duration:        pgtype.Interval{Microseconds: req.GetDuration() * 24 * 60 * 60 * OneMillion, Valid: true},
		Amount:          req.GetAmount(),
		CurrencyIsoCode: req.GetCurrencyIsoCode(),
		ID:              foundSubscription.ID,
	}

	updatedSubscription, err := querier.UpdateSubscription(ctx, arg)

	if err != nil {
		return nil, status.Errorf(codes.Internal, "Could not update subscription: %v", err)
	}

	err = tx.Commit(ctx)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "Failed to commit the transaction: %v", err)
	}

	return &usersgrpc.UpdateSubscriptionResponse{
		Subscription: &usersgrpc.Subscription{
			Id:          updatedSubscription.ID,
			Title:       updatedSubscription.Title,
			Description: updatedSubscription.Description,
			// Convert microseconds back to days
			Duration: updatedSubscription.Duration.Microseconds / (24 * 60 * 60 * OneMillion),
			Amount: &types.Amount{
				Value:           updatedSubscription.Amount,
				CurrencyIsoCode: updatedSubscription.CurrencyIsoCode,
			},
		},
	}, nil
}

// DeleteUserPaymentMethod implements usersgrpc.UsersServer.
func (i *Impl) DeleteUserPaymentMethod(ctx context.Context,
	req *usersgrpc.DeleteUserPaymentMethodRequest) (
	*usersgrpc.DeleteUserPaymentMethodResponse, error) {
	err := i.repo.Do().DeleteUserPaymentMethod(ctx, req.GetPaymentMethodId())

	if err != nil {
		return nil, status.Errorf(codes.Internal, "Erro deleting payment method: %v", err)
	}

	return &usersgrpc.DeleteUserPaymentMethodResponse{
		Message: fmt.Sprintf("Payment method with id %v for user %v deleted successfully",
			req.GetPaymentMethodId(), req.GetUserId()),
	}, nil
}

// GetUserPaymentMethodsByUserID implements usersgrpc.UsersServer.
func (i *Impl) GetUserPaymentMethodsByUserID(ctx context.Context,
	req *usersgrpc.GetUserPaymentMethodsByUserIDRequest) (
	*usersgrpc.GetUserPaymentMethodsByUserIDResponse, error) {
	paymentMethods, err := i.repo.Do().GetUserPaymentMethodsByUserID(ctx, req.GetUserId())

	if err != nil {
		return nil, status.Errorf(codes.Internal, "Error getting user payment methods : %v", err)
	}

	var paymentMethodsResponse []*usersgrpc.UserPaymentMethod

	for _, pm := range paymentMethods {
		paymentMethodsResponse = append(paymentMethodsResponse, &usersgrpc.UserPaymentMethod{
			Id:     pm.ID,
			UserId: pm.UserID,
			PaymentMethod: &usersgrpc.PaymentMethod{
				Method:   pm.Method,
				MethodId: *pm.MethodID,
			},
		})
	}

	return &usersgrpc.GetUserPaymentMethodsByUserIDResponse{
		UserPaymentMethods: paymentMethodsResponse,
	}, nil
}

// GetUserActiveSubscription implements usersgrpc.UsersServer.
func (i *Impl) GetUserActiveSubscription(ctx context.Context,
	req *usersgrpc.GetUserActiveSubscriptionRequest) (
	*usersgrpc.GetUserActiveSubscriptionResponse, error) {
	activeUserSubscription, err := i.repo.Do().GetUserActiveSubscription(ctx, req.GetUserId())

	if err != nil {
		return nil, status.Errorf(codes.Internal, "Error getting user active subscription : %v", err)
	}

	subscription, err := i.repo.Do().GetSubscriptionByID(ctx, activeUserSubscription.SubscriptionID)

	if err != nil {
		return nil, status.Errorf(codes.Internal, "Error fetching subscription : %v", err)
	}

	return &usersgrpc.GetUserActiveSubscriptionResponse{
		UserSubscription: &usersgrpc.UserSubscription{
			Id:     activeUserSubscription.ID,
			UserId: activeUserSubscription.UserID,
			Active: activeUserSubscription.Active,
			Subscription: &usersgrpc.Subscription{
				Id:          subscription.ID,
				Title:       subscription.Title,
				Description: subscription.Description,
				Amount: &types.Amount{
					Value:           subscription.Amount,
					CurrencyIsoCode: subscription.CurrencyIsoCode,
				},
			},
			CreatedAt: timestamppb.New(activeUserSubscription.CreatedAt.Time),
			UpdatedAt: timestamppb.New(activeUserSubscription.UpdatedAt.Time),
			ExpiresAt: timestamppb.New(activeUserSubscription.ExpiresAt),
		},
	}, nil
}

// GetUserSubscriptions implements usersgrpc.UsersServer.
func (i *Impl) GetUserSubscriptions(context.Context,
	*usersgrpc.GetUserSubscriptionsRequest) (
	*usersgrpc.GetUserSubscriptionsResponse, error) {
	panic("unimplemented")
}

// ListUsers implements usersgrpc.UsersServer.
func (i *Impl) ListUsers(context.Context,
	*usersgrpc.ListUsersRequest) (
	*usersgrpc.ListUsersResponse, error) {
	panic("unimplemented")
}

// Subscribe implements usersgrpc.UsersServer.
func (i *Impl) Subscribe(ctx context.Context,
	req *usersgrpc.SubscribeRequest) (
	*usersgrpc.SubscribeResponse, error) {
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

	subscription, err := querier.GetSubscriptionByID(ctx, req.GetSubscriptionId())

	// TODO for now, we're not converting the amount, so we will throw an error if the currency codes are different
	// in the future, we will want to convert from currency code 1
	// to currency code 2 and then compare the amounts to make sure that they are the same

	if subscription.CurrencyIsoCode != req.GetCurrencyIsoCode() {
		return nil, status.Error(codes.Internal,
			fmt.Sprintf("cannot convert from currency %v to currency %v",
				req.GetCurrencyIsoCode(), subscription.CurrencyIsoCode))
	}

	if req.GetAmount() < subscription.Amount {
		return nil, status.Error(codes.InvalidArgument,
			fmt.Sprintf("The amount passed (%v) is less than the price (%v) for the package %v",
				req.GetAmount(), subscription.Amount, subscription.Title))
	}

	// create a user subscription
	createUserSubscriptionArgs := &sqlc.CreateUserSubscriptionParams{
		UserID:         req.GetUserId(),
		SubscriptionID: subscription.ID,
		Active:         false,
		ExpiresAt: time.Now().Add(
			time.Duration(
				subscription.Duration.Microseconds/(24*60*60*OneMillion)) * 24 * time.Hour),
	}

	userSubscription, err := querier.CreateUserSubscription(ctx, *createUserSubscriptionArgs)

	if err != nil {
		return nil, status.Error(codes.Internal, fmt.Sprintf("error creating user subscription %v", err))
	}

	if err != nil {
		return nil, status.Error(codes.Internal, fmt.Sprintf("error creating payment %v", err))
	}

	err = tx.Commit(ctx)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "Failed to commit the transaction: %v", err)
	}

	return &usersgrpc.SubscribeResponse{
		UserSubscription: &usersgrpc.UserSubscription{
			Id:        userSubscription.ID,
			Active:    userSubscription.Active,
			ExpiresAt: timestamppb.New(userSubscription.ExpiresAt),
			CreatedAt: timestamppb.New(userSubscription.CreatedAt.Time),
			UpdatedAt: timestamppb.New(userSubscription.UpdatedAt.Time),
			Subscription: &usersgrpc.Subscription{
				Id:          subscription.ID,
				Title:       subscription.Title,
				Description: subscription.Description,
			},
		},
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
		},
	}, nil
}

// GetUserSubscriptionByID implements usersgrpc.UsersServer.
func (i *Impl) GetUserSubscriptionByID(ctx context.Context,
	req *usersgrpc.GetUserSubscriptionByIDRequest) (
	*usersgrpc.GetUserSubscriptionByIDResponse, error) {
	userSubscription, err := i.repo.Do().GetUserSubscriptionByID(ctx, req.GetUserSubscriptionId())

	if err != nil {
		return nil, status.Errorf(codes.Internal, "Error getting user subscription by id : %v", err)
	}

	return &usersgrpc.GetUserSubscriptionByIDResponse{
		UserSubscription: &usersgrpc.UserSubscription{
			Id:     userSubscription.ID,
			UserId: userSubscription.UserID,
			Active: userSubscription.Active,
			Subscription: &usersgrpc.Subscription{
				Id: userSubscription.SubscriptionID,
			},
			CreatedAt: timestamppb.New(userSubscription.CreatedAt.Time),
			UpdatedAt: timestamppb.New(userSubscription.UpdatedAt.Time),
			ExpiresAt: timestamppb.New(userSubscription.ExpiresAt),
		},
	}, nil
}

// ActivateUserSubscription implements usersgrpc.UsersServer.
func (i *Impl) ActivateUserSubscription(ctx context.Context,
	req *usersgrpc.ActivateUserSubscriptionRequest) (
	*usersgrpc.ActivateUserSubscriptionResponse, error) {
	err := i.repo.Do().ActivateUserSubscription(ctx, req.GetUserSubscriptionId())

	if err != nil {
		return nil, status.Errorf(codes.Internal, "error activating user subscription %v", err)
	}

	return &usersgrpc.ActivateUserSubscriptionResponse{}, nil
}

// DeleteUserSubscription implements usersgrpc.UsersServer.
func (i *Impl) DeleteUserSubscription(ctx context.Context,
	req *usersgrpc.DeleteUserSubscriptionRequest) (
	*usersgrpc.DeleteUserSubscriptionResponse, error) {
	err := i.repo.Do().DeleteUserSubscription(ctx, req.GetUserSubscriptionId())

	if err != nil {
		return nil, status.Errorf(codes.Internal, "error deleting user subscription %v", err)
	}

	return &usersgrpc.DeleteUserSubscriptionResponse{}, nil
}

// ListSubscriptions implements usersgrpc.UsersServer.
func (i *Impl) ListSubscriptions(ctx context.Context,
	_ *usersgrpc.ListSubscriptionsRequest) (
	*usersgrpc.ListSubscriptionsResponse, error) {
	subscriptions, err := i.repo.Do().ListSubsriptions(ctx)

	if err != nil {
		return nil, status.Errorf(codes.Internal, "error fetching subscriptions %v", err)
	}

	protoSubscriptions, err := converters.SqlcToProtoSubscriptions(subscriptions)

	if err != nil {
		return nil, status.Errorf(codes.Internal, "error converting sqlc to proto subscriptions %v", err)
	}

	return &usersgrpc.ListSubscriptionsResponse{
		Subscriptions: protoSubscriptions,
	}, nil
}

// GetPublicUser implements usersgrpc.UsersServer.
func (i *Impl) GetPublicUser(context.Context, *usersgrpc.GetPublicUserRequest) (*usersgrpc.GetPublicUserResponse, error) {
	panic("unimplemented")
}
