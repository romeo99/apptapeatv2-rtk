import { Package } from 'lucide-react';
import { formatCurrency } from '../../../utils/formatters';

interface InventoryItem {
  id: string;
  name: string;
  image?: string;
  quantity: number;
  unit: string;
  optimalStock: number;
  category: string;
  price: number;
  lastUpdated: Date;
}

interface InventoryCardProps {
  item: InventoryItem;
  onClick: () => void;
}

export default function InventoryCard({ item, onClick }: InventoryCardProps) {
  const stockPercentage = (item.quantity / item.optimalStock) * 100;
  
  const getStockColor = () => {
    if (stockPercentage > 70) return 'bg-emerald-100 text-emerald-700';
    if (stockPercentage > 30) return 'bg-orange-100 text-orange-700';
    return 'bg-red-100 text-red-700';
  };

  return (
    <button
      onClick={onClick}
      className="bg-white rounded-lg shadow-sm p-4 text-left hover:shadow-md transition-shadow"
    >
      <div className="flex items-start gap-4">
        {item.image ? (
          <img
            src={item.image}
            alt={item.name}
            className="w-16 h-16 rounded-lg object-cover"
          />
        ) : (
          <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
            <Package className="h-8 w-8 text-gray-400" />
          </div>
        )}
        
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-gray-900 truncate">{item.name}</h3>
          <p className="text-sm text-gray-500">{item.category}</p>
          <p className="text-sm text-gray-500 mt-1">
            {formatCurrency(item.price)} / {item.unit}
          </p>
        </div>
      </div>

      <div className="mt-4">
        <div className="flex items-end justify-between mb-1">
          <span className={`text-3xl font-bold ${getStockColor()}`}>
            {item.quantity}
          </span>
          <span className="text-sm text-gray-500">{item.unit}</span>
        </div>

        <div className="relative pt-1">
          <div className="overflow-hidden h-2 text-xs flex rounded bg-gray-100">
            <div
              style={{ width: `${Math.min(stockPercentage, 100)}%` }}
              className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center transition-all ${
                stockPercentage > 70 ? 'bg-emerald-500' :
                stockPercentage > 30 ? 'bg-orange-500' : 'bg-red-500'
              }`}
            />
          </div>
          <div className="flex items-center justify-between mt-1">
            <span className="text-xs text-gray-500">Stock</span>
            <span className="text-xs text-gray-500">{Math.round(stockPercentage)}%</span>
          </div>
        </div>
      </div>
    </button>
  );
}