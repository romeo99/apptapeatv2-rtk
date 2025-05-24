import { ChevronLeft, MapPin, Navigation } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AdminLayout from '../../../components/admin/AdminLayout';
import { useOrderContext } from '../../../context/OrderContext';
import type { Order } from '../../../types/firebase';

export default function DriverAdminHistory() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { fetchDeliveryHistory } = useOrderContext();
    const [availableOrders, setAvailableOrders] = useState<Order[]>([]);

    const updateAvailableOrders = useCallback(async () => {
        const orders = await fetchDeliveryHistory(id!);
        setAvailableOrders(orders);
    }, [fetchDeliveryHistory, id]);

    useEffect(() => {
        updateAvailableOrders();
    }, [updateAvailableOrders]);

    return (
        <AdminLayout>
            <div className="min-h-screen bg-gray-50">
                <div className="bg-white shadow">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                        <div className="flex justify-between items-center">
                            <button
                                onClick={() => navigate(-1)}
                                className="p-2 hover:bg-gray-100 rounded-lg"
                            >
                                <ChevronLeft className="h-6 w-6" />
                            </button>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Historique du Livreur</h1>

                            </div>
                            <p className="text-sm text-gray-500">
                                {availableOrders.length} livraison{availableOrders.length > 1 ? 's' : ''} effectuée{availableOrders.length > 1 ? 's' : ''}
                            </p>
                        </div>
                    </div>
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
        </AdminLayout>
    );
}