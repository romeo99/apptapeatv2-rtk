import { useState } from 'react';
import { X, Mail } from 'lucide-react';

interface EmailReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (email: string) => void;
}

export default function EmailReceiptModal({ isOpen, onClose, onSubmit }: EmailReceiptModalProps) {
  const [wantsReceipt, setWantsReceipt] = useState<boolean | null>(null);
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = () => {
    if (wantsReceipt && !email) {
      setError('Veuillez entrer votre adresse email');
      return;
    }
    if (wantsReceipt) {
      onSubmit(email);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Reçu par email</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
            <X className="h-5 w-5" />
          </button>
        </div>

        {wantsReceipt === null ? (
          <div className="space-y-4">
            <p className="text-gray-600">Souhaitez-vous recevoir votre reçu par email ?</p>
            <div className="flex gap-3">
              <button
                onClick={() => setWantsReceipt(true)}
                className="flex-1 bg-emerald-500 text-white py-3 rounded-xl font-medium"
              >
                Oui, s'il vous plaît
              </button>
              <button
                onClick={() => setWantsReceipt(false)}
                className="flex-1 bg-gray-100 text-gray-600 py-3 rounded-xl font-medium"
              >
                Non, merci
              </button>
            </div>
          </div>
        ) : wantsReceipt ? (
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Adresse email
              </label>
              <div className="relative">
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError('');
                  }}
                  className="w-full pl-10 pr-4 py-2 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="Entrez votre email"
                />
                <Mail className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              </div>
              {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
            </div>
            <button
              onClick={handleSubmit}
              className="w-full bg-emerald-500 text-white py-3 rounded-xl font-medium"
            >
              Envoyer le reçu
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-gray-600">Pas de problème ! Votre commande est confirmée.</p>
            <button
              onClick={onClose}
              className="w-full bg-emerald-500 text-white py-3 rounded-xl font-medium"
            >
              Terminer
            </button>
          </div>
        )}
      </div>
    </div>
  );
}