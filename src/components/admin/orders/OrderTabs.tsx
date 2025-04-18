import { Calendar, CheckCircle, Clock, Package } from 'lucide-react';

interface OrderTabsProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  orderCounts: Record<string, number>;
}

const TABS = [
  { id: 'scheduled', name: 'Programmées', icon: Calendar, color: 'bg-blue-100 text-blue-800' },
  { id: 'pending', name: 'En attente', icon: Clock, color: 'bg-red-100 text-red-800' },
  { id: 'preparing', name: 'En préparation', icon: Package, color: 'bg-orange-100 text-orange-800' },
  { id: 'ready', name: 'Prêtes', icon: CheckCircle, color: 'bg-green-100 text-green-800' }
];

const getStatusBadgeColor = (status: string, isActive: boolean) => {
  if (isActive) return 'bg-white text-emerald-600';

  switch (status) {
    case 'scheduled':
      return 'bg-blue-500 text-white';
    case 'pending':
      return 'bg-red-500 text-white';
    case 'preparing':
      return 'bg-orange-500 text-white';
    case 'ready':
      return 'bg-green-500 text-white';
    default:
      return 'bg-gray-500 text-white';
  }
};

export default function OrderTabs({ activeTab, setActiveTab, orderCounts }: OrderTabsProps) {
  return (
    <div className="grid grid-cols-2 gap-2 p-4 bg-gray-50 md:grid-cols-2 lg:grid-cols-4">
      {TABS.map((tab) => {
        const count = orderCounts[tab.id] || 0;
        const Icon = tab.icon;

        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`relative flex items-center justify-between p-4 rounded-xl transition-colors border-2 border-emerald-500 ${
              activeTab === tab.id
                ? 'bg-emerald-500 text-white shadow-lg transform scale-[1.02]'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center gap-4">
              <Icon className="h-5 w-5" />
              <span className="font-medium text-[15px]">{tab.name}</span>
            </div>
            {count > 0 && (
              <span
                className={`min-w-[32px] h-8 px-2.5 flex items-center justify-center rounded-full text-sm font-bold ${getStatusBadgeColor(
                  tab.id,
                  activeTab === tab.id
                )}`}
              >
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}