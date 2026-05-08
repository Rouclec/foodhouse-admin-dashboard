package payment

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"math"
	"net/http"
	"strings"
	"time"

	"github.com/rs/zerolog"
)

type TrustPayWayProvider struct {
	SecretKey string
	AppToken  string
	BaseUrl   string
	WebHook   string
	ReturnUrl string
	CancelUrl string
	Logger    zerolog.Logger
	Client    *http.Client
}

type TPWStatus string

const (
	TPWStatusCompleted TPWStatus = "COMPLETED"
	TPWStatusPending   TPWStatus = "PENDING"
	TPWStatusFailed    TPWStatus = "FAILED"
)

type LoginRequest struct {
	ApplicationID string `json:"applicationId,requrired"`
}

type LoginResponse struct {
	TokenType   string `json:"token_type"`
	AccessToken string `json:"access_token"`
}

type InitiatePaymentRequest struct {
	Amount           string `json:"amount"`
	Currency         string `json:"currency"`
	SubscriberMsisdn string `json:"subscriberMsisdn"`
	Descrtiption     string `json:"description"`
	OrderId          string `json:"orderId"`
	NotifUrl         string `json:"notifUrl"`
}

type InitiatePaymentResponse struct {
	Data struct {
		TransactionId string `json:"transaction_id"`
	}
	Message    string `json:"message"`
	StatusCode int32  `json:"status_code"`
}

type InitiateWithdrawalRequest struct {
	Amount           string `json:"amount"`
	Currency         string `json:"currency"`
	SubscriberMsisdn string `json:"subscriberMsisdn"`
	Descrtiption     string `json:"description"`
	OrderId          string `json:"orderId"`
	NotifUrl         string `json:"notifUrl"`
}

type InitiateWithdrawalResponse struct {
	Data struct {
		TransactionId string `json:"transaction_id"`
	}
	Message    string `json:"message"`
	StatusCode int32  `json:"status_code"`
}

type CheckPaymentStatusRequest struct {
	TransactionId string `json:"transaction_id"`
}

type CheckPaymentResponse struct {
	Amount             string `json:"amount"`
	ConfirmationStatus string `json:"confirmationStatus"`
	Description        string `json:"description"`
	OrderId            string `json:"orderId"`
	PayerPhone         string `json:"payerPhone"`
	Status             string `json:"status"`
	TransactionDate    string `json:"transactionDate"`
	TransactionId      string `json:"transactionId"`
}

type GenerateSignatureRequest struct {
	CpmAmount        string `json:"cpm_amount"`
	CpmCurrency      string `json:"cpm_currency"`
	CpmTransId       string `json:"cpm_trans_id"`
	CpmTransDate     string `json:"cpm_trans_date"`
	CpmPaymentConfig string `json:"cpm_payment_config"`
	CpmPageAction    string `json:"cpm_page_action"`
	CpmVersion       string `json:"cpm_version"`
	CpmLanguage      string `json:"cpm_language"`
	CpmDesignation   string `json:"cpm_designation"`
	CpmCustom        string `json:"cpm_custom"`
}

type GenerateSignatureResponse struct {
	Code    int32  `json:"code"`
	Message string `json:"message"`
	Data    struct {
		Signature string `json:"signature"`
	} `json:"data"`
}

type InitiateCreditCardPaymentRequest struct {
	CpmAmount        string `json:"cpm_amount"`
	CpmCurrency      string `json:"cpm_currency"`
	CpmTransId       string `json:"cpm_trans_id"`
	CpmTransDate     string `json:"cpm_trans_date"`
	CpmPaymentConfig string `json:"cpm_payment_config"`
	CpmPageAction    string `json:"cpm_page_action"`
	CpmVersion       string `json:"cpm_version"`
	CpmLanguage      string `json:"cpm_language"`
	CpmDesignation   string `json:"cpm_designation"`
	CpmCustom        string `json:"cpm_custom"`
	Signature        string `json:"signature"`
	ReturnUrl        string `json:"return_url"`
	CancelUrl        string `json:"cancel_url"`
	NotifyUrl        string `json:"notify_url"`
}

