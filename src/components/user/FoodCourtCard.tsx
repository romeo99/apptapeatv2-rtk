import { useNavigate } from 'react-router-dom';

interface FoodCourtCardProps {
    foodCourt: {
        id: string;
        name: string;
        description: string;
        coverImage: string;
        isOpen: boolean;
    };
    variant?: 'default' | 'full-width';
}

export default function FoodCourtCard({ foodCourt, variant = 'default' }: FoodCourtCardProps) {
    const navigate = useNavigate();
    const isOpen = true //foodCourt.isOpen;

    if (variant === 'full-width') {
        return (
            <div
                onClick={() => isOpen && navigate(`/foodCourt?foodCourtId=${foodCourt.id}`)}
                className={`bg-white rounded-xl overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.08)] transition-all duration-300 w-full ${isOpen ? 'hover:shadow-[0_8px_16px_rgba(0,0,0,0.12)] cursor-pointer hover:scale-[1.01]' : 'opacity-75'
                    }`}
            >
                <div className="flex">
                    <div className="w-32 h-32 flex-shrink-0">
                        <img
                            src={foodCourt.coverImage}
                            alt={foodCourt.name}
                            className={`w-full h-full object-cover bg-gray-100 ${!isOpen && 'grayscale'}`}
                        />
                        {!isOpen && (
                            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                                <span className="text-white font-medium text-sm">Fermé</span>
                            </div>
                        )}
                    </div>

                    <div className="flex-1 p-4 min-w-0">
                        <div className="flex items-start justify-between">
                            <div className="min-w-0 flex-1 mr-4">
                                <h3 className="text-[17px] font-bold">{foodCourt.name}</h3>
                                <p className="text-xs text-gray-500">{foodCourt.description}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div
            onClick={() => isOpen && navigate(`/food-court?foodCourtId=${foodCourt.id}`)}
            className={`bg-white rounded-xl overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.08)] transition-all duration-300 w-[220px] relative h-[180px] ${isOpen ? 'hover:shadow-[0_8px_16px_rgba(0,0,0,0.12)] cursor-pointer hover:scale-[1.01]' : 'opacity-75'
                }`}
        >
            <div className="relative h-28">
                <img
                    src={foodCourt.coverImage}
                    alt={foodCourt.name}
                    className={`w-full h-full object-cover ${!isOpen ? 'grayscale brightness-75' : ''}`}
                />
                {!isOpen && (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <span className="bg-black/75 text-white font-medium text-sm px-3 py-1 rounded-full">Fermé</span>
                    </div>
                )}

            </div>

            <div className="p-4">
                <div className="flex items-start justify-between">
                    <div>
                        <h3 className="font-medium text-[14px] truncate max-w-[160px]">{foodCourt.name}</h3>
                        <p className="text-xs text-gray-500">{foodCourt.description}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}