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

	userDB, err := sql.Open("postgres", os.Getenv("USER_DB_URL"))
	if err != nil {
		log.Fatal("❌ Failed to connect to user DB:", err)
	}
	defer userDB.Close()

	productDB, err := sql.Open("postgres", os.Getenv("PRODUCT_DB_URL"))
	if err != nil {
		log.Fatal("❌ Failed to connect to product DB:", err)
	}
	defer productDB.Close()

	// Fetch distinct user IDs for products missing locations
	userRows, err := productDB.Query(`
		SELECT DISTINCT created_by
		FROM products
		WHERE 
    		location IS NULL
    		OR ST_Equals(location, ST_SetSRID(ST_MakePoint(0, 0), 4326));
	`)
	if err != nil {
		log.Fatal("❌ Failed to fetch users from products:", err)
	}
	defer userRows.Close()

	var totalUpdated int
	for userRows.Next() {
		var userID string
		if err := userRows.Scan(&userID); err != nil {
			log.Println("⚠️ Skipping user due to scan error:", err)
			continue
		}

		// Fetch user location as raw point string
		var rawPoint string
		err := userDB.QueryRow(`
			SELECT location_coordinates
			FROM users
			WHERE id = $1 AND role = 'USER_ROLE_FARMER'
		`, userID).Scan(&rawPoint)
		if err != nil {
			if err == sql.ErrNoRows {
				continue
			}
			log.Printf("⚠️ Error fetching user %s: %v\n", userID, err)
			continue
		}

		// Log the user as they are fetched
		log.Printf("📍 Fetched user %s with location: %s\n", userID, rawPoint)

		var lon, lat float64
		_, err = fmt.Sscanf(rawPoint, "(%f,%f)", &lon, &lat)
		if err != nil {
			log.Printf("⚠️ Failed parsing location for user %s: %v\n", userID, err)
			continue
		}

		// Skip if location is (0,0)
		if lon == 0 && lat == 0 {
			continue
		}

		// Update all products for this user
		res, err := productDB.Exec(`
			UPDATE products
			SET location = ST_SetSRID(ST_MakePoint($1, $2), 4326)
			WHERE 
				created_by = $3 
				AND (
					location IS NULL
					OR ST_Equals(location, ST_SetSRID(ST_MakePoint(0, 0), 4326))
				)
		`, lon, lat, userID)

		if err != nil {
			log.Printf("⚠️ Failed updating products for user %s: %v\n", userID, err)
			continue
		}

		count, _ := res.RowsAffected()
		totalUpdated += int(count)
		log.Printf("✅ Updated %d products for user %s\n", count, userID)
	}

	fmt.Printf("🎉 Total products updated: %d\n", totalUpdated)
}
