import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Navigation, Power, Clock } from 'lucide-react';
import { useOrderContext } from '../../context/OrderContext';
import type { Order } from '../../types/firebase';

export default function DriverDashboard() {
  const navigate = useNavigate();
  const { getDeliveryOrders, updateOrderStatus } = useOrderContext();
  const [isOnline, setIsOnline] = useState(true);
  const [availableOrders, setAvailableOrders] = useState<Order[]>([]);

  const updateAvailableOrders = useCallback(() => {
    if (isOnline) {
      const orders = getDeliveryOrders();
      setAvailableOrders(orders);
    } else {
      setAvailableOrders([]);
    }
  }, [isOnline, getDeliveryOrders]);

  useEffect(() => {
    updateAvailableOrders();
    
    const intervalId = setInterval(updateAvailableOrders, 3000);
    const handleOrdersUpdate = () => updateAvailableOrders();
    
    window.addEventListener('ordersUpdated', handleOrdersUpdate);
    
    return () => {
      clearInterval(intervalId);
      window.removeEventListener('ordersUpdated', handleOrdersUpdate);
    };
  }, [updateAvailableOrders]);

  const handleAcceptDelivery = async (order: Order) => {
    try {
      await updateOrderStatus(order.id, 'delivering', 'driver-1');
      navigate(`/driver/delivery/${order.id}`);
    } catch (err) {
      console.error('Error accepting delivery:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="fixed top-0 left-0 right-0 bg-white shadow-sm z-40">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-semibold">Livraisons disponibles</h1>
              <p className="text-sm text-gray-500">
                {availableOrders.length} commande{availableOrders.length !== 1 ? 's' : ''} en attente
              </p>
            </div>
            <button
              onClick={() => setIsOnline(!isOnline)}
              className={`px-4 py-2 rounded-full flex items-center gap-2 ${
                isOnline 
                  ? 'bg-emerald-500 text-white' 
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              <Power className="h-4 w-4" />
              <span>{isOnline ? 'En ligne' : 'Hors ligne'}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="pt-20 px-4 pb-4">
        {isOnline ? (
          availableOrders.length > 0 ? (
            <div className="space-y-4">
              {availableOrders.map((order) => (
                <div 
                  key={order.id}
                  className="bg-white rounded-xl shadow-sm p-4"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-medium">Commande #{order.id.slice(-5)}</h3>
                      <div className="flex items-center gap-1 text-sm text-emerald-500 mt-1">
                        <Clock className="h-4 w-4" />
                        <span>Préparation en cours</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                        <MapPin className="h-4 w-4" />
                        <span>{order.delivery?.address}</span>
                      </div>
                    </div>
                    <span className="font-medium text-emerald-600">
                      {order.deliveryFee?.toFixed(2)} €
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-500">
                      {order.items.length} article{order.items.length > 1 ? 's' : ''}
                    </div>
                    <button
                      onClick={() => handleAcceptDelivery(order)}
                      className="px-4 py-2 bg-emerald-500 text-white rounded-lg text-sm hover:bg-emerald-600 flex items-center gap-2"
                    >
                      <Navigation className="h-4 w-4" />
                      Accepter la livraison
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Navigation className="h-8 w-8 text-gray-400" />
              </div>
              <h2 className="text-lg font-medium text-gray-900 mb-2">
                Aucune livraison disponible
              </h2>
              <p className="text-gray-500">
                Les nouvelles commandes apparaîtront ici
              </p>
            </div>
          )
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Power className="h-8 w-8 text-gray-400" />
            </div>
            <h2 className="text-lg font-medium text-gray-900 mb-2">
              Vous êtes hors ligne
            </h2>
            <p className="text-gray-500">
              Passez en ligne pour recevoir des livraisons
            </p>
          </div>
        )}
      </div>
    </div>
  );
}