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
	ID        string
	Location  pgtype.Point
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

	// Fetch distinct user IDs from products
	userRows, err := productDB.Query(`
		SELECT DISTINCT created_by
		FROM products
		WHERE location IS NULL
	`)
	if err != nil {
		log.Fatal("❌ Failed to fetch users from products:", err)
	}
	defer userRows.Close()

	var updatedCount int
	for userRows.Next() {
		var userID string
		if err := userRows.Scan(&userID); err != nil {
			log.Println("⚠️ Skipping user due to scan error:", err)
			continue
		}

		// Fetch user's location
		var u User
		err := userDB.QueryRow(`
			SELECT id, location_coordinates
			FROM users
			WHERE id = $1
			  AND role = 'USER_ROLE_FARMER'
		`, userID).Scan(&u.ID, &u.Location)
		if err != nil {
			if err == sql.ErrNoRows {
				// Skip if user not found
				continue
			}
			log.Printf("⚠️ Error fetching user %s: %v\n", userID, err)
			continue
		}

		// Skip if location is null or (0,0)
		if !u.Location.Valid || (u.Location.P.X == 0 && u.Location.P.Y == 0) {
			continue
		}

		lon := u.Location.P.X
		lat := u.Location.P.Y

		// Update all products for this user
		res, err := productDB.Exec(`
			UPDATE products
			SET location = ST_SetSRID(ST_MakePoint($1, $2), 4326)
			WHERE created_by = $3
			  AND location IS NULL
		`, lon, lat, u.ID)
		if err != nil {
			log.Printf("⚠️ Failed updating products for user %s: %v\n", u.ID, err)
			continue
		}

		count, _ := res.RowsAffected()
		updatedCount += int(count)
		log.Printf("✅ Updated %d products for user %s\n", count, u.ID)
	}

	fmt.Printf("🎉 Total products updated: %d\n", updatedCount)
}
