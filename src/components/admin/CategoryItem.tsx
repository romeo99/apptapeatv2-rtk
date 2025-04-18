import { Draggable } from '@hello-pangea/dnd';
import { Edit2, Trash2, GripVertical } from 'lucide-react';
import MenuItemList from './MenuItemList';
import type { Category, MenuItem } from '../../types/firebase';

interface CategoryItemProps {
  category: Category;
  index: number;
  menu: MenuItem[];
  isSelected: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export default function CategoryItem({
  category,
  index,
  menu,
  isSelected,
  onSelect,
  onEdit,
  onDelete
}: CategoryItemProps) {
  const categoryItems = isSelected
    ? menu
        .filter(item => item.categoryId === category.id)
        .sort((a, b) => (a.order || 0) - (b.order || 0))
    : [];

  return (
    <Draggable draggableId={category.id} index={index}>
      {(provided) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          className="bg-white rounded-lg shadow-sm overflow-hidden"
        >
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div {...provided.dragHandleProps}>
                  <GripVertical className="h-5 w-5 text-gray-400" />
                </div>
                <div className="flex items-center gap-3">
                  {category.image ? (
                    <img 
                      src={category.image} 
                      alt={category.name}
                      className="w-10 h-10 object-cover rounded-lg"
                    />
                  ) : (
                    <span className="text-2xl">{category.icon}</span>
                  )}
                  <h3 className="font-medium">{category.name}</h3>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={onSelect}
                  className="text-gray-600 hover:text-gray-900"
                >
                  {isSelected ? 'Masquer' : 'Voir les produits'}
                </button>
                <button
                  onClick={onEdit}
                  className="text-emerald-600 hover:text-emerald-900"
                >
                  <Edit2 className="h-5 w-5" />
                </button>
                <button
                  onClick={onDelete}
                  className="text-red-600 hover:text-red-900"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
                {category.hidden && (
                  <span className="ml-2 px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full">
                    Masquée
                  </span>
                )}
              </div>
            </div>

            {isSelected && (
              <div className="mt-4 pl-12">
                <MenuItemList 
                  items={categoryItems} 
                  categoryId={category.id} 
                />
              </div>
            )}
          </div>
        </div>
      )}
    </Draggable>
  );
}