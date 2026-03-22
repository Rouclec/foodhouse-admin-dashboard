export interface AgentOrder {
  id: string;
  orderNumber: number;
  status: 'available' | 'assigned' | 'picked_up' | 'delivered';
  pickupAddress: string;
  pickupLocation: { lat: number; lng: number };
  deliveryAddress: string;
  deliveryLocation: { lat: number; lng: number };
  securityCode: string;
  totalAmount: number;
  deliveryFee: number;
  customerName: string;
  customerPhone: string;
  farmerName: string;
  farmerPhone: string;
  distance: number;
  items: string[];
}

export const mockOrders: AgentOrder[] = [
  {
    id: '1',
    orderNumber: 12345,
    status: 'available',
    pickupAddress: '123 Farm Road, Akwa, Douala',
    pickupLocation: { lat: 4.0511, lng: 9.7679 },
    deliveryAddress: '456 Customer Street, Bonamoussadi, Douala',
    deliveryLocation: { lat: 4.0611, lng: 9.7779 },
    securityCode: '5839',
    totalAmount: 15000,
    deliveryFee: 2500,
    customerName: 'John Customer',
    customerPhone: '+237 612 345 678',
    farmerName: 'Jane Farmer',
    farmerPhone: '+237 655 123 456',
    distance: 2.3,
    items: ['Tomatoes (5kg)', 'Onions (2kg)', 'Peppers (1kg)'],
  },
  {
    id: '2',
    orderNumber: 12346,
    status: 'available',
    pickupAddress: '789 Village Lane, Bonaberi, Douala',
    pickupLocation: { lat: 4.0550, lng: 9.7600 },
    deliveryAddress: '321 Main Avenue, Makepe, Douala',
    deliveryLocation: { lat: 4.0700, lng: 9.7850 },
    securityCode: '2947',
    totalAmount: 22000,
    deliveryFee: 3000,
    customerName: 'Mary Client',
    customerPhone: '+237 677 890 123',
    farmerName: 'Bob Farmer',
    farmerPhone: '+237 699 456 789',
    distance: 4.5,
    items: ['Fresh Maize (10kg)', 'Cassava (5kg)'],
  },
  {
    id: '3',
    orderNumber: 12347,
    status: 'available',
    pickupAddress: '456 Market Square, Douala Grand Mall',
    pickupLocation: { lat: 4.0600, lng: 9.7750 },
    deliveryAddress: '789 Hills Road, Bastos, Douala',
    deliveryLocation: { lat: 4.0750, lng: 9.7900 },
    securityCode: '1056',
    totalAmount: 8500,
    deliveryFee: 2000,
    customerName: 'Paul Client',
    customerPhone: '+237 688 234 567',
    farmerName: 'Alice Farmer',
    farmerPhone: '+237 600 789 012',
    distance: 3.8,
    items: ['Plantains (8kg)', 'Green Bananas (3kg)'],
  },
  {
    id: '4',
    orderNumber: 12348,
    status: 'available',
    pickupAddress: '321 Green Farm, Bonamouri, Douala',
    pickupLocation: { lat: 4.0480, lng: 9.7550 },
    deliveryAddress: '555 Lake View, Deido, Douala',
    deliveryLocation: { lat: 4.0650, lng: 9.7720 },
    securityCode: '7832',
    totalAmount: 18000,
    deliveryFee: 3500,
    customerName: 'Sarah Wilson',
    customerPhone: '+237 691 345 678',
    farmerName: 'David Farmer',
    farmerPhone: '+237 674 890 123',
    distance: 5.2,
    items: ['Organic Vegetables Mix', 'Fresh Herbs Bundle', 'Lettuce (4 heads)'],
  },
];

class MockDataStore {
  private orders: AgentOrder[] = [...mockOrders];
  private agentEarnings: number = 15000;
  private completedDeliveries: number = 5;
  private pendingOrders: number = 2;

  getOrders(): AgentOrder[] {
    return this.orders.filter(o => o.status === 'available');
  }

  getAcceptedOrders(): AgentOrder[] {
    return this.orders.filter(o => o.status !== 'available');
  }

  getOrderById(id: string): AgentOrder | undefined {
    return this.orders.find(o => o.id === id);
  }

  acceptOrder(orderId: string): AgentOrder | undefined {
    const order = this.orders.find(o => o.id === orderId);
    if (order) {
      order.status = 'assigned';
    }
    return order;
  }

  confirmPickup(orderId: string): AgentOrder | undefined {
    const order = this.orders.find(o => o.id === orderId);
    if (order && order.status === 'assigned') {
      order.status = 'picked_up';
    }
    return order;
  }

  confirmDelivery(orderId: string): AgentOrder | undefined {
    const order = this.orders.find(o => o.id === orderId);
    if (order && order.status === 'picked_up') {
      order.status = 'delivered';
      this.agentEarnings += order.deliveryFee;
      this.completedDeliveries += 1;
    }
    return order;
  }

  getStats() {
    return {
      totalEarnings: this.agentEarnings,
      completedDeliveries: this.completedDeliveries,
      pendingOrders: this.pendingOrders,
    };
  }

  resetAll() {
    this.orders = [...mockOrders];
    this.agentEarnings = 15000;
    this.completedDeliveries = 5;
    this.pendingOrders = 2;
  }
}

export const mockDataStore = new MockDataStore();
