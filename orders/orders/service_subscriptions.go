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

// ListAllActiveSubscriptions implements ordersgrpc.OrdersServer.
func (i *Impl) ListAllActiveSubscriptions(
	ctx context.Context,
	req *ordersgrpc.ListAllActiveSubscriptionsRequest) (
	*ordersgrpc.ListAllActiveSubscriptionsResponse, error) {

	// Filter by active status (defaults to true if not specified)
	activeOnly := true
	if req.ActiveOnly != nil {
		activeOnly = req.GetActiveOnly()
	}

	var subscriptions []sqlc.ListAllActiveUserSubscriptionsRow
	var err error

	if activeOnly {
		subscriptions, err = i.repo.Do().ListAllActiveUserSubscriptions(ctx)
		if err != nil {
			return nil, status.Errorf(codes.Internal, "error fetching active subscriptions: %v", err)
		}
	} else {
		// If not active only, get all subscriptions and convert to rows
		allSubs, err := i.repo.Do().GetAllUserSubscriptions(ctx)
		if err != nil {
			return nil, status.Errorf(codes.Internal, "error fetching subscriptions: %v", err)
		}
		// Convert UserSubscription to ListAllActiveUserSubscriptionsRow (without soonest date)
		subscriptions = make([]sqlc.ListAllActiveUserSubscriptionsRow, 0, len(allSubs))
		for _, sub := range allSubs {
			subscriptions = append(subscriptions, sqlc.ListAllActiveUserSubscriptionsRow{
				ID:                    sub.ID,
				PublicID:              sub.PublicID,
				UserID:                sub.UserID,
				SubscriptionID:        sub.SubscriptionID,
				Active:                sub.Active,
				CreatedAt:             sub.CreatedAt,
				UpdatedAt:             sub.UpdatedAt,
				ExpiresAt:             sub.ExpiresAt,
				Progress:              sub.Progress,
				Amount:                sub.Amount,
				CurrencyIsoCode:       sub.CurrencyIsoCode,
				EstimatedDeliveryTime: sub.EstimatedDeliveryTime,
				IsCustom:              sub.IsCustom,
				DailyDeliveryLimit:    sub.DailyDeliveryLimit,
				SoonestDeliveryDate:   time.Time{}, // No soonest date for non-active filtering
			})
		}
	}

	const OneMillion = 1000000
	protoSubscriptions := make([]*ordersgrpc.UserSubscription, 0, len(subscriptions))
	for _, row := range subscriptions {
		// Convert row to UserSubscription proto
		progress := 0.0
		if row.Progress != nil {
			progress = *row.Progress
		}

		var estimatedDeliveryTimeDays *int64
		if row.EstimatedDeliveryTime.Valid {
			totalDays := int64(row.EstimatedDeliveryTime.Months)*30 +
				int64(row.EstimatedDeliveryTime.Days) +
				row.EstimatedDeliveryTime.Microseconds/(24*60*60*OneMillion)
			estimatedDeliveryTimeDays = &totalDays
		}

		result := &ordersgrpc.UserSubscription{
			Id:                 fmt.Sprintf("%d", row.ID),
			PublicId:           row.PublicID,
			UserId:             row.UserID,
			SubscriptionPlanId: row.SubscriptionID,
			Active:             row.Active,
			Progress:           progress,
			Amount: &types.Amount{
				Value:           float64(row.Amount),
				CurrencyIsoCode: row.CurrencyIsoCode,
			},
			IsCustom: row.IsCustom,
		}

		if row.CreatedAt.Valid {
			result.CreatedAt = timestamppb.New(row.CreatedAt.Time)
		}
		if row.UpdatedAt.Valid {
			result.UpdatedAt = timestamppb.New(row.UpdatedAt.Time)
		}
		if row.ExpiresAt.Valid {
			result.ExpiresAt = timestamppb.New(row.ExpiresAt.Time)
		}
		if estimatedDeliveryTimeDays != nil {
			result.EstimatedDeliveryTimeDays = estimatedDeliveryTimeDays
		}
		if row.DailyDeliveryLimit != nil {
			result.DailyDeliveryLimit = row.DailyDeliveryLimit
		}
		// Handle SoonestDeliveryDate - check if it's not zero (NULL means zero time)
		if !row.SoonestDeliveryDate.IsZero() {
			result.SoonestDeliveryDate = timestamppb.New(row.SoonestDeliveryDate)
		}

		protoSubscriptions = append(protoSubscriptions, result)
	}

	return &ordersgrpc.ListAllActiveSubscriptionsResponse{
		Subscriptions: protoSubscriptions,
	}, nil
}

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

	// Validate all products are from same farmer and fetch product info
	var farmerID string
	type itemWithProduct struct {
		item    *ordersgrpc.SubscriptionItem
		product *productsgrpc.Product
		amount  float64
	}
	itemsWithProducts := make([]itemWithProduct, 0, len(req.GetSubscriptionItems()))

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

		itemAmount := p.Amount.Value * float64(item.GetQuantity())
		itemsWithProducts = append(itemsWithProducts, itemWithProduct{
			item:    item,
			product: p,
			amount:  itemAmount,
		})
	}

	// Get max amount per order (default 50k XAF = 5000000 cents)
	maxAmountPerOrderCents := int64(5000000) // 50k XAF default
	if req.MaxAmountPerOrder != nil && *req.MaxAmountPerOrder > 0 {
		maxAmountPerOrderCents = *req.MaxAmountPerOrder
	}
	maxAmountPerOrder := float64(maxAmountPerOrderCents) / 100.0 // Convert to currency units

	// Automatically split items into orders based on max amount per order
	// Items are assigned to orders (order_index) while keeping total <= maxAmountPerOrder
	type orderGroup struct {
		orderIndex int32
		items      []itemWithProduct
		total      float64
	}
	orderGroups := []orderGroup{{orderIndex: 0, items: []itemWithProduct{}, total: 0}}

	currentGroup := &orderGroups[0]
	for _, itemWithProd := range itemsWithProducts {
		// If adding this item would exceed the limit, start a new order group
		if currentGroup.total+itemWithProd.amount > maxAmountPerOrder && len(currentGroup.items) > 0 {
			newGroup := orderGroup{
				orderIndex: int32(len(orderGroups)),
				items:      []itemWithProduct{},
				total:      0,
			}
			orderGroups = append(orderGroups, newGroup)
			currentGroup = &orderGroups[len(orderGroups)-1]
		}

		currentGroup.items = append(currentGroup.items, itemWithProd)
		currentGroup.total += itemWithProd.amount
	}

	// Validate total doesn't exceed budget
	totalAmount := float64(0)
	for _, group := range orderGroups {
		totalAmount += group.total
	}
	if totalAmount > req.GetBudget().GetValue() {
		return nil, status.Errorf(codes.InvalidArgument,
			"Total amount %f exceeds budget %f", totalAmount, req.GetBudget().GetValue())
	}

	// Calculate estimated delivery time: 3 days between orders
	numberOfOrders := len(orderGroups)
	estimatedDays := numberOfOrders * 3
	if req.EstimatedDeliveryTimeDays != nil && *req.EstimatedDeliveryTimeDays > 0 {
		estimatedDays = int(*req.EstimatedDeliveryTimeDays)
	}

	// Create user subscription (custom subscription, no subscription_id references a plan)
	subscription, err := querier.CreateUserSubscription(ctx, sqlc.CreateUserSubscriptionParams{
		UserID:          req.GetUserId(),
		SubscriptionID: fmt.Sprintf("custom-%d", time.Now().UnixNano()), // Custom ID for custom subscriptions
		Active:          false,                                                      // Will be activated after payment
		Amount:          int64(req.GetBudget().GetValue()),
		CurrencyIsoCode: req.GetBudget().GetCurrencyIsoCode(),
		EstimatedDeliveryTime: pgtype.Interval{
			Days:  int32(estimatedDays),
			Valid: true,
		},
		IsCustom: true,
		// Store max amount per order as daily delivery limit for backward compatibility
		DailyDeliveryLimit: &maxAmountPerOrderCents,
	})
	if err != nil {
		return nil, status.Errorf(codes.Internal, "error creating custom subscription: %v", err)
	}

	// Create subscription items with proper order_index
	for _, group := range orderGroups {
		for _, itemWithProd := range group.items {
			_, err = querier.CreateSubscriptionItem(ctx, sqlc.CreateSubscriptionItemParams{
				SubscriptionID: subscription.SubscriptionID, // Use the custom subscription ID
				Product:        itemWithProd.item.GetProductId(),
				Quantity:       int32(itemWithProd.item.GetQuantity()),
				UnitType:       itemWithProd.product.GetUnitType(),
				OrderIndex:     group.orderIndex,
			})
			if err != nil {
				return nil, status.Errorf(codes.Internal, "error creating subscription item: %v", err)
			}
		}
	}

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

			orderIndex := si.GetOrderIndex() // OrderIndex is now a direct int32

			_, err = querier.CreateSubscriptionItem(ctx, sqlc.CreateSubscriptionItemParams{
				SubscriptionID: req.GetSubscriptionPlanId(),
				Product:        si.ProductId,
				Quantity:       int32(si.Quantity),
				UnitType:       product.GetProduct().GetUnitType(),
				OrderIndex:     orderIndex,
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
				OrderIndex:       orderIndex,
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
				OrderIndex:       item.OrderIndex, // OrderIndex is now a direct int32
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

			orderIndex := int32(0)
			// After migration and sqlc regeneration, item.OrderIndex will be available
			// For now, default to 0

			subItems = append(subItems, &ordersgrpc.SubscriptionItem{
				ProductId:        item.Product,
				ProductImage:     product.GetProduct().GetImage(),
				ProductName:      product.GetProduct().GetName(),
				ProductUnitPrice: product.GetProduct().GetAmount(),
				UnitType:         item.UnitType,
				SubscriptionId:   sub.ID,
				OrderIndex:       orderIndex,
			})
		}

		result = append(result, converters.SqlcSubscriptionToProto(sub, subItems))
	}

	return &ordersgrpc.ListSubscriptionPlansResponse{
		SubscriptionPlans: result,
	}, nil
}
