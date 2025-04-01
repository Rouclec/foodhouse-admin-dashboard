package users_test

import (
	"context"
	"testing"

	"github.com/foodhouse/foodhouseapp/grpc/go/usersgrpc"
	"github.com/foodhouse/foodhouseapp/users/db/sqlc"
	sqlcMocks "github.com/foodhouse/foodhouseapp/users/db/sqlc/mocks"
	"github.com/foodhouse/foodhouseapp/users/users"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"go.uber.org/mock/gomock"
)

func TestOtpGeneratorImpl_GenerateOtp(t *testing.T) {
	numberOfDigits := uint8(6)
	otp := "123456"
	testFactorType := usersgrpc.FactorType_FACTOR_TYPE_SMS_OTP
	testFactor := "+254712345678"

	ctrl := gomock.NewController(t)
	mockQuerier := sqlcMocks.NewMockQuerier(ctrl)
	// mockQuerier.EXPECT().CountSentOtpsToPhonenumberToday(gomock.Any(), testFactor).Return(int64(0), nil)
	mockQuerier.EXPECT().CreateSentOtp(gomock.Any(), gomock.Any()).Return(sqlc.SentOtp{
		RequestID:   uuid.NewString(),
		Factor:      testFactor,
		SecretValue: otp,
	}, nil)

	otpGenerator, err := users.NewOtpGenerator(numberOfDigits, mockQuerier)
	require.NoErrorf(t, err, "NewOtpGenerator() error = %v", err)
	ctx := context.Background()

	requestID, otp, err := otpGenerator.GenerateOtp(ctx, testFactorType, testFactor)
	require.NoErrorf(t, err, "OtpGeneratorImpl.GenerateOtp() error = %v", err)
	require.NotEmptyf(t, requestID, "OtpGeneratorImpl.GenerateOtp() requestID = %s, want non-empty", requestID)

	assert.Equalf(t, numberOfDigits, uint8(len(otp)), "Otp length = %d, want %d", len(otp), numberOfDigits)
}
