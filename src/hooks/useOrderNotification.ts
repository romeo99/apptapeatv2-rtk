import { useEffect, useRef, useState } from 'react';
import useSound from 'use-sound';
import { notificationSoundUrl, useNotification } from '../context/NotificationContext';
import { useOrderContext } from '../context/OrderContext';
//import { printReceipt } from '../services/printingService';
import { useReactToPrint } from "react-to-print";
import { Order } from '../types/firebase';

const initializeOrderNotifications = (): void => {
    const notifications = localStorage.getItem('orderNotifications');
    if (!notifications) {
        localStorage.setItem('orderNotifications', JSON.stringify({}));
    }
};

const useOrderNotification = () => {
    const { orders } = useOrderContext();
    const { playNotificationSound } = useNotification();
    const previousOrdersRef = useRef<string[]>([]);
    const [play] = useSound(notificationSoundUrl, {
        volume: 1.0,
        interrupt: true // Allow interrupting previous sound
    });

    const contentRef = useRef<HTMLDivElement>(null); // Ref pour le reçu
    const [orderToPrint, setOrderToPrint] = useState<Order | null>(null);

    // Fonction d'impression
    const handlePrint = useReactToPrint({
        contentRef,
    });

    useEffect(() => {
        initializeOrderNotifications();

        const currentOrderIds: string[] = orders.filter((o) => o.status === 'pending').map((o) => o.id);
        const previousOrderIds: string[] = previousOrdersRef.current;

        // Find new orders that weren't in the previous list
        const newOrderIds: string[] = currentOrderIds.filter(id => !previousOrderIds.includes(id));

        if (newOrderIds.length > 0) {
            const notifications: { [key: string]: boolean } = JSON.parse(localStorage.getItem('orderNotifications') || '{}');

            newOrderIds.forEach(id => {
                if (!notifications[id]) {
                    //Lancement de la notification
                    playNotificationSound();
                    //Impression du reçu
                    //printReceipt(orders.find((o) => o.id === id)!);

                    // Définir la commande en cours d'impression
                    const order = orders.find(o => o.id === id);
                    if (order) {
                        setOrderToPrint(order);
                        setTimeout(() => {
                            handlePrint(); // Lancer l'impression
                            setOrderToPrint(null)
                        }, 2000);
                    }

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
        }

        previousOrdersRef.current = currentOrderIds;
    }, [orders, playNotificationSound, play]);

    return { contentRef, orderToPrint, setOrderToPrint, handlePrint };
};

export default useOrderNotification;