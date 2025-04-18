import { useState } from 'react';
import { X, Delete, Search } from 'lucide-react';

interface OrderSearchKeypadProps {
  onClose: () => void;
  onSearch: (orderNumber: string) => void;
}

export default function OrderSearchKeypad({ onClose, onSearch }: OrderSearchKeypadProps) {
  const [input, setInput] = useState('');

  const handleKeyPress = (key: string) => {
    if (input.length < 6) { // Limit to 6 digits
      setInput(prev => prev + key);
    }
  };

  const handleDelete = () => {
    setInput(prev => prev.slice(0, -1));
  };

  const handleSearch = () => {
    if (input) {
      onSearch(input);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto" onClick={() => onClose()}>
      <div 
        className="bg-white rounded-2xl w-full max-w-[320px] relative" 
        onClick={e => e.stopPropagation()}
      >
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-lg font-semibold">Rechercher une commande</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4 overflow-y-auto">
          <div className="bg-gray-100 p-4 rounded-lg mb-4">
            <input
              type="text"
              value={input}
              readOnly
              placeholder="Entrez le numéro"
              className="w-full text-2xl font-bold text-center bg-transparent focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
              <button
                key={num}
                onClick={() => handleKeyPress(num.toString())}
                className="h-12 bg-gray-100 rounded-xl text-xl font-semibold hover:bg-gray-200"
              >
                {num}
              </button>
            ))}
            <button
              onClick={() => handleKeyPress('0')}
              className="h-12 bg-gray-100 rounded-xl text-xl font-semibold hover:bg-gray-200"
            >
              0
            </button>
            <button
              onClick={handleDelete}
              className="h-12 bg-gray-100 rounded-xl flex items-center justify-center hover:bg-gray-200"
            >
              <Delete className="h-6 w-6" />
            </button>
            <button
              onClick={handleSearch}
              className="h-12 bg-emerald-500 text-white rounded-xl flex items-center justify-center hover:bg-emerald-600"
            >
              <Search className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}