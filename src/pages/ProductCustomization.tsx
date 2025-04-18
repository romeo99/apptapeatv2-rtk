import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';

const product = {
  id: 'cheese-burger',
  name: 'Cheese Burger',
  price: 15.30,
  image: 'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?auto=format&fit=crop&w=800&h=600',
  ingredients: [
    { id: 'salt', name: 'Salt', icon: '🧂' },
    { id: 'chicken', name: 'Chicken', icon: '🍗' },
    { id: 'onion', name: 'Onion', icon: '🧅' },
    { id: 'garlic', name: 'Garlic', icon: '🧄' },
    { id: 'peppers', name: 'Peppers', icon: '🌶' },
    { id: 'ginger', name: 'Ginger', icon: '🫃' },
    { id: 'broccoli', name: 'Broccoli', icon: '🥦' },
    { id: 'orange', name: 'Orange', icon: '🍊' },
    { id: 'walnut', name: 'Walnut', icon: '🥜' },
  ]
};

export default function ProductCustomization() {
  const navigate = useNavigate();
  const [quantity, setQuantity] = useState(1);

  return (
    <div className="min-h-screen bg-white">
      {/* Product Image */}
      <div className="relative h-72">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover"
        />
        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 right-4 w-8 h-8 bg-white rounded-full flex items-center justify-center"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Product Details */}
      <div className="p-4">
        <h1 className="text-xl font-medium mb-2">{product.name}</h1>
        <p className="text-emerald-500 mb-4">${product.price.toFixed(2)}</p>
        
        {/* Ingredients Grid */}
        <div className="grid grid-cols-5 gap-4">
          {product.ingredients.map((ingredient) => (
            <button
              key={ingredient.id}
              className="flex flex-col items-center"
            >
              <div className="w-12 h-12 rounded-full border-2 border-emerald-500 flex items-center justify-center mb-1">
                <span className="text-xl">{ingredient.icon}</span>
              </div>
              <span className="text-xs text-center">{ingredient.name}</span>
            </button>
          ))}
        </div>

        {/* Add to Cart */}
        <div className="mt-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center"
            >
              -
            </button>
            <span>{quantity}</span>
            <button
              onClick={() => setQuantity(quantity + 1)}
              className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center"
            >
              +
            </button>
          </div>
          <button
            onClick={() => navigate('/order-confirmation')}
            className="bg-emerald-500 text-white px-6 py-2 rounded-full"
          >
            Add to Cart
          </button>
        </div>
      </div>

      {/* Cart Summary */}
      <div className="fixed bottom-4 left-4 right-4">
        <button className="w-full bg-gray-100 text-gray-600 rounded-full py-3 px-4 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <span className="bg-gray-200 px-2 py-1 rounded">1 Item</span>
            <span>View Cart</span>
          </span>
          <span>${(product.price * quantity).toFixed(2)}</span>
        </button>
      </div>
    </div>
  );
}