type InitiateCreditCardPaymentResponse struct {
	Code    int32  `json:"code"`
	Message string `json:"message"`
	Data    struct {
		RedirectUrl string `json:"redirect_url"`
	} `json:"data"`
}

type CheckCardPaymentStatusRequest struct {
	CpmTransId    string `json:"cpm_trans_id"`
	PaymentMethod string `json:"payment_method"`
}

type CheckCardPaymentStatusResponse struct {
	Success bool `json:"success"`
	Data    struct {
		Transaction struct {
			CpmSiteId      string `json:"cpm_site_id"`
			CpmAmount      string `json:"cpm_amount"`
			CpmTransId     string `json:"cpm_trans_id"`
			CpmTransStatus string `json:"cpm_trans_status"`
			CpmResult      string `json:"cpm_result"`
			CpmPayid       string `json:"cpm_payid"`
			CpmCurrency    string `json:"cpm_currency"`
			CpmDesignation string `json:"cpm_designation"`
			CpmPaymentDate string `json:"cpm_payment_date"`
			CpmPaymentTime string `json:"cpm_payment_time"`
			PaymentMethod  string `json:"payment_method"`
			BuyerEmail     string `json:"buyer_email"`
			BuyerName      string `json:"buyer_name"`
			BuyerPhone     string `json:"buyer_phone"`
		} `json:"transaction"`
	} `json:"data"`
}

func NewTPWProvider(trustPayWaySecretKey string,
	trustPayWayAppToken string,
	trustPayWayBaseUrl string,
	trustPayWayWebHook string,
	trustPayWayReturnUrl string,
	trustPayWayCancelUrl string,
	logger zerolog.Logger) (
	*TrustPayWayProvider, error) {
	return &TrustPayWayProvider{
		SecretKey: trustPayWaySecretKey,
		AppToken:  trustPayWayAppToken,
		BaseUrl:   trustPayWayBaseUrl,
		WebHook:   trustPayWayWebHook,
		ReturnUrl: trustPayWayReturnUrl,
		CancelUrl: trustPayWayCancelUrl,
		Logger:    logger,
		Client:    http.DefaultClient,
	}, nil
}

func (tp *TrustPayWayProvider) RequestPayment(ctx context.Context, from string, amount float64, currency string, description string, externalReference *string) (*string, error) {
	network := DetectProvider(from)

	if network == ProviderUnknown {
		return nil, fmt.Errorf("unknonwn provider for phone number %v", from)
	}

	url := fmt.Sprintf("%s/api/%s/process-payment", tp.BaseUrl, network)

	loginResponse, err := tp.authenticate(ctx)

	if err != nil {
		return nil, fmt.Errorf("failed to authenticate request %v", err)
	}

	tp.Logger.Debug().Msgf("login response %v", loginResponse)

	requestBody := InitiatePaymentRequest{
		Amount:           fmt.Sprintf("%.0f", math.Ceil(amount)),
		Currency:         currency,
		SubscriberMsisdn: RemovePlusPrefix(from),
		Descrtiption:     description,
		OrderId:          *externalReference,
		NotifUrl:         tp.WebHook,
	}

	tp.Logger.Debug().Msgf("Payment request body: %v", requestBody)

	jsonBody, err := json.Marshal(requestBody)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal payment request: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, url, bytes.NewBuffer(jsonBody))
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Authorization", "Bearer "+loginResponse.AccessToken)
	req.Header.Set("Content-Type", "application/json")

	tp.Logger.Debug().Msgf("raw request: %v", req)

	resp, err := tp.Client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to send request: %w", err)
	}
	defer resp.Body.Close()

	tp.Logger.Debug().Msgf("Raw response %v", resp)

	var response InitiatePaymentResponse
	if err := json.NewDecoder(resp.Body).Decode(&response); err != nil {
		return nil, fmt.Errorf("failed to decode Infobip response: %w", err)
	}

	tp.Logger.Debug().Msgf("Payment response body %v", response)

	return &response.Data.TransactionId, nil
}

