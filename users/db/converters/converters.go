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
		totalDays := int64(sc.Duration.Months)*30 +
			int64(sc.Duration.Days) +
			sc.Duration.Microseconds/(24*60*60*OneMillion)

		protoSubscriptions[i] = &usersgrpc.Subscription{
			Id:          sc.ID,
			Title:       sc.Title,
			Description: sc.Description,
			Amount: &types.Amount{
				Value:           sc.Amount,
				CurrencyIsoCode: sc.CurrencyIsoCode,
			},
			Duration: totalDays,
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
				Email:        derefString(sf.Email),
				PhoneNumber:  derefString(&sf.PhoneNumber),
				CreatedAt:    timestamppb.New(sf.CreatedAt.Time),
				Status:       status,
			},
			Rating: sf.AverageRating,
		}
	}

	return protoFarmers, nil
}

func SqlcToProtoUser(sqlcUser sqlc.User) *usersgrpc.User {
	var status usersgrpc.UserStatus

	var role usersgrpc.UserRole
	switch sqlcUser.Role {
	case usersgrpc.UserRole_USER_ROLE_ADMIN.String():
		role = usersgrpc.UserRole_USER_ROLE_ADMIN
	case usersgrpc.UserRole_USER_ROLE_AGENT.String():
		role = usersgrpc.UserRole_USER_ROLE_AGENT
	case usersgrpc.UserRole_USER_ROLE_FARMER.String():
		role = usersgrpc.UserRole_USER_ROLE_FARMER
	case usersgrpc.UserRole_USER_ROLE_MARKETING_AGENT.String():
		role = usersgrpc.UserRole_USER_ROLE_MARKETING_AGENT
	case usersgrpc.UserRole_USER_ROLE_BUYER.String():
		role = usersgrpc.UserRole_USER_ROLE_BUYER
	default:
		role = usersgrpc.UserRole_USER_ROLE_UNSPECIFIED
	}

	switch sqlcUser.UserStatus {
	case usersgrpc.UserStatus_UserStatus_ACTIVE.String():
		status = usersgrpc.UserStatus_UserStatus_ACTIVE
	case usersgrpc.UserStatus_UserStatus_SUSPENDED.String():
		status = usersgrpc.UserStatus_UserStatus_SUSPENDED
	default:
		status = usersgrpc.UserStatus_UserStatus_UNSPECIFIED
	}

	return &usersgrpc.User{
		UserId:       sqlcUser.ID,
		FirstName:    derefString(sqlcUser.FirstName),
		LastName:     derefString(sqlcUser.LastName),
		ProfileImage: derefString(&sqlcUser.ProfileImage),
		Address:      derefString(sqlcUser.Address),
		CreatedAt:    timestamppb.New(sqlcUser.CreatedAt.Time),
		Email:        derefString(sqlcUser.Email),
		PhoneNumber:  derefString(&sqlcUser.PhoneNumber),
		Status:       status,
		ReferralCode: sqlcUser.ReferralCode,
		Role:         role,
		LocationCoordinates: &types.Point{
			Lon:     sqlcUser.LocationCoordinates.P.X,
			Lat:     sqlcUser.LocationCoordinates.P.Y,
			Address: derefString(sqlcUser.Address),
		},
		ResidenceCountryIsoCode: sqlcUser.ResidenceCountryIsoCode,
	}
}
func SqlcToProtoUsers(sqlcUsers []sqlc.User) ([]*usersgrpc.User, error) {
	protoUsers := make([]*usersgrpc.User, 0, len(sqlcUsers))

	for _, su := range sqlcUsers {
		protoUsers = append(protoUsers, SqlcToProtoUser(su))
	}

	return protoUsers, nil
}
