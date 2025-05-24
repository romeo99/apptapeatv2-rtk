import { collection, doc, getDocs, onSnapshot, query, serverTimestamp, updateDoc, where } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { ChevronLeft, Receipt } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import LoadingSpinner from '../components/LoadingSpinner';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import { useRestaurantContext } from '../context/RestaurantContext';
import { Order } from '../types/firebase';

export default function OrderConfirmation() {
  const { user } = useAuth()
  const navigate = useNavigate();
  const location = useLocation();
  const { themeColor } = useRestaurantContext();
  const [orderDetails, setOrderDetails] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const orderId = location.state?.orderId;
  const [sessionId, setSessionId] = useState<string | null>(null);

  const [showModal, setShowModal] = useState(false);
  const [email, setEmail] = useState(user?.email || '');
  const [sending, setSending] = useState(false);

  // Set up listener for the order if we have an orderId
  useEffect(() => {
    if (orderId && location.state?.restaurantId) {
      const restaurantId = location.state.restaurantId;
      const orderRef = doc(db, 'restaurants', restaurantId, 'orders', orderId);
      const unsubscribe = onSnapshot(orderRef, (snapshot) => {
        if (snapshot.exists()) {
          const orderData = snapshot.data();
          setOrderDetails({
            id: snapshot.id,
            ...orderData,
            createdAt: orderData.createdAt?.toDate() || new Date(),
            updatedAt: orderData.updatedAt?.toDate() || new Date()
          } as Order);
          setLoading(false);
          setShowModal(true);
        } else {
          setLoading(false);
        }
      });
      return () => unsubscribe();
    }
  }, [orderId, location.state]);

  // Handle Stripe session_id parameter when redirected from payment
  useEffect(() => {
    const sessionId = new URLSearchParams(window.location.search).get('session_id');
    if (sessionId) {
      console.log(`Payment confirmed with session ID: ${sessionId}`);
      setSessionId(sessionId);
      setLoading(true);

      // Try to find the order from Stripe session ID
      const fetchOrderFromSession = async () => {
        try {
          console.log('Searching for order with session ID:', sessionId);
          // Get all restaurants
          const restaurantsRef = collection(db, 'restaurants');
          const restaurantsSnapshot = await getDocs(restaurantsRef);

          let orderFound = false;
          // Check each restaurant for the order with this session ID
          for (const restaurantDoc of restaurantsSnapshot.docs) {
            const ordersRef = collection(db, 'restaurants', restaurantDoc.id, 'orders');
            const q = query(ordersRef, where('stripeSessionId', '==', sessionId));
            console.log(`Searching for order with session ID ${sessionId} in restaurant ${restaurantDoc.id}`);
            const orderSnapshot = await getDocs(q);

            if (!orderSnapshot.empty) {
              orderFound = true;
              const foundOrderId = orderSnapshot.docs[0].id;
              console.log(`Found order ${foundOrderId} in restaurant ${restaurantDoc.id}`);
              const orderRef = doc(db, 'restaurants', restaurantDoc.id, 'orders', foundOrderId);

              // Set up real-time listener for this order
              const unsubscribe = onSnapshot(orderRef, (doc) => {
                if (doc.exists()) {
                  const orderData = doc.data();
                  console.log(`Order ${doc.id} data:`, orderData);

                  // Vérifier si le paiement est confirmé
                  if (orderData.paymentStatus !== 'paid') {
                    console.log(`Order ${doc.id} payment not yet confirmed, updating...`);
                    // Mettre à jour le statut de paiement si nécessaire
                    updateDoc(orderRef, {
                      paymentStatus: 'paid',
                      status: 'pending', // Change status to pending to make it visible in admin panel
                      visibleInDashboard: true,
                      updatedAt: serverTimestamp()
                    }).catch(err => console.error('Error updating payment status:', err));
                  }

                  setOrderDetails({
                    id: doc.id,
                    ...orderData,
                    createdAt: orderData.createdAt?.toDate() || new Date(),
                    updatedAt: orderData.updatedAt?.toDate() || new Date()
                  } as Order);
                  setLoading(false);
                }
              });

              return () => unsubscribe();
            }
          }

          if (!orderFound) {
            console.error(`No order found with session ID: ${sessionId}`);
          }
          setLoading(false);
        } catch (err) {
          console.error('Error fetching order from session:', err);
          setLoading(false);
        }
      };

      fetchOrderFromSession();
    } else if (!orderId) {
      // If no order info, redirect after a delay
      setTimeout(() => {
        navigate('/discover', { replace: true });
      }, 2000);
    } else {
      setLoading(false);
    }
  }, [orderId, navigate, sessionId]);

  // Handle back button - redirect to discover page instead of going back to Stripe
  const handleBack = () => {
    navigate('/discover');
  };

  // Handle email submission
  const handleEmailSubmit = async () => {
    //Demande de email pour envoie de ticket par mail
    const functions = getFunctions();
    const sendEmail = httpsCallable(functions, 'sendOrderConfirmation');

    setSending(true);
    try {
      // Send email logic here
      await sendEmail({
        to: email,
        subject: 'Merci pour votre commande',
        order: orderDetails,
      });
      // After sending, close the modal
      setShowModal(false);
    } catch (error) {
      console.error('Error sending email:', error);
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="fixed top-0 left-0 right-0 bg-white z-10 p-4">
        <button
          onClick={handleBack}
          className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center"
        >
          <ChevronLeft className="h-5 w-5 text-white" />
        </button>
        <h1 className="text-center text-2xl font-bold mt-4">Confirmation de commande</h1>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center pt-32 pb-8 px-4">
        <p className="text-gray-600 text-xl mb-6">Numéro de commande</p>
        <div className="w-full max-w-md">
          {/* Order confirmation icon and message */}
          <div className="text-center mb-6">
            <div className="flex items-center justify-center gap-4 mb-6">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center">
                <Receipt className="h-8 w-8 text-emerald-500" />
              </div>

              {/* Order number with format like #ESP145 */}
              <h2 className="text-4xl font-bold text-emerald-500">
                #{orderDetails?.orderNumber || `${orderDetails?.paymentMethod === 'cash' ? 'ESP' : 'CB'}${orderDetails?.id?.slice(-3)}`}
              </h2>
            </div>

            <button
              onClick={() => navigate(`/track-order/${orderDetails?.id}`)}
              className="w-full bg-emerald-500 text-white py-4 rounded-lg font-medium text-lg mb-6"
              style={{ backgroundColor: themeColor }}
            >
              Suivre ma commande
            </button>
          </div>

          {/* Order details card */}
          <div className="bg-white rounded-lg shadow mb-6">
            <div className="p-4 border-b">
              <h3 className="text-xl font-semibold">Détails de la commande</h3>
            </div>

            {orderDetails?.items && (
              <div className="p-4">
                {/* Order items */}
                {orderDetails.items.map((item, index) => (
                  <div key={index} className="flex mb-4">
                    {item.image && (
                      <div className="mr-3">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-24 h-24 object-cover rounded-lg"
                        />
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <div>
                          <h4 className="font-semibold text-lg">{item.name.toUpperCase()}</h4>
                          <p className="text-gray-500">Quantité : {item.quantity}</p>

                          {/* Display combo sections */}
                          {item.sections?.map((section, idx) => (
                            <div key={idx} className="text-sm text-gray-600 mt-1">
                              <span className="font-medium">{section.name} : </span>
                              {section.choice}
                              {!section.included && (
                                <span className="text-emerald-500 ml-1">(+supplément)</span>
                              )}
                            </div>
                          ))}

                          {/* Display regular options */}
                          {item.menuOptions && !item.sections && (
                            <div className="text-sm text-gray-600">
                              {item.menuOptions.drink && (
                                <p>Boisson : {item.menuOptions.drink}</p>
                              )}
                              {item.menuOptions.side && (
                                <p>Accompagnement : {item.menuOptions.side}</p>
                              )}
                              {item.menuOptions.sauces?.length > 0 && (
                                <p>Sauces : {item.menuOptions.sauces.join(', ')}</p>
                              )}
                            </div>
                          )}

                          {/* Display excluded ingredients */}
                          {item.excludedIngredients?.length > 0 && (
                            <p className="text-sm text-red-500 mt-1">
                              Sans : {item.excludedIngredients.join(', ')}
                            </p>
                          )}

                          {/* Display remarks */}
                          {item.remarks && (
                            <p className="text-sm text-gray-600 italic mt-1 bg-gray-50 p-2 rounded-lg">
                              <span className="font-medium">Remarque client :</span> {item.remarks}
                            </p>
                          )}
                        </div>
                        <div className="font-bold">{(item.price * item.quantity).toFixed(2)} €</div>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Order totals */}
                <div className="border-t pt-4 mt-4">
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-600">Sous-total total</span>
                    <span className="font-semibold">{orderDetails.subtotal?.toFixed(2)}€</span>
                  </div>
                  {orderDetails.type === 'delivery' && <div className="flex justify-between mb-2">
                    <span className="text-gray-600">Frais de livraison</span>
                    <span className="font-semibold">{orderDetails.deliveryFee!.toFixed(2)}€</span>
                  </div>}
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-600">Frais de service</span>
                    <span className="font-semibold">{((orderDetails.total || 0) - ((orderDetails.subtotal || 0) + (orderDetails.deliveryFee || 0))).toFixed(2)}€</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t mt-2">
                    <span className="text-xl font-bold">Total</span>
                    <span className="text-xl font-bold">{orderDetails.total?.toFixed(2)}€</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Buttons */}
          <div>
            <button
              onClick={() => navigate('/discover')}
              className="w-full bg-gray-100 text-gray-700 py-4 rounded-lg font-medium text-lg"
            >
              Retour au menu
            </button>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-11/12 sm:w-96">
            <h2 className="text-lg font-semibold mb-4">Confirmation</h2>
            <p className="text-gray-600 mb-4">Souhaitez-vous recevoir le reçu par mail?</p>
            <div className="flex items-center gap-2 mb-4">
              <input
                type="email"
                name="address"
                onChange={(e) => setEmail(e.target.value)}
                value={email}
                placeholder="Votre adresse email"
                className="border border-gray-300 rounded-lg px-4 py-2 w-full"
              />
            </div>
            <button onClick={handleEmailSubmit} disabled={sending || !email} className="w-full text-white py-2.5 sm:py-3 rounded-xl font-medium" style={{ backgroundColor: themeColor }}>
              {sending ? 'Envoie en cours...' : `Envoyer le reçu`}
            </button>
            <button
              onClick={() => setShowModal(false)}
              className="mt-2 w-full text-gray-500 hover:text-gray-700 transition-colors"
            >
              Passer
            </button>
          </div>
        </div>
      )}

    </div>
  );
}