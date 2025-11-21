export type CartItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  currency: string;
  image?: string;
  unitType?: string;
};

export type LocalOrderItem = Omit<CartItem, 'quantity'> & {
  quantity: string;
};
