import { getFunctions, httpsCallable } from 'firebase/functions';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import AdminLayout from '../../../components/admin/AdminLayout';
import { useRestaurantContext } from '../../../context/RestaurantContext';

export default function StripeConnect() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const { restaurant } = useRestaurantContext();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    // Check for success parameter in URL
    if (searchParams.get('success') === 'true') {
      setSuccessMessage('Votre compte Stripe a été connecté avec succès!');
    }
  }, [searchParams]);

  const handleConnectStripe = async () => {
    try {
      setLoading(true);
      setError(null);

      const functions = getFunctions();

      const createConnectAccount = httpsCallable(functions, 'createStripeConnectAccount');
      const result = await createConnectAccount({ restaurantId: restaurant?.id });

      // The result will contain the Stripe Connect onboarding URL
      const { url } = result.data as { url: string };

      // Redirect to Stripe Connect onboarding
      window.location.href = url;
    } catch (err) {
      console.error('Error creating Stripe Connect account:', err);
      setError('Une erreur est survenue lors de la création du compte Stripe Connect. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  const getStripeDashboardUrl = async (accountId: string | undefined) => {
    try {
      const response = await fetch(`https://api.stripe.com/v1/accounts/${accountId}/login_links`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${import.meta.env.VITE_STRIPE_SECRET_KEY}`,
        },
      });

      const data = await response.json();
      if (data.url) {
        //window.location.href = data.url; // Rediriger l'utilisateur vers Stripe
        window.open(data.url, '_blank');
      } else {
        console.error("Erreur lors de la récupération du lien:", data);
        alert("Impossible d'obtenir le lien Stripe.");
      }
    } catch (error) {
      console.error("Erreur:", error);
      alert("Une erreur est survenue.");
    }
  }

  const isStripeConnected = restaurant?.stripeAccountId;

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-2xl font-bold mb-4">Configuration Stripe Connect</h2>

          <p className="text-gray-600 mb-6">Pour recevoir des paiements, vous devez configurer votre compte Stripe Connect. Cela vous permettra de recevoir les paiements directement sur votre compte bancaire.</p>

          {successMessage && <div className="bg-green-50 text-green-700 p-4 rounded-md mb-4">{successMessage}</div>}

          {error && <div className="bg-red-50 text-red-700 p-4 rounded-md mb-4">{error}</div>}

          {isStripeConnected ? (
            <button className="bg-blue-50 text-blue-700 p-4 rounded-md" onClick={() => getStripeDashboardUrl(restaurant?.stripeAccountId)}>Votre compte est déjà connecté à Stripe. Cliquez pour accédez au dashboard</button>
          ) : (
            <button onClick={handleConnectStripe} disabled={loading} className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}>
              {loading ? 'Chargement...' : 'Connecter mon compte Stripe'}
            </button>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
