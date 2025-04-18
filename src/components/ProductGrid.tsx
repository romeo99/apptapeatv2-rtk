import React from 'react';
import { MenuItem } from '../types';

interface ProductGridProps {
  items: MenuItem[];
  onProductClick: (id: string) => void;
}

export default function ProductGrid({ items, onProductClick }: ProductGridProps) {
  return (
    <div className="grid grid-cols-2 gap-4 p-4">
      {items.map((item) => (
        <div
          key={item.id}
          onClick={() => onProductClick(item.id)}
          className="bg-white rounded-xl shadow-sm overflow-hidden"
        >
          <img
            src={item.image}
            alt={item.name}
            className="w-full h-32 object-cover"
          />
          <div className="p-3">
            <h3 className="font-medium text-sm mb-1">{item.name}</h3>
            <p className="text-gray-500 text-xs mb-2 line-clamp-2">
              {item.description}
            </p>
            <p className="font-semibold text-sm">{item.price.toFixed(2)} €</p>
          </div>
        </div>
      ))}
    </div>
  );
}