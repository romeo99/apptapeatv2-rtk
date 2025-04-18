import { Plus, Minus, Trash2 } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useRestaurantContext } from '../context/RestaurantContext';

interface CartItemProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  item: any;
}

export default function CartItem({ item }: CartItemProps) {
  const { updateQuantity, removeItem } = useCart();
  const { themeColor } = useRestaurantContext();

  const renderItemDetails = () => {
    const details = [];

    if (item.excludedIngredients?.length > 0) {
      details.push(
        <p key="excluded" className="text-sm text-red-500">
          Sans : {item.excludedIngredients.join(', ')}
        </p>,
      );
    }

    if (item.menuOptions) {
      if (item.menuOptions.drink) {
        details.push(
          <p key="drink" className="text-sm text-gray-500">
            Boisson : {item.menuOptions.drink}
          </p>,
        );
      }
      if (item.menuOptions.side) {
        details.push(
          <p key="side" className="text-sm text-gray-500">
            Accompagnement : {item.menuOptions.side}
          </p>,
        );
      }
      if (item.menuOptions.sauces?.length > 0) {
        details.push(
          <p key="sauces" className="text-sm text-gray-500">
            Sauces : {item.menuOptions.sauces.join(', ')}
          </p>,
        );
      }
    }

    return details;
  };

  return (
    <div className="flex items-center gap-4 bg-white rounded-lg p-3 shadow-sm">
      <img src={item.image} alt={item.name} className="w-20 h-20 object-cover rounded-lg" />
      <div className="flex-1">
        <div className="flex justify-between">
          <span className="font-medium">
            {item.quantity}x {item.name}
          </span>
          <span style={{ color: themeColor }}>{item.price.toFixed(2)} €</span>
        </div>
        {renderItemDetails()}
        <div className="flex items-center gap-3 mt-2">
          <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="p-1 rounded-full bg-gray-100">
            <Minus className="h-4 w-4" />
          </button>
          <span>{item.quantity}</span>
          <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="p-1 rounded-full bg-gray-100">
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>
      <button onClick={() => removeItem(item.id)} className="p-2 hover:bg-gray-100 rounded-full">
        <Trash2 className="h-5 w-5 text-gray-400" />
      </button>
    </div>
  );
}
