import { AlertCircle, ChevronLeft, Loader2, Lock, Mail } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import BottomNavigation from '../../components/layout/BottomNavigation';
import { signIn } from '../../services/authService';

export default function SignIn() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const redirect = new URLSearchParams(window.location.search).get('redirect');

  const handleBack = () => {
    navigate('/discover', { replace: true });
  };

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);

      const { role } = await signIn(formData.email, formData.password);

      // Rediriger les comptes restaurant vers l'admin
      if (role === 'owner' || role === 'staff') {
        window.location.href = '/admin/live-orders';
        return;
      }
      // if there is a redirect param, redirect to the specified page
      if (redirect) {
        window.location.href = redirect;
        return;
      }

      // Rediriger les utilisateurs normaux vers discover
      navigate('/discover');
    } catch (err) {
      console.error('Login error:', err);
      setError('Email ou mot de passe incorrect');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-[url('https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&h=1200')] bg-cover bg-center">
      <div className="absolute inset-0 bg-black bg-opacity-50 flex flex-col">
        <div className="relative flex-1 flex flex-col">
          <button onClick={handleBack} className="fixed top-1 left-4 z-50 w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center text-white">
            <ChevronLeft className="h-6 w-6" />
          </button>

          <div className="mt-safe">
            <img src="https://i.postimg.cc/TPbpkRnD/Tap-Eart-2.png" alt="TapEat" className="w-48 mx-auto brightness-0 invert" />
          </div>

          <div className="absolute inset-0 flex items-center justify-center px-4">
            <div className="w-full max-w-md">
              <h2 className="text-center text-3xl font-bold text-white mb-8">Connexion</h2>

              {error && (
                <div className="mb-4 p-4 bg-white/10 text-white rounded-lg flex items-center gap-2 backdrop-blur-sm">
                  <AlertCircle className="h-5 w-5" />
                  <p>{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-1">Email</label>
                  <div className="mt-1 relative">
                    <input type="email" value={formData.email} onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))} className="appearance-none block w-full px-3 py-3 pl-10 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent backdrop-blur-sm" required />
                    <Mail className="h-5 w-5 text-white/60 absolute left-3 top-3" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/80 mb-1">Mot de passe</label>
                  <div className="mt-1 relative">
                    <input type="password" value={formData.password} onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))} className="appearance-none block w-full px-3 py-3 pl-10 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent backdrop-blur-sm" required />
                    <Lock className="h-5 w-5 text-white/60 absolute left-3 top-3" />
                  </div>
                </div>

                <button type="submit" disabled={loading} className="w-full bg-emerald-500 text-white py-3 rounded-xl font-medium disabled:opacity-50 flex items-center justify-center gap-2">
                  {loading && <Loader2 className="h-5 w-5 animate-spin" />}
                  {loading ? 'Connexion en cours...' : 'Se connecter'}
                </button>

                <div className="text-center mt-4">
                  <Link to="/forgot-password" className="text-white/80 hover:text-white">
                    Mot de passe oublié ?
                  </Link>
                </div>
              </form>

              <div className="mt-4">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/20" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-transparent text-white/60">Pas encore inscrit ?</span>
                  </div>
                </div>

                <Link to={'/signup' + (redirect ? `?redirect=${redirect}` : '')} className="mt-4 w-full flex justify-center py-3 px-4 border border-transparent rounded-xl text-sm font-medium text-gray-900 bg-white hover:bg-white/90">
                  Créer un compte
                </Link>
              </div>
            </div>
          </div>
        </div>
        <BottomNavigation />
      </div>
    </div>
  );
}
