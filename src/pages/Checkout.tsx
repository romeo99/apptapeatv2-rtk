import { loadStripe } from '@stripe/stripe-js';
import { doc, onSnapshot } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { ChevronLeft, CreditCard } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import OrderSummary from '../components/OrderSummary';
import UpsellModal from '../components/UpsellModal';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useRestaurantContext } from '../context/RestaurantContext';
import { createFoodCourtOrder, createOrder, generateOrderNumber } from '../services/orderService';
import { createCheckoutSession } from '../services/stripeCheckoutService';
import { Restaurant } from '../types/firebase';
import { getSuggestionGroups } from '../utils/suggestionEngine';

const stripePromise = loadStripe(`${import.meta.env.VITE_STRIPE_PUBLISH_KEY}`);

export default function Checkout() {
  const navigate = useNavigate();
  const { items, applicationFee, serviceFees, subtotal, total, clearCart, scheduledTime, isFoodCourtOrder, foodCourtId, setScheduledTime, anonymousUser, } = useCart();
  const { themeColor, restaurant } = useRestaurantContext();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<string>('card');
  const [showUpsell, setShowUpsell] = useState(true);
  const [isScheduled, setIsScheduled] = useState(false);
  const [searchParams] = useSearchParams();
  const restaurantId = searchParams.get('restaurantId');
  const isRegisterMode = searchParams.get('mode') === 'register';
  const [restaurantData, setRestaurantData] = useState<Restaurant | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const today = new Date().toISOString().split('T')[0];

  const { user } = useAuth();
  const [nbLaunch, setNbLaunch] = useState(0);

  // Check if Apple Pay is available
  const [isApplePayAvailable, setIsApplePayAvailable] = useState(false);
  const [isGooglePayAvailable, setIsGooglePayAvailable] = useState(false);

  const query = new URLSearchParams(window.location.search);
  const sessionId = query.get('session_id');

  useEffect(() => {
    // Check if Apple Pay is available
    const isApplePaySupported = window.ApplePaySession && window.ApplePaySession.canMakePayments();
    setIsApplePayAvailable(isApplePaySupported);

    // Check if Google Pay is available
    // This is a simplified check - in production you'd use the Google Pay API
    const isGooglePaySupported =
      window.navigator.userAgent.indexOf('Android') > -1 ||
      /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor);
    setIsGooglePayAvailable(isGooglePaySupported);
  }, []);

  // Check for order_id in URL (coming back from cancelled Stripe session)
  useEffect(() => {
    const orderIdFromUrl = new URLSearchParams(window.location.search).get('order_id');
    if (orderIdFromUrl) {
      setError('Le paiement a été annulé. Veuillez réessayer ou choisir un autre mode de paiement.');
    }
  }, []);

  // Redirect if no restaurant ID
  useEffect(() => {
    if (!restaurantId) {
      navigate('/');
      return;
    }
    //Recuperation du restaurant depuis firebase
    const restaurantRef = doc(db, 'restaurants', restaurantId);
    const unsubscribe = onSnapshot(restaurantRef, (doc) => {
      if (doc.exists()) {
        setRestaurantData(doc.data() as Restaurant);
      } else {
        navigate('/');
      }
    }
    );
    return () => unsubscribe();
  }, [restaurantId, navigate]);

  // Filter available payment methods
  const availablePaymentMethods = {
    card: { icon: '💳', label: 'Carte' },
    cash: { icon: '💵', label: 'Espèces' },
    apple_pay: { icon: 'apple_pay', label: 'Apple Pay' },
    google_pay: { icon: 'google_pay', label: 'Google Pay' }
  };

  const allowedMethods = restaurantData?.paymentMethods || ['card', 'cash', 'apple_pay'];

  // Memoize restaurant items grouping to prevent unnecessary recalculations
  const restaurantItems = useMemo(() => {
    return items.reduce((acc, item) => {
      if (!acc[item.restaurantId]) {
        acc[item.restaurantId] = {
          items: [],
          amount: 0,
        };
      }
      acc[item.restaurantId].items.push(item);
      acc[item.restaurantId].amount += item.price * item.quantity;
      return acc;
    }, {} as Record<string, { items: typeof items; amount: number }>);
  }, [items]);

  const prepareOrderData = async (selectedMethod: string): Promise<any> => {
    let orderData;
    let orderType = JSON.parse(localStorage.getItem('orderType') || '{"type":"takeaway"}');

    // Vérifier que le type de commande est valide
    if (!orderType || !orderType.type) {
      orderType = { type: "takeaway" };
    }

    if (!['dine_in', 'takeaway', 'delivery'].includes(orderType.type)) {
      throw new Error('Type de commande invalide');
    }

    const orderNumber = await generateOrderNumber(restaurantId!, selectedMethod);

    // Préparer les données de livraison si nécessaire
    let deliveryInfo = null;
    if (orderType.type === 'delivery') {
      const deliveryData = localStorage.getItem('deliveryInfo');
      if (!deliveryData) {
        throw new Error('Informations de livraison manquantes');
      }
      try {
        deliveryInfo = JSON.parse(deliveryData);
      } catch (e) {
        throw new Error('Informations de livraison invalides');
      }
    }

    if (isFoodCourtOrder && foodCourtId) {
      // Regroupement des items par restaurant
      const restaurantOrders = Object.entries(
        items.reduce((acc, item) => {
          if (!acc[item.restaurantId]) {
            acc[item.restaurantId] = { items: [] };
          }
          acc[item.restaurantId].items.push({
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            image: item.image,
            menuOptions: item.menuOptions,
            excludedIngredients: item.excludedIngredients,
            remarks: item.remarks,
            sections: item.sections,
            promotionLabel: item.promotionLabel,
            restaurantName: item.restaurantName,
            restaurantId: item.restaurantId,
          });
          return acc;
        }, {} as Record<string, { items: any[] }>)
      ).map(([restaurantId, data]) => ({
        restaurantId,
        ...data
      }));

      orderData = {
        restaurantOrders,
        type: orderType.type,
        subtotal: parseFloat(subtotal.toFixed(2)),
        total: parseFloat(total.toFixed(2)),
        customerName: user ? user.displayName : anonymousUser,
        paymentMethod: selectedMethod,
        paymentStatus: selectedMethod === 'cash' ? 'pending' : 'paid',
        scheduledTime,
        ...(deliveryInfo && { delivery: deliveryInfo })
      };
    } else {
      // Commande d'un seul restaurant
      orderData = {
        items: items.map(item => ({
          id: item.id || '',
          name: item.name || '',
          price: item.price || 0,
          quantity: item.quantity || 1,
          image: item.image || null,
          menuOptions: item.menuOptions || null,
          excludedIngredients: item.excludedIngredients || null,
          remarks: item.remarks || null,
          sections: item.sections || null,
          promotionLabel: item.promotionLabel || null,
          restaurantName: item.restaurantName || '',
          restaurantId: item.restaurantId || '',
        })),
        type: orderType.type,
        subtotal: parseFloat(subtotal.toFixed(2)),
        total: parseFloat(total.toFixed(2)),
        paymentMethod: selectedMethod,
        message: message,
        customerName: user ? user.displayName : anonymousUser,
        orderNumber: orderNumber,
        scheduledTime,
        ...(deliveryInfo && { delivery: deliveryInfo })
      };
    }
    return orderData;
  };

  const processPayment = async (): Promise<boolean> => {
    try {
      const stripe = await stripePromise;
      if (!stripe) return false;

      const functions = getFunctions();
      const createCheckoutSession = httpsCallable(functions, 'createCheckoutSession');

      // Préparer les données des restaurants pour la session de paiement
      const restaurants = Object.entries(restaurantItems).map(([restaurantId, { items, amount }]) => ({
        restaurantId,
        items,
        amount,
      }));

      // Créer la session Stripe
      const { data } = await createCheckoutSession({
        restaurants,
        fees: applicationFee,
        successUrl: `${window.location.origin}/checkout?restaurantId=${restaurantId}`,
        cancelUrl: `${window.location.origin}/checkout?restaurantId=${restaurantId}`,
        method: 'card',
        userFistname: 'test',
      });

      /* clearCart();
      localStorage.removeItem('foodCourtId');
      localStorage.removeItem('deliveryInfo'); */

      // Rediriger vers Stripe Checkout
      const { sessionId } = data as { sessionId: string };
      const result = await stripe.redirectToCheckout({ sessionId });

      if (result.error) {
        console.error('Stripe checkout error:', result.error);
        setError('Une erreur est survenue lors de la redirection vers la page de paiement.');
        return false;
      }
      return true;
    } catch (error) {
      console.error('Payment error:', error);
      setError('Une erreur est survenue lors de la création de la session de paiement.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const processStripePayment = async (orderId: string) => {
    try {
      setLoading(true);
      console.log(`Processing Stripe payment for order ${orderId} in restaurant ${restaurantData?.id} - Starting checkout flow`);

      const checkoutUrl = await createCheckoutSession({
        restaurantId: restaurantData?.id || '',
        items,
        total,
        orderId,
        successUrl: `${window.location.origin}/order-confirmation`,
        cancelUrl: `${window.location.origin}/checkout?order_id=${orderId}`
      });

      console.log(`Redirecting to Stripe checkout: ${checkoutUrl} - Order should be visible in admin panel`);
      window.location.href = checkoutUrl;

      // Nettoyer le panier et les données locales
      clearCart();
      localStorage.removeItem('foodCourtId');
      localStorage.removeItem('deliveryInfo');
    } catch (error) {
      console.error('Payment error:', error);
      setError('Une erreur est survenue lors de la création de la session de paiement.');
      setLoading(false);
    }
  };

  const handleSuccessfulOrder = async (orderId: string) => {
    try {
      clearCart();
      localStorage.removeItem('foodCourtId');
      localStorage.removeItem('deliveryInfo');

      if (isFoodCourtOrder && foodCourtId) {
        navigate(`/order-confirmation${isRegisterMode ? '?mode=register' : ''}`, {
          state: { foodCourtId },
          replace: true
        });
      } else {
        navigate(`/order-confirmation${isRegisterMode ? '?mode=register' : ''}`, {
          state: { orderId, restaurantId: restaurantData?.id },
          replace: true
        });
      }
    } catch (error) {
      console.error('Order error:', error);
      setError('Une erreur est survenue lors de la commande.');
    } finally {
      setLoading(false);
    }
  };

  // Fonction principale de gestion du paiement
  const handlePayment = async () => {
    setLoading(true);

    //Demande de email pour envoie de ticket par mail
    const functions = getFunctions();
    const sendEmail = httpsCallable(functions, 'sendOrderConfirmation');

    // For Apple Pay and Google Pay, use the card payment flow
    /* if (selectedMethod === 'apple_pay' || selectedMethod === 'google_pay') {
      console.log(`Using card payment flow for ${selectedMethod}`);
      setSelectedMethod('card');
    } */

    //Controle pour verifier si la valeur de l'heure est bien renseignée et est au minimum 15 minutes après l'heure actuelle
    if (isScheduled) {
      const now = new Date();
      const selectedDate = scheduledTime?.date;
      const selectedTime = scheduledTime?.time;

      if (!selectedTime) {
        setError('Veuillez sélectionner une heure de livraison.');
        setLoading(false);
        return;
      }

      if (!selectedDate) {
        setError('Veuillez sélectionner le jour de livraison.');
        setLoading(false);
        return;
      }

      // Convertir la date et l'heure sélectionnées en un objet Date
      const scheduledDateTime = new Date(`${selectedDate}T${selectedTime}`);

      // Vérifier si la date est aujourd'hui
      const today = now.toISOString().split('T')[0] === selectedDate;

      // Si la date est aujourd'hui, vérifier que l'heure est au minimum l'heure actuelle + 15 minutes
      if (today) {
        const minAllowedTime = new Date(now.getTime() + (restaurant?.averagePreparationTime || 15) * 60 * 1000); // Ajoute 15 min à l'heure actuelle

        if (scheduledDateTime < minAllowedTime) {
          setError(`L\'heure sélectionnée doit être au moins ${restaurant?.averagePreparationTime || 15} minutes après l\'heure actuelle.`);
          setLoading(false);
          return;
        }
      }

      // Si tout est bon, effacer les erreurs
      setError(null);
    }

    /* try {
      // Pour les paiements en espèces ou en mode caisse, créer et confirmer la commande immédiatement
      if (selectedMethod === 'cash' || isRegisterMode) {
        // Pour les paiements en espèces, créer la commande avec un statut 'pending'
        const cashOrderData = prepareOrderData(selectedMethod);

        let orderId: string | string[] | void = isFoodCourtOrder
          ? await createFoodCourtOrder(foodCourtId!, cashOrderData)
          : await createOrder(restaurantData?.id!, {
            ...cashOrderData,
            paymentMethod: selectedMethod
          });

        if (!orderId) {
          throw new Error('Erreur lors de la création de la commande');
        }

        // Commande créée avec succès pour paiement en espèces
        await handleSuccessfulOrder(Array.isArray(orderId) ? orderId[0] : orderId);
      }
      // Pour les paiements par carte ou Apple Pay (non mode caisse)
      else if ((selectedMethod === 'card' || selectedMethod === 'apple_pay' || selectedMethod === 'google_pay') && !isRegisterMode) {
        // Pour les paiements en ligne, créer la commande avec un statut 'awaiting_payment'
        // Use 'card' as the payment method for all online payments to ensure consistent processing
        const orderData = prepareOrderData('card');
        let orderId: string | string[] | void = isFoodCourtOrder
          ? await createFoodCourtOrder(foodCourtId!, orderData)
          : await createOrder(restaurantData?.id!, orderData);

        if (!orderId) {
          throw new Error('Erreur lors de la création de la commande');
        }

        const orderIdStr = Array.isArray(orderId) ? orderId[0] : orderId;
        await processStripePayment(orderIdStr);
      }
    } catch (error) {
      console.error('Order error:', error);
      setError('Une erreur est survenue lors de la commande.');
      setLoading(false);
    } */

    try {
      const orderData = await prepareOrderData(selectedMethod);

      if ((selectedMethod === 'card' && !isRegisterMode) || selectedMethod === 'apple_pay') {
        const paymentResult = await processPayment();
        if (!paymentResult) {
          throw new Error('Erreur lors du traitement du paiement.');
        }
      }

      // Créer la commande dans Firestore
      let orderId: string | string[] | void = isFoodCourtOrder ? await createFoodCourtOrder(foodCourtId!, orderData) : await createOrder(restaurantData?.id!, orderData);

      if (!orderId) {
        throw new Error('Erreur lors de la création de la commande');
      }

      await sendEmail({
        to: 'melesusuaris@gmail.com',
        subject: 'Merci pour votre commande',
        order: orderData,
      });

      if (!((selectedMethod === 'card' && !isRegisterMode) || selectedMethod === 'apple_pay')) {
        clearCart();
        localStorage.removeItem('foodCourtId');
        localStorage.removeItem('deliveryInfo');
        if (isFoodCourtOrder && foodCourtId) {
          navigate(`/order-confirmation${isRegisterMode ? '?mode=register' : ''}`, {
            state: { foodCourtId },
            replace: true
          });
        } else {
          navigate(`/order-confirmation${isRegisterMode ? '?mode=register' : ''}`, {
            state: { orderId, restaurantId: restaurantData?.id },
            replace: true
          });
        }
        setLoading(false);
      }
      setLoading(false);
    } catch (error) {
      console.error('Order error:', error);
      setError('Une erreur est survenue lors de la commande.');
      setLoading(false);
    }
  };

  useEffect(() => {
    if (sessionId && nbLaunch === 0) {
      setLoading(true);
      const functions = getFunctions();
      const retrieveCheckoutSession = httpsCallable(functions, 'retrieveCheckoutSession');

      retrieveCheckoutSession({ sessionId })
        .then(async (result: any) => {
          const session = result.data;

          if (session.payment_status === 'paid') {
            try {
              const orderData = await prepareOrderData('card');
              const anoUser = localStorage.getItem('anoUser')

              // Créer la commande dans Firestore
              let orderId: string | string[] | void = isFoodCourtOrder ? await createFoodCourtOrder(foodCourtId!, orderData) : await createOrder(restaurantId!, { ...orderData, customerName: anoUser });

              if (!orderId) {
                throw new Error('Erreur lors de la création de la commande');
              }

              if (!isRegisterMode) {
                clearCart();
                localStorage.removeItem('foodCourtId');
                localStorage.removeItem('deliveryInfo');
                localStorage.removeItem('anoUser');
                if (isFoodCourtOrder && foodCourtId) {
                  navigate(`/order-confirmation${isRegisterMode ? '?mode=register' : ''}`, {
                    state: { foodCourtId },
                    replace: true
                  });
                } else {
                  navigate(`/order-confirmation${isRegisterMode ? '?mode=register' : ''}`, {
                    state: { orderId, restaurantId: restaurantId },
                    replace: true
                  });
                }
                setLoading(false);
              }
              setLoading(false);
            } catch (error) {
              console.error('Order error:', error);
              setError('Une erreur est survenue lors de la commande.');
              setLoading(false);
            }
          } else {
            setError('Le paiement a échoué. Veuillez réessayer.');
            setLoading(false);
          }
        })
        .catch((error) => {
          console.error('Error retrieving checkout session:', error);
        })
        .finally(() => setLoading(false));
      setNbLaunch(1);
    } else {
      setLoading(false);
    }
  }, [sessionId]);

  const handleUpsellComplete = () => {
    setShowUpsell(false);
  };

  // Obtenir les suggestions basées sur le panier actuel
  const suggestions = getSuggestionGroups(items, []);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="fixed top-0 left-0 right-0 bg-white shadow-sm z-50">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-lg flex items-center justify-center text-white" style={{ backgroundColor: themeColor }}>
            <ChevronLeft className="h-6 w-6 text-white" />
          </button>
          <h1 className="text-xl font-semibold text-center">Paiement</h1>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 pt-20 flex-1 flex flex-col">
        {error && <div className="mb-6 p-4 bg-red-50 text-red-500 rounded-lg">{error}</div>}

        {!isRegisterMode && <div className="grid grid-cols-2 gap-3 mb-4">
          <button
            onClick={() => setIsScheduled(false)}
            className={`p-3 sm:p-4 rounded-xl flex flex-col items-center gap-1 sm:gap-2 border-2 transition-colors bg-opacity-10
              bg-white border-gray-200 hover:border-2`}
            style={!isScheduled ? {
              backgroundColor: `${themeColor}20`,
              borderColor: themeColor
            } : undefined}
          >Maintenant
          </button>
          <button
            onClick={() => setIsScheduled(true)}
            className={`p-3 sm:p-4 rounded-xl flex flex-col items-center gap-1 sm:gap-2 border-2 transition-colors bg-opacity-10
              bg-white border-gray-200 hover:border-2`}
            style={isScheduled ? {
              backgroundColor: `${themeColor}20`,
              borderColor: themeColor
            } : undefined}
          >Plus tard
          </button>
        </div>}

        {isScheduled && !isRegisterMode && (
          <div className="mb-4">
            <label htmlFor="scheduledTime" className="block text-sm font-medium text-gray-700 mb-2">
              Choisissez la date voulue:
            </label>
            <div className="flex space-x-4">
              {/* Sélecteur de date */}
              <input
                type="date"
                name="scheduledDate"
                id="scheduledDate"
                className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                min={new Date().toISOString().split('T')[0]} // Empêche la sélection d'un jour antérieur
                value={scheduledTime?.date || today}
                onChange={(e) => setScheduledTime((prev) => ({ ...prev, date: e.target.value }))}
              />

              {/* Sélecteur d'heure */}
              <input
                type="time"
                name="scheduledTime"
                id="scheduledTime"
                className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                min={(() => {
                  const now = new Date();
                  now.setMinutes(now.getMinutes() + (restaurant?.averagePreparationTime || 15) + 1);

                  const minHour = 8; // Heure minimale (ex: 08:00)
                  const minDate = new Date();
                  minDate.setHours(minHour, 0, 0, 0); // Fixe l'heure minimale

                  // Si la date choisie est aujourd'hui, alors appliquer la restriction sur l'heure
                  return scheduledTime?.date === new Date().toISOString().split('T')[0]
                    ? now.toTimeString().slice(0, 5)
                    : "00:00"; // Sinon, pas de restriction
                })()}
                value={scheduledTime?.time || ''}
                onChange={(e) => setScheduledTime((prev) => ({ ...prev, time: e.target.value }))}
              />
            </div>

          </div>
        )}

        <div className="grid grid-cols-3 gap-3 mb-4">
          {/* Card payment option */}
          <button
            onClick={() => setSelectedMethod('card')}
            disabled={!allowedMethods.includes('card') || !restaurantData?.stripeAccountId}
            className={`p-3 sm:p-4 rounded-xl flex flex-col items-center gap-1 sm:gap-2 border-2 transition-colors ${selectedMethod === 'card'
              ? 'bg-opacity-10'
              : allowedMethods.includes('card') && restaurantData?.stripeAccountId
                ? 'bg-white border-gray-200 hover:border-2'
                : 'bg-gray-50 border border-gray-200 opacity-50 cursor-not-allowed'
              }`}
            style={selectedMethod === 'card' ? {
              backgroundColor: `${themeColor}20`,
              borderColor: themeColor
            } : undefined}
          >
            <CreditCard className="h-6 w-6 sm:h-8 sm:w-8" />
            <span className="text-xs sm:text-sm font-medium">Carte</span>
            {!(allowedMethods.includes('card') && restaurantData?.stripeAccountId) && (
              <span className="text-[10px] sm:text-xs text-gray-500">Non disponible</span>
            )}
          </button>

          {/* Cash payment option */}
          <button
            onClick={() => setSelectedMethod('cash')}
            disabled={!allowedMethods.includes('cash')}
            className={`p-3 sm:p-4 rounded-xl flex flex-col items-center gap-1 sm:gap-2 border-2 transition-colors ${selectedMethod === 'cash'
              ? 'bg-opacity-10'
              : allowedMethods.includes('cash')
                ? 'bg-white border-gray-200 hover:border-2'
                : 'bg-gray-50 border border-gray-200 opacity-50 cursor-not-allowed'
              }`}
            style={selectedMethod === 'cash' ? {
              backgroundColor: `${themeColor}20`,
              borderColor: themeColor
            } : undefined}
          >
            <span className="text-xl sm:text-2xl">💵</span>
            <span className="text-xs sm:text-sm font-medium">Espèces</span>
            {!allowedMethods.includes('cash') && (
              <span className="text-[10px] sm:text-xs text-gray-500">Non disponible</span>
            )}
          </button>

          {/* Apple Pay option - only show if available */}
          {isApplePayAvailable && (
            <button
              onClick={() => setSelectedMethod('apple_pay')}
              disabled={!allowedMethods.includes('apple_pay') || !restaurantData?.stripeAccountId}
              className={`p-3 sm:p-4 rounded-xl flex flex-col items-center gap-1 sm:gap-2 border-2 transition-colors ${selectedMethod === 'apple_pay'
                ? 'bg-opacity-10'
                : allowedMethods.includes('apple_pay') && restaurantData?.stripeAccountId
                  ? 'bg-white border-gray-200 hover:border-2'
                  : 'bg-gray-50 border border-gray-200 opacity-50 cursor-not-allowed'
                }`}
              style={selectedMethod === 'apple_pay' ? {
                backgroundColor: `${themeColor}20`,
                borderColor: themeColor
              } : undefined}
            >
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/thumb/b/b0/Apple_Pay_logo.svg/1920px-Apple_Pay_logo.svg.png"
                alt="Apple Pay"
                className="h-6 sm:h-8 object-contain"
              />
              <span className="text-xs sm:text-sm font-medium">Apple Pay</span>
              {!(allowedMethods.includes('apple_pay') && restaurantData?.stripeAccountId) && (
                <span className="text-[10px] sm:text-xs text-gray-500">Non disponible</span>
              )}
            </button>
          )}

          {/* Google Pay option - only show if available */}
          {isGooglePayAvailable && (
            <button
              onClick={() => setSelectedMethod('google_pay')}
              disabled={!restaurantData?.stripeAccountId}
              className={`p-3 sm:p-4 rounded-xl flex flex-col items-center gap-1 sm:gap-2 border-2 transition-colors ${selectedMethod === 'google_pay'
                ? 'bg-opacity-10'
                : restaurantData?.stripeAccountId
                  ? 'bg-white border-gray-200 hover:border-2'
                  : 'bg-gray-50 border border-gray-200 opacity-50 cursor-not-allowed'
                }`}
              style={selectedMethod === 'google_pay' ? {
                backgroundColor: `${themeColor}20`,
                borderColor: themeColor
              } : undefined}
            >
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/thumb/f/f2/Google_Pay_Logo.svg/1200px-Google_Pay_Logo.svg.png"
                alt="Google Pay"
                className="h-6 sm:h-8 object-contain"
              />
              <span className="text-xs sm:text-sm font-medium">Google Pay</span>
              {!restaurantData?.stripeAccountId && (
                <span className="text-[10px] sm:text-xs text-gray-500">Non disponible</span>
              )}
            </button>
          )}
        </div>

        <div className="flex-1 overflow-auto">
          <OrderSummary
            restaurants={restaurantItems}
            items={items}
            serviceFees={serviceFees}
            subtotal={subtotal}
            total={total}
            themeColor={themeColor}
            setMessage={!isFoodCourtOrder && !isRegisterMode ? setMessage : undefined}
          />
        </div>

        <div className="sticky bottom-0 left-0 right-0 pb-safe bg-gray-50 pt-2">
          <button onClick={handlePayment} disabled={loading /* || !user */ || items.length === 0} className="w-full text-white py-2.5 sm:py-3 rounded-xl font-medium" style={{ backgroundColor: themeColor }}>
            {loading ? 'Traitement en cours...' : `Payer ${total.toFixed(2)} €`}
          </button>
        </div>
      </div>

      {/* Modal de suggestions */}
      {showUpsell && items.length > 0 && suggestions.length > 0 && (
        <UpsellModal
          suggestions={suggestions}
          onClose={handleUpsellComplete}
          onComplete={handleUpsellComplete}
        />
      )}
    </div>
  );
}