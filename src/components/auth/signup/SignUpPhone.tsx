import { useState } from 'react';
import { Phone, Loader2, ArrowRight } from 'lucide-react';

interface SignUpPhoneProps {
  onComplete: (data: { phone: string }) => Promise<void>;
}

export default function SignUpPhone({ onComplete }: SignUpPhoneProps) {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formatPhoneNumber = (value: string) => {
    // Keep only digits
    const digits = value.replace(/\D/g, '');
    
    // Format as XX XX XX XX XX
    return digits
      .slice(0, 10)
      .match(/.{1,2}/g)
      ?.join(' ') || '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const phoneDigits = phone.replace(/\D/g, '');
    if (phoneDigits.length !== 10) {
      setError('Veuillez entrer un numéro de téléphone valide');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await onComplete({ phone: phoneDigits });
    } catch (err) {
      console.error('Error:', err);
      setError('Une erreur est survenue');
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col justify-center px-4">
      <div className="max-w-sm mx-auto w-full">
        <h1 className="text-2xl font-bold text-center mb-2">
          Votre numéro de téléphone
        </h1>
        <p className="text-gray-500 text-center mb-8">
          Pour vous contacter en cas de besoin
        </p>

        {error && (
          <div className="mb-4 p-4 bg-red-50 text-red-500 rounded-xl text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Numéro de téléphone
            </label>
            <div className="relative">
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(formatPhoneNumber(e.target.value))}
                className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="06 12 34 56 78"
                required
                disabled={loading}
              />
              <Phone className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || phone.length < 14}
            className="w-full bg-emerald-500 text-white py-3 rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Inscription en cours...</span>
              </>
            ) : (
              <>
                <span>Terminer l'inscription</span>
                <ArrowRight className="h-5 w-5" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}