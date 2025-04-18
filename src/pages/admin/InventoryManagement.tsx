import { AlertTriangle, ArrowUpDown, DollarSign, Package, Plus, Search } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import useSound from 'use-sound';
import AdminLayout from '../../components/admin/AdminLayout';
import InventoryCard from '../../components/admin/inventory/InventoryCard';
import InventoryModal from '../../components/admin/inventory/InventoryModal';
import LoadingSpinner from '../../components/LoadingSpinner';
import { notificationSoundUrl, useNotification } from '../../context/NotificationContext';
import { useOrderContext } from '../../context/OrderContext';
import { useRestaurantContext } from '../../context/RestaurantContext';
import { useInventory } from '../../hooks/useInventory';
import { formatCurrency } from '../../utils/formatters';
import useOrderNotification from '../../hooks/useOrderNotification';

const CATEGORIES = [
  'Viandes',
  'Légumes',
  'Épicerie',
  'Boissons',
  'Produits laitiers',
  'Condiments'
];

export default function InventoryManagement() {
  const { restaurant } = useRestaurantContext();
  const { inventory, loading, error, addItem, updateItem, deleteItem, updateStock } = useInventory(restaurant?.id || '');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [sortBy, setSortBy] = useState<'name' | 'stock' | 'category'>('name');
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [showModal, setShowModal] = useState<boolean>(false);

  useOrderNotification();

  const handleSave = async (itemData: any, imageFile?: File) => {
    try {
      if (!restaurant?.id) throw new Error('Restaurant ID is required');

      const data = {
        ...itemData,
        restaurantId: restaurant.id,
        quantity: Number(itemData.quantity) || 0,
        optimalStock: Number(itemData.optimalStock) || 0,
        price: Number(itemData.price) || 0,
        lastUpdated: new Date()
      };

      if (selectedItem) {
        await updateItem(selectedItem.id, data, imageFile);
      } else {
        await addItem(data, imageFile);
      }
      setShowModal(false);
      setSelectedItem(null);
    } catch (err) {
      console.error('Error saving inventory item:', err);
    }
  };

  const handleDelete = async (itemId: string) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cet article ?')) {
      return;
    }
    if (!restaurant?.id) return;

    try {
      await deleteItem(itemId);
    } catch (err) {
      console.error('Error deleting inventory item:', err);
    }
  };

  const handleStockAdjustment = async (itemId: string, newQuantity: number) => {
    if (!restaurant?.id) return;
    try {
      await updateStock(itemId, Math.max(0, newQuantity));
    } catch (err) {
      console.error('Error adjusting stock:', err);
    }
  };

  const filteredInventory = useMemo(() => {
    return inventory
      .filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        (!selectedCategory || item.category === selectedCategory)
      )
      .sort((a, b) => {
        switch (sortBy) {
          case 'stock':
            return (b.quantity / b.optimalStock) - (a.quantity / a.optimalStock);
          case 'category':
            return a.category.localeCompare(b.category);
          default:
            return a.name.localeCompare(b.name);
        }
      });
  }, [inventory, searchQuery, selectedCategory, sortBy]);

  // Calculate totals
  const totalItems = inventory.length;
  const totalValue = inventory.reduce((sum, item) => sum + (item.quantity * item.price), 0);
  const lowStockItems = inventory.filter(item => {
    const stockPercentage = item.optimalStock ? (item.quantity / item.optimalStock) * 100 : 0;
    return stockPercentage < 30 && item.optimalStock > 0;
  }).length;

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center p-8">
          <LoadingSpinner />
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-500">{error}</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* En-tête et résumé */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Gestion des stocks</h1>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-emerald-50 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <Package className="h-8 w-8 text-emerald-600" />
                <div>
                  <p className="text-sm text-emerald-600">Total produits</p>
                  <p className="text-2xl font-bold text-emerald-700">{totalItems}</p>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <DollarSign className="h-8 w-8 text-blue-600" />
                <div>
                  <p className="text-sm text-blue-600">Valeur totale</p>
                  <p className="text-2xl font-bold text-blue-700">{formatCurrency(totalValue)}</p>
                </div>
              </div>
            </div>

            <div className="bg-orange-50 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-8 w-8 text-orange-600" />
                <div>
                  <p className="text-sm text-orange-600">Stock faible</p>
                  <p className="text-2xl font-bold text-orange-700">{lowStockItems || 0} produits</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filtres et recherche */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex flex-col md:flex-row gap-4">
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

            <div className="flex gap-2">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="">Toutes les catégories</option>
                {CATEGORIES.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>

              <button
                onClick={() => setSortBy(prev =>
                  prev === 'name' ? 'stock' : prev === 'stock' ? 'category' : 'name'
                )}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
              >
                <ArrowUpDown className="h-4 w-4" />
                <span className="hidden sm:inline">Trier par</span>
                <span className="text-emerald-600">
                  {sortBy === 'name' ? 'Nom' :
                    sortBy === 'stock' ? 'Niveau de stock' : 'Catégorie'}
                </span>
              </button>

              <button
                onClick={() => {
                  setSelectedItem(null);
                  setShowModal(true);
                }}
                className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 flex items-center gap-2 whitespace-nowrap"
                type="button"
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Nouveau produit</span>
              </button>
            </div>
          </div>
        </div>

        {/* Grille de produits */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredInventory.map((item) => (
            <InventoryCard
              key={item.id}
              item={item}
              onClick={() => {
                setSelectedItem(item);
                setShowModal(true);
              }}
              onStockAdjust={(newQuantity) => handleStockAdjustment(item.id, newQuantity)}
            />
          ))}

          {!loading && filteredInventory.length === 0 && (
            <div className="col-span-full text-center py-12">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">
                {searchQuery || selectedCategory
                  ? 'Aucun produit ne correspond à votre recherche'
                  : 'Aucun produit dans l\'inventaire'}
              </p>
              <button
                onClick={() => {
                  setSelectedItem(null);
                  setShowModal(true);
                }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 cursor-pointer"
                type="button"
              >
                <Plus className="h-4 w-4" />
                {searchQuery || selectedCategory
                  ? 'Ajouter un produit'
                  : 'Ajouter un premier produit'}
              </button>
            </div>
          )}
        </div>

        {/* Modal */}
        {showModal && restaurant?.id && (
          <InventoryModal
            item={selectedItem}
            onClose={() => setShowModal(false)}
            onSubmit={handleSave}
            onDelete={selectedItem ? () => handleDelete(selectedItem.id) : undefined}
            categories={CATEGORIES}
          />
        )}
      </div>
    </AdminLayout>
  );
}