import { useLoadScript } from '@react-google-maps/api';
import { collection, getDocs } from 'firebase/firestore';
import { ChevronLeft, Clock, DollarSign, Mail, MapPin, Package, Phone, Star } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import LoadingSpinner from '../../components/LoadingSpinner';
import SuperAdminLayout from '../../components/superadmin/SuperAdminLayout';
import { db } from '../../config/firebase';
import { getRestaurant, updateRestaurant } from '../../services/restaurantService';

const GOOGLE_MAPS_API_KEY = 'AIzaSyBi3DoK4uEJmMfyjnSCLoQ_hxIv-h-Cbf4';
const libraries: ("places" | "geometry" | "drawing" | "visualization")[] = ["places"];
const TABS = [
  { id: 'overview', label: 'Aperçu' },
  { id: 'orders', label: 'Commandes' },
  { id: 'history', label: 'Historique' },
  { id: 'settings', label: 'Paramètres' }
];

const ORDER_STATUS_TABS = [
  { id: 'pending', label: 'En attente' },
  { id: 'preparing', label: 'En préparation' },
  { id: 'completed', label: 'Terminées' }
];

const DAYS = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];

export default function RestaurantDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [activeOrderTab, setActiveOrderTab] = useState('pending');
  const [restaurant, setRestaurant] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reviewCount, setReviewCount] = useState(0);
  const [loadingRestaurant, setLoadingRestaurant] = useState(true);
  const [loadingAction, setLoadingAction] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: restaurant?.name || '',
    email: restaurant?.email || '',
    phone: restaurant?.phone || '',
    address: restaurant?.address || '',
    openingHours: restaurant?.openingHours || DAYS.reduce((acc, day) => ({
      ...acc,
      [day]: { open: '09:00', close: '22:00', closed: false }
    }), {})
  });
  const addressInputRef = useRef<HTMLInputElement>(null);
  const [addressError, setAddressError] = useState<string | null>(null);

  const { isLoaded } = useLoadScript({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries
  });

  // Initialize Google Places Autocomplete
  useEffect(() => {
    if (isLoaded && addressInputRef.current) {
      const autocomplete = new google.maps.places.Autocomplete(addressInputRef.current, {
        componentRestrictions: { country: 'FR' },
        fields: ['formatted_address', 'geometry']
      });

      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        if (place.geometry?.location && place.formatted_address) {
          setFormData(prev => ({
            ...prev,
            address: place.formatted_address
          }));
          setAddressError(null);
        }
      });
    }
  }, [isLoaded]);
  useEffect(() => {
    const loadRestaurantData = async () => {
      if (!id) return;
      try {
        setLoadingRestaurant(true);
        setError(null);

        // Get restaurant details
        const restaurantData = await getRestaurant(id);

        // Get reviews count
        const reviewsRef = collection(db, 'restaurants', id, 'reviews');
        const reviewsSnapshot = await getDocs(reviewsRef);
        const reviewsCount = reviewsSnapshot.docs.length;
        setReviewCount(reviewsCount);
        // Get orders
        const ordersRef = collection(db, 'restaurants', id, 'orders');
        const ordersSnapshot = await getDocs(ordersRef);
        const ordersData = ordersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date()
        }));

        // Calculate stats
        const stats = {
          totalOrders: ordersData.length,
          totalRevenue: ordersData.reduce((sum, order) => sum + (order.total || 0), 0),
          averageOrderValue: ordersData.length > 0
            ? ordersData.reduce((sum, order) => sum + (order.total || 0), 0) / ordersData.length
            : 0,
          pendingOrders: ordersData.filter(o => o.status === 'pending').length,
          dailyRevenue: {},
          dailyOrders: {}
        };

        setRestaurant(restaurantData);
        setFormData({
          name: restaurantData.name || '',
          email: restaurantData.email || '',
          phone: restaurantData.phone || '',
          address: restaurantData.address || '',
          openingHours: restaurantData.openingHours || DAYS.reduce((acc, day) => ({
            ...acc,
            [day]: { open: '09:00', close: '22:00', closed: false }
          }), {})
        });
        setOrders(ordersData);
        setStats(stats);
      } catch (err) {
        console.error('Error loading restaurant data:', err);
        setError(err instanceof Error ? err.message : 'Une erreur est survenue');
      } finally {
        setLoading(false);
      }
    };

    loadRestaurantData();
  }, [id]);

  const filteredOrders = orders.filter(order => {
    if (activeOrderTab === 'pending') {
      return ['pending', 'confirmed'].includes(order.status);
    }
    if (activeOrderTab === 'preparing') {
      return order.status === 'preparing';
    }
    return ['completed', 'cancelled'].includes(order.status);
  });

  const handleSave = async () => {
    try {
      setLoadingAction(true);
      setError(null);

      await updateRestaurant(id!, {
        ...formData,
        openingHours: formData.openingHours
      });

      setIsEditing(false);

      // Reload restaurant data
      const updatedRestaurant = await getRestaurant(id!);
      setRestaurant(updatedRestaurant);
      setFormData({
        name: updatedRestaurant.name || '',
        email: updatedRestaurant.email || '',
        phone: updatedRestaurant.phone || '',
        address: updatedRestaurant.address || '',
        openingHours: updatedRestaurant.openingHours || DAYS.reduce((acc, day) => ({
          ...acc,
          [day]: { open: '09:00', close: '22:00', closed: false }
        }), {})
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setLoadingAction(false);
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

  if (error || !restaurant) {
    return (
      <SuperAdminLayout>
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <p className="text-red-500">{error || 'Restaurant introuvable'}</p>
            <button
              onClick={() => navigate('/superadmin/restaurants')}
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
      {/* Header avec informations principales */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6 flex items-center gap-4">
            <button
              onClick={() => navigate('/superadmin/restaurants')}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <div className="flex items-center gap-6">
              <img
                src={restaurant.logo || "https://i.postimg.cc/TPbpkRnD/Tap-Eart-2.png"}
                alt={restaurant.name}
                className="w-16 h-16 rounded-lg object-cover"
              />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{restaurant.name}</h1>
                <div className="flex items-center gap-4 mt-1">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${restaurant.isOpen
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                    }`}>
                    {restaurant.isOpen ? 'Ouvert' : 'Fermé'}
                  </span>
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                    <span className="text-sm font-medium">{restaurant.rating || '0'}</span>
                    <span className="text-sm text-gray-500">
                      ({reviewCount} avis)
                    </span>
                  </div>
                </div>
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
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === tab.id
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
            {/* Mini Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white p-6 rounded-xl shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center">
                    <DollarSign className="h-6 w-6 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Chiffre d'affaires</p>
                    <p className="text-2xl font-bold">{stats.totalRevenue.toFixed(2)} €</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                    <Package className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Commandes totales</p>
                    <p className="text-2xl font-bold">{stats.totalOrders}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center">
                    <DollarSign className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Panier moyen</p>
                    <p className="text-2xl font-bold">{stats.averageOrderValue.toFixed(2)} €</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center">
                    <Clock className="h-6 w-6 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">En attente</p>
                    <p className="text-2xl font-bold">{stats.pendingOrders}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Informations détaillées */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-xl shadow-sm lg:col-span-2">
                <h2 className="text-lg font-medium mb-4">Informations générales</h2>
                {isEditing ? (
                  <form className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nom du restaurant
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full px-4 py-2 border rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                        className="w-full px-4 py-2 border rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Téléphone
                      </label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                        className="w-full px-4 py-2 border rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Adresse
                        <span className="text-xs text-gray-500 ml-1">(sélectionnez dans la liste)</span>
                      </label>
                      <div className="relative">
                        <input
                          ref={addressInputRef}
                          type="text"
                          defaultValue={formData.address}
                          className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${addressError ? 'border-red-500' : 'border-gray-300'
                            }`}
                          placeholder="Entrez l'adresse du restaurant"
                          required
                        />
                        <MapPin className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                      </div>
                      {addressError && (
                        <p className="mt-1 text-sm text-red-500">{addressError}</p>
                      )}
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-gray-700 mb-2">Horaires d'ouverture</h3>
                      <div className="space-y-3">
                        {DAYS.map((day, index) => (
                          <div key={day} className="flex items-center gap-4">
                            <div className="w-32">
                              <span className="text-sm font-medium text-gray-700">
                                {day.charAt(0).toUpperCase() + day.slice(1)}
                              </span>
                            </div>

                            <label className="flex items-center">
                              <input
                                type="checkbox"
                                checked={!formData.openingHours[day]?.closed}
                                onChange={(e) => setFormData(prev => ({
                                  ...prev,
                                  openingHours: {
                                    ...prev.openingHours,
                                    [day]: {
                                      open: prev.openingHours[day]?.open || '09:00',
                                      close: prev.openingHours[day]?.close || '22:00',
                                      closed: !e.target.checked
                                    }
                                  }
                                }))}
                                className="rounded border-gray-300 text-emerald-500"
                              />
                              <span className="ml-2 text-sm text-gray-600">Ouvert</span>
                            </label>

                            {(!formData.openingHours[day]?.closed) && (
                              <div className="flex items-center gap-2">
                                <input
                                  type="time"
                                  value={formData.openingHours[day]?.open ?? '09:00'}
                                  onChange={(e) => setFormData(prev => ({
                                    ...prev,
                                    openingHours: {
                                      ...prev.openingHours,
                                      [day]: {
                                        open: e.target.value,
                                        close: prev.openingHours[day]?.close || '22:00',
                                        closed: prev.openingHours[day]?.closed || false
                                      }
                                    }
                                  }))}
                                  className="px-2 py-1 border rounded-lg text-sm"
                                />
                                <span className="text-gray-500">-</span>
                                <input
                                  type="time"
                                  value={formData.openingHours[day]?.close ?? '22:00'}
                                  onChange={(e) => setFormData(prev => ({
                                    ...prev,
                                    openingHours: {
                                      ...prev.openingHours,
                                      [day]: {
                                        open: prev.openingHours[day]?.open || '09:00',
                                        close: e.target.value,
                                        closed: prev.openingHours[day]?.closed || false
                                      }
                                    }
                                  }))}
                                  className="px-2 py-1 border rounded-lg text-sm"
                                />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => setIsEditing(false)}
                        className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                      >
                        Annuler
                      </button>
                      <button
                        type="button"
                        onClick={handleSave}
                        className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600"
                      >
                        Enregistrer
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <MapPin className="h-5 w-5 text-gray-400" />
                      <span>{restaurant.address}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Phone className="h-5 w-5 text-gray-400" />
                      <span>{restaurant.phone}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Mail className="h-5 w-5 text-gray-400" />
                      <span>{restaurant.email}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Clock className="h-5 w-5 text-gray-400" />
                      <span>Créé le {new Date(restaurant.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="mt-4">
                      <h3 className="font-medium mb-2">Horaires d'ouverture</h3>
                      <div className="space-y-2">
                        {DAYS.map((day) => (
                          <div key={day} className="flex items-center gap-4">
                            <div className="w-32">
                              <span className="text-sm font-medium">
                                {day.charAt(0).toUpperCase() + day.slice(1)}
                              </span>
                            </div>
                            {restaurant.openingHours?.[day]?.closed ? (
                              <span className="text-sm text-red-500">Fermé</span>
                            ) : (
                              <span className="text-sm text-gray-600">
                                {restaurant.openingHours?.[day]?.open || '09:00'} - {restaurant.openingHours?.[day]?.close || '22:00'}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="mt-4">
                      <button
                        onClick={() => setIsEditing(true)}
                        className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600"
                      >
                        Modifier
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm">
                <h2 className="text-lg font-medium mb-4">Statistiques</h2>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Commandes totales</span>
                    <span className="font-medium">{stats.totalOrders}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Chiffre d'affaires</span>
                    <span className="font-medium">{stats.totalRevenue.toFixed(2)} €</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Panier moyen</span>
                    <span className="font-medium">{stats.averageOrderValue.toFixed(2)} €</span>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === 'orders' && (
          <>
            {/* Onglets de statut des commandes */}
            <div className="bg-white rounded-xl shadow-sm mb-6">
              <div className="border-b">
                <nav className="flex">
                  {ORDER_STATUS_TABS.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveOrderTab(tab.id)}
                      className={`py-4 px-6 font-medium text-sm ${activeOrderTab === tab.id
                        ? 'border-b-2 border-emerald-500 text-emerald-600'
                        : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                      {tab.label}
                      <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-gray-100">
                        {filteredOrders.length}
                      </span>
                    </button>
                  ))}
                </nav>
              </div>

              {/* Liste des commandes */}
              <div className="divide-y">
                {filteredOrders.map((order) => (
                  <div key={order.id} className="p-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <span className="text-sm text-gray-500">
                          Commande #{order.orderNumber}
                        </span>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="font-medium">{order.total.toFixed(2)} €</span>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${order.status === 'completed' ? 'bg-green-100 text-green-800' :
                            order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                            {order.status}
                          </span>
                        </div>
                      </div>
                      <span className="text-sm text-gray-500">
                        {new Date(order.createdAt).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}

                {filteredOrders.length === 0 && (
                  <div className="p-8 text-center text-gray-500">
                    Aucune commande {activeOrderTab === 'pending' ? 'en attente' :
                      activeOrderTab === 'preparing' ? 'en préparation' :
                        'terminée'}
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {activeTab === 'history' && (
          <div className="bg-white rounded-xl shadow-sm">
            <div className="p-6">
              <h2 className="text-lg font-medium mb-4">Historique des commandes</h2>
              {/* Ajouter ici le composant d'historique des commandes */}
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="bg-white rounded-xl shadow-sm">
            <div className="p-6">
              <h2 className="text-lg font-medium mb-4">Paramètres du restaurant</h2>
              {/* Ajouter ici le formulaire de paramètres */}
            </div>
          </div>
        )}
      </div>
    </SuperAdminLayout>
  );
}