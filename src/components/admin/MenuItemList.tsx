import { Droppable, Draggable } from '@hello-pangea/dnd';
import { GripVertical } from 'lucide-react';
import type { MenuItem } from '../../types/firebase';

interface MenuItemListProps {
  items: MenuItem[];
  categoryId: string;
}

export default function MenuItemList({ items, categoryId }: MenuItemListProps) {
  return (
    <Droppable droppableId={`items-${categoryId}`} type="menuItem">
      {(provided) => (
        <div
          {...provided.droppableProps}
          ref={provided.innerRef}
          className="space-y-2"
        >
          {items.map((item, index) => (
            <Draggable
              key={item.id}
              draggableId={item.id}
              index={index}
            >
              {(provided) => (
                <div
                  ref={provided.innerRef}
                  {...provided.draggableProps}
                  className="flex items-center gap-3 bg-gray-50 p-2 rounded-lg"
                >
                  <div {...provided.dragHandleProps}>
                    <GripVertical className="h-4 w-4 text-gray-400" />
                  </div>
                  {item.image && (
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-8 h-8 object-cover rounded"
                    />
                  )}
                  <span>{item.name}</span>
                </div>
              )}
            </Draggable>
          ))}
          {provided.placeholder}
        </div>
      )}
    </Droppable>
  );
}