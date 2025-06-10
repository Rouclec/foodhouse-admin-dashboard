package sms

import (
	"context"
	"net/http"
)

type SmsSenderNexah struct {
	BaseURL  string
	User     string
	Password string
	SenderID string
	Client   *http.Client
}

type NexahSmsRequest struct {
	User     string `json:"user"`
	Password string `json:"password"`
	SenderID string `json:"senderid"`
	SMS      string `json:"sms"`
	Mobiles  string `json:"mobiles"`
}

type NexahSmsResponse struct {
	ResponseCode        int64  `json:"responsecode"`
	ResponseDescription string `json:"responsedescription"`
	ResponseMessage     string `json:"responsemessage"`
	Sms                 []struct {
		Status           string `json:"status"`
		MobileNumber     string `json:"mobileno"`
		ErrorCode        string `json:"errorcode"`
		ErrorDescription string `json:"errordescription"`
		SenderId         string `json:"senderid"`
		Message          string `json:"message"`
	} `json:"sms"`
}

func NewSmsSenderNexah(baseURL string, user string, password string, senderId string) (*SmsSenderNexah, error) {
	return &SmsSenderNexah{
		BaseURL:  baseURL,
		User:     user,
		Password: password,
		SenderID: senderId,
	}, nil
}

func (s *SmsSenderNexah) SendSms(ctx context.Context, to, message string) (*string, error) {
	// url := fmt.Sprintf("%s/bulk/public/index.php/api/v1/sendsms", s.BaseURL)

	// reqBody := NexahSmsRequest{
	// 	User:     s.User,
	// 	Password: s.Password,
	// 	SenderID: s.SenderID,
	// 	SMS:      message,
	// 	Mobiles:  to,
	// }

	// jsonBody, err := json.Marshal(reqBody)
	// if err != nil {
	// 	return nil, fmt.Errorf("failed to marshal SMS request: %w", err)
	// }

	// req, err := http.NewRequestWithContext(ctx, http.MethodPost, url, bytes.NewBuffer(jsonBody))
	// if err != nil {
	// 	return nil, fmt.Errorf("failed to create request: %w", err)
	// }

	// req.Header.Set("Content-Type", "application/json")

	// resp, err := s.Client.Do(req)
	// if err != nil {
	// 	return nil, fmt.Errorf("failed to send request to Infobip: %w", err)
	// }
	// defer resp.Body.Close()

	// var smsResponse NexahSmsResponse
	// if err := json.NewDecoder(resp.Body).Decode(&smsResponse); err != nil {
	// 	return nil, fmt.Errorf("failed to decode Infobip response: %w", err)
	// }

	// return &smsResponse.Sms[0].ErrorCode, nil
	response := "sms sent"

	return &response, nil
}
