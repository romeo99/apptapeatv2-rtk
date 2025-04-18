import React from 'react';
import { Menu, ShoppingCart, User } from 'lucide-react';

export default function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 bg-white shadow-md z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <button className="p-2 rounded-md text-gray-700 lg:hidden">
              <Menu className="h-6 w-6" />
            </button>
            <div className="flex items-center">
              <span className="text-2xl font-bold text-indigo-600">TapEat</span>
            </div>
          </div>
          
          <div className="hidden lg:flex lg:items-center lg:space-x-8">
            <a href="#" className="text-gray-700 hover:text-indigo-600">Menu</a>
            <a href="#" className="text-gray-700 hover:text-indigo-600">Restaurants</a>
            <a href="#" className="text-gray-700 hover:text-indigo-600">Pour les Restaurateurs</a>
          </div>

          <div className="flex items-center space-x-4">
            <button className="p-2 rounded-md text-gray-700 hover:text-indigo-600">
              <ShoppingCart className="h-6 w-6" />
            </button>
            <button className="p-2 rounded-md text-gray-700 hover:text-indigo-600">
              <User className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}