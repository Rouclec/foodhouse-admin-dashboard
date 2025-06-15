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

func derefString(s *string) string {
	if s != nil {
		return *s
	}
	return ""
}

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
		var status usersgrpc.UserStatus

		switch sf.UserStatus {
		case usersgrpc.UserStatus_UserStatus_ACTIVE.String():
			status = usersgrpc.UserStatus_UserStatus_ACTIVE
		case usersgrpc.UserStatus_UserStatus_SUSPENDED.String():
			status = usersgrpc.UserStatus_UserStatus_SUSPENDED
		default:
			status = usersgrpc.UserStatus_UserStatus_UNSPECIFIED
		}

		protoFarmers[i] = &usersgrpc.FarmerWithRating{
			User: &usersgrpc.User{
				UserId:       sf.ID,
				FirstName:    derefString(sf.FirstName),
				LastName:     derefString(sf.LastName),
				ProfileImage: derefString(&sf.ProfileImage),
				Address:      derefString(sf.Address),
				CreatedAt:    timestamppb.New(sf.CreatedAt.Time),
				Status:       status,
			},
			Rating: sf.AverageRating,
		}
	}

	return protoFarmers, nil
}

func SqlcToProtoUsers(sqlcUsers []sqlc.User) ([]*usersgrpc.User, error) {
	protoUsers := make([]*usersgrpc.User, 0, len(sqlcUsers))

	for _, su := range sqlcUsers {
		var status usersgrpc.UserStatus

		switch su.UserStatus {
		case usersgrpc.UserStatus_UserStatus_ACTIVE.String():
			status = usersgrpc.UserStatus_UserStatus_ACTIVE
		case usersgrpc.UserStatus_UserStatus_SUSPENDED.String():
			status = usersgrpc.UserStatus_UserStatus_SUSPENDED
		default:
			status = usersgrpc.UserStatus_UserStatus_UNSPECIFIED
		}

		protoUsers = append(protoUsers,
			&usersgrpc.User{
				UserId:       su.ID,
				FirstName:    derefString(su.FirstName),
				LastName:     derefString(su.LastName),
				ProfileImage: derefString(&su.ProfileImage),
				Address:      derefString(su.Address),
				CreatedAt:    timestamppb.New(su.CreatedAt.Time),
				Status:       status,
			})
	}

	return protoUsers, nil
}
