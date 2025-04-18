import React from 'react';
import { Plus } from 'lucide-react';
import type { MenuItem as MenuItemType } from '../types';
import { useRestaurantContext } from '../context/RestaurantContext';

interface MenuItemProps {
  item: MenuItemType;
  onAdd: (item: MenuItemType) => void;
}

export default function MenuItem({ item, onAdd }: MenuItemProps) {
  const { themeColor } = useRestaurantContext();

  return (
    <div className="flex items-center p-4 border-b">
      {item.image && (
        <img
          src={item.image}
          alt={item.name}
          className="w-24 h-24 object-cover rounded-lg"
        />
      )}
      <div className="flex-1 ml-4">
        <h3 className="font-medium">{item.name}</h3>
        <p className="text-sm text-gray-500 mt-1">{item.description}</p>
        <div className="flex items-center justify-between mt-2">
          <span className="font-semibold">{item.price.toFixed(2)} €</span>
          <button
            onClick={() => onAdd(item)}
            className="p-2 rounded-full text-white transition-colors"
            style={{ backgroundColor: themeColor }}
          >
            <Plus className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}