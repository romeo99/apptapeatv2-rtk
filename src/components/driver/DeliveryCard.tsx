import { MapPin, Clock, Navigation } from 'lucide-react';
import { Order } from '../../types/firebase';

interface DeliveryCardProps {
  order: Order;
  onAccept: (order: Order) => void;
}

export default function DeliveryCard({ order, onAccept }: DeliveryCardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-4 bg-emerald-50 border-b border-emerald-100">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-emerald-500" />
            <span className="text-sm text-emerald-700 font-medium">
              Nouvelle commande
            </span>
          </div>
          <span className="text-lg font-semibold text-emerald-600">
            {order.deliveryFee?.toFixed(2)} €
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start gap-3 mb-3">
          <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
          <div>
            <p className="text-sm text-gray-600 mb-1">Distance estimée</p>
            <p className="font-medium">2.5 km • ~12 min</p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <Navigation className="h-5 w-5 text-gray-400 mt-0.5" />
          <div>
            <p className="text-sm text-gray-600 mb-1">Adresse de livraison</p>
            <p className="font-medium">{order.delivery?.address}</p>
            {order.delivery?.additionalInfo && (
              <p className="text-sm text-gray-500 mt-1">
                {order.delivery.additionalInfo}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t">
        <button
          onClick={() => onAccept(order)}
          className="w-full bg-emerald-500 text-white py-3 rounded-xl font-medium hover:bg-emerald-600 transition-colors"
        >
          Accepter la livraison
        </button>
      </div>
    </div>
  );
}