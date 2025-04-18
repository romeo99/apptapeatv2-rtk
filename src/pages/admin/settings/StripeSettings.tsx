import { ChevronLeft, Loader2, Save } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import AdminLayout from '../../../components/admin/AdminLayout';
import LoadingSpinner from '../../../components/LoadingSpinner';
import { useRestaurantContext } from '../../../context/RestaurantContext';
import useOrderNotification from '../../../hooks/useOrderNotification';
import { updateRestaurant } from '../../../services/restaurantService';
import { auth } from '../../../config/firebase';

export default function StripeSettings() {
  const navigate = useNavigate();
  const { restaurant, loading, error: contextError } = useRestaurantContext();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    stripeSecretKey: '',
    stripePublishableKey: ''
  });

  useOrderNotification();

  useEffect(() => {
    if (restaurant) {
      setFormData({
        stripeSecretKey: restaurant.stripeSecretKey || '',
        stripePublishableKey: restaurant.stripePublishableKey || ''
      });
    }
  }, [restaurant]);

  const validateForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!restaurant?.id) return;

    // Basic Stripe key validation
    if (formData.stripeSecretKey && !formData.stripeSecretKey.startsWith('sk_')) {
      setError('La clé secrète Stripe doit commencer par "sk_"');
      return false;
    }

    if (formData.stripePublishableKey && !formData.stripePublishableKey.startsWith('pk_')) {
      setError('La clé publique Stripe doit commencer par "pk_"');
      return false;
    }
    
    setError(null);
    setShowPasswordModal(true);
    return true;
  };

  const handlePasswordVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required data
    if (!restaurant?.id || !restaurant.email) {
      setPasswordError("Une erreur est survenue. Veuillez réessayer.");
      return;
    }

    // Validate password
    if (!password.trim()) {
      setPasswordError("Veuillez entrer votre mot de passe actuel.");
      return;
    }
    
    try {
      setSaving(true);
      setPasswordError(null);

      // Get current user
      const user = auth.currentUser;
      if (!user || !user.email) {
        throw new Error('Utilisateur non authentifié');
      }

      // Create credential with current user's email and provided password
      const credential = EmailAuthProvider.credential(user.email, password);
      
      // Re-authenticate with credential
      await reauthenticateWithCredential(user, credential);
      
      // If authentication successful, update Stripe settings
      await updateRestaurant(restaurant.id, {
        stripeSecretKey: formData.stripeSecretKey,
        stripePublishableKey: formData.stripePublishableKey
      });

      // Reset form state and show success message
      setShowPasswordModal(false);
      setPassword('');
      setSuccess('Configuration Stripe mise à jour avec succès');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('Error during password verification:', err);
      
      // Handle specific Firebase auth errors
      switch (err.code) {
        case 'auth/invalid-credential':
        case 'auth/wrong-password':
          setPasswordError('Le mot de passe saisi est incorrect. Veuillez vérifier votre mot de passe actuel.');
          break;
        case 'auth/too-many-requests':
          setPasswordError('Trop de tentatives. Veuillez réessayer plus tard.');
          break;
        case 'auth/network-request-failed':
          setPasswordError('Erreur de connexion. Veuillez vérifier votre connexion internet.');
          break;
        case 'auth/user-disabled':
          setPasswordError('Ce compte a été désactivé. Veuillez contacter le support.');
          break;
        default:
          setPasswordError('Une erreur est survenue lors de la vérification. Veuillez réessayer.');
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <LoadingSpinner />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6 flex items-center gap-4">
            <button
              onClick={() => navigate('/admin/settings')}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <h1 className="text-2xl font-bold text-gray-900">Configuration Stripe</h1>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-500 rounded-lg">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 text-green-500 rounded-lg">
            {success}
          </div>
        )}

        <div className="bg-white rounded-lg shadow-sm p-6">
          <form onSubmit={validateForm} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Clé secrète Stripe (Secret Key)
              </label>
              <input
                type="text"
                value={formData.stripeSecretKey}
                onChange={(e) => setFormData(prev => ({ ...prev, stripeSecretKey: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="sk_..."
              />
              <p className="mt-1 text-sm text-gray-500">
                Vous trouverez cette clé dans votre tableau de bord Stripe, section Développeurs &gt; Clés API.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Clé publique Stripe (Publishable Key)
              </label>
              <input
                type="text"
                value={formData.stripePublishableKey}
                onChange={(e) => setFormData(prev => ({ ...prev, stripePublishableKey: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="pk_..."
              />
              <p className="mt-1 text-sm text-gray-500">
                Vous trouverez cette clé dans votre tableau de bord Stripe, section Développeurs &gt; Clés API.
              </p>
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => navigate('/admin/settings')}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                <Save className="h-5 w-5" />
                {saving ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            </div>
          </form>
        </div>

        <div className="mt-8 bg-blue-50 rounded-lg p-4">
          <h3 className="text-blue-800 font-medium mb-2">Informations importantes</h3>
          <ul className="text-sm text-blue-700 space-y-2">
            <li>• Assurez-vous d'utiliser les clés API de votre compte Stripe en mode production pour les paiements réels.</li>
            <li>• Pour les tests, utilisez les clés API en mode test (commençant par sk_test_ et pk_test_).</li>
            <li>• Configurez vos webhooks Stripe pour recevoir les notifications de paiement.</li>
            <li>• Pour activer Apple Pay et Google Pay, vous devez configurer ces méthodes dans votre tableau de bord Stripe.</li>
            <li>• Pour Apple Pay, vous devez également configurer votre domaine dans le tableau de bord Stripe.</li>
            <li>• Vérifiez régulièrement votre tableau de bord Stripe pour suivre vos transactions.</li>
          </ul>
        </div>
      </div>
      
      {/* Password verification modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium mb-4">Vérification de sécurité</h3>
            <p className="text-gray-600 mb-4">
              Pour des raisons de sécurité, veuillez entrer votre mot de passe actuel pour confirmer cette modification.
            </p>
            
            {passwordError && (
              <div className="mb-4 p-3 bg-red-50 text-red-500 rounded-lg text-sm">
                {passwordError}
              </div>
            )}
            
            <form onSubmit={handlePasswordVerification} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mot de passe actuel
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="Entrez votre mot de passe actuel"
                  required
                />
              </div>
              
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordModal(false);
                    setPassword('');
                    setPasswordError(null);
                  }}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={saving || !password.trim()}
                  className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 disabled:opacity-50 flex items-center gap-2"
                >
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                  <Save className="h-5 w-5" />
                  {saving ? 'Vérification...' : 'Confirmer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}