// Package db : This package contains the database related code.
package db

//go:generate go run github.com/sqlc-dev/sqlc/cmd/sqlc@v1.27.0 generate
//go:generate go run  go.uber.org/mock/mockgen@v0.5.0 -destination sqlc/mocks/querier.go -package mocks ./sqlc Querier
//go:generate go run  go.uber.org/mock/mockgen@v0.5.0 -destination repo/mocks/repo.go -package mocks ./repo ProductsRepo
