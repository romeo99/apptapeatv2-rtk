export interface Restaurant {
  id: string;
  name: string;
  description: string;
  address: string;
  phone: string;
  email: string;
  logo: string;
  coverImage: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  image: string;
  icon: string;
  hidden?: boolean;
  order: number;
}
export interface MenuOptions {
  drink?: string;
  side?: string;
  sauces?: string[];
}

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  restaurantId: string;
  restaurantName: string;
  description?: string;
  originalPrice?: number | null;
  excludedIngredients?: string[] | null;
  menuOptions?: MenuOptions | null;
  isCombo?: boolean | null;
  remarks?: string | null;
  promotionLabel?: string | null;
  promotionType?: string | null;
  sections?: Array<{
    name: string;
    choice: string;
    included: boolean;
  }>;
}
export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  categoryId: string;
  status: 'available' | 'out_of_stock' | 'hidden';
}
