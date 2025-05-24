import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useUserLocation } from '../hooks/useUserLocation';
import { getActivePromotions } from '../services/promotionService';
import { calculateDistance } from '../services/restaurantService';
import { getApplicationFee } from '../services/superadminService';
import { CartItem, MenuOptions } from '../types';
import type { Promotion } from '../types/firebase';
import { useRestaurantContext } from './RestaurantContext';

interface CartContextType {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => void;
  addItems: (items: CartItem[]) => void;
  removeItem: (id: string, menuOptions?: MenuOptions) => void;
  updateQuantity: (id: string, quantity: number, menuOptions?: MenuOptions) => void;
  clearCart: () => void;
  isCartOpen: boolean;
  toggleCart: () => void;
  applicationFee: number;
  serviceFees: number;
  deliveryFees: number;
  subtotal: number;
  total: number;
  isFoodCourtOrder: boolean;
  foodCourtId?: string | null;
  scheduledTime: { date: string; time: string } | null;
  setScheduledTime: (time: { date: string; time: string } | null) => void;
  anonymousUser: string;
  fixAnonymousUser: (value: string) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const savedItems = localStorage.getItem('cart');
      return savedItems ? JSON.parse(savedItems) : [];
    } catch (error) {
      console.error('Error loading cart from localStorage:', error);
      return [];
    }
  });
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [scheduledTime, setScheduledTime] = useState<{ date: string; time: string } | null>(null);
  const loc = useLocation();
  const [foodCourtId, setFoodCourtId] = useState<string | null>(null);
  const [activePromotions, setActivePromotions] = useState<Promotion[]>([]);
  const [applicationFee, setApplicationFee] = useState<number>(0);
  const [anonymouUser, setAnonymousUser] = useState('');

  const { restaurant } = useRestaurantContext();

  // Load application fee
  useEffect(() => {
    let mounted = true;
    const fetchFee = async () => {
      if (!mounted) return;
      try {
        const fee = await getApplicationFee();
        if (mounted) {
          setApplicationFee(fee);
        }
      } catch (err) {
        if (mounted) {
          console.error('Error fetching application fee:', err);
        }
      }
    };
    fetchFee();
    return () => {
      mounted = false;
    };
  }, []);

  // Load active promotions
  useEffect(() => {
    if (!restaurant?.id) return;

    const loadPromotions = async () => {
      try {
        const promotions = await getActivePromotions(restaurant.id);
        setActivePromotions(promotions);
      } catch (err) {
        // Silently handle error - promotions are optional
        setActivePromotions([]);
      }
    };

    loadPromotions();
  }, [restaurant?.id]);

  // Initialize foodCourtId from URL or localStorage
  useEffect(() => {
    try {
      const params = new URLSearchParams(loc.search);
      const urlFoodCourtId = params.get('foodCourtId');

      if (urlFoodCourtId) {
        setFoodCourtId(urlFoodCourtId);
        localStorage.setItem('foodCourtId', urlFoodCourtId);
      } else {
        // If no foodCourtId in URL, clean up any existing data
        localStorage.removeItem('foodCourtId');
        setFoodCourtId(null);
      }
    } catch (error) {
      console.error('Error initializing food court ID:', error);
      localStorage.removeItem('foodCourtId');
      setFoodCourtId(null);
    }
  }, [loc.search]);

  // Check if this is a food court order
  const isFoodCourtOrder = useMemo(() => {
    try {
      if (!foodCourtId || items.length === 0) return false;
      const firstRestaurantId = items[0]?.restaurantId;
      return items.some((item) => item.restaurantId !== firstRestaurantId);
    } catch (error) {
      console.error('Error checking food court order:', error);
      return false;
    }
  }, [items, foodCourtId]);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('cart', JSON.stringify(items));
    } catch (error) {
      console.error('Error saving cart to localStorage:', error);
    }
  }, [items]);

  const addItem = (newItem: Omit<CartItem, 'quantity'> & { quantity?: number }) => {
    setItems((currentItems) => {
      const getItemKey = (item: any) => `${item.id}-${JSON.stringify(item.menuOptions)}-${JSON.stringify(item.excludedIngredients)}`;
      // For combos, also include sections in the key to differentiate between different combinations
      const getComboItemKey = (item: any) => `${item.id}-${JSON.stringify(item.menuOptions)}-${JSON.stringify(item.excludedIngredients)}-${JSON.stringify(item.sections)}`;

      // Use the appropriate key based on whether it's a combo or not
      const newItemKey = newItem.isCombo ? getComboItemKey(newItem) : getItemKey(newItem);
      const existingItemIndex = currentItems.findIndex((item) => getItemKey(item) === newItemKey);
      const initialQuantity = newItem.quantity || 1;
      let itemToAdd = { ...newItem, quantity: initialQuantity };

      // Check for applicable promotion
      const promotion = activePromotions.find((p) => {
        return p.conditions.productId === newItem.id || p.conditions.freeProductId === newItem.id;
      });

      if (promotion) {
        switch (promotion.type) {
          case 'double':
            if (existingItemIndex >= 0) {
              const updatedItems = [...currentItems];
              const currentQuantity = updatedItems[existingItemIndex].quantity;

              // Add +2 (1 bought = 1 free)
              updatedItems[existingItemIndex] = {
                ...updatedItems[existingItemIndex],
                quantity: currentQuantity + 2,
                promotionLabel: `${(currentQuantity + 2) / 2} offerts`,
                promotionType: `double`,
              };

              return updatedItems;
            } else {
              // If item doesn't exist in cart yet, add 2 directly
              return [
                ...currentItems,
                {
                  ...itemToAdd,
                  quantity: 2, // 1 paid + 1 free
                  promotionLabel: `1 offert`,
                  promotionType: 'double',
                },
              ];
            }

          case 'discount':
            itemToAdd = {
              ...newItem,
              originalPrice: newItem.price,
              quantity: initialQuantity,
              price: Number((newItem.price * (1 - (promotion.conditions.discountPercent || 0) / 100)).toFixed(2)),
              promotionLabel: `-${promotion.conditions.discountPercent}%`,
              promotionType: `discount`,
            };
            break;

          case 'free':
            // If it's the free product
            if (newItem.id === promotion.conditions.freeProductId) {
              // Check if main product is in cart
              const mainProductInCart = currentItems.some((item) => item.id === promotion.conditions.productId);

              if (mainProductInCart) {
                itemToAdd = {
                  ...newItem,
                  originalPrice: newItem.price,
                  quantity: initialQuantity,
                  price: 0,
                  promotionLabel: 'OFFERT',
                  promotionType: 'free',
                };
              }
            }
            break;

          case 'second_item_discount': {
            // Find all identical items in cart
            const sameItems = currentItems.filter((item) => item.id === newItem.id);
            const totalQuantity = sameItems.reduce((sum, item) => sum + item.quantity, 0) + initialQuantity;
            itemToAdd.promotionType = `second_item_discount`;

            // Apply discount on even items
            if (totalQuantity >= 2) {
              const discountPercent = promotion.conditions.discountPercent || 0;
              itemToAdd.originalPrice = newItem.price;
              itemToAdd.price = newItem.price * (1 - discountPercent / 100);
              itemToAdd.promotionLabel = `-${discountPercent}% sur le 2ème`;
            }
            break;
          }
        }
      }

      if (existingItemIndex >= 0) {
        const updatedItems = [...currentItems];
        updatedItems[existingItemIndex] = {
          ...updatedItems[existingItemIndex],
          quantity: updatedItems[existingItemIndex].quantity + itemToAdd.quantity,
          price: itemToAdd.price,
          originalPrice: itemToAdd.originalPrice,
          promotionLabel: itemToAdd.promotionLabel,
        };
        return updatedItems;
      }

      return [...currentItems, itemToAdd];
    });
  };

  const addItems = (newItems: CartItem[]) => {
    setItems((currentItems) => {
      if (!Array.isArray(currentItems)) {
        return newItems;
      }
      return [...currentItems, ...newItems];
    });
  };

  const removeItem = (id: string, menuOptions?: MenuOptions) => {
    setItems((currentItems) => {
      // Find exact index of item to remove
      const itemIndex = currentItems.findIndex((item) => {
        const sameId = item.id === id;
        const sameOptions = menuOptions ? JSON.stringify(item.menuOptions) === JSON.stringify(menuOptions) : true;
        return sameId && sameOptions;
      });

      if (itemIndex === -1) return currentItems;

      // Create new array without the item
      return [...currentItems.slice(0, itemIndex), ...currentItems.slice(itemIndex + 1)];
    });
  };

  const updateQuantity = (id: string, quantity: number, menuOptions?: MenuOptions) => {
    setItems((currentItems) => {
      // Find index of item to update
      const itemIndex = currentItems.findIndex((item) => {
        const sameId = item.id === id;
        const sameOptions = menuOptions ? JSON.stringify(item.menuOptions) === JSON.stringify(menuOptions) : true;
        return sameId && sameOptions;
      });

      if (itemIndex === -1) return currentItems;

      const item = currentItems[itemIndex];

      // Check for applicable promotion
      const promotion = activePromotions.find((p) => {
        return p.conditions.productId === item.id || p.conditions.freeProductId === item.id;
      });

      // If quantity is 0 or less, remove item
      if (item.quantity + quantity <= 0) {
        return [...currentItems.slice(0, itemIndex), ...currentItems.slice(itemIndex + 1)];
      }

      // Update quantity with promotion handling
      let updatedItem = { ...item, quantity: item.quantity + quantity };

      if (promotion) {
        switch (promotion.type) {
          case 'double':
            updatedItem.quantity = updatedItem.quantity + quantity;
            updatedItem.promotionLabel = updatedItem.quantity % 2 === 0 ? `${updatedItem.quantity / 2} offert${(updatedItem.quantity / 2) > 1 ? 's' : ''}` : undefined;
            break;

          case 'free':
            if (item.id === promotion.conditions.freeProductId) {
              // Find main product in cart
              const mainProduct = currentItems.find((cartItem) => cartItem.id === promotion.conditions.productId);

              // Check if main product is in cart
              const mainProductInCart = currentItems.some((cartItem) => cartItem.id === promotion.conditions.productId);

              if (mainProductInCart) {
                // Only one free product per main product
                const freeQuantity = Math.min(1, mainProduct?.quantity ?? 0);
                const paidQuantity = Math.max(0, quantity - freeQuantity);

                updatedItem = {
                  ...item,
                  quantity,
                  originalPrice: item.price,
                  // Total price = unit price * paid quantity
                  price: paidQuantity === 0 ? 0 : item.originalPrice || item.price,
                  promotionLabel: freeQuantity > 0 ? `${freeQuantity} offert${freeQuantity > 1 ? 's' : ''}` : undefined,
                };
              }
            }
            break;
        }
      }

      return [...currentItems.slice(0, itemIndex), updatedItem, ...currentItems.slice(itemIndex + 1)];
    });
  };

  const clearCart = () => {
    setItems([]);
    setScheduledTime(null);
    localStorage.removeItem('foodCourtId');
  };

  const toggleCart = () => setIsCartOpen((prev) => !prev);

  const fixAnonymousUser = (value: string) => {
    setAnonymousUser(value)
    localStorage.setItem("anoUser", value)
  };

  const subtotal =
    items && Array.isArray(items)
      ? items.reduce((sum, item) => {
        if (item.promotionType === 'double') {
          // For each pair of items, only charge one
          return sum + Math.ceil(item.quantity / 2) * item.price;
        }
        if (item.promotionType === 'second_item_discount') {
          const pairs = Math.floor(item.quantity / 2);
          const remainingItems = item.quantity % 2;
          const regularPrice = item.originalPrice || item.price;
          const discountedPrice = item.price;

          return sum + pairs * (regularPrice + discountedPrice) + remainingItems * regularPrice;
        }
        return sum + item.price * item.quantity;
      }, 0)
      : 0;

  const anonymousUser = anonymouUser;

  let orderType = JSON.parse(localStorage.getItem('orderType') || '{"type":""}');
  const isDelivery = orderType?.type === 'delivery';

  //Calcul de la distance entre le restaurant et l'utilisateur
  const { location } = useUserLocation();
  const restaurantLocation = restaurant?.location;

  const deliveryDistance: number = calculateDistance(location?.latitude!, location?.longitude!, restaurantLocation?.lat!, restaurantLocation?.lng!) / 1000; //Distance en km

  //Calcul des frais de livraison
  const deliveryFees: number = isDelivery ?
    restaurant?.deliveryFeeType === 'fixed' ?
      restaurant?.deliveryFee! :
      restaurant?.deliveryFeeType === 'variable' ?
        (deliveryDistance <= 1 ?
          restaurant?.driverFee! :
          restaurant?.driverFee! * deliveryDistance) :
        0 :
    0;

  const serviceFees = subtotal * applicationFee;
  const total = subtotal + serviceFees + (isDelivery ? deliveryFees : 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        addItems,
        removeItem,
        updateQuantity,
        clearCart,
        isCartOpen,
        toggleCart,
        applicationFee,
        serviceFees,
        deliveryFees,
        subtotal,
        total,
        isFoodCourtOrder,
        foodCourtId,
        scheduledTime,
        setScheduledTime,
        anonymousUser,
        fixAnonymousUser
      }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}