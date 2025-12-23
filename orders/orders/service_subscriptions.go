package orders

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"strconv"
	"time"

	"github.com/jackc/pgx/v5/pgtype"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
	"google.golang.org/protobuf/types/known/timestamppb"

	"github.com/foodhouse/foodhouseapp/grpc/go/ordersgrpc"
	"github.com/foodhouse/foodhouseapp/grpc/go/productsgrpc"
	"github.com/foodhouse/foodhouseapp/grpc/go/types"
	"github.com/foodhouse/foodhouseapp/orders/db/converters"
	"github.com/foodhouse/foodhouseapp/orders/db/sqlc"
)

// convertListOrdersDueSoonRowToProto converts ListOrdersDueSoonRow to Order proto
func convertListOrdersDueSoonRowToProto(order sqlc.ListOrdersDueSoonRow) *ordersgrpc.Order {
	var price *types.Amount
	if order.PriceValue != nil && order.PriceCurrency != nil {
		price = &types.Amount{
			Value:           *order.PriceValue,
			CurrencyIsoCode: *order.PriceCurrency,
		}
	}

	statusEnum := ordersgrpc.OrderStatus_OrderStatus_UNSPECIFIED
	switch order.Status {
	case ordersgrpc.OrderStatus_OrderStatus_CREATED.String():
		statusEnum = ordersgrpc.OrderStatus_OrderStatus_CREATED
	case ordersgrpc.OrderStatus_OrderStatus_PAYMENT_SUCCESSFUL.String():
		statusEnum = ordersgrpc.OrderStatus_OrderStatus_PAYMENT_SUCCESSFUL
	case ordersgrpc.OrderStatus_OrderStatus_PAYMENT_FAILED.String():
		statusEnum = ordersgrpc.OrderStatus_OrderStatus_PAYMENT_FAILED
	case ordersgrpc.OrderStatus_OrderStatus_IN_TRANSIT.String():
		statusEnum = ordersgrpc.OrderStatus_OrderStatus_IN_TRANSIT
	case ordersgrpc.OrderStatus_OrderStatus_DELIVERED.String():
		statusEnum = ordersgrpc.OrderStatus_OrderStatus_DELIVERED
	case ordersgrpc.OrderStatus_OrderStatus_APPROVED.String():
		statusEnum = ordersgrpc.OrderStatus_OrderStatus_APPROVED
	case ordersgrpc.OrderStatus_OrderStatus_REJECTED.String():
		statusEnum = ordersgrpc.OrderStatus_OrderStatus_REJECTED
	}

	var previewItems []*ordersgrpc.OrderItem
	if order.PreviewProduct != "" {
		previewItems = []*ordersgrpc.OrderItem{
			{
				ProductId: order.PreviewProduct,
				Quantity:  int64(order.PreviewQuantity),
			},
		}
	}

	derefString := func(s *string) string {
		if s != nil {
			return *s
		}
		return ""
	}

	derefFloat := func(f *float64) float64 {
		if f != nil {
			return *f
		}
		return 0.0
	}

	result := &ordersgrpc.Order{
		OrderNumber: fmt.Sprintf("%d", order.OrderNumber),
		SumTotal:    price,
		Status:      statusEnum,
		TotalItems:  order.TotalItems,
		OrderItems:  previewItems,
		DeliveryLocation: &types.Point{
			Address: order.DeliveryAddress,
			Lat:     order.DeliveryLocation.P.Y,
			Lon:     order.DeliveryLocation.P.X,
		},
		CreatedBy:         derefString(order.CreatedBy),
		ProductOwner:      derefString(order.ProductOwner),
		PayoutPhoneNumber: derefString(order.PayoutPhoneNumber),
		DispatchedBy:      derefString(order.DispatchedBy),
		SecretKey:         derefString(order.SecretKey),
		DeliveryFee: &types.Amount{
			Value:           derefFloat(order.DeliveryFeeAmount),
			CurrencyIsoCode: derefString(order.DeliveryFeeCurrency),
		},
	}

	if order.CreatedAt.Valid {
		result.CreatedAt = timestamppb.New(order.CreatedAt.Time)
	}
	if order.UpdatedAt.Valid {
		result.UpdatedAt = timestamppb.New(order.UpdatedAt.Time)
	}
	if order.ExpectedDeliveryDate.Valid {
		result.ExpectedDeliveryDate = timestamppb.New(order.ExpectedDeliveryDate.Time)
	}
	if order.Rating.Valid {
		result.Rating = int32(order.Rating.Int.Int64())
	}
	if order.Review != "" {
		result.Review = order.Review
	}

	return result
}

