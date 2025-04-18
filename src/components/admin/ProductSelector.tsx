import { useState } from 'react';
import { Search } from 'lucide-react';
import type { MenuItem } from '../../types/firebase';

interface ProductSelectorProps {
  products: MenuItem[];
  onSelect: (product: MenuItem) => void;
  onClose: () => void;
  title: string;
}

export default function ProductSelector({ products, onSelect, onClose, title }: ProductSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelect = (product: MenuItem, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onSelect(product);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" onClick={(e) => {
      e.preventDefault();
      e.stopPropagation();
    }}>
      <div className="bg-white rounded-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        <div className="p-4 border-b">
          <h2 className="text-lg font-medium">{title}</h2>
          <div className="mt-2 relative">
            <input
              type="text"
              placeholder="Rechercher un produit..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg"
            />
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-2 gap-4">
            {filteredProducts.map((product) => (
              <button
                key={product.id}
                type="button"
                onClick={(e) => handleSelect(product, e)}
                className="flex flex-col items-center p-4 border rounded-lg hover:border-emerald-500 transition-colors"
              >
                <div className="w-full aspect-square mb-3 rounded-lg overflow-hidden">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <span className="font-medium text-center">{product.name}</span>
                <span className="text-sm text-emerald-600">{product.price.toFixed(2)} €</span>
              </button>
            ))}
          </div>

          {filteredProducts.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              Aucun produit trouvé
            </div>
          )}
        </div>

        <div className="p-4 border-t">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onClose();
            }}
            className="w-full px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}