import { useNavigate } from 'react-router-dom';
import { UtensilsCrossed, ShoppingBag } from 'lucide-react';

export function DiningOptions() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center pt-8">
      <h2 className="text-[17px] font-semibold text-gray-900 mb-8">
        Où souhaitez-vous manger aujourd'hui ?
      </h2>
      <div className="grid grid-cols-2 gap-6 w-full max-w-xl px-4">
        <button
          onClick={() => navigate('/menu')}
          className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm hover:border-emerald-500 transition-colors aspect-square flex flex-col items-center justify-center gap-6"
        >
          <div className="w-20 h-20 rounded-full bg-emerald-50 flex items-center justify-center">
            <UtensilsCrossed className="h-10 w-10 text-emerald-500" />
          </div>
          <span className="font-medium text-[17px] text-gray-800">Sur place</span>
        </button>
        <button
          onClick={() => navigate('/menu')}
          className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm hover:border-emerald-500 transition-colors aspect-square flex flex-col items-center justify-center gap-6"
        >
          <div className="w-20 h-20 rounded-full bg-emerald-50 flex items-center justify-center">
            <ShoppingBag className="h-10 w-10 text-emerald-500" />
          </div>
          <span className="font-medium text-[17px] text-gray-800">À emporter</span>
        </button>
      </div>
    </div>
  );
}