// ListUserSubscriptions implements ordersgrpc.OrdersServer.
func (i *Impl) ListUserSubscriptions(
	ctx context.Context,
	req *ordersgrpc.ListUserSubscriptionsRequest) (
	*ordersgrpc.ListUserSubscriptionsResponse, error) {

	subscriptions, err := i.repo.Do().ListUserSubscriptionsByUserID(ctx, req.GetUserId())
	if err != nil {
		return nil, status.Errorf(codes.Internal, "error listing user subscriptions: %v", err)
	}

	// Filter by active if requested
	result := make([]*ordersgrpc.UserSubscription, 0, len(subscriptions))
	for _, sub := range subscriptions {
		if req.ActiveOnly != nil && *req.ActiveOnly && !sub.Active {
			continue
		}
		result = append(result, converters.SqlcUserSubscriptionToProto(sub))
	}

	return &ordersgrpc.ListUserSubscriptionsResponse{
		Subscriptions: result,
	}, nil
}

// GetUserSubscriptionDetails implements ordersgrpc.OrdersServer.
func (i *Impl) GetUserSubscriptionDetails(
	ctx context.Context,
	req *ordersgrpc.GetUserSubscriptionDetailsRequest) (
	*ordersgrpc.GetUserSubscriptionDetailsResponse, error) {

	subscriptionIDInt, err := strconv.ParseInt(req.GetSubscriptionId(), 10, 64)
	if err != nil {
		return nil, status.Errorf(codes.InvalidArgument, "invalid subscription id: %v", err)
	}

	subscription, err := i.repo.Do().GetUserSubscriptionByID(ctx, subscriptionIDInt)
	if err != nil {
		return nil, status.Errorf(codes.NotFound, "subscription not found: %v", err)
	}

	// Verify user owns this subscription
	if subscription.UserID != req.GetUserId() {
		return nil, status.Errorf(codes.PermissionDenied, "user does not own this subscription")
	}

	// Get orders for this subscription
	orders, err := i.repo.Do().ListUserOrders(ctx, sqlc.ListUserOrdersParams{
		CreatedBy:        &req.UserId,
		IncludedStatuses: []string{}, // Get all orders
		CreatedBefore:    time.Time{},
		SearchKey:        "",
		Count:            1000, // Large limit to get all orders
	})
	if err != nil {
		return nil, status.Errorf(codes.Internal, "error listing orders: %v", err)
	}

	// Filter orders that belong to this subscription
	subscriptionOrders := make([]*ordersgrpc.Order, 0)
	for _, order := range orders {
		if order.UserSubscriptionID != nil && *order.UserSubscriptionID == subscription.ID {
			subscriptionOrders = append(subscriptionOrders, converters.SqlcUserOrderRowToProto(order))
		}
	}

	return &ordersgrpc.GetUserSubscriptionDetailsResponse{
		Subscription: converters.SqlcUserSubscriptionToProto(subscription),
		Orders:       subscriptionOrders,
	}, nil
}

