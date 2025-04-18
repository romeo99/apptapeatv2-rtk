import { useState, useEffect } from 'react';
import { Loader2, ArrowRight } from 'lucide-react';
import { verifyEmailCode } from '../../../services/authService';

interface SignUpVerificationProps {
  email: string;
  onComplete: (data: { verificationId: string }) => void;
}

export default function SignUpVerification({ email, onComplete }: SignUpVerificationProps) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timer, setTimer] = useState(30);

  useEffect(() => {
    const countdown = setInterval(() => {
      setTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(countdown);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);

      await verifyEmailCode(email, code);
      onComplete({ verificationId: email }); // Using email as verificationId for simplicity
    } catch (err) {
      console.error('Error verifying code:', err);
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col justify-center px-4">
      <div className="max-w-sm mx-auto w-full">
        <h1 className="text-2xl font-bold text-center mb-2">
          Vérifiez votre email
        </h1>
        <p className="text-gray-500 text-center mb-8">
          Entrez le code à 6 chiffres envoyé à {email}
        </p>

        {error && (
          <div className="mb-4 p-4 bg-red-50 text-red-500 rounded-xl text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Code de vérification
            </label>
            <input
              type="text"
              inputMode="numeric"
              pattern="\d{6}"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-center text-2xl tracking-widest"
              placeholder="000000"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading || code.length !== 6}
            className="w-full bg-emerald-500 text-white py-3 rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <span>Vérifier</span>
                <ArrowRight className="h-5 w-5" />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 text-center">
          {timer > 0 ? (
            <p className="text-sm text-gray-500">
              Renvoyer le code dans {timer}s
            </p>
          ) : (
            <button
              onClick={() => {
                // Implement resend logic
                setTimer(30);
              }}
              className="text-sm text-emerald-500 font-medium"
            >
              Renvoyer le code
            </button>
          )}
        </div>
      </div>
    </div>
  );
}