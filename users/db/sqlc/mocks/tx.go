package mocks

import (
	"context"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
)

// TxMock is a mock implementation of pgx.Tx.
// Note this mock was created manually and not generated using mockgen.
type TxMock struct{}

var _ pgx.Tx = (*TxMock)(nil)

// Begin implements pgx.Tx.
func (t *TxMock) Begin(_ context.Context) (pgx.Tx, error) {
	panic("unimplemented")
}

// Commit implements pgx.Tx.
func (t *TxMock) Commit(_ context.Context) error {
	return nil
}

// Conn implements pgx.Tx.
func (t *TxMock) Conn() *pgx.Conn {
	panic("unimplemented")
}

// CopyFrom implements pgx.Tx.
func (t *TxMock) CopyFrom(_ context.Context, _ pgx.Identifier, _ []string, _ pgx.CopyFromSource) (int64, error) {
	panic("unimplemented")
}

// Exec implements pgx.Tx.
func (t *TxMock) Exec(_ context.Context, _ string, _ ...any) (_ pgconn.CommandTag, _ error) {
	panic("unimplemented")
}

// LargeObjects implements pgx.Tx.
func (t *TxMock) LargeObjects() pgx.LargeObjects {
	panic("unimplemented")
}

// Prepare implements pgx.Tx.
func (t *TxMock) Prepare(_ context.Context, _ string, _ string) (*pgconn.StatementDescription, error) {
	panic("unimplemented")
}

// Query implements pgx.Tx.
func (t *TxMock) Query(_ context.Context, _ string, _ ...any) (pgx.Rows, error) {
	panic("unimplemented")
}

// QueryRow implements pgx.Tx.
func (t *TxMock) QueryRow(_ context.Context, _ string, _ ...any) pgx.Row {
	panic("unimplemented")
}

// Rollback implements pgx.Tx.
func (t *TxMock) Rollback(_ context.Context) error {
	return nil
}

// SendBatch implements pgx.Tx.
func (t *TxMock) SendBatch(_ context.Context, _ *pgx.Batch) pgx.BatchResults {
	panic("unimplemented")
}
