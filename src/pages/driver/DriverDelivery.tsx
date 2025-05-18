import { AlertCircle, CheckCircle, ChevronLeft, MapPin, Navigation, Phone } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useOrderContext } from '../../context/OrderContext';
import { Order } from '../../types/firebase';

export default function DriverDelivery() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { updateDeliveryOrderStatus, fetchDeliveryOrders } = useOrderContext();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState<Order>();

  //const order = orders.find(o => o.id === orderId);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const orders = await fetchDeliveryOrders();
        setOrder(orders.find(o => o.id === orderId));
      } catch (err) {
        console.error('Error fetching orders:', err);
        setError('Erreur lors de la récupération des commandes');
      }
    };

    fetchOrders();

    const handleOrdersUpdated = () => {
      fetchOrders();
    };

    window.addEventListener('ordersUpdated', handleOrdersUpdated);

    return () => {
      window.removeEventListener('ordersUpdated', handleOrdersUpdated);
    };
  }, [fetchDeliveryOrders]);

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-10 w-10 text-red-500 mx-auto mb-2" />
          <p className="text-gray-500">Commande introuvable</p>
        </div>
      </div>
    );
  }

  const handleDeliveryComplete = async () => {
    try {
      setLoading(true);
      setError(null);
      await updateDeliveryOrderStatus(order.id, 'delivered');
      navigate('/driver');
    } catch (err) {
      console.error('Error completing delivery:', err);
      setError('Erreur lors de la validation de la livraison');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/driver')}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <div>
              <h1 className="text-xl font-semibold">Livraison #{order.orderNumber}</h1>
              <p className="text-sm text-gray-500">
                {order.delivery?.name} - {order.delivery?.phone}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Carte statique de l'adresse */}
        <div className="mb-6 rounded-lg overflow-hidden">
          <img
            src={`https://maps.googleapis.com/maps/api/staticmap?center=${encodeURIComponent(order.delivery?.deliveryAddress!)}&zoom=15&size=600x300&key=AIzaSyBi3DoK4uEJmMfyjnSCLoQ_hxIv-h-Cbf4&markers=${encodeURIComponent(order.delivery?.deliveryAddress!)}`}
            alt="Carte de livraison"
            className="w-full h-[300px] object-cover"
          />
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <div className="font-medium">{order.delivery?.address}</div>
                {order.delivery?.additionalInfo && (
                  <div className="text-sm text-gray-500">
                    {order.delivery.additionalInfo}
                  </div>
                )}
              </div>
            </div>

            {order.delivery?.phone && (
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-gray-400" />
                <a
                  href={`tel:${order.delivery.phone}`}
                  className="text-emerald-500"
                >
                  {order.delivery.phone}
                </a>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <h2 className="font-medium mb-4">Détails de la commande</h2>
          <div className="space-y-2">
            {order.items.map((item, index) => (
              <div key={index} className="flex justify-between">
                <span>{item.quantity}x {item.name}</span>
                <span>{(item.price * item.quantity).toFixed(2)} €</span>
              </div>
            ))}
            <div className="pt-2 border-t mt-2">
              <div className="flex justify-between font-medium">
                <span>Frais de livraison</span>
                <span>{order.deliveryFee!.toFixed(2)} €</span>
              </div>
            </div>
            <div className="pt-2 border-t mt-2">
              <div className="flex justify-between font-medium">
                <span>Total</span>
                <span>{order.total.toFixed(2)} €</span>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-500 rounded-lg">
            {error}
          </div>
        )}

        <div className="space-y-3">
          <a
            href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(order.delivery?.deliveryAddress!)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full bg-emerald-500 text-white py-3 rounded-lg flex items-center justify-center gap-2"
          >
            <Navigation className="h-5 w-5" />
            Ouvrir dans Google Maps
          </a>

          <button
            onClick={handleDeliveryComplete}
            disabled={loading}
            className="w-full bg-emerald-100 text-emerald-700 py-3 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <LoadingSpinner />
            ) : (
              <CheckCircle className="h-5 w-5" />
            )}
            {loading ? 'Validation...' : 'Valider la livraison'}
          </button>
        </div>
      </div>
    </div>
  );
}