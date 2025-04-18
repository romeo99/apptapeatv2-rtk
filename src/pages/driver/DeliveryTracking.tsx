import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, MapPin, Package, CheckCircle, Navigation2, Clock } from 'lucide-react';
import { useOrderContext } from '../../context/OrderContext';
import LoadingSpinner from '../../components/LoadingSpinner';
import ActiveDelivery from '../../components/driver/ActiveDelivery';

const RESTAURANT_ADDRESS = "85 Rue Ferrari, 13005 Marseille";

export default function DeliveryTracking() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { orders, updateOrderStatus } = useOrderContext();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deliveryStep, setDeliveryStep] = useState<'pickup' | 'delivery'>('pickup');

  const order = orders.find(o => o.id === orderId);

  useEffect(() => {
    if (!order) {
      navigate('/driver');
      return;
    }
    setLoading(false);
  }, [order, navigate]);

  const handleNextStep = async () => {
    if (!order) return;

    try {
      if (deliveryStep === 'pickup') {
        await updateOrderStatus(order.id, 'delivering');
        setDeliveryStep('delivery');
      } else {
        await updateOrderStatus(order.id, 'delivered');
        navigate('/driver');
      }
    } catch (err) {
      console.error('Error updating delivery status:', err);
      setError('Une erreur est survenue lors de la mise à jour du statut');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500">Commande introuvable</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="fixed top-0 left-0 right-0 bg-white shadow-sm z-40">
        <div className="px-4 py-3">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/driver')}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <div>
              <h1 className="text-lg font-semibold">Livraison #{order.id.slice(-5)}</h1>
              <p className="text-sm text-gray-500">
                {order.delivery?.address}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="pt-16 px-4 pb-4">
        {error && (
          <div className="mb-4 p-4 bg-red-50 text-red-500 rounded-lg">
            {error}
          </div>
        )}

        <ActiveDelivery
          order={order}
          deliveryStep={deliveryStep}
          onNextStep={handleNextStep}
        />

        <div className="mt-4 bg-white rounded-xl shadow-sm p-4">
          <h2 className="font-medium mb-3">Détails de la commande</h2>
          <div className="space-y-2">
            {order.items.map((item, index) => (
              <div key={index} className="flex justify-between text-sm">
                <span>{item.quantity}x {item.name}</span>
                <span>{(item.price * item.quantity).toFixed(2)} €</span>
              </div>
            ))}
            <div className="pt-2 border-t mt-2">
              <div className="flex justify-between font-medium">
                <span>Total</span>
                <span>{order.total.toFixed(2)} €</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}