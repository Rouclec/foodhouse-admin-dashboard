package users

import (
	"context"
	"crypto/rand"
	"math/big"
)

const (
	StandardNumberOfPasswordDigits int32 = 15

	charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()-_=+[]{}|;:,.<>?/"
)

func GeneratePassword(_ context.Context) (string, error) {
	randomlyGeneratedPassword, err := RandomString(int(StandardNumberOfPasswordDigits))
	if err != nil {
		return "", err
	}

	hasedRandomlyGeneratedPassword, err := HashPassword(randomlyGeneratedPassword)
	if err != nil {
		return "", err
	}

	return hasedRandomlyGeneratedPassword, nil
}

func RandomString(length int) (string, error) {
	bytes := make([]byte, length)
	for i := range bytes {
		randomByte, err := rand.Int(rand.Reader, big.NewInt(int64(len(charset))))
		if err != nil {
			return "", err
		}
		bytes[i] = charset[randomByte.Int64()]
	}
	return string(bytes), nil
}
