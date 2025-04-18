import React from 'react';

const categories = [
  { id: 'burgers', name: 'Burgers', icon: '🍔' },
  { id: 'pizzas', name: 'Pizzas', icon: '🍕' },
  { id: 'salads', name: 'Salades', icon: '🥗' },
  { id: 'desserts', name: 'Desserts', icon: '🍰' },
  { id: 'drinks', name: 'Boissons', icon: '🥤' },
];

export default function CategoryTabs() {
  const [activeCategory, setActiveCategory] = React.useState(categories[0].id);

  return (
    <div className="bg-white px-4 py-3 shadow-sm">
      <div className="flex overflow-x-auto hide-scrollbar space-x-3">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => setActiveCategory(category.id)}
            className={`flex flex-col items-center min-w-[4.5rem] p-2 rounded-xl transition-colors ${
              activeCategory === category.id
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-700'
            }`}
          >
            <span className="text-xl mb-1">{category.icon}</span>
            <span className="text-xs font-medium">{category.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}