func (tp *TrustPayWayProvider) WithdrawFunds(ctx context.Context, to string, amount float64, currency string, description string, externalReference *string) (*string, error) {
	network := DetectProvider(to)

	if network == ProviderUnknown {
		return nil, fmt.Errorf("unknonwn provider for phone number %v", to)
	}

	url := fmt.Sprintf("%s/api/%s/process-cashin", tp.BaseUrl, network)

	loginResponse, err := tp.authenticate(ctx)

	tp.Logger.Debug().Msgf("login response %v", loginResponse)

	if err != nil {
		return nil, fmt.Errorf("failed to authenticate request %v", err)
	}

	requestBody := InitiateWithdrawalRequest{
		Amount:           fmt.Sprintf("%.0f", math.Floor(amount)),
		Currency:         currency,
		SubscriberMsisdn: RemovePlusPrefix(to),
		Descrtiption:     description,
		OrderId:          *externalReference,
		NotifUrl:         tp.WebHook,
	}

	tp.Logger.Debug().Msgf("withdrawal request body: %v", requestBody)

	jsonBody, err := json.Marshal(requestBody)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal SMS request: %w", err)
	}

	tp.Logger.Debug().Msgf("JSON body %v", jsonBody)

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, url, bytes.NewBuffer(jsonBody))
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Authorization", "Bearer "+loginResponse.AccessToken)
	req.Header.Set("Content-Type", "application/json")

	tp.Logger.Debug().Msgf("raw request: %v", req)

	// Then send the request as usual
	resp, err := tp.Client.Do(req)

	if err != nil {
		return nil, fmt.Errorf("failed to send request: %w", err)
	}
	defer resp.Body.Close()

	tp.Logger.Debug().Msgf("Raw response %v", resp)

	var response InitiateWithdrawalResponse
	if err := json.NewDecoder(resp.Body).Decode(&response); err != nil {
		return nil, fmt.Errorf("failed to decode Infobip response: %w", err)
	}

	tp.Logger.Debug().Msgf("Withdrawal response body %v", response)

	return &response.Data.TransactionId, nil
}

func (tp *TrustPayWayProvider) CheckCreditCardPaymentStatus(ctx context.Context, paymentId string) (PaymentStatus, error) {
	url := fmt.Sprintf("%s/api/payment/check", tp.BaseUrl)

	requestBody := CheckCardPaymentStatusRequest{
		CpmTransId:    paymentId,
		PaymentMethod: "credit_card",
	}

	tp.Logger.Debug().Msgf("check card payment status request body: %v", requestBody)

	jsonBody, err := json.Marshal(requestBody)
	if err != nil {
		return StatusUnknown, fmt.Errorf("failed to marshal check card payment status request: %w", err)
	}

	tp.Logger.Debug().Msgf("JSON body %v", jsonBody)

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, url, bytes.NewBuffer(jsonBody))
	if err != nil {
		return StatusUnknown, fmt.Errorf("failed to create request: %w", err)
	}

	loginResponse, err := tp.authenticate(ctx)

	if err != nil {
		return StatusUnknown, fmt.Errorf("failed to authenticate request %v", err)
	}

	req.Header.Set("Authorization", "Bearer "+loginResponse.AccessToken)
	req.Header.Set("Content-Type", "application/json")

	tp.Logger.Debug().Msgf("raw request: %v", req)

	resp, err := tp.Client.Do(req)
	if err != nil {
		return StatusUnknown, fmt.Errorf("failed to send request: %w", err)
	}
	defer resp.Body.Close()

	tp.Logger.Debug().Msgf("Raw response %v", resp)

	var response CheckCardPaymentStatusResponse
	if err := json.NewDecoder(resp.Body).Decode(&response); err != nil {
		return StatusUnknown, fmt.Errorf("failed to decode Infobip response: %w", err)
	}

	tp.Logger.Debug().Msgf("check card payment status response body %v", response)

	switch response.Data.Transaction.CpmTransStatus {
	case "ACCEPTED":
		return StatusCompleted, nil
	case "REJECTED":
		return StatusFailed, nil
	case "PENDING":
		return StatusPending, nil
	default:
		return StatusUnknown, nil
	}
}

