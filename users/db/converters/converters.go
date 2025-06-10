package converters

import (
	"github.com/foodhouse/foodhouseapp/grpc/go/types"
	"github.com/foodhouse/foodhouseapp/grpc/go/usersgrpc"
	"github.com/foodhouse/foodhouseapp/users/db/sqlc"
	"google.golang.org/protobuf/types/known/timestamppb"
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

func SqlcToProtoReviews(sqlcReviews []sqlc.FarmersReview) ([]*usersgrpc.Review, error) {
	protoReviews := make([]*usersgrpc.Review, len(sqlcReviews))

	for i, sr := range sqlcReviews {
		protoReviews[i] = &usersgrpc.Review{
			FarmerId:  sr.FarmerID,
			ProductId: sr.ProductID,
			Rating:    sr.Rating,
			Comment:   sr.Comment,
			CreatedBy: *sr.CreatedBy,
			OrderId:   sr.OrderID,
			CreatedAt: timestamppb.New(sr.CreatedAt.Time),
		}
	}

	return protoReviews, nil
}

func SqlcToProtoFarmers(sqlcFarmers []sqlc.ListFarmersByRatingRow) ([]*usersgrpc.FarmerWithRating, error) {
	protoFarmers := make([]*usersgrpc.FarmerWithRating, len(sqlcFarmers))

	for i, sf := range sqlcFarmers {
		protoFarmers[i] = &usersgrpc.FarmerWithRating{
			User: &usersgrpc.User{
				FirstName:    *sf.FirstName,
				LastName:     *sf.LastName,
				ProfileImage: sf.ProfileImage,
				CreatedAt:    timestamppb.New(sf.CreatedAt.Time),
			},
			Rating: sf.AverageRating,
		}
	}

	return protoFarmers, nil
}
