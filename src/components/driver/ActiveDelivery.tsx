import { MapPin, Package, CheckCircle, Navigation2, Clock } from 'lucide-react';
import { Order } from '../../types/firebase';
import DeliveryMap from './DeliveryMap';

interface ActiveDeliveryProps {
  order: Order;
  deliveryStep: 'pickup' | 'delivery';
  onNextStep: () => void;
}

const RESTAURANT_ADDRESS = "85 Rue Ferrari, 13005 Marseille";

export default function ActiveDelivery({ order, deliveryStep, onNextStep }: ActiveDeliveryProps) {
  return (
    <div className="space-y-4">
      {/* Progress Steps */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex-1 flex items-center">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            deliveryStep === 'pickup' ? 'bg-emerald-500 text-white' : 'bg-emerald-100 text-emerald-500'
          }`}>
            <Package className="h-4 w-4" />
          </div>
          <div className={`flex-1 h-1 ${
            deliveryStep === 'pickup' ? 'bg-gray-200' : 'bg-emerald-500'
          }`} />
        </div>
        <div className="flex-1 flex items-center">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            deliveryStep === 'delivery' ? 'bg-emerald-500 text-white' : 'bg-emerald-100 text-emerald-500'
          }`}>
            <Navigation2 className="h-4 w-4" />
          </div>
        </div>
      </div>

      {/* Map */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <DeliveryMap
          origin={RESTAURANT_ADDRESS}
          destination={order.delivery?.address || ''}
          isPickup={deliveryStep === 'pickup'}
        />
      </div>

      {/* Current Step Info */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium">
            {deliveryStep === 'pickup' ? 'Récupération' : 'Livraison'}
          </h3>
          <div className="flex items-center gap-2 text-emerald-600">
            <Clock className="h-4 w-4" />
            <span className="text-sm font-medium">12 min</span>
          </div>
        </div>

        <div className="flex items-start gap-3 mb-4">
          <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
          <div>
            <p className="text-sm text-gray-600 mb-1">
              {deliveryStep === 'pickup' ? 'Adresse du restaurant' : 'Adresse de livraison'}
            </p>
            <p className="font-medium">
              {deliveryStep === 'pickup' ? RESTAURANT_ADDRESS : order.delivery?.address}
            </p>
            {deliveryStep === 'delivery' && order.delivery?.additionalInfo && (
              <p className="text-sm text-gray-500 mt-1">
                {order.delivery.additionalInfo}
              </p>
            )}
          </div>
        </div>

        <button
          onClick={onNextStep}
          className="w-full bg-emerald-500 text-white py-3 rounded-xl font-medium hover:bg-emerald-600 transition-colors flex items-center justify-center gap-2"
        >
          {deliveryStep === 'pickup' ? (
            <>
              <Package className="h-5 w-5" />
              J'ai récupéré la commande
            </>
          ) : (
            <>
              <CheckCircle className="h-5 w-5" />
              Valider la livraison
            </>
          )}
        </button>
      </div>
    </div>
  );
}