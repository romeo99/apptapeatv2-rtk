import { useState } from 'react';
import { useOrderContext } from '../../context/OrderContext';
import { Clock, Package, CheckCircle } from 'lucide-react';
import LoadingSpinner from '../LoadingSpinner';

export default function RecentOrders() {
  const { orders, loading, error } = useOrderContext();
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="text-red-500 text-center">
        {error}
      </div>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'preparing':
        return <Package className="h-5 w-5 text-purple-500" />;
      case 'ready':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      default:
        return null;
    }
  };

  const filteredOrders = selectedStatus 
    ? orders.filter(order => order.status === selectedStatus)
    : orders;

  const ordersByStatus = {
    pending: orders.filter(order => order.status === 'pending'),
    preparing: orders.filter(order => order.status === 'preparing'),
    ready: orders.filter(order => order.status === 'ready')
  };

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="p-4 border-b">
        <h2 className="text-lg font-medium">Commandes récentes</h2>
      </div>

      <div className="border-b">
        <div className="flex">
          <button
            onClick={() => setSelectedStatus(null)}
            className={`flex-1 px-4 py-2 text-sm font-medium ${
              !selectedStatus ? 'border-b-2 border-emerald-500 text-emerald-600' : 'text-gray-500'
            }`}
          >
            Toutes ({orders.length})
          </button>
          <button
            onClick={() => setSelectedStatus('pending')}
            className={`flex-1 px-4 py-2 text-sm font-medium ${
              selectedStatus === 'pending' ? 'border-b-2 border-emerald-500 text-emerald-600' : 'text-gray-500'
            }`}
          >
            En attente ({ordersByStatus.pending.length})
          </button>
          <button
            onClick={() => setSelectedStatus('preparing')}
            className={`flex-1 px-4 py-2 text-sm font-medium ${
              selectedStatus === 'preparing' ? 'border-b-2 border-emerald-500 text-emerald-600' : 'text-gray-500'
            }`}
          >
            En préparation ({ordersByStatus.preparing.length})
          </button>
          <button
            onClick={() => setSelectedStatus('ready')}
            className={`flex-1 px-4 py-2 text-sm font-medium ${
              selectedStatus === 'ready' ? 'border-b-2 border-emerald-500 text-emerald-600' : 'text-gray-500'
            }`}
          >
            Prêtes ({ordersByStatus.ready.length})
          </button>
        </div>
      </div>

      <div className="divide-y">
        {filteredOrders.map((order) => (
          <div key={order.id} className="p-4 hover:bg-gray-50">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {getStatusIcon(order.status)}
                <span className="font-medium">Commande #{order.id.slice(-5)}</span>
              </div>
              <span className="text-emerald-600 font-medium">
                {order.total.toFixed(2)} €
              </span>
            </div>
            <div className="space-y-1">
              {order.items.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  {item.image && (
                    <img 
                      src={item.image} 
                      alt={item.name}
                      className="w-10 h-10 object-cover rounded-lg"
                    />
                  )}
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">
                        {item.quantity}x {item.name}
                      </span>
                      <span className="text-sm text-gray-600">
                        {(item.price * item.quantity).toFixed(2)} €
                      </span>
                    </div>
                    {item.menuOptions && (
                      <div className="text-xs text-gray-500">
                        {item.menuOptions.drink && `Boisson: ${item.menuOptions.drink}`}
                        {item.menuOptions.side && `, Accompagnement: ${item.menuOptions.side}`}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {filteredOrders.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            Aucune commande {selectedStatus ? `${selectedStatus}` : ''}
          </div>
        )}
      </div>
    </div>
  );
}