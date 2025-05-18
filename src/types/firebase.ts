export interface MenuItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  image?: string;
  categoryId: string;
  status?: 'available' | 'out_of_stock' | 'hidden';
  isCombo?: boolean;
  mainProductId?: string;
  sections?: ComboSection[];
  ingredients?: string[];
  allergens?: string[];
  tags?: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface SavedComboSection {
  id: string;
  label: string;
  name: string;
  required: boolean;
  maxChoices?: number;
  icon?: string;
  image?: string;
  items: Array<{
    id: string;
    name: string;
    price: number;
    image?: string;
    included: boolean;
  }>;
  createdAt: Date;
  updatedAt?: Date;
}

export interface ComboSection {
  id: string;
  name: string;
  required: boolean;
  maxChoices?: number;
  icon?: string;
  image?: string;
  items: Array<{
    id: string;
    name: string;
    price: number;
    image?: string;
    included: boolean;
  }>;
}

export interface Order {
  id: string;
  orderNumber: string;
  restaurantId: string;
  table?: string;
  type: 'delivery' | 'takeaway' | 'dine_in';
  status: 'pending' | 'confirmed' | 'preparing' | 'completed' | 'cancelled' | 'ready' | 'scheduled';
  deliveryStatus?: 'pending' | 'delivering' | 'delivered' | 'cancelled';
  items: OrderItem[];
  subtotal: number;
  tax: number;
  total: number;
  deliveryFee?: number;
  driverId?: string | null;
  delivery?: {
    address: string;
    deliveryAddress: string;
    additionalInfo?: string;
    phone?: string;
    name?: string;
  };
  message?: string;
  customerName?: string;
  createdAt: Date;
  updatedAt: Date;
  paymentStatus: string;
  paymentMethod: string;
  scheduledTime: string | null;
  userId: string | null;
}

export interface InventoryItem {
  id: string;
  name: string;
  image?: string;
  quantity: number;
  unit: string;
  optimalStock: number;
  category: string;
  price: number;
  restaurantId: string;
  lastUpdated: Date;
  createdAt: Date;
  updatedAt: Date;
  linkedItems?: Array<{
    menuItemId: string;
    menuItemName: string;
    quantityPerItem: number;
  }>;
}

export interface RestaurantTheme {
  primaryColor: string;
}

export interface Promotion {
  id: string;
  name: string;
  description?: string;
  hidden?: boolean;
  image?: string;
  icon?: string;
  type?: string;
  order: number;
}

export interface MenuOptions {
  drink?: string;
  side?: string;
  sauces?: string[];
}

export interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  remarks?: string | null;
  excludedIngredients?: string[] | null;
  menuOptions?: MenuOptions | null;
  sections?: Array<{
    name: string;
    choice: string;
    included: boolean;
  }>;
}

export interface Restaurant {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  logo?: string;
  coverImage?: string;
  isOpen: boolean;
  rating?: number;
  reviewCount?: number;
  location?: {
    lat: number;
    lng: number;
  };
  stripeAccountId?: string;
  instagramUrl?: string;
  googleUrl?: string;
  createdAt: Date;
  updatedAt: Date;
  totalRevenue?: number;
  driverFee?: number;
  deliveryFee?: number;
  orderCount?: number;
  paymentMethods: string[];
  serviceOptions: string[];
  averagePreparationTime: number;
  openingHours: {
    [key: string]: {
      closed: boolean;
      open: string;
      close: string;
    };
  };
  autoPrint?: boolean;
}