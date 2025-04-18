import { ChevronLeft, Heart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function Header() {
  const navigate = useNavigate();

  return (
    <div className="relative h-[200px]">
      <img
        src="https://images.unsplash.com/photo-1542834369-f10ebf06d3e0?auto=format&fit=crop&w=1200&h=400&q=100"
        alt="Restaurant cover"
        className="w-full h-full object-cover"
      />
      <button 
        onClick={() => navigate(-1)}
        className="absolute top-4 left-4 w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center shadow-lg"
      >
        <ChevronLeft className="h-6 w-6 text-white" />
      </button>
    </div>
  );
}