// ListOrdersDueSoon implements ordersgrpc.OrdersServer.
func (i *Impl) ListOrdersDueSoon(
	ctx context.Context,
	req *ordersgrpc.ListOrdersDueSoonRequest) (
	*ordersgrpc.ListOrdersDueSoonResponse, error) {

	orders, err := i.repo.Do().ListOrdersDueSoon(ctx, int32(req.GetDays()))
	if err != nil {
		return nil, status.Errorf(codes.Internal, "error listing orders due soon: %v", err)
	}

	result := make([]*ordersgrpc.Order, 0, len(orders))
	for _, orderRow := range orders {
		// Convert ListOrdersDueSoonRow to Order (helper function defined above)
		result = append(result, convertListOrdersDueSoonRowToProto(orderRow))
	}

	return &ordersgrpc.ListOrdersDueSoonResponse{
		Orders: result,
	}, nil
}

// CreateCustomSubscription implements ordersgrpc.OrdersServer.
func (i *Impl) CreateCustomSubscription(
	ctx context.Context,
	req *ordersgrpc.CreateCustomSubscriptionRequest) (
	*ordersgrpc.CreateCustomSubscriptionResponse, error) {

	querier, tx, err := i.repo.Begin(ctx)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to begin transaction: %v", err)
	}

	defer func() {
		err = tx.Rollback(ctx)
		if err != nil && !errors.Is(err, sql.ErrTxDone) {
			i.logger.Err(err).Msgf("Failed to rollback transaction: %v", req)
		}
	}()

	// Calculate total amount from items and validate all products are from same farmer
	var totalAmount float64
	var farmerID string

	for _, item := range req.GetSubscriptionItems() {
		prod, err := i.productService.GetProduct(ctx, &productsgrpc.GetProductRequest{
			ProductId: item.GetProductId(),
		})
		if err != nil {
			return nil, status.Errorf(codes.Internal, "error fetching product %v: %v", item.GetProductId(), err)
		}

		p := prod.GetProduct()
		if farmerID == "" {
			farmerID = p.GetCreatedBy()
		} else if p.GetCreatedBy() != farmerID {
			return nil, status.Error(codes.InvalidArgument,
				"All products in custom subscription must be from the same farmer")
		}

		totalAmount += p.Amount.Value * float64(item.GetQuantity()) * TotalPercentage
	}

	// Calculate estimated delivery time based on budget and daily limit
	// Number of intervals = total amount / daily limit
	budgetInCents := int64(req.GetBudget().GetValue() * 100)
	dailyLimit := req.GetDailyDeliveryLimit()
	if dailyLimit <= 0 {
		return nil, status.Error(codes.InvalidArgument, "daily delivery limit must be positive")
	}

	numberOfIntervals := (budgetInCents + dailyLimit - 1) / dailyLimit // Ceiling division
	if numberOfIntervals <= 0 {
		numberOfIntervals = 1
	}

	// Estimate delivery time: assume 3 days between intervals
	estimatedDays := numberOfIntervals * 3

	// Create user subscription (custom subscription, no subscription_id references a plan)
	subscription, err := querier.CreateUserSubscription(ctx, sqlc.CreateUserSubscriptionParams{
		UserID:          req.GetUserId(),
		SubscriptionID:  "",    // Empty for custom subscriptions
		Active:          false, // Will be activated after payment
		Amount:          int64(req.GetBudget().GetValue()),
		CurrencyIsoCode: req.GetBudget().GetCurrencyIsoCode(),
		EstimatedDeliveryTime: pgtype.Interval{
			Microseconds: int64(estimatedDays) * 24 * 60 * 60 * OneMillion,
			Days:         int32(estimatedDays % 30),
			Months:       int32(estimatedDays / 30),
			Valid:        true,
		},
		IsCustom:           true,
		DailyDeliveryLimit: &dailyLimit,
	})
	if err != nil {
		return nil, status.Errorf(codes.Internal, "error creating custom subscription: %v", err)
	}

	// Store subscription items in a temporary table or handle them differently
	// For now, we'll create subscription items with an empty subscription_id
	// This is a simplification - you might want a different approach for custom subscriptions
	// TODO: Consider creating a separate table for custom subscription items

	err = tx.Commit(ctx)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to commit transaction: %v", err)
	}

	return &ordersgrpc.CreateCustomSubscriptionResponse{
		Subscription: converters.SqlcUserSubscriptionToProto(subscription),
	}, nil
}

