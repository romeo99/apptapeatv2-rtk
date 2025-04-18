import { useState, useEffect } from 'react';
import { X, ArrowRight } from 'lucide-react';
import { useCart } from '../context/CartContext';
import type { MenuItem } from '../types/firebase';

interface UpsellModalProps {
  suggestions: MenuItem[][];
  onClose: () => void;
  onComplete: () => void;
}

export default function UpsellModal({ suggestions, onClose, onComplete }: UpsellModalProps) {
  const [currentGroupIndex, setCurrentGroupIndex] = useState(0);
  const { addItem } = useCart();
  const [modalHeight, setModalHeight] = useState('85vh');
  
  const currentGroup = suggestions[currentGroupIndex];

  // Ajuster la hauteur du modal en fonction de la taille de l'écran
  useEffect(() => {
    const adjustModalHeight = () => {
      if (window.innerHeight < 700) {
        setModalHeight('92vh');
      } else {
        setModalHeight('85vh');
      }
    };

    adjustModalHeight();
    window.addEventListener('resize', adjustModalHeight);
    return () => window.removeEventListener('resize', adjustModalHeight);
  }, []);

  // Check for empty suggestions
  useEffect(() => {
    if (!currentGroup || currentGroup.length === 0) {
      onComplete();
    }
  }, [currentGroup, onComplete]);

  const isLastGroup = currentGroupIndex === suggestions.length - 1;

  const handleAddItem = (item: MenuItem) => {
    addItem({ ...item, quantity: 1 });
    onComplete();
  };

  const handleSkipOrNext = () => {
    if (isLastGroup) {
      onComplete();
    } else {
      setCurrentGroupIndex(prev => prev + 1);
    }
  };

  if (!currentGroup || currentGroup.length === 0) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[60] flex items-end sm:items-center justify-center">
      <div 
        className="bg-white w-full sm:w-[600px] rounded-t-2xl sm:rounded-2xl overflow-hidden"
        style={{ maxHeight: modalHeight }}
      >
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-semibold">
            {currentGroup[0]?.categoryId === 'desserts' 
              ? 'Pour terminer en douceur ?' 
              : 'Une boisson pour accompagner ?'}
          </h2>
          <button 
            onClick={onComplete}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="overflow-y-auto" style={{ maxHeight: 'calc(100% - 140px)' }}>
          <div className="p-4">
            <div className="grid grid-cols-2 gap-4">
              {currentGroup.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleAddItem(item)}
                  className="bg-white rounded-xl p-4 border hover:border-emerald-500 hover:shadow-md transition-all text-left w-full"
                >
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-32 object-cover rounded-lg mb-3"
                  />
                  <h3 className="font-medium mb-1">{item.name}</h3>
                  <p className="text-sm text-gray-500 mb-2 line-clamp-2">
                    {item.description}
                  </p>
                  <p className="text-emerald-500 font-medium">{item.price.toFixed(2)} €</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 bg-white border-t p-4 pb-safe flex justify-between">
          <button
            onClick={handleSkipOrNext}
            className="text-gray-500 hover:text-gray-700 font-medium"
          >
            {isLastGroup ? 'Non merci' : 'Passer'}
          </button>
          {!isLastGroup && (
            <button
              onClick={handleSkipOrNext}
              className="text-emerald-500 hover:text-emerald-600 font-medium flex items-center gap-2"
            >
              Suivant
              <ArrowRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}