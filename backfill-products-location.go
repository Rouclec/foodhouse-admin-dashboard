package main

import (
	"database/sql"
	"fmt"
	"log"
	"os"

	"github.com/jackc/pgx/v5/pgtype"
	"github.com/joho/godotenv"
	_ "github.com/lib/pq"
)

type User struct {
	ID                 string
	LocationCoordinates pgtype.Point
}

func main() {
	// Load .env file
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

	rows, err := userDB.Query(`
		SELECT id, location_coordinates
		FROM users
		WHERE location_coordinates IS NOT NULL
		AND role = 'USER_ROLE_FARMER'
	`)
	if err != nil {
		log.Fatal("❌ Failed to fetch users:", err)
	}
	defer rows.Close()

	updatedCount := 0

	for rows.Next() {
		var u User
		if err := rows.Scan(&u.ID, &u.LocationCoordinates); err != nil {
			log.Println("⚠️ Skipping user due to scan error:", err)
			continue
		}

		// Skip if null or invalid point
		if !u.LocationCoordinates.Valid {
			continue
		}

		longitude := u.LocationCoordinates.P.X
		latitude := u.LocationCoordinates.P.Y

		// Update products
		_, err = productDB.Exec(`
			UPDATE products
			SET location = ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography
			WHERE created_by = $3
			  AND (location IS NULL OR ST_IsEmpty(location));
		`, longitude, latitude, u.ID)

		if err != nil {
			log.Printf("⚠️ Failed updating products for user %s: %v\n", u.ID, err)
			continue
		}

		updatedCount++
	}

	fmt.Printf("✅ Updated product locations for %d users\n", updatedCount)
}