// UpdateSubscriptionPlan implements ordersgrpc.OrdersServer.
func (i *Impl) UpdateSubscriptionPlan(
	ctx context.Context,
	req *ordersgrpc.UpdateSubscriptionPlanRequest) (
	*ordersgrpc.UpdateSubscriptionPlanResponse, error) {

	querier, tx, err := i.repo.Begin(ctx)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to begin transaction: %v", err)
	}
	defer func() {
		err := tx.Rollback(ctx)
		if err != nil && !errors.Is(err, sql.ErrTxDone) {
			i.logger.Err(err).Msgf("Failed to rollback transaction")
		}
	}()

	// Get existing subscription
	existing, err := querier.GetSubscriptionByID(ctx, req.GetSubscriptionPlanId())
	if err != nil {
		return nil, status.Errorf(codes.NotFound, "subscription plan not found: %v", err)
	}

	// Prepare update parameters - use existing values if not provided
	var title *string
	if req.Title != nil {
		titleStr := *req.Title
		title = &titleStr
	}

	description := existing.Description
	if req.Description != nil {
		description = *req.Description
	}

	duration := existing.Duration
	if req.Duration != nil {
		duration = pgtype.Interval{
			Microseconds: *req.Duration * 7 * 24 * 60 * 60 * converters.OneMillion,
			Valid:        true,
		}
	}

	var amount *int64
	if req.Amount != nil {
		amountVal := int64(req.Amount.GetValue())
		amount = &amountVal
	}

	var currencyIsoCode *string
	if req.Amount != nil {
		currStr := req.Amount.GetCurrencyIsoCode()
		currencyIsoCode = &currStr
	}

	estimatedDeliveryTime := existing.EstimatedDeliveryTime
	if req.EstimatedDeliveryTimeDays != nil && *req.EstimatedDeliveryTimeDays > 0 {
		estimatedDeliveryTime = pgtype.Interval{
			Days:  int32(*req.EstimatedDeliveryTimeDays),
			Valid: true,
		}
	}

	// Update subscription
	updated, err := querier.UpdateSubscription(ctx, sqlc.UpdateSubscriptionParams{
		Title:                 title,
		Description:           description,
		Duration:              duration,
		Amount:                amount,
		CurrencyIsoCode:       currencyIsoCode,
		EstimatedDeliveryTime: estimatedDeliveryTime,
		ID:                    req.GetSubscriptionPlanId(),
	})
	if err != nil {
		return nil, status.Errorf(codes.Internal, "error updating subscription plan: %v", err)
	}

	// Handle subscription items if provided
	var subItems []*ordersgrpc.SubscriptionItem
	if len(req.GetSubscriptionItems()) > 0 {
		// Delete existing items
		existingItems, err := querier.GetSubscriptionItemsBySubscriptionID(ctx, req.GetSubscriptionPlanId())
		if err != nil {
			return nil, status.Errorf(codes.Internal, "error fetching existing subscription items: %v", err)
		}

		for _, item := range existingItems {
			err := querier.DeleteSubscriptionItem(ctx, item.ID)
			if err != nil {
				return nil, status.Errorf(codes.Internal, "error deleting subscription item: %v", err)
			}
		}

		// Create new items
		for _, si := range req.GetSubscriptionItems() {
			product, err := i.productService.GetProduct(ctx, &productsgrpc.GetProductRequest{ProductId: si.ProductId})
			if err != nil {
				return nil, status.Errorf(codes.Internal, "error fetching product for subscription item: %v", err)
			}

			_, err = querier.CreateSubscriptionItem(ctx, sqlc.CreateSubscriptionItemParams{
				SubscriptionID: req.GetSubscriptionPlanId(),
				Product:        si.ProductId,
				Quantity:       int32(si.Quantity),
				UnitType:       product.GetProduct().GetUnitType(),
			})
			if err != nil {
				return nil, status.Errorf(codes.Internal, "error creating subscription item: %v", err)
			}

			subItems = append(subItems, &ordersgrpc.SubscriptionItem{
				ProductId:        si.ProductId,
				ProductImage:     product.GetProduct().GetImage(),
				ProductName:      product.GetProduct().GetName(),
				ProductUnitPrice: product.GetProduct().GetAmount(),
				UnitType:         product.GetProduct().GetUnitType(),
				SubscriptionId:   req.GetSubscriptionPlanId(),
			})
		}
	} else {
		// Fetch existing items
		existingItems, err := querier.GetSubscriptionItemsBySubscriptionID(ctx, req.GetSubscriptionPlanId())
		if err != nil {
			return nil, status.Errorf(codes.Internal, "error fetching subscription items: %v", err)
		}

		for _, item := range existingItems {
			product, err := i.productService.GetProduct(ctx, &productsgrpc.GetProductRequest{ProductId: item.Product})
			if err != nil {
				return nil, status.Errorf(codes.Internal, "error fetching product: %v", err)
			}

			subItems = append(subItems, &ordersgrpc.SubscriptionItem{
				ProductId:        item.Product,
				ProductImage:     product.GetProduct().GetImage(),
				ProductName:      product.GetProduct().GetName(),
				ProductUnitPrice: product.GetProduct().GetAmount(),
				UnitType:         item.UnitType,
				SubscriptionId:   req.GetSubscriptionPlanId(),
			})
		}
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, status.Errorf(codes.Internal, "failed to commit transaction: %v", err)
	}

	return &ordersgrpc.UpdateSubscriptionPlanResponse{
		SubscriptionPlan: converters.SqlcSubscriptionToProto(updated, subItems),
	}, nil
}

