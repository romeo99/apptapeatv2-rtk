import { useState } from 'react';
import { Mail, Loader2, ArrowRight } from 'lucide-react';

interface SignUpEmailProps {
  onComplete: (data: { email: string }) => void;
}

export default function SignUpEmail({ onComplete }: SignUpEmailProps) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw new Error('Adresse email invalide');
      }

      onComplete({ email });
    } catch (err) {
      console.error('Error:', err);
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col justify-center px-4">
      <div className="max-w-sm mx-auto w-full">
        <h1 className="text-2xl font-bold text-center mb-2">Créer un compte</h1>
        <p className="text-gray-500 text-center mb-8">
          Entrez votre adresse email pour commencer
        </p>

        {error && (
          <div className="mb-4 p-4 bg-red-50 text-red-500 rounded-xl text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Adresse email
            </label>
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="vous@exemple.com"
                required
              />
              <Mail className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !email}
            className="w-full bg-emerald-500 text-white py-3 rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <span>Continuer</span>
                <ArrowRight className="h-5 w-5" />
              </>
            )}
          </button>
        </form>

        <div className="mt-8">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gray-50 text-gray-500">
                Ou s'inscrire avec
              </span>
            </div>
          </div>

          <button
            onClick={() => {
              // Google sign in will be implemented later
              console.log('Google sign in clicked');
            }}
            className="mt-4 w-full bg-white border border-gray-200 py-3 rounded-xl font-medium text-gray-600 hover:bg-gray-50 flex items-center justify-center gap-3"
          >
            <img 
              src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" 
              alt="Google"
              className="w-5 h-5"
            />
            <span>Continuer avec Google</span>
          </button>
        </div>

        <p className="text-sm text-gray-500 text-center mt-8">
          Déjà inscrit ?{' '}
          <a href="/signin" className="text-emerald-500 font-medium">
            Se connecter
          </a>
        </p>
      </div>
    </div>
  );
}