import { Order, OrderItem } from "./firebase";

export interface FoodCourt {
  id: string;
  name: string;
  description: string;
  location: {
    lat: number;
    lng: number;
    address: string;
  };
  logo?: string;
  coverImage?: string;
  qrCode?: string;
  status: 'active' | 'inactive';
  openingHours: {
    [key: string]: {
      open: string;
      close: string;
      closed: boolean;
    };
  };
  paymentMethods: string[];
  deliveryZone?: {
    radius: number;
    center: {
      lat: number;
      lng: number;
    };
  };
  serviceFee: number;
  restaurants: FoodCourtRestaurant[];
  categories: FoodCourtCategory[];
  createdAt: Date;
  updatedAt: Date;
}

export interface FoodCourtRestaurant {
  id: string;
  restaurantId: string;
  categoryId: string;
  order: number;
  status: 'active' | 'inactive';
}

export interface FoodCourtCategory {
  id: string;
  name: string;
  icon: string;
  order: number;
}

export interface FoodCourtOrder extends Order {
  foodCourtId: string;
  restaurantOrders: {
    restaurantId: string;
    items: OrderItem[];
    subtotal: number;
    tax: number;
    total: number;
  }[];
  serviceFee: number;
}