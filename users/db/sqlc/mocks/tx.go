package mocks

import (
	"context"

	"github.com/jackc/pgx/v5"
)

// TxMock is a lightweight stand-in that satisfies `pgx.Tx`.
// Tests typically only need a value of this type to return from mocks.
type TxMock struct{ pgx.Tx }

func (t *TxMock) Commit(_ context.Context) error   { return nil }
func (t *TxMock) Rollback(_ context.Context) error { return nil }

