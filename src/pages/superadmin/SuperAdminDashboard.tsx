import { useState, useEffect } from 'react';
import { Building2, Users, DollarSign, TrendingUp, TrendingDown } from 'lucide-react';
import SuperAdminLayout from '../../components/superadmin/SuperAdminLayout';
import { getAllRestaurants, getAllUsers } from '../../services/superadminService';
import LoadingSpinner from '../../components/LoadingSpinner';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

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

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState({
    totalRestaurants: 0,
    totalUsers: 0,
    activeRestaurants: 0,
    activeUsers: 0,
    totalRevenue: 0,
    revenueGrowth: 0,
    dailyRevenue: {} as Record<string, number>,
    dailyUsers: {} as Record<string, number>
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadStats = async () => {
      try {
        setLoading(true);
        const [restaurants, users] = await Promise.all([
          getAllRestaurants(),
          getAllUsers()
        ]);

        setStats({
          totalRestaurants: restaurants.length,
          activeRestaurants: restaurants.filter(r => r.isOpen).length,
          totalUsers: users.length,
          activeUsers: users.filter(u => u.status === 'active').length,
          totalRevenue: 0, // Initialize with default values
          revenueGrowth: 0,
          dailyRevenue: {},
          dailyUsers: {}
        });
      } catch (err) {
        console.error('Error loading stats:', err);
        setError('Erreur lors du chargement des statistiques');
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  if (loading) {
    return (
      <SuperAdminLayout>
        <div className="flex items-center justify-center p-8">
          <LoadingSpinner />
        </div>
      </SuperAdminLayout>
    );
  }

  return (
    <SuperAdminLayout>
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-2xl font-bold text-gray-900">SuperAdmin Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">
            Vue d'ensemble de la plateforme
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-500 rounded-lg">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center">
                <Building2 className="h-6 w-6 text-emerald-600" />
              </div>
              <div className="flex-1 text-left">
                <h3 className="font-medium text-gray-900">Restaurants</h3>
                <p className="text-sm text-gray-500">
                  {stats.activeRestaurants} actifs sur {stats.totalRestaurants} restaurants
                </p>
              </div>              
            </div>
          </div>

          <div
            className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div className="flex-1 text-left">
                <h3 className="font-medium text-gray-900">Utilisateurs</h3>
                <p className="text-sm text-gray-500">
                  {stats.activeUsers} actifs sur {stats.totalUsers} utilisateurs
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Chiffre d'affaires</h3>
                <div className="flex items-center gap-2">
                  <p className="text-lg font-bold">{stats.totalRevenue.toFixed(2)} €</p>
                  <span className={`flex items-center text-sm ${
                    stats.revenueGrowth >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {stats.revenueGrowth >= 0 ? (
                      <TrendingUp className="h-4 w-4 mr-1" />
                    ) : (
                      <TrendingDown className="h-4 w-4 mr-1" />
                    )}
                    {Math.abs(stats.revenueGrowth)}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Graphiques */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <h3 className="text-lg font-medium mb-6">Évolution du CA</h3>
            <div className="h-64">
              <Line
                data={{
                  labels: Object.keys(stats.dailyRevenue).map(date => 
                    new Date(date).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'short'
                    })
                  ),
                  datasets: [{
                    label: 'Chiffre d\'affaires',
                    data: Object.values(stats.dailyRevenue),
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
                      ticks: {
                        callback: value => `${value}€`
                      }
                    }
                  }
                }}
              />
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm">
            <h3 className="text-lg font-medium mb-6">Nouveaux utilisateurs</h3>
            <div className="h-64">
              <Line
                data={{
                  labels: Object.keys(stats.dailyUsers).map(date => 
                    new Date(date).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'short'
                    })
                  ),
                  datasets: [{
                    label: 'Nouveaux utilisateurs',
                    data: Object.values(stats.dailyUsers),
                    borderColor: '#6366F1',
                    backgroundColor: 'rgba(99, 102, 241, 0.1)',
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
                      ticks: {
                        stepSize: 1
                      }
                    }
                  }
                }}
              />
            </div>
          </div>
        </div>

        {/* Statistiques détaillées */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <h3 className="text-lg font-medium mb-4">Restaurants</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total</span>
                <span className="font-medium">{stats.totalRestaurants}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Actifs</span>
                <span className="text-green-600 font-medium">{stats.activeRestaurants}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Inactifs</span>
                <span className="text-red-600 font-medium">
                  {stats.totalRestaurants - stats.activeRestaurants}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm">
            <h3 className="text-lg font-medium mb-4">Utilisateurs</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total</span>
                <span className="font-medium">{stats.totalUsers}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Actifs</span>
                <span className="text-green-600 font-medium">{stats.activeUsers}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Inactifs</span>
                <span className="text-red-600 font-medium">
                  {stats.totalUsers - stats.activeUsers}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </SuperAdminLayout>
  );
}