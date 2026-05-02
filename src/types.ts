export interface Product {
  id: string;
  nameEn: string;
  nameZh: string;
  price: number;
  stock: number;
  image: string;
  description: string;
  order: number;
}

export interface Customer {
  name: string;
  ig: string;
  phone: string;
  delivery: 'Self Pickup' | 'Lalamove Delivery';
}

export interface Greeting {
  type: string;
  message: string;
}

export interface Customization {
  artImage: string;
  isKpop: boolean;
}

export type OrderStatus = 'pending_payment' | 'awaiting_verification' | 'completed' | 'cancelled';

export interface Order {
  id?: string;
  customer: Customer;
  cart: Record<string, number>;
  greeting: Greeting;
  customization: Customization;
  tip: number;
  totals: {
    final: number;
    count: number;
  };
  status: OrderStatus;
  createdAt: any;
  completedAt?: any;
  paymentProof?: string;
  uid: string;
}

export interface ShopConfig {
  products: Product[];
  qrCodes: {
    duitNow: string;
    tng: string;
  };
  pickupDate: string;
  pickupLocation: string;
}
