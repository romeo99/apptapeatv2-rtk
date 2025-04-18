import {
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip
} from 'chart.js';
import {
  BarChart3,
  Calendar,
  CreditCard,
  DollarSign,
  Download,
  FileText,
  Filter,
  Loader2,
  PieChart,
  TrendingUp
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import AdminLayout from '../../components/admin/AdminLayout';
import OrdersChart from '../../components/admin/charts/OrdersChart';
import SalesChart from '../../components/admin/charts/SalesChart';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useOrderContext } from '../../context/OrderContext';
import { useRestaurantContext } from '../../context/RestaurantContext';
import useOrderNotification from '../../hooks/useOrderNotification';
import { exportAccountingData, getAccountingData } from '../../services/accountingService';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);
const PERIODS = [
  { id: 'today', label: "Aujourd'hui" },
  { id: 'week', label: 'Cette semaine' },
  { id: 'month', label: 'Ce mois' },
  { id: 'year', label: "L'année" },
  { id: 'custom', label: 'Personnalisé' }
];

const EXPORT_FORMATS = [
  { id: 'pdf', label: 'PDF', icon: FileText },
  { id: 'csv', label: 'CSV', icon: FileText }
];

export default function Accounting() {
  const { orders } = useOrderContext();
  const { restaurant } = useRestaurantContext();
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [loading, setLoading] = useState(false);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [metrics, setMetrics] = useState({
    totalRevenue: 0 as number,
    totalComptoir: 0 as number,
    totalDeliveryFees: 0 as number,
    paymentMethodBreakdown: {} as Record<string, number>,
    orderCount: 0 as number,
    averageOrderValue: 0 as number,
    dailyRevenue: {} as Record<string, number>,
    dailyOrders: {} as Record<string, number>
  });
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  useOrderNotification();

  useEffect(() => {
    async function fetchData() {
      if (!restaurant?.id) return;

      try {
        setLoading(true);
        setError(null);

        // Ensure we have valid date range for custom period
        if (selectedPeriod === 'custom' && (!dateRange.start || !dateRange.end)) {
          return;
        }

        const data = await getAccountingData(
          restaurant.id,
          selectedPeriod,
          selectedPeriod === 'custom' ? {
            start: new Date(dateRange.start),
            end: new Date(dateRange.end)
          } : undefined
        );

        // Update metrics immediately for better UX
        setMetrics(data.metrics);
        setTransactions(data.orders);
      } catch (err) {
        console.error('Error fetching accounting data:', err);
        setError('Erreur lors du chargement des données');
      } finally {
        setLoading(false);
      }
    }

    // Fetch data immediately and set up interval for real-time updates
    fetchData();
    const interval = setInterval(fetchData, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [restaurant?.id, selectedPeriod, dateRange, orders]);

  const handleExport = async (format: string) => {
    if (!restaurant?.id) return;

    setLoading(true);
    try {
      const blob = await exportAccountingData(
        restaurant.id,
        format as 'pdf' | 'csv',
        selectedPeriod,
        selectedPeriod === 'custom' ? {
          start: new Date(dateRange.start),
          end: new Date(dateRange.end)
        } : undefined
      );

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `rapport_comptable_${selectedPeriod}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      // Show success message
      alert('Export réussi !');
    } catch (error) {
      console.error('Export error:', error);
      alert('Erreur lors de l\'export');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !metrics) {
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
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Comptabilité</h1>
              <p className="mt-1 text-sm text-gray-500">
                Gérez vos finances et générez des rapports
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="px-4 py-2 bg-white border rounded-lg hover:bg-gray-50 flex items-center gap-2"
                >
                  <Filter className="h-4 w-4" />
                  <span>Filtres</span>
                </button>

                {showFilters && (
                  <div className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-lg border p-4 z-10">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Période
                        </label>
                        <select
                          value={selectedPeriod}
                          onChange={(e) => setSelectedPeriod(e.target.value)}
                          className="w-full px-3 py-2 border rounded-lg"
                        >
                          {PERIODS.map(period => (
                            <option key={period.id} value={period.id}>
                              {period.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      {selectedPeriod === 'custom' && (
                        <div className="space-y-2">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Date de début
                            </label>
                            <input
                              type="date"
                              value={dateRange.start}
                              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                              className="w-full px-3 py-2 border rounded-lg"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Date de fin
                            </label>
                            <input
                              type="date"
                              value={dateRange.end}
                              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                              className="w-full px-3 py-2 border rounded-lg"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="relative">
                <button
                  onClick={() => handleExport('pdf')}
                  disabled={loading}
                  className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 flex items-center gap-2 disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                  <span>Exporter</span>
                </button>

                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border divide-y hidden group-hover:block">
                  {EXPORT_FORMATS.map(format => {
                    const Icon = format.icon;
                    return (
                      <button
                        key={format.id}
                        onClick={() => handleExport(format.id)}
                        className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2"
                      >
                        <Icon className="h-4 w-4" />
                        <span>Exporter en {format.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-500 rounded-lg">
            {error}
          </div>
        )}

        {metrics.orderCount === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl shadow-sm">
            <h2 className="text-xl font-medium text-gray-900 mb-4">Aucune donnée comptable</h2>
            <p className="text-gray-500">
              Les données comptables s'afficheront dès que vous recevrez votre première commande.
            </p>
          </div>
        ) : (
          <>
            {/* Métriques principales */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center">
                    <DollarSign className="h-6 w-6 text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Chiffre d'affaires</p>
                    <p className="text-2xl font-bold">{metrics.totalRevenue.toFixed(2)} €</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                    <CreditCard className="h-6 w-6 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Carte comptoire</p>
                    <p className="text-2xl font-bold">{metrics.totalComptoir.toFixed(2)} €</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 text-purple-500" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Panier moyen</p>
                    <p className="text-2xl font-bold">{metrics.averageOrderValue.toFixed(2)} €</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center">
                    <Calendar className="h-6 w-6 text-orange-500" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Commandes</p>
                    <p className="text-2xl font-bold">{metrics.orderCount}</p>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-medium mb-6">Chiffre d'affaires</h3>
            <SalesChart data={metrics.dailyRevenue} period={selectedPeriod} />
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-medium mb-6">Commandes</h3>
            <OrdersChart data={metrics.dailyOrders} period={selectedPeriod} />
          </div>
        </div>

        {/* Graphiques et analyses */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Répartition des paiements */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <PieChart className="h-5 w-5 text-emerald-500" />
                Répartition des paiements
              </h3>
            </div>
            <div className="space-y-4">
              {Object.entries(metrics.paymentMethodBreakdown || {}).map(([method, amount]) => (
                <div key={method} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      {method === 'card' ? 'Carte bancaire' :
                        method === 'cash' ? 'Espèces' : 'Apple Pay'}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-32 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500"
                        style={{
                          width: `${metrics.totalRevenue ? (amount / metrics.totalRevenue) * 100 : 0}%`
                        }}
                      />
                    </div>
                    <span className="text-sm font-medium">{amount.toFixed(2)} €</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Évolution du CA */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-emerald-500" />
                Évolution du CA
              </h3>
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="px-3 py-1.5 border rounded-lg text-sm"
              >
                <option value="day">Par jour</option>
                <option value="week">Par semaine</option>
                <option value="month">Par mois</option>
              </select>
            </div>
            <div className="h-64">
              <Line
                data={{
                  labels: Object.keys(metrics.dailyRevenue || {}).map(date =>
                    new Date(date).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'short',
                      year: '2-digit'
                    })
                  ),
                  datasets: [{
                    label: 'Chiffre d\'affaires',
                    data: Object.values(metrics.dailyRevenue || {}),
                    borderColor: '#10B981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    tension: 0.4,
                    fill: true
                  }]
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      display: false
                    }
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      grid: {
                        display: true,
                        drawBorder: false
                      },
                      ticks: {
                        callback: value => `${value}€`
                      }
                    },
                    x: {
                      grid: {
                        display: false
                      }
                    }
                  }
                }}
              />
            </div>
          </div>

          {/* Tableau des transactions */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden lg:col-span-2">
            <div className="px-6 py-5 border-b">
              <h3 className="text-lg font-semibold">Dernières transactions</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      N° Commande
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Montant
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      TVA
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Paiement
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {transactions && transactions.length > 0 ? transactions
                    .slice(0, 10)
                    .map((order) => (
                      <tr key={order.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(order.createdAt).toLocaleDateString('fr-FR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          #{order.orderNumber}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {(order?.total || 0).toFixed(2)} €
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {(order?.tax || 0).toFixed(2)} €
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {order?.paymentMethod === 'card' ? 'CB' :
                            order?.paymentMethod === 'cash' ? 'ESP' : 'AP'}
                        </td>
                      </tr>
                    )) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                        Aucune transaction pour le moment
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}