import {
  ordersConfirmDelivery,
  ordersDispatchOrder,
  ordersGetOrderDetails,
  ordersListAgentAvailableOrders,
  ordersListAgentDeliveredOrders,
  ordersListAgentOngoingOrders,
  type ordersgrpcOrder,
  type ordersgrpcOrderStatus,
} from '@/client/orders.swagger';
import type { AgentOrder } from '@/data/mock-orders';

export type AgentOrdersPage = {
  orders: AgentOrder[];
  nextKey?: string;
};

function mapOrderStatus(status?: ordersgrpcOrderStatus): AgentOrder['status'] {
  switch (status) {
    case 'OrderStatus_APPROVED':
      return 'available';
    case 'OrderStatus_IN_TRANSIT':
      // backend doesn't expose a distinct "picked up" state in the mobile spec
      return 'picked_up';
    case 'OrderStatus_DELIVERED':
      return 'delivered';
    default:
      return 'available';
  }
}

export function mapBackendOrderToAgentOrder(order: ordersgrpcOrder): AgentOrder {
  const orderNumber = Number(order.orderNumber ?? 0);
  const deliveryLat = order.deliveryLocation?.lat ?? 0;
  const deliveryLng = order.deliveryLocation?.lon ?? 0;
  const deliveryAddress =
    order.deliveryLocation?.address ??
    (deliveryLat && deliveryLng ? `${deliveryLat}, ${deliveryLng}` : 'Delivery address not available');

  const totalAmount = order.sumTotal?.value ?? 0;
  const deliveryFee = order.deliveryFee?.value ?? 0;

  return {
    id: (order.orderNumber ?? '').toString() || String(orderNumber || Date.now()),
    orderNumber: Number.isFinite(orderNumber) && orderNumber > 0 ? orderNumber : 0,
    status: mapOrderStatus(order.status),
    pickupAddress: 'Pickup address not available',
    pickupLocation: { lat: deliveryLat, lng: deliveryLng },
    deliveryAddress,
    deliveryLocation: { lat: deliveryLat, lng: deliveryLng },
    securityCode: (order.secretKey ?? '').toString(),
    totalAmount,
    deliveryFee,
    customerName: 'Customer',
    customerPhone: '',
    farmerName: 'Farmer',
    farmerPhone: '',
    distance: 0,
    items: (order.orderItems ?? [])
      .map(i => {
        const name = (i.productName ?? '').trim();
        const qty = (i.quantity ?? '').toString().trim();
        const unit = (i.unitType ?? '').trim();
        const left = name || 'Item';
        const right = [qty, unit].filter(Boolean).join(' ');
        return right ? `${left} (${right})` : left;
      })
      .filter(Boolean),
  };
}

export async function listAgentAvailableOrdersPage(params: {
  userId: string;
  count?: number;
  startKey?: string;
  radiusKm?: number;
}): Promise<AgentOrdersPage> {
  const { data } = await ordersListAgentAvailableOrders({
    path: { userId: params.userId },
    query: {
      count: params.count ?? 20,
      startKey: params.startKey,
      radiusKm: params.radiusKm ?? 300,
    },
  });

  const orders = ((data?.orders ?? []) as ordersgrpcOrder[]).map(mapBackendOrderToAgentOrder);
  const nextKey = (data?.nextKey ?? '') || undefined;

  return { orders, nextKey };
}

export async function listAgentOngoingOrdersPage(params: {
  userId: string;
  count?: number;
  startKey?: string;
}): Promise<AgentOrdersPage> {
  const { data } = await ordersListAgentOngoingOrders({
    path: { userId: params.userId },
    query: {
      count: params.count ?? 20,
      startKey: params.startKey,
    },
  });

  const orders = ((data?.orders ?? []) as ordersgrpcOrder[]).map(mapBackendOrderToAgentOrder);
  const nextKey = (data?.nextKey ?? '') || undefined;

  return { orders, nextKey };
}

export async function listAgentDeliveredOrdersPage(params: {
  userId: string;
  count?: number;
  startKey?: string;
}): Promise<AgentOrdersPage> {
  const { data } = await ordersListAgentDeliveredOrders({
    path: { userId: params.userId },
    query: {
      count: params.count ?? 20,
      startKey: params.startKey,
    },
  });

  const orders = ((data?.orders ?? []) as ordersgrpcOrder[]).map(mapBackendOrderToAgentOrder);
  const nextKey = (data?.nextKey ?? '') || undefined;

  return { orders, nextKey };
}

export async function listAgentOrdersFromBackend(params: {
  userId: string;
  statuses?: ordersgrpcOrderStatus[];
  count?: number;
}): Promise<AgentOrder[]> {
  const status = params.statuses?.[0];

  const count = params.count ?? 50;

  if (status === 'OrderStatus_IN_TRANSIT') {
    const page = await listAgentOngoingOrdersPage({ userId: params.userId, count });
    return page.orders;
  }
  if (status === 'OrderStatus_DELIVERED') {
    const page = await listAgentDeliveredOrdersPage({ userId: params.userId, count });
    return page.orders;
  }

  const page = await listAgentAvailableOrdersPage({
    userId: params.userId,
    count,
    radiusKm: 300,
  });
  return page.orders;
}

export async function getAgentOrderDetailsFromBackend(params: {
  userId: string;
  orderNumber: string;
}): Promise<AgentOrder | null> {
  const { data } = await ordersGetOrderDetails({
    path: { userId: params.userId, orderNumber: params.orderNumber },
  });

  const order = (data?.order ?? null) as ordersgrpcOrder | null;
  return order ? mapBackendOrderToAgentOrder(order) : null;
}

export async function dispatchOrderToAgent(params: {
  userId: string;
  orderNumber: string;
  agentId: string;
}): Promise<void> {
  await ordersDispatchOrder({
    path: { userId: params.userId, orderNumber: params.orderNumber },
    body: { agentId: params.agentId },
  });
}

export async function confirmDeliveryWithSecretKey(params: {
  userId: string;
  secretKey: string;
  agentPayoutPhoneNumber?: string;
}): Promise<void> {
  await ordersConfirmDelivery({
    path: { userId: params.userId, secretKey: params.secretKey },
    body: {
      agentPayoutPhoneNumber: params.agentPayoutPhoneNumber,
    },
  });
}

