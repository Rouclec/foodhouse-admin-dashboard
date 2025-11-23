package main

import (
	"database/sql"
	"fmt"
	"log"
	"os"

	"github.com/joho/godotenv"
	_ "github.com/lib/pq"
)

func main() {
	// Load .env
	if err := godotenv.Load(); err != nil {
		log.Fatal("❌ Error loading .env file:", err)
	}

	// Connect to Order DB
	orderDB, err := sql.Open("postgres", os.Getenv("ORDER_DB_URL"))
	if err != nil {
		log.Fatal("❌ Failed to connect to order DB:", err)
	}
	defer orderDB.Close()

	// Connect to Product DB
	productDB, err := sql.Open("postgres", os.Getenv("PRODUCT_DB_URL"))
	if err != nil {
		log.Fatal("❌ Failed to connect to product DB:", err)
	}
	defer productDB.Close()

	// Fetch order items with null unit_type
	orderRows, err := orderDB.Query(`
		SELECT id, product
		FROM order_items
		WHERE unit_type IS NULL
	`)
	if err != nil {
		log.Fatal("❌ Failed to fetch order items:", err)
	}
	defer orderRows.Close()

	var totalUpdated int
	for orderRows.Next() {
		var orderItemID string
		var productID string

		if err := orderRows.Scan(&orderItemID, &productID); err != nil {
			log.Println("⚠️ Skipping order item due to scan error:", err)
			continue
		}

		// Fetch product unit_type from product DB
		var unitType sql.NullString
		err := productDB.QueryRow(`
			SELECT unit_type
			FROM products
			WHERE id = $1
		`, productID).Scan(&unitType)
		if err != nil {
			if err == sql.ErrNoRows {
				log.Printf("⚠️ Product not found: %s\n", productID)
				continue
			}
			log.Printf("⚠️ Error fetching product %s: %v\n", productID, err)
			continue
		}

		if !unitType.Valid {
			log.Printf("⚠️ Product %s has null unit_type, skipping\n", productID)
			continue
		}

		// Update order item with the fetched unit_type
		res, err := orderDB.Exec(`
			UPDATE order_items
			SET unit_type = $1
			WHERE id = $2
		`, unitType.String, orderItemID)
		if err != nil {
			log.Printf("⚠️ Failed updating order item %s: %v\n", orderItemID, err)
			continue
		}

		affected, _ := res.RowsAffected()
		totalUpdated += int(affected)
		log.Printf("✅ Updated order item %s with unit_type %s\n", orderItemID, unitType.String)
	}

	fmt.Printf("🎉 Total order items updated: %d\n", totalUpdated)
}
