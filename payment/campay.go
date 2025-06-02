package payment

import (
	"context"
	"fmt"
	"strconv"

	"github.com/Iknite-Space/campay-go-sdk/campay"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

type CampayProvider struct {
	CampayUserName string
	CampayPassword string
	CampayBaseUrl  string
	CampayWebHook  string
}

func NewCampayProvider(campayUsername string, campayPassword string, campayBaseUrl string, campayWebHook string) (*CampayProvider, error) {
	return &CampayProvider{
		CampayUserName: campayUsername,
		CampayPassword: campayPassword,
		CampayBaseUrl:  campayBaseUrl,
		CampayWebHook:  campayWebHook,
	}, nil
}

func (cp *CampayProvider) RequestPayment(ctx context.Context, from string, amount float64, currency string, description string, externalReference *string) (*string, error) {
	campayClient, err := campay.NewPaymentClient(cp.CampayUserName, cp.CampayPassword, cp.CampayBaseUrl)

	if err != nil {
		return nil, status.Error(codes.InvalidArgument, fmt.Sprintf(`One of these is not valid: %s--%s--%s`, cp.CampayUserName, cp.CampayPassword, cp.CampayBaseUrl))
	}

	amountStr := strconv.FormatFloat(amount, 'f', 2, 64)

	campayPaymentRequirement := campay.CampayPaymentsRequest{
		Amount:      amountStr,
		From:        from,
		Description: description,
		ExternalRef: *externalReference,
	}

	response, err := campayClient.InitiateCampayMobileMoneyPayments(ctx, campayPaymentRequirement)

	if err != nil {
		return nil, err
	}

	return &response.Reference, nil
}

func (cp *CampayProvider) WithdrawFunds(ctx context.Context, to string, amount float64, currency string, description string, externalReference *string) (*string, error) {
	campayClient, err := campay.NewPaymentClient(cp.CampayUserName, cp.CampayPassword, cp.CampayBaseUrl)

	if err != nil {
		return nil, status.Error(codes.InvalidArgument, fmt.Sprintf(`One of these is not valid: %s--%s--%s`, cp.CampayUserName, cp.CampayPassword, cp.CampayBaseUrl))
	}

	amountStr := strconv.FormatFloat(amount, 'f', 2, 64)

	campayPaymentRequirement := campay.WithdrawalRequest{
		Amount:      amountStr,
		To:          to,
		Description: description,
		ExternalRef: *externalReference,
	}

	response, err := campayClient.Withdraw(ctx, campayPaymentRequirement)

	if err != nil {
		return nil, err
	}

	return &response.Reference, nil
}
