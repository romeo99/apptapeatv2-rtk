import { useState } from 'react';
import { Star, X, Loader2 } from 'lucide-react';
import { useRestaurantContext } from '../context/RestaurantContext';

interface RatingModalProps {
  orderId: string;
  restaurantId: string;
  onClose: () => void;
  onSubmit: (rating: number, comment: string) => Promise<void>;
}

export default function RatingModal({ orderId, restaurantId, onClose, onSubmit }: RatingModalProps) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { themeColor } = useRestaurantContext();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent event bubbling
    
    if (rating === 0) {
      setError('Veuillez sélectionner une note');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await onSubmit(rating, comment);
      onClose();
    } catch (err) {
      console.error('Error submitting review:', err);
      setError('Une erreur est survenue lors de l\'envoi de votre avis');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      onClick={(e) => {
        e.stopPropagation(); // Prevent event bubbling
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-lg font-semibold">Noter votre commande</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 text-red-500 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="flex justify-center gap-2">
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setRating(value)}
                onMouseEnter={() => setHoveredRating(value)}
                onMouseLeave={() => setHoveredRating(0)}
                className="p-1 transition-transform hover:scale-110"
              >
                <Star
                  className={`h-8 w-8 ${
                    value <= (hoveredRating || rating)
                      ? 'fill-current text-yellow-400'
                      : 'text-gray-300'
                  }`}
                />
              </button>
            ))}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Commentaire (optionnel)
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="Partagez votre expérience..."
            />
          </div>

          <button
            type="submit"
            disabled={loading || rating === 0}
            className="w-full py-3 rounded-xl font-medium text-white flex items-center justify-center gap-2 disabled:opacity-50"
            style={{ backgroundColor: themeColor }}
          >
            {loading && <Loader2 className="h-5 w-5 animate-spin" />}
            {loading ? 'Envoi en cours...' : 'Envoyer mon avis'}
          </button>
        </form>
      </div>
    </div>
  );
}