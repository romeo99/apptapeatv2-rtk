import { DragDropContext, DropResult } from '@hello-pangea/dnd';
import { Plus, Search } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import LoadingSpinner from '../../components/LoadingSpinner';
import AdminLayout from '../../components/admin/AdminLayout';
import CategoryList from '../../components/admin/CategoryList';
import { useRestaurantContext } from '../../context/RestaurantContext';
import useOrderNotification from '../../hooks/useOrderNotification';
import { deleteCategory, updateCategoriesOrder } from '../../services/categoryService';

export default function CategoryManagement() {
  const navigate = useNavigate();
  const { restaurant, menu = [], loading, error, categories = [] } = useRestaurantContext();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [reordering, setReordering] = useState(false);

  useOrderNotification();

  const handleDeleteCategory = async (categoryId: string) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette catégorie ?')) {
      return;
    }

    try {
      if (!restaurant?.id) return;
      await deleteCategory(categoryId, restaurant.id);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Une erreur est survenue');
    }
  };

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return;

    const { source, destination, type } = result;

    if (source.index === destination.index) return;

    try {
      setReordering(true);

      if (type === 'category') {
        // Reorder categories
        const reorderedCategories = Array.from(categories);
        const [removed] = reorderedCategories.splice(source.index, 1);
        reorderedCategories.splice(destination.index, 0, removed);

        // Update order field for each category
        const updates = reorderedCategories.map((category, index) => ({
          id: category.id,
          order: index
        }));

        await updateCategoriesOrder(restaurant.id, updates);
      }
    } catch (err) {
      console.error('Error reordering:', err);
      alert('Erreur lors de la réorganisation');
    } finally {
      setReordering(false);
    }
  };

  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center p-8">
          <LoadingSpinner />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Gestion des Catégories</h1>
              <p className="mt-1 text-sm text-gray-500">
                {categories.length} catégorie{categories.length > 1 ? 's' : ''}
              </p>
            </div>
            <button
              onClick={() => navigate('/admin/categories/new')}
              className="bg-emerald-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-emerald-600"
            >
              <Plus className="h-5 w-5" />
              Nouvelle catégorie
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <div className="relative">
            <input
              type="text"
              placeholder="Rechercher une catégorie..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          </div>
        </div>

        <div className="space-y-4">
          <DragDropContext onDragEnd={handleDragEnd}>
            <CategoryList
              categories={filteredCategories}
              menu={menu}
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
              onEdit={(id) => navigate(`/admin/categories/edit/${id}`)}
              onDelete={handleDeleteCategory}
            />
          </DragDropContext>

          {filteredCategories.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">
                {searchQuery ? 'Aucune catégorie ne correspond à votre recherche' : 'Aucune catégorie'}
              </p>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}