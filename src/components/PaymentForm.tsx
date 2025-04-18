import { useState, useEffect } from 'react';
import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Loader2 } from 'lucide-react';

interface PaymentFormProps {
  amount: number;
  onSuccess: () => void;
  onError: (error: { message: string }) => void;
}

export default function PaymentForm({ amount, onSuccess, onError }: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'apple_pay' | 'google_pay'>('card');

  useEffect(() => {
    if (!stripe || !elements) return;

    // Check for Apple Pay / Google Pay availability
    const checkWalletAvailability = async () => {
      const { error: applePayError } = await stripe.canMakePayment();
      if (!applePayError) {
        setPaymentMethod('apple_pay');
      }
    };

    checkWalletAvailability();
  }, [stripe, elements]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    try {
      setProcessing(true);

      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/order-confirmation`,
          payment_method_data: {
            type: paymentMethod,
          },
        },
      });

      if (error) {
        onError({ message: error.message || 'Une erreur est survenue' });
      } else {
        onSuccess();
      }
    } catch (err) {
      onError({ message: 'Une erreur est survenue lors du paiement' });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement 
        options={{
          layout: 'tabs',
          wallets: {
            applePay: 'auto',
            googlePay: 'auto'
          }
        }}
      />
      
      <button
        type="submit"
        disabled={!stripe || processing}
        className="w-full bg-emerald-500 text-white py-3 rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {processing && <Loader2 className="h-5 w-5 animate-spin" />}
        {processing ? 'Traitement en cours...' : `Payer ${(amount / 100).toFixed(2)} €`}
      </button>
    </form>
  );
}