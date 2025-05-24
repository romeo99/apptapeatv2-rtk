import { Order } from '../../../types/firebase';
import OrderDetails from './OrderDetails';
import OrderItem from './OrderItem';

interface OrderListProps {
  filteredOrders: Order[];
  activeTab: string;
  expandedOrder: string | null;
  toggleOrderExpansion: (orderId: string) => void;
  handlePayAndPrepare: (orderId: string) => Promise<void>;
  updateOrderStatus: (orderId: string, status: string, autoComplete?: boolean) => Promise<void>;
  handleCompleteOrder: (orderId: string) => Promise<void>;
  printOrder: (order: Order) => void;
  newOrders: string[];
}

export default function OrderList({
  filteredOrders,
  activeTab,
  expandedOrder,
  toggleOrderExpansion,
  handlePayAndPrepare,
  updateOrderStatus,
  handleCompleteOrder,
  printOrder,
  newOrders
}: OrderListProps) {
  if (filteredOrders.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">
          Aucune commande {
            activeTab === 'scheduled' ? 'programmée' :
            activeTab === 'pending' ? 'en attente' :
            activeTab === 'preparing' ? 'en préparation' : 'prête'
          }
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {filteredOrders
        .filter(order => {
          if (activeTab === 'scheduled') {
            return order.status === 'scheduled' && order.scheduledTime?.date && order.scheduledTime?.time;
          }
          return true;
        })
        .map((order) => (
          <OrderItem
            key={order.id}
            order={order}
            expandedOrder={expandedOrder}
            toggleOrderExpansion={toggleOrderExpansion}
            printOrder={printOrder}
            newOrders={newOrders}
          >
            <OrderDetails
              order={order}
              handlePayAndPrepare={handlePayAndPrepare}
              updateOrderStatus={updateOrderStatus}
              handleCompleteOrder={handleCompleteOrder}
            />
          </OrderItem>
        ))}
    </div>
  );
}