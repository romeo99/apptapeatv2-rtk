import { X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useCart } from '../context/CartContext';
import { useRestaurantContext } from '../context/RestaurantContext';
import { availableIngredients } from '../data/ingredients';

interface ProductDetailsProps {
  product: {
    id: string;
    name: string;
    price: number;
    image: string;
    description?: string;
    ingredients?: Array<{
      id: string;
      name: string;
      icon: string;
    }>;
    status?: string;
  };
  onClose: () => void;
}

export default function ProductDetails({ product, onClose }: ProductDetailsProps) {
  const { addItem } = useCart();
  const { menu, themeColor } = useRestaurantContext();
  const [excludedIngredients, setExcludedIngredients] = useState<string[]>([]);
  const [showAnimation, setShowAnimation] = useState(false);
  const [productIngredients, setProductIngredients] = useState<Array<{ id: string; name: string; icon: string }>>([]);
  const [remarks, setRemarks] = useState('');

  useEffect(() => {
    const fullProduct = menu?.find(item => item.id === product.id);
    if (fullProduct?.ingredients) {
      const ingredients = fullProduct.ingredients.map((id: string) => {
        const ingredient = availableIngredients.find(ing => ing.id === id);
        return ingredient || null;
      }).filter((ing: { id: string, name: string, icon: string }): ing is NonNullable<typeof ing> => ing !== null);
      setProductIngredients(ingredients);
    }
  }, [product.id, menu]);

  const handleAddToCart = () => {
    // Ne rien faire si le produit n'est pas disponible
    if (product.status !== 'available') return;
    const cleanedRemarks = remarks && remarks.trim() !== '' ? remarks.trim() : null;

    // Vibrate on mobile devices
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }

    // Close modal immediately
    onClose();

    // Add item to cart
    const excludedNames = excludedIngredients.length > 0 && productIngredients.length > 0
      ? productIngredients
        .filter(ing => excludedIngredients.includes(ing.id))
        .map(ing => ing.name)
      : undefined;

    addItem({
      ...product,
      restaurantId: window.location.search.split('restaurantId=')[1]?.split('&')[0] || '',
      excludedIngredients: excludedNames,
      remarks: remarks.trim() || null,
      quantity: 1
    });
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center" onClick={handleBackdropClick}>
      <div className="bg-white w-full max-w-lg mx-4 rounded-2xl overflow-hidden">
        <div className="relative h-48">
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="p-4">
          <h2 className="text-xl font-medium mb-2">{product.name}</h2>
          <p className="text-lg mb-4" style={{ color: themeColor }}>{product.price.toFixed(2)} €</p>

          <p className="text-gray-600 mb-6">
            {product.description || "Un délicieux plat préparé avec des ingrédients frais"}
          </p>

          {productIngredients.length > 0 ? (
            <>
              <h3 className="font-medium mb-3">Ingrédients</h3>
              <div className="grid grid-cols-4 gap-2">
                {productIngredients.map((ingredient) => (
                  <button
                    key={`${product.id}-ingredient-${ingredient.id}`}
                    onClick={() => {
                      setExcludedIngredients(prev =>
                        prev.includes(ingredient.id)
                          ? prev.filter(id => id !== ingredient.id)
                          : [...prev, ingredient.id]
                      );
                    }}
                    className={`flex flex-col items-center p-2 rounded-xl transition-all ${excludedIngredients.includes(ingredient.id)
                        ? 'bg-red-50 text-red-500'
                        : `bg-gray-50 hover:bg-[${themeColor}10]`
                      }`}
                  >
                    <span className="text-2xl mb-1">{ingredient.icon}</span>
                    <span className="text-xs text-center leading-tight">
                      {ingredient.name}
                    </span>
                    {excludedIngredients.includes(ingredient.id) && (
                      <span className="text-xs text-red-500 mt-1">Exclu</span>
                    )}
                  </button>
                ))}
              </div>
            </>
          ) : (
            <p className="text-gray-500">Aucune information sur les ingrédients</p>
          )}

          <div className="mt-6">
            {/* Remarques */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Remarques pour le restaurant
              </label>
              <textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Ex: Sans sauce, bien cuit..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                rows={3}
              />
            </div>

            <button
              onClick={handleAddToCart}
              className="w-full text-white py-3 rounded-xl font-medium hover:scale-[1.02] active:scale-[0.98] transition-transform"
              style={{ backgroundColor: themeColor }}
            >
              {product.status === 'available' ? 'Ajouter au panier' : 'Non disponible'}
            </button>
          </div>
        </div>
      </div>

      {/* Animation element */}
      {showAnimation && (
        <div
          className="fixed w-32 h-32 rounded-xl bg-white shadow-xl z-[100] pointer-events-none left-1/2 top-1/2"
          style={{
            animation: 'addToCart 0.3s ease-in-out forwards',
            backgroundImage: `url(${product.image})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            transform: 'translate(-50%, -50%)',
            willChange: 'transform, opacity',
            border: '2px solid white'
          }}
        />
      )}
    </div>
  );
}