func (tp *TrustPayWayProvider) CheckPaymentStatus(ctx context.Context, paymentId string) (PaymentStatus, error) {

	url := fmt.Sprintf("%s/api/%s/get-status/%s", tp.BaseUrl, ProviderMTN, paymentId)

	loginResponse, err := tp.authenticate(ctx)

	if err != nil {
		return StatusUnknown, fmt.Errorf("failed to authenticate request %v", err)
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return StatusUnknown, fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Authorization", "Bearer "+loginResponse.AccessToken)

	resp, err := tp.Client.Do(req)
	if err != nil {
		return StatusUnknown, fmt.Errorf("failed to send request: %w", err)
	}
	defer resp.Body.Close()

	tp.Logger.Debug().Msgf("Raw response %v", resp)

	var response CheckPaymentResponse
	if err := json.NewDecoder(resp.Body).Decode(&response); err != nil {
		return StatusUnknown, fmt.Errorf("failed to decode Infobip response: %w", err)
	}

	tp.Logger.Debug().Msgf("payment status response body %v", response)

	switch response.Status {
	case string(TPWStatusPending):
		return StatusPending, nil
	case string(TPWStatusFailed):
		return StatusFailed, nil
	case string(TPWStatusCompleted):
		return StatusCompleted, nil
	default:
		return StatusUnknown, nil
	}
}

func (tp *TrustPayWayProvider) authenticate(ctx context.Context) (*LoginResponse, error) {
	url := fmt.Sprintf("%s/api/login", tp.BaseUrl)

	requestBody := LoginRequest{
		ApplicationID: tp.AppToken,
	}

	tp.Logger.Debug().Msgf("login request body: %v", requestBody)

	jsonBody, err := json.Marshal(requestBody)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal login request: %w", err)
	}

	tp.Logger.Debug().Msgf("JSON body %v", jsonBody)

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, url, bytes.NewBuffer(jsonBody))
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Authorization", "Bearer "+tp.SecretKey)
	req.Header.Set("Content-Type", "application/json")

	tp.Logger.Debug().Msgf("tpw login request: %v", req)

	resp, err := tp.Client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to send request: %w", err)
	}
	defer resp.Body.Close()

	tp.Logger.Debug().Msgf("Raw response %v", resp)

	var response LoginResponse

	if err := json.NewDecoder(resp.Body).Decode(&response); err != nil {
		return nil, fmt.Errorf("failed to decode tpw login response: %w", err)
	}

	return &response, nil
}

func (tp *TrustPayWayProvider) GenerateSignature(ctx context.Context, amount float64, currency string, description string, externalReference *string) (*string, error) {

	loginResponse, err := tp.authenticate(ctx)

	if err != nil {
		return nil, fmt.Errorf("failed to authenticate request %v", err)
	}

	url := fmt.Sprintf("%s/api/payment/token", tp.BaseUrl)

	requestBody := GenerateSignatureRequest{
		CpmAmount:        fmt.Sprintf("%.0f", math.Floor(amount)),
		CpmCurrency:      currency,
		CpmTransId:       *externalReference,
		CpmTransDate:     time.Now().Format("2006-01-02 15:04:05"),
		CpmPaymentConfig: "SINGLE",
		CpmPageAction:    "PAYMENT",
		CpmVersion:       "V1",
		CpmLanguage:      "en",
		CpmDesignation:   description,
		CpmCustom:        *externalReference,
	}

	tp.Logger.Debug().Msgf("generate signature request body: %v", requestBody)

	jsonBody, err := json.Marshal(requestBody)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal generate signature request: %w", err)
	}

	tp.Logger.Debug().Msgf("JSON body %v", jsonBody)

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, url, bytes.NewBuffer(jsonBody))
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Authorization", "Bearer "+loginResponse.AccessToken)
	req.Header.Set("Content-Type", "application/json")

	tp.Logger.Debug().Msgf("raw request: %v", req)

	// Then send the request as usual
	resp, err := tp.Client.Do(req)

	if err != nil {
		return nil, fmt.Errorf("failed to send request: %w", err)
	}
	defer resp.Body.Close()

	tp.Logger.Debug().Msgf("Raw response %v", resp)

	var response GenerateSignatureResponse
	if err := json.NewDecoder(resp.Body).Decode(&response); err != nil {
		return nil, fmt.Errorf("failed to decode Infobip response: %w", err)
	}

	tp.Logger.Debug().Msgf("Generate signature response body %v", response)

	return &response.Data.Signature, nil
}

