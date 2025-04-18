import { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { getIngredients } from '../services/ingredientService';
import { useRestaurantContext } from '../context/RestaurantContext';
import LoadingSpinner from './LoadingSpinner';

interface IngredientsSelectorProps {
  selectedIngredients: string[];
  onChange: (ingredients: string[]) => void;
}

export default function IngredientsSelector({ selectedIngredients, onChange }: IngredientsSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [localSelectedIngredients, setLocalSelectedIngredients] = useState<string[]>([]);
  const [restaurantIngredients, setRestaurantIngredients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { restaurant } = useRestaurantContext();

  useEffect(() => {
    const loadIngredients = async () => {
      if (!restaurant?.id) return;
      try {
        setLoading(true);
        const ingredients = await getIngredients(restaurant.id);
        setRestaurantIngredients(ingredients);
      } catch (err) {
        console.error('Error loading ingredients:', err);
        setError('Erreur lors du chargement des ingrédients');
      } finally {
        setLoading(false);
      }
    };

    loadIngredients();
  }, [restaurant?.id]);

  useEffect(() => {
    setLocalSelectedIngredients(selectedIngredients);
  }, [selectedIngredients]);

  const filteredIngredients = restaurantIngredients.filter(ingredient =>
    ingredient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ingredient.icon.includes(searchQuery)
  );

  const handleIngredientToggle = (ingredientId: string) => {
    const newSelection = localSelectedIngredients.includes(ingredientId)
      ? localSelectedIngredients.filter(id => id !== ingredientId)
      : [...localSelectedIngredients, ingredientId];
    
    setLocalSelectedIngredients(newSelection);
    onChange(newSelection);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-500 rounded-lg">
        {error}
      </div>
    );
  }

  if (restaurantIngredients.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>Aucun ingrédient disponible.</p>
        <p className="mt-2">
          Veuillez d'abord ajouter des ingrédients dans la section "Ingrédients" du menu.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <input
          type="text"
          placeholder="Rechercher un ingrédient..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
        />
        <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
        {filteredIngredients.map((ingredient) => (
          <button
            key={ingredient.id}
            type="button"
            onClick={() => handleIngredientToggle(ingredient.id)}
            className={`p-3 rounded-lg text-center transition-colors ${
              localSelectedIngredients.includes(ingredient.id)
                ? 'bg-emerald-50 border-2 border-emerald-500'
                : 'bg-gray-50 border border-gray-200 hover:border-emerald-500'
            }`}
          >
            <span className="text-2xl block mb-1">{ingredient.icon}</span>
            <span className="text-sm">{ingredient.name}</span>
          </button>
        ))}
      </div>

      {localSelectedIngredients.length > 0 && (
        <div className="pt-4 border-t">
          <h4 className="text-sm font-medium text-gray-700 mb-2">
            Ingrédients sélectionnés :
          </h4>
          <div className="flex flex-wrap gap-2">
            {localSelectedIngredients.map(id => {
              const ingredient = restaurantIngredients.find(i => i.id === id);
              return ingredient ? (
                <span 
                  key={id}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-50 text-emerald-700 rounded-full text-sm"
                >
                  {ingredient.icon} {ingredient.name}
                </span>
              ) : null;
            })}
          </div>
        </div>
      )}
    </div>
  );
}