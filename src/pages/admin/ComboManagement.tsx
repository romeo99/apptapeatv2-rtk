import { Edit2, Plus, Search, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useRestaurantContext } from '../../context/RestaurantContext';
import useOrderNotification from '../../hooks/useOrderNotification';
import { deleteMenuItem, updateMenuItem } from '../../services/menuService';

export default function ComboManagement() {
  const navigate = useNavigate();
  const { restaurant, menu = [], loading, error } = useRestaurantContext();
  const [searchQuery, setSearchQuery] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useOrderNotification();

  // Filter only combos
  const combos = menu.filter(item => item.isCombo === true);
  const filteredCombos = combos.filter(combo =>
    combo.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleStatusToggle = async (itemId: string, currentStatus: string) => {
    try {
      setUpdatingStatus(itemId);
      if (!restaurant?.id) {
        throw new Error('Restaurant ID is required');
      }

      const combo = menu.find(item => item.id === itemId);
      if (!combo) {
        throw new Error('Combo not found');
      }

      const newStatus = currentStatus === 'available' ? 'out_of_stock' : 'available';
      await updateMenuItem(itemId, restaurant.id, {
        status: newStatus,
        image: combo.image
      });
    } catch (err) {
      console.error('Error updating availability:', err);
    } finally {
      setUpdatingStatus(null);
    }
  };

  const handleDelete = async (comboId: string) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce combo ?')) {
      return;
    }

    try {
      if (!restaurant?.id) return;
      setDeleteError(null);
      await deleteMenuItem(comboId, restaurant.id);
    } catch (err) {
      console.error('Error deleting combo:', err);
      setDeleteError('Erreur lors de la suppression du combo');
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

  if (error) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <p className="text-red-500">{error}</p>
          </div>
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
              <h1 className="text-2xl font-bold text-gray-900">Gestion des Menus & Combos</h1>
              <p className="mt-1 text-sm text-gray-500">
                Créez et gérez vos menus combinés
              </p>
            </div>
            <button
              onClick={() => navigate('/admin/menu/combo/new')}
              className="bg-emerald-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-emerald-600"
            >
              <Plus className="h-5 w-5" />
              Nouveau combo
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {deleteError && (
          <div className="mb-6 p-4 bg-red-50 text-red-500 rounded-lg">
            {deleteError}
          </div>
        )}

        <div className="mb-6">
          <div className="relative">
            <input
              type="text"
              placeholder="Rechercher un menu ou combo..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCombos.map((combo) => (
            <div
              key={combo.id}
              className="bg-white rounded-lg shadow-sm overflow-hidden"
            >
              <div className="relative h-48">
                <img
                  src={combo.image}
                  alt={combo.name}
                  className="w-full h-full object-cover"
                />
                {combo.status !== 'available' && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <span className="text-white font-medium">Non disponible</span>
                  </div>
                )}
                <div className="absolute top-2 right-2 flex gap-2">
                  <button
                    onClick={() => navigate(`/admin/menu/combo/edit/${combo.id}`)}
                    className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg"
                  >
                    <Edit2 className="h-4 w-4 text-gray-600" />
                  </button>
                  <button
                    onClick={() => handleDelete(combo.id)}
                    className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg"
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </button>
                </div>
              </div>

              <div className="p-4">
                <h3 className="font-medium text-gray-900 mb-1">{combo.name}</h3>
                <p className="text-sm text-gray-500 mb-2">{combo.description}</p>
                <div className="flex justify-between items-center">
                  <span className="font-medium text-emerald-600">
                    {combo.price.toFixed(2)} €
                  </span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={combo.status === 'available'} 
                      onChange={() => handleStatusToggle(combo.id, combo.status || 'available')}
                      disabled={updatingStatus === combo.id}
                    />
                    <div className={`w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500 ${updatingStatus === combo.id ? 'opacity-50' : ''}`}></div>
                    <span className="ml-2 text-sm text-gray-600">
                      {combo.status === 'available' ? 'Disponible' : 'Indisponible'}
                    </span>
                  </label>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredCombos.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">
              {searchQuery ? 'Aucun menu ou combo trouvé' : 'Aucun menu ou combo'}
            </p>
            <button
              onClick={() => navigate('/admin/menu/combo/new')}
              className="mt-4 px-4 py-2 bg-emerald-500 text-white rounded-lg"
            >
              Créer un combo
            </button>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}