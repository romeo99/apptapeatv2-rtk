import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Mail, Phone, Clock, Package, DollarSign, Star, Edit2, Save, Loader2 } from 'lucide-react';
import { doc, getDoc, collection, getDocs, query, where, orderBy, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { Line } from 'react-chartjs-2';
import SuperAdminLayout from '../../components/superadmin/SuperAdminLayout';
import LoadingSpinner from '../../components/LoadingSpinner';
import OrderHistoryItem from '../../components/user/OrderHistoryItem';

const TABS = [
  { id: 'overview', label: 'Aperçu' },
  { id: 'orders', label: 'Commandes en cours' },
  { id: 'history', label: 'Historique' }
];

export default function UserDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null); 
  const [isEditing, setIsEditing] = useState(false); 
  const [ordersList, setOrdersList] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: ''
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadUserData = async () => {
      if (!id) return;
      try {
        setLoading(true);
        setError(null);

        // Get user details
        const userDoc = await getDoc(doc(db, 'users', id));
        if (!userDoc.exists()) {
          throw new Error('Utilisateur introuvable');
        }

        const userData = {
          id: userDoc.id,
          ...userDoc.data(),
          createdAt: userDoc.data().createdAt?.toDate(),
          updatedAt: userDoc.data().updatedAt?.toDate()
        };

        // Get user's orders
        const ordersQuery = query(
          collection(db, 'users', id, 'orders'),
          orderBy('createdAt', 'desc')
        );
        const ordersSnapshot = await getDocs(ordersQuery);
        const ordersData = ordersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
          updatedAt: doc.data().updatedAt?.toDate() || new Date()
        }));

        setUser(userData);
        setOrdersList(ordersData);
        setFormData({
          firstName: userData.firstName || '',
          lastName: userData.lastName || '',
          email: userData.email || '',
          phone: userData.phone || ''
        });
      } catch (err) {
        console.error('Error loading user data:', err);
        setError(err instanceof Error ? err.message : 'Une erreur est survenue');
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, [id]);

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      const userRef = doc(db, 'users', id!);
      await updateDoc(userRef, {
        ...formData,
        updatedAt: serverTimestamp()
      });

      setIsEditing(false);
      
      // Reload user data
      const updatedDoc = await getDoc(userRef);
      const updatedData = {
        id: updatedDoc.id,
        ...updatedDoc.data(),
        createdAt: updatedDoc.data()?.createdAt?.toDate(),
        updatedAt: updatedDoc.data()?.updatedAt?.toDate()
      };
      setUser(updatedData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setSaving(false);
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

  if (error || !user) {
    return (
      <SuperAdminLayout>
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <p className="text-red-500">{error || 'Utilisateur introuvable'}</p>
            <button
              onClick={() => navigate('/superadmin/users')}
              className="mt-4 px-4 py-2 bg-emerald-500 text-white rounded-lg"
            >
              Retour à la liste
            </button>
          </div>
        </div>
      </SuperAdminLayout>
    );
  }

  // Filter orders based on status
  const activeOrders = ordersList.filter(order => 
    !['completed', 'cancelled'].includes(order.status)
  ); 

  const completedOrders = ordersList.filter(order =>
    order.status === 'completed'
  );


  // Calculate total spent from completed orders only
  const totalSpent = ordersList.filter(order => order.status === 'completed').reduce((sum, order) => {
    // Only count completed orders, not cancelled ones
    if (order.status === 'completed') {
      return sum + (order.total || 0);
    }
    return sum;
  }, 0);

  // Calculate average order value
  const completedOrdersCount = ordersList.filter(order => order.status === 'completed').length;
  const averageOrderValue = completedOrdersCount > 0 
    ? totalSpent / completedOrdersCount 
    : 0;

  return (
    <SuperAdminLayout>
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6 flex items-center gap-4">
            <button
              onClick={() => navigate('/superadmin/users')}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {user.firstName} {user.lastName}
              </h1>
              <div className="flex items-center gap-4 mt-1">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  user.status === 'active'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {user.status === 'active' ? 'Actif' : 'Inactif'}
                </span>
                <span className="text-sm text-gray-500">
                  Inscrit le {new Date(user.createdAt).toLocaleDateString()}
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
                  {tab.id === 'orders' && activeOrders.length > 0 && (
                    <span className="ml-2 px-2 py-0.5 text-xs bg-emerald-100 text-emerald-600 rounded-full">
                      {activeOrders.length}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && (
          <>
            {/* Statistiques */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white p-6 rounded-xl shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center">
                    <Package className="h-6 w-6 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Commandes totales</p>
                    <p className="text-2xl font-bold">{ordersList.length}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                    <DollarSign className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total dépensé</p>
                    <div>
                      <p className="text-2xl font-bold">{totalSpent.toFixed(2)} €</p>
                      <p className="text-xs text-gray-500">
                        Panier moyen: {averageOrderValue.toFixed(2)} €
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center">
                    <Star className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Note moyenne</p>
                    <p className="text-2xl font-bold">4.5</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Informations utilisateur */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-medium">Informations personnelles</h2>
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg"
                >
                  <Edit2 className="h-5 w-5" />
                </button>
              </div>

              {isEditing ? (
                <form className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Prénom
                      </label>
                      <input
                        type="text"
                        value={formData.firstName}
                        onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                        className="w-full px-4 py-2 border rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nom
                      </label>
                      <input
                        type="text"
                        value={formData.lastName}
                        onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                        className="w-full px-4 py-2 border rounded-lg"
                      />
                    </div>
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
                      disabled={saving}
                      className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 disabled:opacity-50 flex items-center gap-2"
                    >
                      {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                      <Save className="h-5 w-5" />
                      {saving ? 'Enregistrement...' : 'Enregistrer'}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-gray-400" />
                    <span>{user.email}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="h-5 w-5 text-gray-400" />
                    <span>{user.phone || 'Non renseigné'}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-gray-400" />
                    <span>Dernière connexion le {new Date(user.lastLoginAt).toLocaleString()}</span>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {activeTab === 'orders' && (
          <div className="space-y-4">
            {activeOrders.length > 0 ? (
              activeOrders.map(order => (
                <OrderHistoryItem 
                  key={order.id} 
                  order={order}
                  showActions={false}
                />
              ))
            ) : (
              <div className="bg-white rounded-xl shadow-sm p-8 text-center">
                <p className="text-gray-500">Aucune commande en cours</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <div className="space-y-4">
            {completedOrders.length > 0 ? (
              completedOrders.map(order => (
                <OrderHistoryItem 
                  key={order.id} 
                  order={order}
                  showActions={false}
                />
              ))
            ) : (
              <div className="bg-white rounded-xl shadow-sm p-8 text-center">
                <p className="text-gray-500">Aucun historique de commande</p>
              </div>
            )}
          </div>
        )}
      </div>
    </SuperAdminLayout>
  );
}