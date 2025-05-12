import { ChevronLeft } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getToken, messaging, onMessage } from '../../../config/firebase';
import { useAuth } from '../../../context/AuthContext';
import { getUserNotificationSettings, updateNotificationSettings } from '../../../services/userService';

export default function NotificationsPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettings] = useState({
    orderUpdates: true,
    promotions: true,
    newsletter: false
  });

  const { user } = useAuth();

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const userSettings = await getUserNotificationSettings();
        setSettings(userSettings);
      } catch (err) {
        console.error('Error loading notification settings:', err);
      }
    };

    loadSettings();
  }, []);

  const handleToggle = async (setting: keyof typeof settings) => {
    try {
      setLoading(true);
      const newSettings = {
        ...settings,
        [setting]: !settings[setting]
      };

      await updateNotificationSettings(newSettings);
      setSettings(newSettings);
    } catch (err) {
      setError('Une erreur est survenue lors de la mise à jour des paramètres');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Demande de permission et récupération du token
    Notification.requestPermission().then((permission) => {
      if (permission === 'granted') {
        getToken(messaging, { vapidKey: 'BGIH8rTk75riG0Qsf50gDOlxnNRgEOkfJmnUuT_muVPU8Rh7Y6VIbRmZYQbR91wc8duWyCIaSU86FDiTFAB2kv8' })
          .then((currentToken) => {
            if (currentToken) {
              console.log('Token:', currentToken);
              // Enregistrer le token côté serveur ici
            } else {
              console.warn('Aucun token dispo');
            }
          })
          .catch(err => console.error('Erreur de récupération du token:', err));
      }
    });

    // Ecoute des notifications en foreground
    onMessage(messaging, (payload) => {
      console.log('Message reçu en foreground:', payload);
      const { title, body } = payload.notification;
      // Afficher la notif custom ou via toast
      new Notification(title, { body });
    });
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white px-4 py-4 flex items-center gap-4">
        <button
          onClick={() => navigate('/profile')}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
        <h1 className="text-xl font-semibold">Notifications</h1>
      </div>

      <div className="p-4">
        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-500 rounded-lg">
            {error}
          </div>
        )}

        <div className="bg-white rounded-xl p-4 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Mises à jour des commandes</h3>
              <p className="text-sm text-gray-500">
                Notifications sur l'état de vos commandes
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.orderUpdates}
                onChange={() => handleToggle('orderUpdates')}
                disabled={loading}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Promotions</h3>
              <p className="text-sm text-gray-500">
                Offres spéciales et réductions
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.promotions}
                onChange={() => handleToggle('promotions')}
                disabled={loading}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Newsletter</h3>
              <p className="text-sm text-gray-500">
                Actualités et nouveautés
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.newsletter}
                onChange={() => handleToggle('newsletter')}
                disabled={loading}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}