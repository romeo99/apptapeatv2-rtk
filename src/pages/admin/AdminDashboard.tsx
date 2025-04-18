import { Clock, DollarSign, ShoppingBag, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout';
import OrdersChart from '../../components/admin/charts/OrdersChart';
import SalesChart from '../../components/admin/charts/SalesChart';
import TopProducts from '../../components/admin/TopProducts';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useOrderContext } from '../../context/OrderContext';
import { useRestaurantContext } from '../../context/RestaurantContext';
import useOrderNotification from '../../hooks/useOrderNotification';
import { checkImpersonation, signInWithImpersonationToken } from '../../services/authService';
import { getDashboardStats } from '../../services/dashboardService';
import Receipt from '../../components/Receipt';

export default function AdminDashboard() {
  const { restaurant } = useRestaurantContext();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [selectedPeriod, setSelectedPeriod] = useState('week');
  const navigate = useNavigate();
  const { orders } = useOrderContext();
  const [refreshKey, setRefreshKey] = useState(0);

  const { contentRef, orderToPrint } = useOrderNotification();

  const handlePeriodChange = async (period: string) => {
    try {
      setLoading(true);
      setError(null);
      setSelectedPeriod(period);
      const data = await getDashboardStats(restaurant.id, period);
      setStats(data);
    } catch (err) {
      console.error('Error loading stats:', err);
      setError('Erreur lors du chargement des statistiques');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Check for impersonation token in URL
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');

    if (token) {
      const handleImpersonation = async () => {
        try {
          await signInWithImpersonationToken(token);
          // Remove token from URL
          const newUrl = window.location.pathname;
          window.history.replaceState({}, '', newUrl);
          // Force reload to apply impersonation
          window.location.reload();
        } catch (error) {
          console.error('Impersonation failed:', error);
          navigate('/superadmin/restaurants');
        }
      };
      handleImpersonation();
    }
  }, [navigate]);

  // Check impersonation status
  const impersonationData = checkImpersonation();
  const isImpersonating = !!impersonationData;

  // Refresh stats when orders change
  useEffect(() => {
    setRefreshKey(prev => prev + 1);
  }, [orders]);

  useEffect(() => {
    if (!restaurant?.id) return;

    const loadStats = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getDashboardStats(restaurant.id, selectedPeriod);
        setStats(data);
      } catch (err) {
        console.error('Error loading dashboard stats:', err);
        setError('Erreur lors du chargement des statistiques');
      } finally {
        setLoading(false);
      }
    };

    loadStats();

    // Refresh stats every minute
    const interval = setInterval(loadStats, 60000);
    return () => clearInterval(interval);
  }, [restaurant?.id, selectedPeriod, refreshKey]);

  if (!restaurant?.id) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <p className="text-red-500">Restaurant non trouvé</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (loading && !stats) {
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
            <button
              onClick={() => setSelectedPeriod(selectedPeriod)}
              className="mt-4 px-4 py-2 bg-emerald-500 text-white rounded-lg"
            >
              Réessayer
            </button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
          <div className="mt-2 flex items-center gap-4">
            <select
              value={selectedPeriod}
              onChange={(e) => {
                const newPeriod = e.target.value;
                handlePeriodChange(newPeriod);
              }}
              className="px-3 py-1.5 border rounded-lg text-sm"
            >
              <option value="today">Aujourd'hui</option>
              <option value="week">Cette semaine</option>
              <option value="month">Ce mois</option>
              <option value="year">Cette année</option>
            </select>
          </div>
        </div>
        {orderToPrint && (
          <Receipt
            ref={contentRef}
            order={orderToPrint}
          />
        )}

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {stats.totalOrders === 0 ? (
            <div className="mt-8 text-center py-12 bg-white rounded-xl shadow-sm">
              <h2 className="text-xl font-medium text-gray-900 mb-4">Aucune donnée disponible</h2>
              <p className="text-gray-500 mb-6">
                Les statistiques s'afficheront dès que vous recevrez votre première commande.
              </p>
              <button
                onClick={() => navigate('/admin/live-orders')}
                className="px-6 py-3 bg-emerald-500 text-white rounded-xl font-medium hover:bg-emerald-600"
              >
                Voir les commandes
              </button>
            </div>
          ) : (
            <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {/* Ventes du jour */}
              <div className="bg-white overflow-hidden shadow-sm rounded-lg border-2 border-emerald-500">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <DollarSign className="h-6 w-6 text-emerald-600" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Ventes du jour
                        </dt>
                        <dd className="flex items-baseline">
                          <div className="text-2xl font-semibold text-gray-900">
                            {stats?.totalRevenue.toFixed(2)} €
                          </div>
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              {/* Commandes du jour */}
              <div className="bg-white overflow-hidden shadow-sm rounded-lg border-2 border-emerald-500">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <ShoppingBag className="h-6 w-6 text-emerald-600" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Commandes du jour
                        </dt>
                        <dd className="flex items-baseline">
                          <div className="text-2xl font-semibold text-gray-900">
                            {stats?.totalOrders}
                          </div>
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              {/* Panier moyen */}
              <div className="bg-white overflow-hidden shadow-sm rounded-lg border-2 border-emerald-500">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <Users className="h-6 w-6 text-emerald-600" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Panier moyen
                        </dt>
                        <dd className="flex items-baseline">
                          <div className="text-2xl font-semibold text-gray-900">
                            {stats?.averageOrderValue.toFixed(2)} €
                          </div>
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              {/* Commandes en cours */}
              <div className="bg-white overflow-hidden shadow-sm rounded-lg border-2 border-emerald-500">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <Clock className="h-6 w-6 text-emerald-600" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Commandes en cours
                        </dt>
                        <dd className="flex items-baseline">
                          <div className="text-2xl font-semibold text-gray-900">
                            {stats?.pendingOrders}
                          </div>
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Graphiques */}
          <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-lg font-medium mb-6">Chiffre d'affaires</h3>
              <SalesChart data={stats?.dailyRevenue} period={selectedPeriod} />
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-lg font-medium mb-6">Commandes</h3>
              <OrdersChart data={stats?.dailyOrders} period={selectedPeriod} />
            </div>
          </div>

          {/* Produits les plus vendus */}
          <div className="mt-8 bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-medium mb-6">Produits les plus vendus</h3>
            <TopProducts products={stats?.topProducts} />
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}