import { Droppable } from '@hello-pangea/dnd';
import CategoryItem from './CategoryItem';
import type { Category, MenuItem } from '../../types/firebase';

interface CategoryListProps {
  categories: Category[];
  menu: MenuItem[];
  selectedCategory: string | null;
  onSelectCategory: (id: string | null) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function CategoryList({
  categories,
  menu,
  selectedCategory,
  onSelectCategory,
  onEdit,
  onDelete
}: CategoryListProps) {
  return (
    <Droppable droppableId="categories" type="category">
      {(provided) => (
        <div
          {...provided.droppableProps}
          ref={provided.innerRef}
          className="space-y-4"
        >
          {categories.map((category, index) => (
            <CategoryItem
              key={category.id}
              category={category}
              index={index}
              menu={menu}
              isSelected={selectedCategory === category.id}
              onSelect={() => onSelectCategory(selectedCategory === category.id ? null : category.id)}
              onEdit={() => onEdit(category.id)}
              onDelete={() => onDelete(category.id)}
            />
          ))}
          {provided.placeholder}
        </div>
      )}
    </Droppable>
  );
}