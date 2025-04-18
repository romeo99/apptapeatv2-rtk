import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useSound } from 'use-sound';
import { 
  Calculator, 
  Clock, 
  Package, 
  CheckCircle, 
  UtensilsCrossed, 
  ShoppingBag, 
  Bike, 
  CreditCard, 
  Calendar 
} from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';
import OrderSearchKeypad from '../../components/admin/OrderSearchKeypad';
import Receipt from '../../components/Receipt';
import { AdminLayoutContext } from '../../context/AdminLayoutContext';
import { notificationSoundUrl, useNotification } from '../../context/NotificationContext';
import { useOrderContext } from '../../context/OrderContext';
import { useRestaurantContext } from '../../context/RestaurantContext';
import useOrderNotification from '../../hooks/useOrderNotification';
import { deductInventoryFromOrder } from '../../services/inventoryService';
import { getButtonPosition, saveButtonPosition } from '../../services/uiPreferencesService';
import { Order } from '../../types/firebase';

// Import the split components
import OrderTabs from '../../components/admin/orders/OrderTabs';
import OrderList from '../../components/admin/orders/OrderList';
import LiveOrdersHeader from '../../components/admin/orders/LiveOrdersHeader';

const TABS = [
  { id: 'scheduled', name: 'Programmées', icon: Calendar, color: 'bg-blue-100 text-blue-800' },
  { id: 'pending', name: 'En attente', icon: Clock, color: 'bg-red-100 text-red-800' },
  { id: 'preparing', name: 'En préparation', icon: Package, color: 'bg-orange-100 text-orange-800' },
  { id: 'ready', name: 'Prêtes', icon: CheckCircle, color: 'bg-green-100 text-green-800' }
];

const orderTypeIcons = {
  dine_in: { icon: UtensilsCrossed, label: 'Sur place' },
  takeaway: { icon: ShoppingBag, label: 'À emporter' },
  delivery: { icon: Bike, label: 'Livraison' }
};

