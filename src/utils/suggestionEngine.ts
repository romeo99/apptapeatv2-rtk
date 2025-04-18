import { MenuItem } from '../types/firebase';

interface CartItem {
  id: string;
  categoryId?: string;
  quantity: number;
}

export function getSuggestionGroups(cartItems: CartItem[], menuItems: MenuItem[]): MenuItem[][] {
  const suggestions: MenuItem[][] = [];
  
  // Vérifier si le panier contient un plat principal sans dessert
  const hasMainDish = cartItems.some(item => {
    const menuItem = menuItems.find(m => m.id === item.id);
    return menuItem?.categoryId === 'burgers' || menuItem?.categoryId === 'salades';
  });
  
  const hasDessert = cartItems.some(item => {
    const menuItem = menuItems.find(m => m.id === item.id);
    return menuItem?.categoryId === 'desserts';
  });

  // Si le client a un plat principal mais pas de dessert, suggérer des desserts
  if (hasMainDish && !hasDessert) {
    const dessertSuggestions = menuItems
      .filter(item => item.categoryId === 'desserts')
      .slice(0, 4);
    
    if (dessertSuggestions.length > 0) {
      suggestions.push(dessertSuggestions);
    }
  }

  // Vérifier si le panier contient une boisson
  const hasDrink = cartItems.some(item => {
    const menuItem = menuItems.find(m => m.id === item.id);
    return menuItem?.categoryId === 'boissons';
  });

  // Si pas de boisson, suggérer des boissons
  if (!hasDrink) {
    const drinkSuggestions = menuItems
      .filter(item => item.categoryId === 'boissons')
      .slice(0, 4);
    
    if (drinkSuggestions.length > 0) {
      suggestions.push(drinkSuggestions);
    }
  }

  return suggestions;
}