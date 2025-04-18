import { useState, useEffect } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';
import { createStripeAccount, getStripeAccountLink } from '../../../services/stripeService';

interface StripeConnectStepProps {
  data: {
    restaurant: {
      name: string;
    };
    owner: {
      email: string;
      firstName: string;
      lastName: string;
    };
  };
  onComplete: (stripeAccountId: string) => void;
}

export default function StripeConnectStep({ data, onComplete }: StripeConnectStepProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeStripeAccount = async () => {
      try {
        setLoading(true);
        setError(null);

        // Validate required data
        if (!data.restaurant?.name || !data.owner?.email) {
          throw new Error('Données manquantes pour la création du compte Stripe');
        }

        // Create Stripe Connect account
        const accountId = await createStripeAccount({
          email: data.owner.email,
          firstName: data.owner.firstName,
          lastName: data.owner.lastName,
          businessName: data.restaurant.name,
          country: 'FR',
          type: 'standard',
          businessType: 'individual',
          business_profile: {
            mcc: '5812', // Restaurant
            url: null,
            product_description: 'Restaurant services'
          },
          settings: {
            payments: {
              statement_descriptor: data.restaurant.name.substring(0, 22)
            }
          }
        });

        // Get account link for onboarding
        const accountLink = await getStripeAccountLink(accountId, {
          refreshUrl: `${window.location.origin}/admin/registration?step=stripe`,
          returnUrl: `${window.location.origin}/admin/dashboard`,
          type: 'account_onboarding'
        });

        // Save Stripe account ID before redirecting
        localStorage.setItem('stripeAccountId', accountId);
        localStorage.setItem('stripeOnboardingStarted', 'true');

        // Redirect to Stripe Connect onboarding
        window.location.href = accountLink.url;
      } catch (err) {
        console.error('Error initializing Stripe account:', err);
        setError(err instanceof Error ? err.message : 'Une erreur est survenue lors de la configuration du compte Stripe');
      } finally {
        setLoading(false);
      }
    };

    initializeStripeAccount();
  }, [data]);

  if (loading) {
    return (
      <div className="text-center py-12">
        <Loader2 className="h-8 w-8 text-emerald-500 animate-spin mx-auto mb-4" />
        <p className="text-gray-600">Configuration du compte de paiement...</p>
        <p className="text-sm text-gray-500 mt-2">
          Vous allez être redirigé vers Stripe pour finaliser la configuration
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="flex items-center justify-center gap-2 text-red-500 mb-4">
          <AlertCircle className="h-6 w-6" />
          <p>{error}</p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600"
        >
          Réessayer
        </button>
      </div>
    );
  }

  return null;
}