package main

import (
	"database/sql"
	"fmt"
	"log"
	"os"

	"github.com/joho/godotenv"
	_ "github.com/lib/pq"
)

type Product struct {
	ID   string
	Name string
}

type OrderItem struct {
	Product  string
	Quantity int
}

func main() {

	// --- Load .env ---
	if err := godotenv.Load(); err != nil {
		log.Fatal("❌ Error loading .env file:", err)
	}

	// --- Load env vars ---

	orderDBURL := os.Getenv("ORDER_DB_URL")
	if orderDBURL == "" {
		log.Fatal("Missing env variable: ORDER_DB_URL")
	}

	productDBURL := os.Getenv("PRODUCT_DB_URL")
	if productDBURL == "" {
		log.Fatal("Missing env variable: PRODUCT_DB_URL")
	}

	userID := os.Getenv("USER_ID")
	if userID == "" {
		log.Fatal("Missing env variable: USER_ID")
	}

	fmt.Println("Starting aggregation for user:", userID)

	// --- Connect to DBs ---

	productDB, err := sql.Open("postgres", productDBURL)
	if err != nil {
		log.Fatal(err)
	}
	defer productDB.Close()

	orderDB, err := sql.Open("postgres", orderDBURL)
	if err != nil {
		log.Fatal(err)
	}
	defer orderDB.Close()

	// --- Load data ---

	products, err := GetProductsByUser(productDB, userID)
	if err != nil {
		log.Fatal(err)
	}

	items, err := GetOrderItems(orderDB)
	if err != nil {
		log.Fatal(err)
	}

	// --- Aggregate ---

	totals := CalculateTotals(products, items)

	// --- Print results ---

	fmt.Println("---- Sales Summary ----")
	for name, qty := range totals {
		fmt.Printf("%s → %d sold\n", name, qty)
	}
	fmt.Println("-----------------------")
}

func GetProductsByUser(db *sql.DB, userID string) (map[string]Product, error) {
	rows, err := db.Query(`
        SELECT id, name
        FROM products
        WHERE created_by = $1
    `, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	result := make(map[string]Product)

	for rows.Next() {
		var p Product
		if err := rows.Scan(&p.ID, &p.Name); err != nil {
			return nil, err
		}
		result[p.ID] = p
	}

	return result, nil
}

func GetOrderItems(db *sql.DB) ([]OrderItem, error) {
	rows, err := db.Query(`
        SELECT oi.product, oi.quantity
        FROM order_items oi
        JOIN orders o ON oi.order_number = o.order_number
        WHERE o.status IN (
            'OrderStatus_PAYMENT_SUCCESSFUL',
            'OrderStatus_IN_TRANSIT',
            'OrderStatus_DELIVERED',
            'OrderStatus_APPROVED'
        )
    `)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []OrderItem

	for rows.Next() {
		var item OrderItem
		if err := rows.Scan(&item.Product, &item.Quantity); err != nil {
			return nil, err
		}
		list = append(list, item)
	}

	return list, nil
}

func CalculateTotals(products map[string]Product, items []OrderItem) map[string]int {
	totals := make(map[string]int)

	for _, item := range items {
		if p, exists := products[item.Product]; exists {
			totals[p.Name] += item.Quantity
		}
	}

	return totals
}
