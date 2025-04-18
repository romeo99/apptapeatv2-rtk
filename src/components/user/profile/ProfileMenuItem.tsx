import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { LucideIcon } from 'lucide-react';

interface ProfileMenuItemProps {
  icon: LucideIcon;
  label: string;
  path: string;
}

export default function ProfileMenuItem({ icon: Icon, label, path }: ProfileMenuItemProps) {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate(path)}
      className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 rounded-xl transition-colors"
    >
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
          <Icon className="h-5 w-5 text-emerald-600" />
        </div>
        <span className="font-medium">{label}</span>
      </div>
      <ChevronRight className="h-5 w-5 text-gray-400" />
    </button>
  );
}