interface DiningOptionProps {
  icon: string;
  label: string;
  onClick: () => void;
}

export function DiningOption({ icon, label, onClick }: DiningOptionProps) {
  return (
    <button
      onClick={onClick}
      className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:border-emerald-500 transition-colors aspect-square flex flex-col items-center justify-center gap-4"
    >
      <img src={icon} alt={label} className="w-20 h-20" />
      <span className="font-medium text-[15px] text-gray-800">{label}</span>
    </button>
  );
}