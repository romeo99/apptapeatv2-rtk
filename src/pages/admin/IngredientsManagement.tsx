import { AlertCircle, Plus, Search, Trash2, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useRestaurantContext } from '../../context/RestaurantContext';
import useOrderNotification from '../../hooks/useOrderNotification';
import { createIngredient, deleteIngredient, getIngredients, searchIngredients } from '../../services/ingredientService';

interface Ingredient {
  id: string;
  name: string;
  icon: string;
  createdAt: Date;
}

interface EmojiSuggestion {
  id: string;
  name: string;
  icon: string;
}
export default function IngredientsManagement() {
  const { restaurant } = useRestaurantContext();
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [addSearchQuery, setAddSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<EmojiSuggestion[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customIngredient, setCustomIngredient] = useState({
    name: '',
    icon: '🔍' // Icône par défaut pour les ingrédients personnalisés
  });

  useOrderNotification();

  useEffect(() => {
    if (!restaurant?.id) return;
    loadIngredients();
  }, [restaurant?.id]);

  const loadIngredients = async () => {
    try {
      setLoading(true);
      const data = await getIngredients(restaurant!.id);
      setIngredients(data);
    } catch (err) {
      console.error('Error loading ingredients:', err);
      setError('Erreur lors du chargement des ingrédients');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (query: string) => {
    setAddSearchQuery(query);

    if (query.length < 2) {
      setSuggestions([]);
      return;
    }

    try {
      const searchResults = searchIngredients(query);
      const newSuggestions = searchResults
        .filter(ingredient => !ingredients.some(ing => ing.icon === ingredient.icon))
        .map(ingredient => ({
          id: ingredient.id,
          name: ingredient.name,
          icon: ingredient.icon
        }));
      setSuggestions(newSuggestions);
    } catch (err) {
      console.error('Error searching ingredients:', err);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleAddIngredient = async (suggestion: EmojiSuggestion) => {
    try {
      if (!restaurant?.id) return;
      setError(null);
      // Reset form data before adding
      setAddSearchQuery('');
      setCustomIngredient({
        name: '',
        icon: '🔍'
      });
      setAddSearchQuery('');
      setCustomIngredient({
        name: '',
        icon: '🔍'
      });

      await createIngredient(restaurant.id, {
        id: suggestion.id,
        name: suggestion.name,
        icon: suggestion.icon
      });

      // Reset search and form state
      setSuggestions([]);
      setIsAdding(false);

      // Reload ingredients
      await loadIngredients();
    } catch (err) {
      console.error('Error adding ingredient:', err);
      setError('Erreur lors de l\'ajout de l\'ingrédient');
    }
  };

  const handleDeleteIngredient = async (ingredientId: string) => {
    try {
      if (!restaurant?.id) return;
      if (!window.confirm('Êtes-vous sûr de vouloir supprimer cet ingrédient ?')) return;

      await deleteIngredient(restaurant.id, ingredientId);
      await loadIngredients();
    } catch (err) {
      console.error('Error deleting ingredient:', err);
      setError('Erreur lors de la suppression de l\'ingrédient');
    }
  };

  const handleAddMenuLink = async () => {
    try {
      setError(null);
      // Reset form data before adding
      setAddSearchQuery('');
      setCustomIngredient({
        name: '',
        icon: '🔍'
      });

      await createIngredient(restaurant.id, {
        id: customIngredient.name.toLowerCase().replace(/\s+/g, '-'),
        name: customIngredient.name,
        icon: customIngredient.icon
      });

      setShowCustomForm(false);
      setSuggestions([]);
      setIsAdding(false);

      await loadIngredients();
    } catch (error) {
      console.error('Error adding ingredient:', error);
      setError('Erreur lors de l\'ajout de l\'ingrédient');
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center p-8">
          <LoadingSpinner />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Gestion des Ingrédients</h1>
              <p className="mt-1 text-sm text-gray-500">
                {ingredients.length} ingrédient{ingredients.length > 1 ? 's' : ''}
              </p>
            </div>
            <button
              onClick={() => setIsAdding(true)}
              className="bg-emerald-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-emerald-600"
            >
              <Plus className="h-5 w-5" />
              Ajouter un ingrédient
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-500 rounded-lg flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            <p>{error}</p>
          </div>
        )}

        {/* Liste des ingrédients */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-6">
          <div className="p-4">
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
          </div>

          <div className="border-t">
            {ingredients
              .filter(ing =>
                ing.name.toLowerCase().includes(searchQuery.toLowerCase())
              )
              .map((ingredient) => (
                <div
                  key={ingredient.id}
                  className="flex items-center justify-between p-4 hover:bg-gray-50 border-b"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                      <span className="text-2xl">{ingredient.icon}</span>
                    </div>
                    <div>
                      <h3 className="font-medium">{ingredient.name}</h3>
                      <p className="text-sm text-gray-500">{ingredient.nameEn}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteIngredient(ingredient.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              ))}

            {ingredients.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500">Aucun ingrédient</p>
              </div>
            )}
          </div>
        </div>

        {/* Modal d'ajout d'ingrédient */}
        {isAdding && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl w-full max-w-2xl">
              <div className="p-6 border-b">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">Ajouter un ingrédient</h2>
                  <button
                    onClick={() => {
                      setIsAdding(false);
                      setAddSearchQuery('');
                      setSuggestions([]);
                    }}
                    className="p-2 hover:bg-gray-100 rounded-full"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="mt-4">
                  <div className="relative">
                    <input
                      type="text"
                      value={addSearchQuery}
                      onChange={(e) => {
                        e.stopPropagation();
                        handleSearch(e.target.value);
                      }}
                      placeholder="Rechercher un ingrédient..."
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      autoFocus
                    />
                    <Search className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
                  </div>
                </div>
              </div>

              <div className="p-6 max-h-[60vh] overflow-y-auto">
                {searchLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <LoadingSpinner />
                  </div>
                ) : suggestions.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {suggestions.map((ingredient) => (
                      <button
                        key={ingredient.id}
                        onClick={() => handleAddIngredient(ingredient)}
                        className="flex flex-col items-center gap-3 p-4 rounded-xl border-2 border-gray-200 hover:border-emerald-500 hover:bg-emerald-50 transition-all"
                        type="button"
                      >
                        <span className="text-3xl">{ingredient.icon}</span>
                        <span className="text-sm font-medium">{ingredient.name}</span>
                      </button>
                    ))}
                  </div>
                ) : addSearchQuery.length > 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500 mb-4">
                      Aucun ingrédient trouvé pour "{addSearchQuery}"
                    </p>
                    <button
                      onClick={() => {
                        setShowCustomForm(true);
                        setCustomIngredient(prev => ({
                          ...prev,
                          name: addSearchQuery
                        }));
                      }}
                      className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600"
                    >
                      Ajouter comme nouvel ingrédient
                    </button>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    Commencez à taper pour rechercher des ingrédients
                  </div>
                )}
              </div>

              {/* Formulaire d'ajout d'ingrédient personnalisé */}
              {showCustomForm && (
                <div className="p-6 border-t">
                  <h3 className="font-medium mb-4">Ajouter un ingrédient personnalisé</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nom de l'ingrédient
                      </label>
                      <input
                        type="text"
                        value={customIngredient.name}
                        onChange={(e) => setCustomIngredient(prev => ({
                          ...prev,
                          name: e.target.value
                        }))}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        required
                      />
                    </div>

                    <div className="flex justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => setShowCustomForm(false)}
                        className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                      >
                        Annuler
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (customIngredient.name.trim()) {
                            handleAddIngredient({
                              id: customIngredient.name.toLowerCase().replace(/\s+/g, '-'),
                              name: customIngredient.name,
                              icon: customIngredient.icon
                            });
                          }
                        }}
                        className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600"
                      >
                        Ajouter
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="p-4 border-t">
                <button
                  onClick={() => {
                    setIsAdding(false);
                    setAddSearchQuery('');
                    setSuggestions([]);
                  }}
                  className="w-full px-4 py-3 text-gray-600 hover:bg-gray-100 rounded-lg font-medium"
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}