import { ChevronLeft, Image, Loader2, Save, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useRestaurantContext } from '../../context/RestaurantContext';
import useOrderNotification from '../../hooks/useOrderNotification';
import { createMenuItem, updateMenuItem } from '../../services/menuService';
import IngredientsSelector from '../../components/IngredientsSelector';

export default function MenuItemForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { restaurant, menu, categories, loading: restaurantLoading } = useRestaurantContext();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [showIngredients, setShowIngredients] = useState(false);

  useOrderNotification();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    categoryId: '',
    ingredients: [] as string[],
    allergens: [] as string[],
    status: 'available' as const
  });

  useEffect(() => {
    if (id && !restaurantLoading) {
      // Edit mode - load existing data
      const item = menu.find((i) => i.id === id);
      if (item) {
        setFormData({
          name: item.name || '',
          description: item.description || '',
          price: item.price?.toString() || '',
          categoryId: item.categoryId || '',
          ingredients: item.ingredients || [],
          allergens: item.allergens || [],
          status: item.status || 'available'
        });
        setImagePreview(item.image || '');
      }
    }
    setLoading(false);
  }, [id, menu, restaurantLoading]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('L\'image ne doit pas dépasser 5MB');
        return;
      }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restaurant?.id) return;

    try {
      setSaving(true);
      setError(null);

      const menuItemData = {
        ...formData,
        price: parseFloat(formData.price) || 0,
        image: imagePreview
      };

      if (id) {
        // Update existing item
        await updateMenuItem(id, restaurant.id, menuItemData, imageFile || undefined);
      } else {
        // Create new item
        await createMenuItem(restaurant.id, menuItemData, imageFile || undefined);
      }

      navigate('/admin/menu');
    } catch (err) {
      console.error('Error saving menu item:', err);
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setSaving(false);
    }
  };

  if (loading || restaurantLoading) {
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
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/admin/menu')}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <h1 className="text-2xl font-bold text-gray-900">
              {id ? 'Modifier le produit' : 'Nouveau produit'}
            </h1>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-500 rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left column - Basic info and image */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-medium mb-4">Informations de base</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Nom</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg"
                    rows={3}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Prix (€)</label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Catégorie</label>
                  <select
                    value={formData.categoryId}
                    onChange={(e) => setFormData(prev => ({ ...prev, categoryId: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg"
                    required
                  >
                    <option value="">Sélectionner une catégorie</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Statut</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as 'available' | 'out_of_stock' | 'hidden' }))}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="available">Disponible</option>
                    <option value="out_of_stock">Rupture de stock</option>
                    <option value="hidden">Masqué</option>
                  </select>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-medium mb-4">Image du produit</h2>
              {imagePreview ? (
                <div className="relative">
                  <img
                    src={imagePreview}
                    alt={formData.name}
                    className="w-full h-48 object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setImagePreview('');
                      setImageFile(null);
                    }}
                    className="absolute top-2 right-2 p-1 bg-white rounded-full shadow-md"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="border-2 border-gray-300 border-dashed rounded-lg p-8 text-center">
                  <label className="cursor-pointer">
                    <Image className="h-10 w-10 text-gray-400 mx-auto" />
                    <span className="mt-2 block text-sm text-gray-600">
                      Ajouter une image
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                </div>
              )}
            </div>
          </div>

          {/* Right column - Details and actions */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-medium mb-4">Ingrédients</h2>
              <p className="text-sm text-gray-500 mb-4">
                Sélectionnez les ingrédients qui composent ce produit. Les clients pourront les visualiser et les exclure si nécessaire.
              </p>

              <IngredientsSelector 
                selectedIngredients={formData.ingredients}
                onChange={(ingredients) => setFormData(prev => ({ ...prev, ingredients }))}
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => navigate('/admin/menu')}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 disabled:opacity-50 flex items-center gap-2"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                <Save className="h-5 w-5" />
                {saving ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}