import { Bike, CheckCircle, CreditCard, Filter, Search, ShoppingBag, UtensilsCrossed, XCircle } from 'lucide-react';
import { useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import OrderHistoryItem from '../../components/admin/OrderHistoryItem';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useRestaurantContext } from '../../context/RestaurantContext';
import { useOrderFilters } from '../../hooks/useOrderFilters';
import { useOrderHistory } from '../../hooks/useOrderHistory';
import useOrderNotification from '../../hooks/useOrderNotification';

const STATUS_COLORS = {
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800'
};

export default function OrderHistory() {
  const { restaurant } = useRestaurantContext();
  const { orders, loading, error } = useOrderHistory(restaurant?.id || '');
  const { filters, setters, filteredOrders } = useOrderFilters(orders);
  const [showFilters, setShowFilters] = useState(false);

  useOrderNotification();

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
          <h1 className="text-2xl font-bold text-gray-900">Historique des commandes</h1>
          <p className="mt-1 text-sm text-gray-500">
            {filteredOrders.length} commande{filteredOrders.length > 1 ? 's' : ''}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-500 rounded-lg">
            {error}
          </div>
        )}

        <div className="mb-6 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Rechercher une commande..."
                value={filters.searchQuery}
                onChange={(e) => setters.setSearchQuery(e.target.value)}
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
              {(filters.selectedPaymentMethod || filters.selectedOrderType || filters.selectedStatus || filters.dateRange.start) && (
                <span className="ml-1 px-2 py-0.5 text-xs bg-emerald-500 text-white rounded-full">
                  {[
                    filters.selectedPaymentMethod && 1,
                    filters.selectedOrderType && 1,
                    filters.selectedStatus && 1,
                    filters.dateRange.start && 1
                  ].filter(Boolean).length}
                </span>
              )}
            </button>
          </div>

          {showFilters && (
            <div className="bg-white rounded-lg shadow-sm p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Période
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="date"
                    value={filters.dateRange.start}
                    onChange={(e) => setters.setDateRange(prev => ({ ...prev, start: e.target.value }))}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                  <input
                    type="date"
                    value={filters.dateRange.end}
                    onChange={(e) => setters.setDateRange(prev => ({ ...prev, end: e.target.value }))}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Moyen de paiement
                </label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: 'card', name: 'Carte bancaire', icon: CreditCard },
                    { id: 'cash', name: 'Espèces', icon: CreditCard },
                    { id: 'apple_pay', name: 'Apple Pay', icon: CreditCard }
                  ].map((method) => {
                    const Icon = method.icon;
                    return (
                      <button
                        key={method.id}
                        onClick={() => setters.setSelectedPaymentMethod(
                          filters.selectedPaymentMethod === method.id ? null : method.id
                        )}
                        className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${filters.selectedPaymentMethod === method.id
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                      >
                        <Icon className="h-4 w-4 mr-1" />
                        {method.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type de commande
                </label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: 'dine_in', name: 'Sur place', icon: UtensilsCrossed },
                    { id: 'takeaway', name: 'À emporter', icon: ShoppingBag },
                    { id: 'delivery', name: 'Livraison', icon: Bike }
                  ].map((type) => {
                    const Icon = type.icon;
                    return (
                      <button
                        key={type.id}
                        onClick={() => setters.setSelectedOrderType(
                          filters.selectedOrderType === type.id ? null : type.id
                        )}
                        className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${filters.selectedOrderType === type.id
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                      >
                        <Icon className="h-4 w-4 mr-1" />
                        {type.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Statut
                </label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: 'completed', name: 'Terminée', icon: CheckCircle },
                    { id: 'cancelled', name: 'Annulée', icon: XCircle }
                  ].map((status) => {
                    const Icon = status.icon;
                    return (
                      <button
                        key={status.id}
                        onClick={() => setters.setSelectedStatus(
                          filters.selectedStatus === status.id ? null : status.id
                        )}
                        className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${filters.selectedStatus === status.id
                          ? STATUS_COLORS[status.id as keyof typeof STATUS_COLORS]
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                      >
                        <Icon className="h-4 w-4 mr-1" />
                        {status.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <OrderHistoryItem key={order.id} order={order} />
          ))}

          {filteredOrders.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">Aucune commande trouvée</p>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}