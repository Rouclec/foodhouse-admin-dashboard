package users

import (
	"context"
	"crypto/rand"
	"fmt"
	"math/big"

	"github.com/foodhouse/foodhouseapp/grpc/go/usersgrpc"
	"github.com/foodhouse/foodhouseapp/users/db/sqlc"
)

const (
	MaxNumberOfOtpDigits int32 = 9
	MaxAttempts          int32 = 5
)

var (
	// ErrMaxAttemptsExceeded is returned when the number of attempts to verify an OTP exceeds the maximum allowed.
	ErrMaxAttemptsExceeded = fmt.Errorf("max attempts exceeded")

	// ErrInvalidFactorType is returned when the factor type in the OTP request does not match the factor type in the OTP.
	ErrInvalidFactorType = fmt.Errorf("invalid factor type")

	// ErrOtpMismatch is returned when the OTP in the request does not match the OTP in the database.
	ErrOtpMismatch = fmt.Errorf("OTP mismatch")
)

//go:generate go run go.uber.org/mock/mockgen@v0.5.0 -destination=mocks/mock_token_generator.go -package=mocks -source=./otp_generator.go OtpGenerator

// OtpGenerator is an interface for generating OTPs.
// Calls to GenerateOtp returns a randomly generated OTP. The number of digits in toe OTP
// is determined at initialization time of the generator.
type OtpGenerator interface {
	GenerateOtp(ctx context.Context, factorType usersgrpc.FactorType, factor string) (requestID string, otp string,
		err error)
	VerifyOtpAuthFactor(ctx context.Context, authFactor *usersgrpc.AuthFactor) (factor string, err error)
}

// OtpGeneratorImpl is an implementation of the OtpGenerator interface using the `crypto/rand` package.
type OtpGeneratorImpl struct {
	min            *big.Int
	rangeDelta     *big.Int
	numberOfDigits uint8
	querier        sqlc.Querier
}

var _ OtpGenerator = (*OtpGeneratorImpl)(nil)

func NewOtpGenerator(numberOfDigits uint8, querier sqlc.Querier) (*OtpGeneratorImpl, error) {
	if int32(numberOfDigits) > MaxNumberOfOtpDigits {
		return nil, fmt.Errorf("number of digits should be less than or equal to %d", MaxNumberOfOtpDigits)
	}
	if numberOfDigits == 0 {
		return nil, fmt.Errorf("number of digits should be greater than 0")
	}

	//nolint:mnd // this magic number is clear enough
	minOtpValue := big.NewInt(1_000_000_000)
	//nolint:mnd // this magic number is clear enough
	maxOtpValue := big.NewInt(1_999_999_999)
	rangeDelta := new(big.Int).Sub(maxOtpValue, minOtpValue)

	return &OtpGeneratorImpl{
		min:            minOtpValue,
		rangeDelta:     rangeDelta,
		numberOfDigits: numberOfDigits,
		querier:        querier,
	}, nil
}

// GenerateOtp generates a random OTP and requestID and returns both as a strings.
// It also persists them in the database.
func (o *OtpGeneratorImpl) GenerateOtp(ctx context.Context, factorType usersgrpc.FactorType, factor string) (
	string, string, error) {
	n, err := rand.Int(rand.Reader, o.rangeDelta)
	if err != nil {
		return "", "", err
	}

	otp := new(big.Int).Add(n, o.min).String()[1 : 1+o.numberOfDigits]

	sentOtp, err := o.querier.CreateSentOtp(ctx, sqlc.CreateSentOtpParams{
		FactorType:  factorType.String(),
		Factor:      factor,
		MaxAttempts: MaxAttempts,
		SecretValue: otp,
	})
	if err != nil {
		return "", "", err
	}

	return sentOtp.RequestID, sentOtp.SecretValue, nil
}

// VerifyOtpAuthFactor implements OtpGenerator.
func (o *OtpGeneratorImpl) VerifyOtpAuthFactor(ctx context.Context, authFactor *usersgrpc.AuthFactor) (string, error) {
	sentOtp, err := o.querier.GetSentOtpByRequestId(ctx, authFactor.GetId())
	if err != nil {
		return "", err
	}

	if sentOtp.NumberOfAttempts >= MaxAttempts {
		return "", ErrMaxAttemptsExceeded
	}

	err = o.querier.UpdateSentOtp(ctx, sqlc.UpdateSentOtpParams{
		RequestID:        sentOtp.RequestID,
		NumberOfAttempts: sentOtp.NumberOfAttempts + 1,
	})
	if err != nil {
		return "", err
	}

	if sentOtp.FactorType != authFactor.GetType().String() {
		return "", ErrInvalidFactorType
	}

	if sentOtp.SecretValue != authFactor.GetSecretValue() {
		return "", ErrOtpMismatch
	}

	return sentOtp.Factor, nil
}
