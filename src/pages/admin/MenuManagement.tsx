import { Edit2, Filter, Plus, Search, Tag, Trash2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import LoadingSpinner from '../../components/LoadingSpinner';
import AdminLayout from '../../components/admin/AdminLayout';
import MenuItemCard from '../../components/admin/MenuItemCard';
import { useRestaurantContext } from '../../context/RestaurantContext';
import useOrderNotification from '../../hooks/useOrderNotification';
import { deleteMenuItem, updateMenuItem } from '../../services/menuService';

const VIEWS = {
  PRODUCTS: 'products',
  COMBOS: 'combos'
} as const;

export default function MenuManagement() {
  const navigate = useNavigate();
  const { restaurant, menu = [], loading, error, categories = [] } = useRestaurantContext();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [currentView, setCurrentView] = useState<keyof typeof VIEWS>('PRODUCTS');
  const [showFilters, setShowFilters] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  useOrderNotification();

  const handleDelete = async (itemId: string) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce produit ?')) {
      return;
    }

    if (!restaurant?.id) {
      setDeleteError('Restaurant ID is missing');
      return;
    }

    try {
      setDeleteError(null);
      await deleteMenuItem(itemId, restaurant.id);
    } catch (err) {
      console.error('Error deleting item:', err);
      setDeleteError(err instanceof Error ? err.message : 'Erreur lors de la suppression du produit');
    }
  };

  const handleStatusToggle = async (itemId: string, currentStatus: string) => {
    try {
      setUpdatingStatus(itemId);
      if (!restaurant?.id) {
        throw new Error('Restaurant ID is required');
      }
      
      const item = menu.find(item => item.id === itemId);
      if (!item) {
        throw new Error('Menu item not found');
      }
      
      const newStatus = currentStatus === 'available' ? 'out_of_stock' : 'available';
      await updateMenuItem(itemId, restaurant.id, {
        status: newStatus,
        image: item.image // Preserve the image
      });
    } catch (err) {
      console.error('Error updating availability:', err);
    } finally {
      setUpdatingStatus(null);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <LoadingSpinner />
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="text-center">
            <p className="text-red-500 mb-2">{error}</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  const allTags = Array.from(new Set(menu.flatMap(item => item.tags || [])));

  const filteredMenu = menu.filter(item => {
    const matchesCategory = !selectedCategory || item.categoryId === selectedCategory;
    const matchesSearch = !searchQuery ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTags = selectedTags.length === 0 ||
      selectedTags.every(tag => item.tags?.includes(tag));
    const matchesType = currentView === 'COMBOS' ? item.isCombo : !item.isCombo;
    return matchesCategory && matchesSearch && matchesTags && matchesType;
  });

  return (
    <AdminLayout>
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Gestion du Menu</h1>
              <div className="mt-1 flex items-center gap-4">
                <button
                  onClick={() => setCurrentView('PRODUCTS')}
                  className={`text-sm font-medium ${currentView === 'PRODUCTS'
                    ? 'text-emerald-600'
                    : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                  Produits
                </button>
                <button
                  onClick={() => setCurrentView('COMBOS')}
                  className={`text-sm font-medium ${currentView === 'COMBOS'
                    ? 'text-emerald-600'
                    : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                  Menus & Combos
                </button>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate(currentView === 'COMBOS' ? '/admin/menu/combo/new' : '/admin/menu/new')}
                className="bg-emerald-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-emerald-600"
              >
                <Plus className="h-5 w-5" />
                {currentView === 'COMBOS' ? 'Nouveau combo' : 'Nouveau produit'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {deleteError && (
          <div className="mb-6 p-4 bg-red-50 text-red-500 rounded-lg">
            {deleteError}
          </div>
        )}

        <div className="mb-6 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Rechercher un produit..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-4 py-2 border border-gray-300 rounded-lg flex items-center gap-2 hover:bg-gray-50"
            >
              <Filter className="h-5 w-5" />
              Filtres
              {(selectedCategory || selectedTags.length > 0) && (
                <span className="ml-1 px-2 py-0.5 text-xs bg-emerald-500 text-white rounded-full">
                  {(selectedCategory ? 1 : 0) + selectedTags.length}
                </span>
              )}
            </button>
          </div>

          {showFilters && (
            <div className="bg-white rounded-lg shadow-sm p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Catégorie
                </label>
                <select
                  value={selectedCategory || ''}
                  onChange={(e) => setSelectedCategory(e.target.value || null)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                >
                  <option value="">Toutes les catégories</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              {allTags.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Étiquettes
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {allTags.map((tag) => (
                      <button
                        key={tag}
                        onClick={() => {
                          setSelectedTags(prev =>
                            prev.includes(tag)
                              ? prev.filter(t => t !== tag)
                              : [...prev, tag]
                          );
                        }}
                        className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${selectedTags.includes(tag)
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                      >
                        <Tag className="h-3 w-3 mr-1" />
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMenu.map((item) => (
            <div key={item.id} className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="relative h-48">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-full h-full object-cover"
                />
                {item.status !== 'available' && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <span className="text-white font-medium">Non disponible</span>
                  </div>
                )}
                <div className="absolute top-2 right-2 flex gap-2">
                  <button
                    onClick={() => navigate(`/admin/menu/edit/${item.id}`)}
                    className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg"
                  >
                    <Edit2 className="h-4 w-4 text-gray-600" />
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg"
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </button>
                </div>
              </div>

              <div className="p-4">
                <h3 className="font-medium text-gray-900 mb-1">{item.name}</h3>
                <p className="text-sm text-gray-500 mb-2">{item.description}</p>
                <div className="flex justify-between items-center">
                  <span className="font-medium text-emerald-600">
                    {item.price.toFixed(2)} €
                  </span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={item.status === 'available'} 
                      onChange={() => handleStatusToggle(item.id, item.status || 'available')}
                      disabled={updatingStatus === item.id}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                    <span className="ml-2 text-sm text-gray-600">
                      {item.status === 'available' ? 'Disponible' : 'Indisponible'}
                    </span>
                  </label>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredMenu.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">Aucun produit trouvé</p>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}