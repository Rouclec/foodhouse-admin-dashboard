package email

import (
	"bytes"
	"context"
	"fmt"
	"html/template"
	"net/smtp"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/jordan-wright/email"
	"github.com/phpdave11/gofpdf"
)

// SMTPConfig holds SMTP server details.
type SMTPConfig struct {
	Host     string
	Port     string
	Username string
	Password string
}

// EmailService is the main handler.
type EmailService struct {
	config     SMTPConfig
	otpTpl     *template.Template
	receiptTpl *template.Template
}

type Amount struct {
	Value           float64
	CurrencyIsoCode string // e.g., "USD", "NGN"
}

type ReceiptItem struct {
	Name     string
	Quantity int64
	Amount   Amount
	Unit     string
}

type ReceiptData struct {
	ReceiptID      string
	Date           time.Time
	CompanyName    string
	CompanyEmail   string
	CompanyPhone   string
	CustomerName   string
	CustomerEmail  string
	Items          []ReceiptItem
	TransactionFee Amount
	ServiceFee     Amount
	DeliveryFee    Amount
	PaymentMethod  string
	TransactionID  string
}

// NewSMTPSerivce initializes templates and config.
func NewSMTPService(host, port, username, password, templatePath string) (*EmailService, error) {
	absTemplatePath, err := filepath.Abs(templatePath)
	if err != nil {
		return nil, fmt.Errorf("resolving absolute template path: %w", err)
	}

	otpTpl, err := template.ParseFiles(fmt.Sprint(absTemplatePath + "/otp.html"))
	if err != nil {
		return nil, fmt.Errorf("loading OTP template: %w", err)
	}

	receiptTpl, err := template.ParseFiles(fmt.Sprint(absTemplatePath + "/receipt.html"))
	if err != nil {
		return nil, fmt.Errorf("loading receipt template: %w", err)
	}

	return &EmailService{
		config: SMTPConfig{
			Host:     host,
			Port:     port,
			Username: username,
			Password: password,
		},
		otpTpl:     otpTpl,
		receiptTpl: receiptTpl,
	}, nil
}

func FormatAmount(a Amount) string {
	// Split into integer and decimal parts
	intPart, fracPart := splitFloat(a.Value)
	// Add commas to integer part
	intWithCommas := addCommas(intPart)
	// Return formatted string with 2 decimal places
	return fmt.Sprintf("%s %s.%s", a.CurrencyIsoCode, intWithCommas, fracPart)
}

// Splits float into integer and decimal string parts
func splitFloat(f float64) (string, string) {
	s := fmt.Sprintf("%.2f", f)    // Always 2 decimal places
	parts := strings.Split(s, ".") // Split at the decimal point
	return parts[0], parts[1]
}

// Adds commas to a string representing an integer number
func addCommas(s string) string {
	n := len(s)
	if n <= 3 {
		return s
	}

	var b strings.Builder
	pre := n % 3
	if pre > 0 {
		b.WriteString(s[:pre])
		if n > pre {
			b.WriteString(",")
		}
	}

	for i := pre; i < n; i += 3 {
		b.WriteString(s[i : i+3])
		if i+3 < n {
			b.WriteString(",")
		}
	}
	return b.String()
}

// SendOTPEmail sends an OTP email using a predefined template.
func (s *EmailService) SendOTPEmail(ctx context.Context, toEmail, firstName, otp string) error {

	select {
	case <-ctx.Done():
		return ctx.Err()
	default:
	}

	data := struct {
		Name string
		OTP  string
	}{
		Name: firstName,
		OTP:  otp,
	}

	var body bytes.Buffer
	if err := s.otpTpl.Execute(&body, data); err != nil {
		return err
	}

	e := email.NewEmail()
	e.From = s.config.Username
	e.To = []string{toEmail}
	e.Subject = "Your OTP Code"
	e.HTML = body.Bytes()

	return e.Send(s.config.Host+":"+s.config.Port,
		smtp.PlainAuth("", s.config.Username, s.config.Password, s.config.Host))
}

// SendPaymentReceipt sends a receipt email with an attachment.
func (s *EmailService) SendPaymentReceipt(ctx context.Context, toEmail, entityName string, receiptData ReceiptData) error {
	select {
	case <-ctx.Done():
		return ctx.Err()
	default:
	}

	fmt.Println("entity name: ", entityName)

	// Generate PDF and write to temp file
	pdfPath, err := GeneratePDFReceipt(receiptData)
	if err != nil {
		return fmt.Errorf("PDF generation failed: %w", err)
	}
	defer os.Remove(pdfPath)

	data := struct {
		Entity string
	}{
		Entity: entityName,
	}

	var body bytes.Buffer
	if err := s.receiptTpl.Execute(&body, data); err != nil {
		return err
	}

	e := email.NewEmail()
	e.From = s.config.Username
	e.To = []string{toEmail}
	e.Subject = "Payment Receipt for " + entityName
	e.HTML = body.Bytes()

	_, _ = filepath.Split(pdfPath)
	if _, err := e.AttachFile(pdfPath); err != nil {
		return fmt.Errorf("attaching receipt: %w", err)
	}

	return e.Send(s.config.Host+":"+s.config.Port,
		smtp.PlainAuth("", s.config.Username, s.config.Password, s.config.Host))
}

var nonPluralUnits = map[string]bool{
	"Kg": true,
	"g":  true,
	"cm": true,
	"mm": true,
	"ml": true,
	"L":  true,
	"m":  true,
}

