import { ChevronLeft, Loader2, Upload, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useRestaurantContext } from '../../context/RestaurantContext';
import useOrderNotification from '../../hooks/useOrderNotification';
import { createCategory, updateCategory } from '../../services/categoryService';

const ICONS = ['🍔', '🍕', '🥗', '🍰', '🥤', '🍟', '🍖', '🥩', '🍗', '🥪', '🌮', '🍣'];

export default function CategoryForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { restaurant, categories } = useRestaurantContext();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');

  useOrderNotification();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon: '',
    hidden: false
  });

  useEffect(() => {
    const loadCategory = async () => {
      if (!id || !categories) {
        setInitialLoading(false);
        return;
      }

      try {
        setInitialLoading(true);
        const category = categories.find(c => c.id === id);

        if (category) {
          setFormData({
            name: category.name,
            description: category.description || '',
            icon: category.icon || '',
            hidden: category.hidden || false
          });
          if (category.image) {
            setImagePreview(category.image);
          }
        }
      } catch (err) {
        console.error('Error loading category:', err);
        setError('Erreur lors du chargement de la catégorie');
      } finally {
        setInitialLoading(false);
      }
    };

    loadCategory();
  }, [id, categories]);

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
      setLoading(true);
      setError(null);

      if (!imagePreview && !formData.icon) {
        setError('Veuillez sélectionner une icône ou uploader une image');
        return;
      }

      if (id) {
        // Update existing category
        await updateCategory(restaurant.id, id, {
          ...formData,
          image: imagePreview,
          restaurantId: restaurant.id
        }, imageFile || undefined);
      } else {
        // Create new category
        await createCategory(restaurant.id, {
          ...formData,
          image: imagePreview,
          restaurantId: restaurant.id
        }, imageFile || undefined);
      }

      navigate('/admin/categories');
    } catch (err) {
      console.error('Error creating category:', err);
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6 flex items-center gap-4">
            <button
              onClick={() => navigate('/admin/categories')}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <h1 className="text-2xl font-bold text-gray-900">
              {id ? 'Modifier la catégorie' : 'Nouvelle catégorie'}
            </h1>
            
            <div className="mt-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.hidden}
                  onChange={(e) => setFormData(prev => ({ ...prev, hidden: e.target.checked }))}
                  className="rounded border-gray-300 text-emerald-500 focus:ring-emerald-500 mr-2"
                />
                <span className="text-sm font-medium text-gray-700">Masquer cette catégorie pour les clients</span>
              </label>
              <p className="mt-1 text-xs text-gray-500">
                Utile pour les catégories contenant des produits destinés uniquement aux menus combo
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-500 rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom de la catégorie
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description (optionnelle)
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Image ou icône
                </label>

                {/* Upload d'image */}
                <div className="mb-4">
                  {imagePreview ? (
                    <div className="relative">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-32 h-32 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setImagePreview('');
                          setImageFile(null);
                        }}
                        className="absolute -top-2 -right-2 p-1 bg-white rounded-full shadow-md"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-32 h-32 border-2 border-gray-300 border-dashed rounded-lg flex items-center justify-center">
                      <label className="cursor-pointer text-center p-2">
                        <Upload className="h-6 w-6 text-gray-400 mx-auto" />
                        <span className="mt-2 block text-xs text-gray-600">
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

                {/* Sélection d'icône */}
                {!imagePreview && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ou choisir une icône
                    </label>
                    <div className="grid grid-cols-6 gap-2">
                      {ICONS.map((icon) => (
                        <button
                          key={icon}
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, icon }))}
                          className={`p-3 text-2xl rounded-lg ${formData.icon === icon
                            ? 'bg-emerald-50 border-2 border-emerald-500'
                            : 'bg-gray-50 border border-gray-200 hover:border-emerald-500'
                            }`}
                        >
                          {icon}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate('/admin/categories')}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? 'Enregistrement...' : (id ? 'Mettre à jour' : 'Créer la catégorie')}
            </button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}