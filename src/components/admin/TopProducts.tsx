import { TrendingUp, TrendingDown } from 'lucide-react';

interface TopProduct {
  id: string;
  name: string;
  sales: number;
  revenue: number;
  trend: number;
}

interface TopProductsProps {
  products?: TopProduct[];
}

export default function TopProducts({ products = [] }: TopProductsProps) {
  if (!products || products.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        Aucune donnée disponible
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {products.map((product) => (
        <div key={product.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div>
            <p className="font-medium">{product.name}</p>
            <p className="text-sm text-gray-500">
              {product.sales} ventes • {product.revenue.toFixed(2)} €
            </p>
          </div>
          <div className={`flex items-center gap-1 px-2 py-1 rounded-full ${
            product.trend > 0 
              ? 'bg-green-100 text-green-800' 
              : product.trend < 0 
                ? 'bg-red-100 text-red-800'
                : 'bg-gray-100 text-gray-800'
          }`}>
            {product.trend > 0 ? (
              <TrendingUp className="h-4 w-4" />
            ) : (
              <TrendingDown className="h-4 w-4" />
            )}
            <span className="text-sm font-medium">
              {product.trend > 0 ? '+' : ''}{product.trend.toFixed(1)}%
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}