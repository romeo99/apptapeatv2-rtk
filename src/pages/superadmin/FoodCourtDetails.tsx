import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, MapPin, Clock, DollarSign, Plus, Trash2, Edit2, QrCode, Download } from 'lucide-react';
import { getFoodCourt, removeRestaurantFromFoodCourt } from '../../services/foodCourtService';
import { generateQRCode, downloadQRCode } from '../../services/qrCodeService';
import SuperAdminLayout from '../../components/superadmin/SuperAdminLayout';
import LoadingSpinner from '../../components/LoadingSpinner';
import type { FoodCourt } from '../../types/foodCourt';

const TABS = [
  { id: 'overview', label: 'Aperçu' },
  { id: 'restaurants', label: 'Restaurants' },
  { id: 'orders', label: 'Commandes' },
  { id: 'settings', label: 'Paramètres' }
];

export default function FoodCourtDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [foodCourt, setFoodCourt] = useState<FoodCourt | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [showQRForm, setShowQRForm] = useState(false);
  const [qrFormData, setQrFormData] = useState({
    label: '',
    tableNumber: ''
  });

  useEffect(() => {
    if (!id) return;
    loadFoodCourt();
  }, [id]);

  const loadFoodCourt = async () => {
    try {
      setLoading(true);
      const data = await getFoodCourt(id!);
      setFoodCourt(data);
    } catch (err) {
      console.error('Error loading food court:', err);
      setError('Erreur lors du chargement du food court');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveRestaurant = async (restaurantId: string) => {
    if (!window.confirm('Êtes-vous sûr de vouloir retirer ce restaurant ?')) {
      return;
    }

    try {
      await removeRestaurantFromFoodCourt(id!, restaurantId);
      await loadFoodCourt();
    } catch (err) {
      console.error('Error removing restaurant:', err);
      setError('Erreur lors de la suppression du restaurant');
    }
  };

  const handleGenerateQR = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    
    try {
      setGenerating(true);
      setError(null);

      await generateQRCode(id, {
        label: qrFormData.label,
        tableNumber: qrFormData.tableNumber,
        type: 'foodCourt'
      });

      await loadFoodCourt();
      setShowQRForm(false);
      setQrFormData({ label: '', tableNumber: '' });
    } catch (err) {
      console.error('Error generating QR code:', err);
      setError('Erreur lors de la génération du QR code');
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <SuperAdminLayout>
        <div className="flex items-center justify-center p-8">
          <LoadingSpinner />
        </div>
      </SuperAdminLayout>
    );
  }

  if (!foodCourt) {
    return (
      <SuperAdminLayout>
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <p className="text-red-500">Food court introuvable</p>
            <button
              onClick={() => navigate('/superadmin/food-courts')}
              className="mt-4 px-4 py-2 bg-emerald-500 text-white rounded-lg"
            >
              Retour à la liste
            </button>
          </div>
        </div>
      </SuperAdminLayout>
    );
  }

  return (
    <SuperAdminLayout>
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6 flex items-center gap-4">
            <button
              onClick={() => navigate('/superadmin/food-courts')}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{foodCourt.name}</h1>
              <div className="flex items-center gap-4 mt-1">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  foodCourt.status === 'active'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {foodCourt.status === 'active' ? 'Actif' : 'Inactif'}
                </span>
                <span className="text-sm text-gray-500">
                  {foodCourt.restaurants.length} restaurant{foodCourt.restaurants.length > 1 ? 's' : ''}
                </span>
              </div>
            </div>
          </div>

          {/* Navigation par onglets */}
          <div className="border-t">
            <nav className="-mb-px flex space-x-8">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-emerald-500 text-emerald-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && (
          <>
            {/* Informations générales */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-lg font-medium mb-6">Informations générales</h2>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <MapPin className="h-5 w-5 text-gray-400" />
                    <span>{foodCourt.location.address}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-gray-400" />
                    <span>
                      {foodCourt.openingHours.monday.closed ? 'Fermé' :
                        `${foodCourt.openingHours.monday.open} - ${foodCourt.openingHours.monday.close}`}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <DollarSign className="h-5 w-5 text-gray-400" />
                    <span>Frais de service : {foodCourt.serviceFee}%</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-lg font-medium mb-6">QR Code</h2>
                {foodCourt.qrCode ? (
                  <div className="text-center space-y-4">
                    <img
                      src={foodCourt.qrCode}
                      alt="QR Code"
                      className="w-48 h-48 mx-auto mb-4 border p-2 rounded-lg"
                    />
                    <button
                      onClick={() => downloadQRCode(foodCourt.qrCode!, `foodcourt-${foodCourt.name.toLowerCase().replace(/\s+/g, '-')}`)}
                      className="px-4 py-2 bg-emerald-500 text-white rounded-lg flex items-center gap-2 mx-auto"
                    >
                      <Download className="h-5 w-5" />
                      Télécharger
                    </button>
                    <button
                      onClick={() => setShowQRForm(true)}
                      className="px-4 py-2 text-emerald-600 bg-emerald-50 rounded-lg flex items-center gap-2 mx-auto"
                    >
                      <QrCode className="h-5 w-5" />
                      Générer un nouveau
                    </button>
                  </div>
                ) : (
                  <div className="text-center">
                    <button
                      onClick={() => setShowQRForm(true)}
                      className="px-4 py-2 bg-emerald-500 text-white rounded-lg flex items-center gap-2 mx-auto"
                    >
                      <QrCode className="h-5 w-5" />
                      Générer un QR code
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Liste des restaurants */}
            <div className="mt-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-medium">Restaurants</h2>
                <button
                  onClick={() => navigate(`/superadmin/food-courts/${id}/restaurants/add`)}
                  className="px-4 py-2 bg-emerald-500 text-white rounded-lg flex items-center gap-2"
                >
                  <Plus className="h-5 w-5" />
                  Ajouter un restaurant
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {foodCourt.restaurants.map((restaurant) => (
                  <div
                    key={restaurant.id}
                    className="bg-white rounded-lg shadow-sm overflow-hidden"
                  >
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-medium">{restaurant.restaurantId}</h3>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          restaurant.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {restaurant.status === 'active' ? 'Actif' : 'Inactif'}
                        </span>
                      </div>

                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleRemoveRestaurant(restaurant.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {activeTab === 'restaurants' && (
          <div>
            {/* Add restaurant management UI here */}
          </div>
        )}

        {activeTab === 'orders' && (
          <div>
            {/* Add orders management UI here */}
          </div>
        )}

        {activeTab === 'settings' && (
          <div>
            {/* Add settings UI here */}
          </div>
        )}
      </div>

      {/* QR Code Generation Modal */}
      {showQRForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-md">
            <div className="p-6 border-b">
              <h3 className="text-lg font-medium">Générer un QR code</h3>
            </div>

            <form onSubmit={handleGenerateQR} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Label
                </label>
                <input
                  type="text"
                  value={qrFormData.label}
                  onChange={(e) => setQrFormData(prev => ({ ...prev, label: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="Ex: Entrée principale, Zone A..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Numéro de table
                  <span className="text-sm font-normal text-gray-500 ml-1">(optionnel)</span>
                </label>
                <input
                  type="text"
                  value={qrFormData.tableNumber}
                  onChange={(e) => setQrFormData(prev => ({ ...prev, tableNumber: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="Ex: 1, 2, 3..."
                />
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowQRForm(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={generating}
                  className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 disabled:opacity-50 flex items-center gap-2"
                >
                  {generating ? (
                    <>
                      <LoadingSpinner />
                      Génération...
                    </>
                  ) : (
                    <>
                      <QrCode className="h-5 w-5" />
                      Générer
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </SuperAdminLayout>
  );
}