// ListSubscriptionPlans implements ordersgrpc.OrdersServer.
func (i *Impl) ListSubscriptionPlans(
	ctx context.Context,
	req *ordersgrpc.ListSubscriptionPlansRequest) (
	*ordersgrpc.ListSubscriptionPlansResponse, error) {

	subscriptions, err := i.repo.Do().ListSubsriptions(ctx)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "error listing subscription plans: %v", err)
	}

	result := make([]*ordersgrpc.Subscription, 0, len(subscriptions))
	for _, sub := range subscriptions {
		// Fetch subscription items
		items, err := i.repo.Do().GetSubscriptionItemsBySubscriptionID(ctx, sub.ID)
		if err != nil {
			i.logger.Err(err).Msgf("error fetching subscription items for %s", sub.ID)
			continue
		}

		subItems := make([]*ordersgrpc.SubscriptionItem, 0, len(items))
		for _, item := range items {
			product, err := i.productService.GetProduct(ctx, &productsgrpc.GetProductRequest{ProductId: item.Product})
			if err != nil {
				i.logger.Err(err).Msgf("error fetching product %s for subscription item", item.Product)
				continue
			}

			subItems = append(subItems, &ordersgrpc.SubscriptionItem{
				ProductId:        item.Product,
				ProductImage:     product.GetProduct().GetImage(),
				ProductName:      product.GetProduct().GetName(),
				ProductUnitPrice: product.GetProduct().GetAmount(),
				UnitType:         item.UnitType,
				SubscriptionId:   sub.ID,
			})
		}

		result = append(result, converters.SqlcSubscriptionToProto(sub, subItems))
	}

	return &ordersgrpc.ListSubscriptionPlansResponse{
		SubscriptionPlans: result,
	}, nil
}
