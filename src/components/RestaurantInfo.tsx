import { Heart } from 'lucide-react';

export function RestaurantInfo() {
  return (
    <div className="flex items-start justify-between mb-5">
      <div className="flex gap-4">
        <div className="w-[72px] h-[72px] rounded-full bg-white flex items-center justify-center p-3 shadow-lg -mt-[36px] border-2 border-emerald-500">
          <img
            src="https://i.postimg.cc/TPbpkRnD/Tap-Eart-2.png"
            alt="TapEat"
            className="w-full h-full object-contain"
          />
        </div>
        <div className="pt-2">
          <h1 className="text-[22px] font-bold text-gray-900 mb-1">PizzaHut</h1>
          <div className="flex items-center gap-1">
            <span className="text-emerald-500 font-medium text-[15px]">4.5</span>
            <span className="text-yellow-400 text-[15px]">★</span>
            <span className="text-gray-500 text-[15px]">8,750+ ratings</span>
          </div>
        </div>
      </div>
      <button className="pt-2">
        <Heart className="h-6 w-6 text-gray-400" />
      </button>
    </div>
  );
}