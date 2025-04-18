import { useState } from 'react';
import { Edit2, Tag, AlertCircle } from 'lucide-react';
import { MenuItem, Category } from '../../types/firebase';
import { updateMenuItem } from '../../services/menuService';

interface MenuItemCardProps {
  item: MenuItem;
  category?: Category;
  onEdit: () => void;
}

export default function MenuItemCard({ item, category, onEdit }: MenuItemCardProps) {
  const [loading, setLoading] = useState(false);

  const handleAvailabilityToggle = async () => {
    try {
      setLoading(true);
      const newStatus = item.status === 'available' ? 'out_of_stock' : 'available';
      
      await updateMenuItem(item.id, {
        status: newStatus
      });
    } catch (err) {
      console.error('Error updating availability:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="relative h-48">
        {item.image ? (
          <img
            src={item.image}
            alt={item.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gray-100 flex items-center justify-center">
            <span className="text-4xl">{category?.icon || '🍽️'}</span>
          </div>
        )}
        {item.status !== 'available' && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <span className="text-white font-medium">Non disponible</span>
          </div>
        )}
        <button
          onClick={onEdit}
          className="absolute top-2 right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg"
        >
          <Edit2 className="h-4 w-4 text-gray-600" />
        </button>
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div>
            <h3 className="font-medium text-gray-900">{item.name}</h3>
            {category && (
              <span className="text-sm text-gray-500">{category.name}</span>
            )}
          </div>
          <span className="font-medium text-emerald-600">
            {item.price.toFixed(2)} €
          </span>
        </div>

        <p className="text-sm text-gray-600 mb-4 line-clamp-2">
          {item.description}
        </p>

        {item.allergens && item.allergens.length > 0 && (
          <div className="flex items-center gap-1 mb-3">
            <AlertCircle className="h-4 w-4 text-orange-500" />
            <span className="text-xs text-orange-500">
              Contient des allergènes
            </span>
          </div>
        )}

        {item.tags && item.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {item.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600"
              >
                <Tag className="h-3 w-3 mr-1" />
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between">
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={item.status === 'available'}
              onChange={handleAvailabilityToggle}
              disabled={loading}
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
            <span className="ml-2 text-sm text-gray-600">
              {item.status === 'available' ? 'Disponible' : 'Indisponible'}
            </span>
          </label>
        </div>
      </div>
    </div>
  );
}