import { ChevronLeft, MapPin, Navigation } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { useOrderContext } from '../../../context/OrderContext';
import type { Order } from '../../../types/firebase';

export default function DriverHistory() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { fetchDeliveryHistory } = useOrderContext();
    const [availableOrders, setAvailableOrders] = useState<Order[]>([]);

    const updateAvailableOrders = useCallback(async () => {
        const orders = await fetchDeliveryHistory(user?.uid!);
        setAvailableOrders(orders);
    }, [fetchDeliveryHistory]);

    useEffect(() => {
        updateAvailableOrders();
    }, [updateAvailableOrders]);

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="bg-white px-4 py-4 flex items-center gap-4">
                <button
                    onClick={() => navigate('/driver/profile')}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                >
                    <ChevronLeft className="h-6 w-6" />
                </button>
                <h1 className="text-xl font-semibold">Historique des livraisons</h1>
                <p className="text-sm text-gray-500">
                    {availableOrders.length} livraison{availableOrders.length > 1 ? 's' : ''} effectuée{availableOrders.length > 1 ? 's' : ''}
                </p>
            </div>

            <div className="pt-5 px-4 pb-4">
                {
                    availableOrders.length > 0 ? (
                        <div className="space-y-4">
                            {availableOrders.map((order) => (
                                <div
                                    key={order.id}
                                    className="bg-white rounded-xl shadow-sm p-4"
                                >
                                    <div className="flex items-start justify-between mb-3">
                                        <div>
                                            <h3 className="font-medium">Commande #{order.orderNumber}</h3>
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
                                Aucune livraison effectuée
                            </h2>
                            <p className="text-gray-500">
                                Les commandes livrés apparaîtront ici
                            </p>
                        </div>
                    )
                }
            </div>
        </div >
    );
}