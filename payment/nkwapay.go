package payment

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/rs/zerolog"
)

type NkwaPayProvider struct {
	ApiKey  string
	BaseUrl string
	Logger  zerolog.Logger
	Client  *http.Client
}

type NkwaPayStatus string

const (
	NkwaPayStatusSuccess  NkwaPayStatus = "success"
	NkwaPayStatusPending  NkwaPayStatus = "pending"
	NkwaPayStatusFailed   NkwaPayStatus = "failed"
	NkwaPayStatusCanceled NkwaPayStatus = "canceled"
)

type InitiateNkwaPaymentRequest struct {
	Amount      float64 `json:"amount"`
	PhoneNumber string  `json:"phoneNumber"`
}

type InitiateNkwaPaymentResponse struct {
	ID              string        `json:"id"`
	Amount          float64       `json:"amount"`
	Currency        string        `json:"currency"`
	Fee             string        `json:"fee"`
	Status          NkwaPayStatus `json:"status"`
	MerchantID      int64         `json:"merchantId"`
	PaymentType     string        `json:"paymentType"`
	Description     string        `json:"description"`
	TelecomOperator string        `json:"telecomOperator"`
	CreatedAt       string        `json:"createdAt"`
	UpdtedAt        string        `json:"updatedAt"`
}

type InitiateNkwaWithdrawalRequest struct {
	Amount      float64 `json:"amount"`
	PhoneNumber string  `json:"phoneNumber"`
}

type InitiateNkwaWithdrawalResponse struct {
	ID              string        `json:"id"`
	Amount          float64       `json:"amount"`
	Currency        string        `json:"currency"`
	Fee             string        `json:"fee"`
	Status          NkwaPayStatus `json:"status"`
	MerchantID      int64         `json:"merchantId"`
	PaymentType     string        `json:"paymentType"`
	Description     string        `json:"description"`
	TelecomOperator string        `json:"telecomOperator"`
	CreatedAt       string        `json:"createdAt"`
	UpdtedAt        string        `json:"updatedAt"`
}

type CheckNkwaPaymentStatusRequest struct {
	PaymentId string `json:"payment_id"`
}

type CheckNkwaPaymentResponse struct {
	ID              string        `json:"id"`
	Amount          float64       `json:"amount"`
	Currency        string        `json:"currency"`
	Fee             string        `json:"fee"`
	Status          NkwaPayStatus `json:"status"`
	MerchantID      int64         `json:"merchantId"`
	PaymentType     string        `json:"paymentType"`
	Description     string        `json:"description"`
	TelecomOperator string        `json:"telecomOperator"`
	CreatedAt       string        `json:"createdAt"`
	UpdtedAt        string        `json:"updatedAt"`
}

func NewNkwaPayProvider(apiKey string,
	nkwaPayBaseUrl string, logger zerolog.Logger) (
	*NkwaPayProvider, error) {
	return &NkwaPayProvider{
		ApiKey:  apiKey,
		BaseUrl: nkwaPayBaseUrl,
		Logger:  logger,
		Client:  http.DefaultClient,
	}, nil
}

func (np *NkwaPayProvider) RequestPayment(ctx context.Context, from string, amount float64, currency string, description string, externalReference *string) (*string, error) {
	if DetectProvider(from) == ProviderUnknown {
		return nil, fmt.Errorf("unknonwn provider for phone number %v", from)
	}

	url := fmt.Sprintf("%s/collect", np.BaseUrl)

	requestBody := InitiateNkwaPaymentRequest{
		Amount:      amount,
		PhoneNumber: RemovePlusPrefix(from),
	}

	np.Logger.Debug().Msgf("Payment request body: %v", requestBody)

	jsonBody, err := json.Marshal(requestBody)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal payment request: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, url, bytes.NewBuffer(jsonBody))
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("x-api-key", np.ApiKey)
	req.Header.Set("Content-Type", "application/json")

	np.Logger.Debug().Msgf("raw request: %v", req)

	resp, err := np.Client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to send request: %w", err)
	}
	defer resp.Body.Close()

	np.Logger.Debug().Msgf("Raw response %v", resp)

	var response InitiateNkwaPaymentResponse
	if err := json.NewDecoder(resp.Body).Decode(&response); err != nil {
		return nil, fmt.Errorf("failed to decode Nkwapay response: %w", err)
	}

	np.Logger.Debug().Msgf("Payment response body %v", response)

	return &response.ID, nil
}

func (np *NkwaPayProvider) WithdrawFunds(ctx context.Context, to string, amount float64, currency string, description string, externalReference *string) (*string, error) {
	network := DetectProvider(to)

	if network == ProviderUnknown {
		return nil, fmt.Errorf("unknonwn provider for phone number %v", to)
	}

	url := fmt.Sprintf("%s/disburse", np.BaseUrl)

	requestBody := InitiateNkwaWithdrawalRequest{
		Amount:      amount,
		PhoneNumber: RemovePlusPrefix(to),
	}

	np.Logger.Debug().Msgf("withdrawal request body: %v", requestBody)

	jsonBody, err := json.Marshal(requestBody)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal SMS request: %w", err)
	}

	np.Logger.Debug().Msgf("JSON body %v", jsonBody)

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, url, bytes.NewBuffer(jsonBody))
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("x-api-key", np.ApiKey)
	req.Header.Set("Content-Type", "application/json")

	resp, err := np.Client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to send request: %w", err)
	}
	defer resp.Body.Close()

	np.Logger.Debug().Msgf("Raw response %v", resp)

	var response InitiateNkwaWithdrawalResponse
	if err := json.NewDecoder(resp.Body).Decode(&response); err != nil {
		return nil, fmt.Errorf("failed to decode NkwaPay response: %w", err)
	}

	np.Logger.Debug().Msgf("Withdrawal response body %v", response)

	return &response.ID, nil
}

func (np *NkwaPayProvider) CheckPaymentStatus(ctx context.Context, paymentId string) (PaymentStatus, error) {

	url := fmt.Sprintf("%s/payments/%s", np.BaseUrl, paymentId)

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return StatusUnknown, fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("x-api-key", np.ApiKey)

	resp, err := np.Client.Do(req)
	if err != nil {
		return StatusUnknown, fmt.Errorf("failed to send request: %w", err)
	}
	defer resp.Body.Close()

	np.Logger.Debug().Msgf("Raw response %v", resp)

	var response CheckNkwaPaymentResponse
	if err := json.NewDecoder(resp.Body).Decode(&response); err != nil {
		return StatusUnknown, fmt.Errorf("failed to decode Infobip response: %w", err)
	}

	np.Logger.Debug().Msgf("payment status response body %v", response)

	switch response.Status {
	case NkwaPayStatusPending:
		return StatusPending, nil
	case NkwaPayStatusFailed:
		return StatusFailed, nil
	case NkwaPayStatusSuccess:
		return StatusCompleted, nil
	default:
		return StatusUnknown, nil
	}
}
