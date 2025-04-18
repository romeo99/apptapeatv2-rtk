import { useState } from 'react';
import { useOrderContext } from '../context/OrderContext';
import { useRestaurantContext } from '../context/RestaurantContext';
import { Clock, Package, CheckCircle, XCircle } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  preparing: 'bg-purple-100 text-purple-800',
  ready: 'bg-green-100 text-green-800',
  completed: 'bg-gray-100 text-gray-600',
  cancelled: 'bg-red-100 text-red-800'
};

export default function AdminDashboard() {
  const { orders, loading, error, updateOrderStatus } = useOrderContext();
  const { restaurant } = useRestaurantContext();
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-red-500 mb-2">{error}</p>
        </div>
      </div>
    );
  }

  const filteredOrders = selectedStatus
    ? orders.filter(order => order.status === selectedStatus)
    : orders;

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      await updateOrderStatus(orderId, newStatus as any);
    } catch (err) {
      console.error('Failed to update order status:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {restaurant?.name || 'Dashboard'}
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Gestion des commandes en temps réel
              </p>
            </div>
            <div className="flex items-center gap-4">
              <select
                value={selectedStatus || ''}
                onChange={(e) => setSelectedStatus(e.target.value || null)}
                className="rounded-lg border-gray-300 text-sm"
              >
                <option value="">Tous les statuts</option>
                <option value="pending">En attente</option>
                <option value="confirmed">Confirmées</option>
                <option value="preparing">En préparation</option>
                <option value="ready">Prêtes</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredOrders.map((order) => (
            <div
              key={order.id}
              className="bg-white rounded-xl shadow-sm overflow-hidden"
            >
              <div className="p-4">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="text-sm text-gray-500">
                      Commande #{order.id.slice(-5)}
                    </span>
                    <div className="mt-1">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        statusColors[order.status]
                      }`}>
                        {order.status === 'pending' && <Clock className="w-3 h-3 mr-1" />}
                        {order.status === 'preparing' && <Package className="w-3 h-3 mr-1" />}
                        {order.status === 'ready' && <CheckCircle className="w-3 h-3 mr-1" />}
                        {order.status === 'cancelled' && <XCircle className="w-3 h-3 mr-1" />}
                        {order.status}
                      </span>
                    </div>
                  </div>
                  <span className="font-medium">{order.total.toFixed(2)} €</span>
                </div>

                <div className="space-y-2 mb-4">
                  {order.items.map((item, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span className="text-gray-600">
                        {item.quantity}x {item.name}
                      </span>
                      <span className="text-gray-900">
                        {(item.price * item.quantity).toFixed(2)} €
                      </span>
                    </div>
                  ))}
                </div>

                <div className="space-y-2">
                  {order.status === 'pending' && (
                    <button
                      onClick={() => handleStatusChange(order.id, 'confirmed')}
                      className="w-full bg-emerald-500 text-white py-2 rounded-lg text-sm font-medium"
                    >
                      Confirmer
                    </button>
                  )}
                  {order.status === 'confirmed' && (
                    <button
                      onClick={() => handleStatusChange(order.id, 'preparing')}
                      className="w-full bg-purple-500 text-white py-2 rounded-lg text-sm font-medium"
                    >
                      Commencer la préparation
                    </button>
                  )}
                  {order.status === 'preparing' && (
                    <button
                      onClick={() => handleStatusChange(order.id, 'ready')}
                      className="w-full bg-green-500 text-white py-2 rounded-lg text-sm font-medium"
                    >
                      Marquer comme prête
                    </button>
                  )}
                  {order.status === 'ready' && (
                    <button
                      onClick={() => handleStatusChange(order.id, 'completed')}
                      className="w-full bg-gray-500 text-white py-2 rounded-lg text-sm font-medium"
                    >
                      Terminer la commande
                    </button>
                  )}
                  {['pending', 'confirmed'].includes(order.status) && (
                    <button
                      onClick={() => handleStatusChange(order.id, 'cancelled')}
                      className="w-full bg-red-500 text-white py-2 rounded-lg text-sm font-medium"
                    >
                      Annuler
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}