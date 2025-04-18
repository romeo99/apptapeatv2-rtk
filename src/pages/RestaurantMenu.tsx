import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MenuHeader from '../components/MenuHeader';
import CategoryTabs from '../components/CategoryTabs';
import ProductGrid from '../components/ProductGrid';
import Cart from '../components/Cart';
import { MenuItem } from '../types';

const menuItems: MenuItem[] = [
  {
    id: '1',
    name: 'Classic Burger',
    description: 'Bœuf, cheddar, salade, tomate, oignon, sauce maison',
    price: 14.90,
    category: 'Burgers',
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=500&h=500'
  },
  {
    id: '2',
    name: 'Chicken Burger',
    description: 'Poulet croustillant, cheddar, salade, tomate, sauce épicée',
    price: 13.90,
    category: 'Burgers',
    image: 'https://images.unsplash.com/photo-1513185158878-8d8c2a2a3da3?auto=format&fit=crop&w=500&h=500'
  },
  // ... autres items
];

export default function RestaurantMenu() {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState<MenuItem[]>([]);

  const handleProductClick = (productId: string) => {
    navigate(`/customize/${productId}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <MenuHeader />
      <main className="pt-36">
        <CategoryTabs />
        <ProductGrid items={menuItems} onProductClick={handleProductClick} />
      </main>
      <Cart items={cartItems} />
    </div>
  );
}