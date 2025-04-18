import type { MenuItem } from '../types/firebase';

interface UpsellItemProps {
  item: MenuItem;
  onSelect: () => void;
}

export default function UpsellItem({ item, onSelect }: UpsellItemProps) {
  return (
    <button
      onClick={onSelect}
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
  );
}