export default function LiveOrders() {
  const { playNotificationSound } = useNotification();
  const { orders, updateOrderStatus } = useOrderContext();
  const { restaurant } = useRestaurantContext();
  const { isRegisterMode } = useContext(AdminLayoutContext);
  const [buttonPosition, setButtonPosition] = useState({ x: -1, y: -1 });
  const [containerWidth, setContainerWidth] = useState(window.innerWidth * (isRegisterMode ? 0.666 : 1));
  const [isDragging, setIsDragging] = useState(false);
  const [isLongPress, setIsLongPress] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [isMoving, setIsMoving] = useState(false);
  const longPressTimer = useRef<NodeJS.Timeout>();
  const touchStartPos = useRef<{ x: number; y: number } | null>(null);
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const lastPosition = useRef({ x: 0, y: 0 });
  const animationFrame = useRef<number>();
  const [activeTab, setActiveTab] = useState('pending');
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [showKeypad, setShowKeypad] = useState(false);
  const [play] = useSound(notificationSoundUrl, {
    volume: 1.0,
    interrupt: true // Allow interrupting previous sound
  });
  const [newOrders, setNewOrders] = useState<string[]>([]);
  const previousOrdersRef = useRef<string[]>([]);

  const { contentRef, orderToPrint, setOrderToPrint, handlePrint } = useOrderNotification();

  const handleStatusChange = async (orderId: string, newStatus: string, autoComplete: boolean = false) => {
    try {
      await updateOrderStatus(orderId, newStatus);
      
      // If we're marking as ready and autoComplete is true, also mark as completed
      if (newStatus === 'ready' && autoComplete) {
        setTimeout(() => {
          updateOrderStatus(orderId, 'completed');
        }, 500); // Small delay to ensure the first status update completes
      }
      
      // La notification sera envoyée automatiquement via le OrderContext
    } catch (err) {
      console.error('Failed to update order status:', err);
    }
  };

  // Check for new orders - include paid credit card orders
  useEffect(() => {
    const currentOrderIds = orders
      .filter(o => {
        return (
          (o.status === 'pending') || 
          (o.paymentStatus === 'paid' && o.status !== 'completed' && o.status !== 'cancelled')
        );
      })
      .map(o => o?.id || '')
      .filter(Boolean);

    const previousOrderIds = previousOrdersRef.current;

    // Find new orders that weren't in the previous list
    const newOrderIds = currentOrderIds.filter(id => !previousOrderIds.includes(id));

    if (newOrderIds.length > 0) {
      const notifications: { [key: string]: boolean } = JSON.parse(localStorage.getItem('orderNotifications') || '{}');

      newOrderIds.forEach(id => {
        if (!notifications[id]) {
          playNotificationSound();
          notifications[id] = true;
        }
      });

      // Clean up notifications for orders that are no longer pending
      const updatedNotifications: { [key: string]: boolean } = Object.keys(notifications)
        .filter(id => currentOrderIds.includes(id))
        .reduce((obj: { [key: string]: boolean }, key: string) => {
          obj[key] = notifications[key];
          return obj;
        }, {});

      localStorage.setItem('orderNotifications', JSON.stringify(updatedNotifications));

      // Add to animated orders list
      setNewOrders(prev => [...prev, ...newOrderIds]);

      // Remove from animation list after 5 seconds
      setTimeout(() => {
        setNewOrders(prev => prev.filter(id => !newOrderIds.includes(id)));
      }, 5000);
    }

    // Update previous orders reference
    previousOrdersRef.current = currentOrderIds;
  }, [orders, playNotificationSound]);

  // Load saved position
  useEffect(() => {
    async function loadPosition() {
      if (!restaurant?.id || isInitialized) return;

      try {
        const savedPosition = await getButtonPosition(restaurant.id);
        const width = isRegisterMode ? window.innerWidth * 0.666 : window.innerWidth;

        const position = savedPosition ? {
          x: Math.min(Math.max(0, savedPosition.x), width - 56),
          y: Math.min(Math.max(0, savedPosition.y), window.innerHeight - 56)
        } : {
          x: width - 100,
          y: window.innerHeight - 200
        };

        setButtonPosition(position);
        lastPosition.current = position;
        setIsInitialized(true);
      } catch (error) {
        console.error('Error loading button position:', error);
        // Set default position on error
        const width = isRegisterMode ? window.innerWidth * 0.666 : window.innerWidth;
        const defaultPosition = {
          x: width - 100,
          y: window.innerHeight - 200
        };
        setButtonPosition(defaultPosition);
        lastPosition.current = defaultPosition;
        setIsInitialized(true);
      }
    }
    loadPosition();
  }, [restaurant?.id, isRegisterMode, isInitialized]);

  // Debounced save position
  const savePosition = useCallback(async (position: { x: number; y: number }) => {
    try {
      if (!restaurant?.id) return;
      if (!isInitialized) return;

      // Validate position before saving
      const width = isRegisterMode ? window.innerWidth * 0.666 : window.innerWidth;
      const validPosition = {
        x: Math.min(Math.max(0, position.x), width - 56),
        y: Math.min(Math.max(0, position.y), window.innerHeight - 56)
      };

      await saveButtonPosition(restaurant.id, validPosition);
    } catch (error) {
      console.error('Error saving button position:', error);
    }
  }, [restaurant?.id, isRegisterMode, isInitialized]);

  // Update container width when register mode changes
  useEffect(() => {
    const width = window.innerWidth - (isRegisterMode ? window.innerWidth * 0.333 : 0);
    setContainerWidth(width);

    // Adjust button position with animation when mode changes
    if (buttonPosition.x > width - 56) {
      const newX = Math.min(buttonPosition.x, width - 56);
      smoothMove(newX, buttonPosition.y);
    }
  }, [isRegisterMode, buttonPosition.x, buttonPosition.y]);

  // Cleanup animation frame on unmount
  useEffect(() => {
    return () => {
      if (animationFrame.current) {
        cancelAnimationFrame(animationFrame.current);
      }
    };
  }, []);

  // Listen for messages from parent window in register mode
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'SEARCH_ORDER') {
        handleOrderSearch(event.data.orderNumber);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  // Process scheduled orders
  useEffect(() => {
    const interval = setInterval(async () => {
      const now = new Date();

      // Filtrer les commandes planifiées dans la fenêtre des 15 mins
      const ordersToUpdate = orders.filter((order) => {
        if (order.status !== 'scheduled' || !order.scheduledTime) return false;

        const { date, time } = order.scheduledTime;
        const scheduledDateTime = new Date(`${date}T${time}:00`); // Forcer HH:MM:SS
        const timeDifference = (scheduledDateTime.getTime() - now.getTime()) / (1000 * 60); // Diff en minutes

        return timeDifference <= (restaurant?.averagePreparationTime || 15) + 3 && timeDifference > 0;
      });

      if (ordersToUpdate.length > 0) {
        try {
          await Promise.all(
            ordersToUpdate.map(async (order) => {
              await updateOrderStatus(order.id, 'pending');
              console.log(`Commande ${order.id} mise à jour en "pending".`);
            })
          );
        } catch (err) {
          console.error('Erreur lors de la mise à jour des commandes:', err);
        }
      }
    }, 15000); // Exécuter toutes les 15 secondes

    return () => clearInterval(interval);
  }, [orders, updateOrderStatus, restaurant?.averagePreparationTime]);

  const smoothMove = (targetX: number, targetY: number) => {
    if (animationFrame.current) {
      cancelAnimationFrame(animationFrame.current);
    }

    const animate = () => {
      const currentX = lastPosition.current.x;
      const currentY = lastPosition.current.y;

      const dx = targetX - currentX;
      const dy = targetY - currentY;

      if (Math.abs(dx) < 0.1 && Math.abs(dy) < 0.1) {
        lastPosition.current = { x: targetX, y: targetY };
        setButtonPosition({ x: targetX, y: targetY });
        setIsMoving(false);
        return;
      }

      lastPosition.current = {
        x: currentX + dx * 0.3,
        y: currentY + dy * 0.3
      };

      setButtonPosition(lastPosition.current);
      animationFrame.current = requestAnimationFrame(animate);
    };

    lastPosition.current = buttonPosition;
    setIsMoving(true);
    animationFrame.current = requestAnimationFrame(animate);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartPos.current = { x: touch.clientX, y: touch.clientY };

    const rect = buttonRef.current?.getBoundingClientRect();
    if (rect) {
      dragOffsetRef.current = {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top
      };
    }

    longPressTimer.current = setTimeout(() => {
      setIsLongPress(true);
      setIsDragging(true);
    }, 500); // 500ms long press
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) {
      if (touchStartPos.current) {
        const touch = e.touches[0];
        const moveX = Math.abs(touch.clientX - touchStartPos.current.x);
        const moveY = Math.abs(touch.clientY - touchStartPos.current.y);
        if (moveX > 10 || moveY > 10) {
          clearTimeout(longPressTimer.current);
          setIsDragging(true);
        }
      }
      return;
    }

    e.preventDefault(); // Prevent scrolling while dragging
    const touch = e.touches[0];
    const containerOffset = isRegisterMode ? window.innerWidth * 0.333 : 0;
    const adjustedX = touch.clientX - containerOffset;
    const x = Math.max(0, Math.min(adjustedX - dragOffsetRef.current.x, containerWidth - 56));
    const y = Math.max(0, Math.min(touch.clientY - dragOffsetRef.current.y, window.innerHeight - 56));
    smoothMove(x, y);
  };

  const handleTouchEnd = () => {
    clearTimeout(longPressTimer.current);
    touchStartPos.current = null;
    setIsLongPress(false);
    setIsDragging(false);
    setIsMoving(false);
    if (animationFrame.current) {
      cancelAnimationFrame(animationFrame.current);
    }
    // Save final position
    savePosition(lastPosition.current);
  };

  const handleDragStart = (e: React.DragEvent) => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      dragOffsetRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
      setIsDragging(true);

      // Create a transparent drag image
      const dragImg = document.createElement('div');
      dragImg.style.opacity = '0';
      document.body.appendChild(dragImg);
      e.dataTransfer.setDragImage(dragImg, 0, 0);
      setTimeout(() => document.body.removeChild(dragImg), 0);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    if (e.clientX === 0 && e.clientY === 0) return; // Ignore invalid positions

    const adjustedX = e.clientX - (isRegisterMode ? window.innerWidth * 0.333 : 0);
    const x = Math.max(0, Math.min(adjustedX - dragOffsetRef.current.x, containerWidth - 56));
    const y = Math.max(0, Math.min(e.clientY - dragOffsetRef.current.y, window.innerHeight - 56));

    smoothMove(x, y);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    setIsMoving(false);
    if (animationFrame.current) {
      cancelAnimationFrame(animationFrame.current);
    }
    // Save final position
    savePosition(lastPosition.current);
  };

  // Filtrer uniquement les commandes visibles - inclure tous les status sauf 'awaiting_payment'
  const activeOrders = orders.filter(order => {
    // Include all visible statuses
   if (['scheduled', 'pending', 'preparing', 'ready'].includes(order.status)) {
      return true;
    }
    
    // Include orders with awaiting_payment status but paid payment status
    if (order.status === 'awaiting_payment' && order.paymentStatus === 'paid') {
      return true;
    }
    
    return false;
  });

  // Compter les commandes par statut
  const orderCounts = activeOrders.reduce((acc, order) => {
    // For counting purposes, treat paid awaiting_payment orders as pending
    const countStatus = (order.status === 'awaiting_payment' && order.paymentStatus === 'paid') 
      ? 'pending' 
      : order.status;
      
    acc[countStatus] = (acc[countStatus] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Filter orders for current tab, treating paid awaiting_payment as pending
  const filteredOrders = activeOrders.filter(order => {
    if (activeTab === 'pending') {
     return order.status === 'pending' || 
            (order.status === 'awaiting_payment' && order.paymentStatus === 'paid');
    }
    
    return order.status === activeTab;
  });

  const handlePayAndPrepare = async (orderId: string) => {
    try {
      // Use the updateOrderStatus function from context
      await updateOrderStatus(orderId, 'preparing');
    } catch (err) {
      console.error('Error updating order:', err);
      alert('Une erreur est survenue lors de la mise à jour de la commande');
    }
  };

  const handleCompleteOrder = async (orderId: string) => {
    try {
      if (!restaurant?.id) {
        throw new Error('Restaurant ID is required');
      }

      const order = orders.find(o => o.id === orderId);
      if (!order?.restaurantId) {
        console.error('No restaurant ID found for order');
        return;
      }

      // First update order status
      await updateOrderStatus(orderId, 'completed');

      // Then deduct from inventory
      console.log('Deducting inventory for order:', order.items);
      await deductInventoryFromOrder(order.restaurantId, order.items);

    } catch (err) {
      console.error('Error completing order:', err);
      alert('Une erreur est survenue lors de la finalisation de la commande');
    }
  };

  const toggleOrderExpansion = (orderId: string) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId);
  };

  const handleOrderSearch = (orderNumber: string) => {
    const order = activeOrders.find(o => {
      if (!o.orderNumber) return false;
      const searchNumber = orderNumber.toLowerCase();
      const orderNum = o.orderNumber.toLowerCase();
      return orderNum.includes(searchNumber);
    });

    if (order) {
      // For paid awaiting_payment orders, show them in the pending tab
      const effectiveStatus = (order.status === 'awaiting_payment' && order.paymentStatus === 'paid') 
        ? 'pending' 
        : order.status;
        
      setActiveTab(effectiveStatus);
      setExpandedOrder(order.id);

      setTimeout(() => {
        const orderElement = document.getElementById(`order-${order.id}`);
        const container = document.querySelector('.p-4.space-y-4.overflow-auto');

        if (orderElement && container) {
          // Ensure the order header is visible
          const headerOffset = 200; // Height of header + tabs
          const elementPosition = orderElement.offsetTop - headerOffset;

          // Scroll to the element
          container.scrollTo({
            top: elementPosition,
            behavior: 'smooth'
          });

          // Add pulse animation class only to found order
          orderElement.classList.add('animate-pulse-emerald');

          // Remove animation class after completion
          setTimeout(() => {
            orderElement.classList.remove('animate-pulse-emerald');
          }, 2000);
        }
      }, 100);
    } else {
      alert('Aucune commande trouvée avec ce numéro');
    }
  };

  const printOrder = (order: Order) => {
    setOrderToPrint(order);
    setTimeout(() => {
      handlePrint(); // Lancer l'impression
      setOrderToPrint(null);
    }, 2000);
  }

  return (
    <AdminLayout>
      <LiveOrdersHeader 
        ordersCount={activeOrders.length}
        onShowKeypad={() => setShowKeypad(true)}
      />

      <OrderTabs 
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        orderCounts={orderCounts}
      />

      <div className="p-4 space-y-4 overflow-auto" style={{ height: 'calc(100vh - 200px)' }}>
        <OrderList 
          filteredOrders={filteredOrders}
          activeTab={activeTab}
          expandedOrder={expandedOrder}
          toggleOrderExpansion={toggleOrderExpansion}
          handlePayAndPrepare={handlePayAndPrepare}
          updateOrderStatus={handleStatusChange}
          handleCompleteOrder={handleCompleteOrder}
          printOrder={printOrder}
          newOrders={newOrders}
        />
      </div>

      {orderToPrint && (
        <Receipt
          ref={contentRef}
          order={orderToPrint}
        />
      )}

      {/* Keypad Modal */}
      {showKeypad && (
        <OrderSearchKeypad
          onClose={() => setShowKeypad(false)}
          onSearch={handleOrderSearch}
        />
      )}

      

      {/* Menu client en mode caisse */}
      {isRegisterMode && restaurant?.id && (
        <div className="fixed right-0 top-20 bottom-0 w-1/3 bg-white border-l border-gray-200 overflow-hidden">
          <div className="w-full h-full">
            <div className="w-full h-full flex flex-col">
              <div className="flex-1 overflow-hidden">
                <iframe
                  id="orders-iframe"
                  src={`${window.location.origin}/restaurant?restaurantId=${restaurant.id}&mode=register`}
                  className="w-full h-full border-none"
                  title="Menu client"
                  style={{ height: '100%' }}
                  sandbox="allow-same-origin allow-scripts allow-forms"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}