import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, ChevronLeft, Loader2, AlertCircle } from 'lucide-react';
import { sendPasswordResetCode } from '../../services/authService';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevent multiple submissions
    if (loading) return;

    if (!email.trim()) {
      setError('Veuillez entrer une adresse email');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      await sendPasswordResetCode(email);
      setSuccess(true);
    } catch (err) {
      console.error('Error sending reset code:', err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Une erreur est survenue lors de l\'envoi du code');
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <div className="flex-1 flex flex-col justify-center px-4 pb-safe">
          <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Mail className="h-8 w-8 text-emerald-500" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Email envoyé !</h2>
            <p className="text-gray-500 mb-8">
              Un email contenant les instructions pour réinitialiser votre mot de passe a été envoyé à {email}
            </p>
            <button
              onClick={() => navigate('/signin')}
              className="w-full bg-emerald-500 text-white py-3 rounded-xl font-medium"
            >
              Retour à la connexion
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="flex-1 flex flex-col justify-center px-4 pb-safe">
        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 p-2 hover:bg-gray-100 rounded-lg"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>

        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <h2 className="text-2xl font-bold text-center mb-2">
            Mot de passe oublié ?
          </h2>
          <p className="text-gray-500 text-center mb-8">
            Entrez votre email pour réinitialiser votre mot de passe
          </p>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 text-red-500 rounded-lg flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 sm:mx-auto sm:w-full sm:max-w-md">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <div className="mt-1 relative">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="appearance-none block w-full px-3 py-2 pl-10 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
                required
              />
              <Mail className="h-5 w-5 text-gray-400 absolute left-3 top-2.5" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !email}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                Envoi en cours...
              </>
            ) : (
              'Envoyer le code'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}