// RemovePlusPrefix removes the '+' from the start of the number if present.
func RemovePlusPrefix(number string) string {
	number = strings.TrimSpace(number)
	if strings.HasPrefix(number, "+") {
		return number[1:]
	}
	return number
}

func firstNonEmpty(values ...string) string {
	for _, v := range values {
		if strings.TrimSpace(v) != "" {
			return v
		}
	}
	return ""
}

func (tp *TrustPayWayProvider) RequestCreditCardPayment(ctx context.Context, amount float64, currency string, description string, externalReference *string) (*string, error) {
	// 1. authenticate
	loginResponse, err := tp.authenticate(ctx)

	if err != nil {
		return nil, fmt.Errorf("failed to authenticate request %v", err)
	}

	// 2. generate secure token
	token, err := tp.GenerateSignature(ctx, amount, currency, description, externalReference)
	if err != nil {
		return nil, fmt.Errorf("failed to generate signature %v", err)
	}

	// 3. initiate payment
	url := fmt.Sprintf("%s/api/payment/init", tp.BaseUrl)

	requestBody := InitiateCreditCardPaymentRequest{
		CpmAmount:        fmt.Sprintf("%d", int64(math.Ceil(amount))),
		CpmCurrency:      currency,
		CpmTransId:       *externalReference,
		CpmTransDate:     time.Now().Format("2006-01-02 15:04:05"),
		CpmPaymentConfig: "SINGLE",
		CpmPageAction:    "PAYMENT",
		CpmVersion:       "V1",
		CpmLanguage:      "en",
		CpmDesignation:   description,
		CpmCustom:        *externalReference,
		Signature:        *token,
		ReturnUrl:        firstNonEmpty(tp.ReturnUrl, tp.WebHook),
		CancelUrl:        firstNonEmpty(tp.CancelUrl, tp.WebHook),
		NotifyUrl:        tp.WebHook,
	}

	tp.Logger.Debug().Msgf("generate signature request body: %v", requestBody)

	jsonBody, err := json.Marshal(requestBody)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal generate signature request: %w", err)
	}

	tp.Logger.Debug().Msgf("JSON body %v", jsonBody)

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, url, bytes.NewBuffer(jsonBody))
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Authorization", "Bearer "+loginResponse.AccessToken)
	req.Header.Set("Content-Type", "application/json")

	tp.Logger.Debug().Msgf("raw request: %v", req)

	// Then send the request as usual
	resp, err := tp.Client.Do(req)

	if err != nil {
		return nil, fmt.Errorf("failed to send request: %w", err)
	}
	defer resp.Body.Close()

	tp.Logger.Debug().Msgf("Raw response %v", resp)

	var response InitiateCreditCardPaymentResponse
	if err := json.NewDecoder(resp.Body).Decode(&response); err != nil {
		return nil, fmt.Errorf("failed to decode Infobip response: %w", err)
	}

	tp.Logger.Debug().Msgf("Initiate credit card payment response body %v", response)

	// 4. return payment link
	return &response.Data.RedirectUrl, nil
}
