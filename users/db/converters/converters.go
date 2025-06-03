package converters

import (
	"github.com/foodhouse/foodhouseapp/grpc/go/types"
	"github.com/foodhouse/foodhouseapp/grpc/go/usersgrpc"
	"github.com/foodhouse/foodhouseapp/users/db/sqlc"
)

const (
	OneMillion = 1000000
)

func SqlcToProtoSubscriptions(sqlcSubscriptions []sqlc.Subscription) ([]*usersgrpc.Subscription, error) {
	protoSubscriptions := make([]*usersgrpc.Subscription, len(sqlcSubscriptions))

	for i, sc := range sqlcSubscriptions {
		protoSubscriptions[i] = &usersgrpc.Subscription{
			Id:          sc.ID,
			Title:       sc.Title,
			Description: sc.Description,
			Amount: &types.Amount{
				Value:           sc.Amount,
				CurrencyIsoCode: sc.CurrencyIsoCode,
			},
			Duration: sc.Duration.Microseconds / (24 * 60 * 60 * OneMillion),
		}
	}
	return protoSubscriptions, nil
}