func FormatQuantity(qty int64, rawUnit string) string {
	// Step 1: Remove "per_" prefix if present
	unit := strings.TrimPrefix(rawUnit, "per_")

	// Step 2: Capitalize first letter
	if len(unit) > 0 {
		unit = strings.ToUpper(unit[:1]) + unit[1:]
	}

	// Step 3: Handle pluralization
	if qty == 1 || nonPluralUnits[unit] {
		return fmt.Sprintf("%d %s", qty, unit)
	}
	return fmt.Sprintf("%d %ss", qty, unit)
}

func GeneratePDFReceipt(data ReceiptData) (string, error) {
	pdf := gofpdf.New("P", "mm", "A4", "")
	pdf.AddPage()

	// --- Company Header ---
	pdf.SetFont("Arial", "B", 20)
	pdf.SetTextColor(109, 205, 71) // Apply your primary color
	pdf.Cell(0, 10, data.CompanyName)
	pdf.SetTextColor(0, 0, 0) // Reset back to black
	pdf.Ln(8)

	pdf.SetFont("Arial", "", 11)
	pdf.Cell(0, 6, fmt.Sprintf("Email: %s | Phone: %s", data.CompanyEmail, data.CompanyPhone))
	pdf.Ln(12)

	// --- Receipt Info ---
	pdf.SetFont("Arial", "B", 14)
	pdf.Cell(0, 8, "Payment Receipt")
	pdf.Ln(10)

	pdf.SetFont("Arial", "", 11)
	pdf.Cell(90, 6, fmt.Sprintf("Receipt #: %s", data.ReceiptID))
	pdf.Cell(0, 6, fmt.Sprintf("Date: %s", data.Date.Format("Jan 2, 2006")))
	pdf.Ln(8)

	// --- Status ---
	pdf.SetFont("Arial", "B", 12)
	pdf.SetTextColor(0, 128, 0)
	pdf.Cell(0, 8, "Status: PAID")
	pdf.SetTextColor(0, 0, 0)
	pdf.Ln(12)

	// --- Bill To ---
	pdf.SetFont("Arial", "B", 12)
	pdf.Cell(0, 6, "Bill To:")
	pdf.Ln(6)

	pdf.SetFont("Arial", "", 11)
	pdf.Cell(0, 6, data.CustomerName)
	pdf.Ln(6)
	pdf.Cell(0, 6, data.CustomerEmail)
	pdf.Ln(12)

	// --- Table Header ---
	pdf.SetFont("Arial", "B", 12)
	pdf.CellFormat(80, 10, "Item", "1", 0, "", false, 0, "")
	pdf.CellFormat(20, 10, "Qty", "1", 0, "", false, 0, "")
	pdf.CellFormat(40, 10, "Unit Price", "1", 0, "", false, 0, "")
	pdf.CellFormat(40, 10, "Total", "1", 1, "", false, 0, "")

	// --- Items ---
	pdf.SetFont("Arial", "", 11)
	var grandTotal float64
	var currency string

	for _, item := range data.Items {
		itemTotal := item.Amount.Value * float64(item.Quantity)
		grandTotal += itemTotal
		currency = item.Amount.CurrencyIsoCode

		pdf.CellFormat(80, 10, item.Name, "1", 0, "", false, 0, "")
		qty := FormatQuantity(item.Quantity, item.Unit)
		pdf.CellFormat(20, 10, qty, "1", 0, "", false, 0, "")
		pdf.CellFormat(40, 10, FormatAmount(item.Amount), "1", 0, "", false, 0, "")
		pdf.CellFormat(40, 10, FormatAmount(Amount{itemTotal, currency}), "1", 1, "", false, 0, "")
	}

	// --- Fees ---
	if data.ServiceFee.Value > 0 {
		grandTotal += data.ServiceFee.Value
		pdf.CellFormat(140, 10, "Service Fee", "1", 0, "", false, 0, "")
		pdf.CellFormat(40, 10, FormatAmount(data.ServiceFee), "1", 1, "", false, 0, "")
	}
	if data.DeliveryFee.Value > 0 {
		grandTotal += data.DeliveryFee.Value
		pdf.CellFormat(140, 10, "Delivery Fee", "1", 0, "", false, 0, "")
		pdf.CellFormat(40, 10, FormatAmount(data.DeliveryFee), "1", 1, "", false, 0, "")
	}
	if data.TransactionFee.Value > 0 {
		grandTotal += data.TransactionFee.Value
		pdf.CellFormat(140, 10, "Transaction Fee", "1", 0, "", false, 0, "")
		pdf.CellFormat(40, 10, FormatAmount(data.TransactionFee), "1", 1, "", false, 0, "")
	}

	// --- Grand Total ---
	pdf.SetFont("Arial", "B", 12)
	pdf.Cell(140, 10, "Total Paid")
	pdf.CellFormat(40, 10, FormatAmount(Amount{grandTotal, currency}), "1", 1, "", false, 0, "")

	// --- Payment Method ---
	pdf.Ln(10)
	pdf.SetFont("Arial", "", 11)
	pdf.Cell(0, 6, fmt.Sprintf("Paid via: %s", data.PaymentMethod))
	pdf.Ln(6)
	pdf.Cell(0, 6, fmt.Sprintf("Transaction ID: %s", data.TransactionID))
	pdf.Ln(12)

	// --- Footer ---
	pdf.SetFont("Arial", "I", 10)
	pdf.Cell(0, 6, "Thank you for your payment!")
	pdf.Ln(6)

	// Save the file
	fileName := fmt.Sprintf("receipt_%s.pdf", data.ReceiptID)
	err := pdf.OutputFileAndClose(fileName)
	if err != nil {
		return "", err
	}
	return fileName, nil
}
