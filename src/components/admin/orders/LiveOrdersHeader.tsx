import React from 'react';
import { Calculator } from 'lucide-react';

interface LiveOrdersHeaderProps {
  ordersCount: number;
  onShowKeypad: () => void;
}

export default function LiveOrdersHeader({ ordersCount, onShowKeypad }: LiveOrdersHeaderProps) {
  return (
    <div className="px-4 py-4 border-b flex justify-between items-center">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Commandes en direct</h1>
        <p className="mt-1 text-sm text-gray-500">
          {ordersCount} commande{ordersCount > 1 ? 's' : ''} en cours
        </p>
      </div>
      <div>
        <button
          onClick={onShowKeypad}
          className="w-14 h-14 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg hover:bg-emerald-600 transition-all"
        >
          <Calculator className="h-6 w-6 text-white" />
        </button>
      </div>
    </div>
  );
}