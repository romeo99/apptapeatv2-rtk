import { collection, doc, getDoc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import { db, getToken, messaging, onMessage } from '../config/firebase';

const vapidKey = "BDVe_onL6Lcmwaxw9TBTF_XQ6SD0MbxxA9zPZ14Xws1CFljXxtQd9LLg2oPF2TxzWXBQtUGvWYCsTClv95MUyuI";

export async function requestNotificationPermission(userId: string) {
  /* try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      // Register service worker if not already registered
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('Service Worker registered:', registration);
      }

      // Save token to user's document
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        notificationsEnabled: true,
        updatedAt: serverTimestamp()
      });

      return true;
    }
    return false;
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return false;
  } */

  const permission = await Notification.requestPermission();
  if (permission === 'granted') {
    getToken(messaging, { vapidKey }).then(async (currentToken) => {
      if (currentToken) {
        console.log('Token de notification FCM:', currentToken);

        // Tu peux l’envoyer à Firebase DB ou Firestore
        // Save token to user's document
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, {
          notificationsEnabled: true,
          token: currentToken,
          updatedAt: serverTimestamp()
        });
      } else {
        console.warn('Aucun token disponible. Demande de permission requise.');
      }
    }).catch((err) => {
      console.error('Erreur lors de la récupération du token:', err);
    });
  }

  onMessage(messaging, (payload) => {
    console.log('Message reçu en foreground:', payload);
    alert(`Notification: ${payload.notification!.title} - ${payload.notification!.body}`);
  });
}

export async function sendOrderNotification(userId: string, orderId: string, status: string) {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) return;

    const userData = userDoc.data();
    if (!userData.notificationsEnabled) return;

    const notificationData = {
      title: 'Mise à jour de votre commande',
      body: getNotificationMessage(status),
      icon: 'https://i.postimg.cc/TPbpkRnD/Tap-Eart-2.png',
      click_action: `/track-order/${orderId}`,
      orderId
    };

    // Save notification in Firestore
    const notificationRef = doc(collection(db, 'users', userId, 'notifications'));
    await setDoc(notificationRef, {
      ...notificationData,
      read: false,
      createdAt: serverTimestamp()
    });

    // Send push notification if supported
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification(notificationData.title, {
        body: notificationData.body,
        icon: notificationData.icon,
        data: {
          url: notificationData.click_action
        }
      });
    }
  } catch (error) {
    console.error('Error sending notification:', error);
  }
}

function getNotificationMessage(status: string): string {
  switch (status) {
    case 'confirmed':
      return 'Votre commande a été confirmée !';
    case 'preparing':
      return 'Votre commande est en cours de préparation';
    case 'ready':
      return 'Votre commande est prête !';
    case 'delivering':
      return 'Votre commande est en cours de livraison';
    case 'delivered':
      return 'Votre commande a été livrée';
    default:
      return 'Le statut de votre commande a été mis à jour';
  }
}