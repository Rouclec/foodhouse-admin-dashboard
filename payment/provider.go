package payment

import (
	"strings"
)

type Provider string

const (
	ProviderMTN     Provider = "mtn"
	ProviderOrange  Provider = "orange"
	ProviderUnknown Provider = "unknown"
)

// normalizePhone ensures the number is in 9-digit national format
func normalizePhone(number string) string {
	number = strings.TrimSpace(number)
	number = strings.TrimPrefix(number, "+237")
	number = strings.TrimPrefix(number, "00237")
	if len(number) > 9 {
		number = number[len(number)-9:]
	}
	return number
}

func DetectProvider(phoneNumber string) Provider {
	number := normalizePhone(phoneNumber)
	if len(number) != 9 {
		return ProviderUnknown
	}

	prefix2 := number[:2] // e.g., "67", "68", "69", "65"
	prefix3 := number[:3] // e.g., "651"..."659"

	switch prefix2 {
	case "67", "68":
		return ProviderMTN
	case "69":
		return ProviderOrange
	case "65":
		switch prefix3 {
		case "650", "651", "652", "653", "654":
			return ProviderMTN
		case "655", "656", "657", "658", "659":
			return ProviderOrange
		}
	}

	return ProviderUnknown
}
