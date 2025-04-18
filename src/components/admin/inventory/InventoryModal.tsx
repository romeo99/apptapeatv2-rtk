import { useState, useEffect } from 'react';
import { X, Plus, Minus, Save, Trash2, Upload, Link } from 'lucide-react';
import { useRestaurantContext } from '../../../context/RestaurantContext';

interface InventoryModalProps {
  item: any;
  onClose: () => void;
  onSubmit: (data: any, imageFile?: File) => void;
  onDelete?: () => void;
  categories: string[];
}

const UNITS = ['pièces', 'kg', 'litres', 'grammes'];

export default function InventoryModal({ item, onClose, onSubmit, onDelete, categories }: InventoryModalProps) {
  const { menu = [] } = useRestaurantContext();
  const [formData, setFormData] = useState({
    name: item?.name || '',
    description: item?.description || '',
    quantity: Number(item?.quantity) || 0,
    unit: item?.unit || 'pièces',
    optimalStock: item?.optimalStock || 0,
    category: item?.category || categories[0],
    price: item?.price || 0,
    linkedItems: item?.linkedItems || []
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>(item?.image || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [selectedMenuItem, setSelectedMenuItem] = useState<string>('');
  const [quantityPerItem, setQuantityPerItem] = useState<string>('1');

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
    try {
      setLoading(true);
      setError(null);
      
      if (!formData.name.trim()) {
        setError('Le nom du produit est requis');
        return;
      }
      
      // Convert quantity from string to number
      const data = {
        ...formData,
        quantity: Number(formData.quantity) || 0
      };

      await onSubmit(data, imageFile || undefined);
      onClose();
    } catch (error) {
      console.error('Error saving inventory item:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce produit ?')) {
      return;
    }
    try {
      setLoading(true);
      onDelete && await onDelete();
      onClose();
    } catch (error) {
      console.error('Error deleting inventory item:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleQuantityAdjustment = (type: 'add' | 'remove') => {
    if (type === 'add') {
      setFormData(prev => ({
        ...prev,
        quantity: prev.quantity + Math.abs(adjustQuantity)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        quantity: Math.max(0, prev.quantity - Math.abs(adjustQuantity))
      }));
    }
    setAdjustQuantity(0);
  };

  const handleAddMenuLink = () => {
    if (!selectedMenuItem || !quantityPerItem) return;
    
    const menuItem = menu.find(item => item.id === selectedMenuItem);
    if (!menuItem) return;

    // Prevent duplicate links
    if (formData.linkedItems.some(link => link.menuItemId === menuItem.id)) {
      setError('Ce produit est déjà lié');
      return;
    }

    setFormData(prev => ({
      ...prev,
      linkedItems: [
        ...prev.linkedItems,
        {
          menuItemId: menuItem.id,
          menuItemName: menuItem.name,
          quantityPerItem: Math.max(0.01, parseFloat(quantityPerItem))
        }
      ]
    }));

    setSelectedMenuItem('');
    setQuantityPerItem('1');
    setShowLinkModal(false);
  };

  const handleRemoveLink = (menuItemId: string) => {
    setFormData(prev => ({
      ...prev,
      linkedItems: prev.linkedItems.filter(item => item.menuItemId !== menuItemId)
    }));
  };

  // Display error message if present
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[60] flex items-center justify-center p-4" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-lg font-semibold">
            {item?.id ? 'Modifier le produit' : 'Nouveau produit'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4">
          <div className="space-y-4">
            {/* Image upload */}
            <div className="flex justify-center">
              {imagePreview ? (
                <div className="relative">
                  <img
                    src={imagePreview}
                    alt={formData.name}
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
                <label className="w-32 h-32 border-2 border-gray-300 border-dashed rounded-lg flex items-center justify-center cursor-pointer hover:border-emerald-500 hover:bg-emerald-50 transition-colors">
                  <div className="text-center p-2">
                    <Upload className="h-8 w-8 text-gray-400 mx-auto" />
                    <span className="mt-2 block text-sm text-gray-500 hover:text-emerald-600">
                      Ajouter une image
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </div>
                </label>
              )}
            </div>

            {/* Informations de base */}
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom du produit
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Catégorie
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                >
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Unité de mesure
                </label>
                <select
                  value={formData.unit}
                  onChange={(e) => setFormData(prev => ({ ...prev, unit: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                >
                  <option value="pièces">Pièces</option>
                  <option value="kg">Kilogrammes</option>
                  <option value="litres">Litres</option>
                  <option value="grammes">Grammes</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Prix unitaire
                </label>
                <input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  min="0"
                  step="0.01"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Stock optimal
                </label>
                <input
                  type="number"
                  value={formData.optimalStock}
                  onChange={(e) => setFormData(prev => ({ ...prev, optimalStock: parseInt(e.target.value) || 0 }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  min="0"
                  required
                />
              </div>
            </div>

            {/* Ajustement du stock */}
            {item && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium mb-2">Stock actuel</h3>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={formData.quantity}
                    onChange={(e) => setFormData(prev => ({ ...prev, quantity: e.target.value }))}
                    className="w-32 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    min="0"
                    step="0.01"
                  />
                  <span className="text-gray-500">{formData.unit}</span>
                </div>
                <p className="mt-2 text-sm text-gray-500">
                  Entrez directement la nouvelle quantité en stock
                </p>
              </div>
            )}

            {/* Liens avec les produits du menu */}
            <div className="bg-gray-50 rounded-lg p-4 mt-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium">Liens avec le menu</h3>
                <button
                  type="button"
                  onClick={() => setShowLinkModal(true)}
                  className="px-3 py-1.5 bg-emerald-500 text-white rounded-lg text-sm hover:bg-emerald-600 flex items-center gap-2"
                >
                  <Link className="h-4 w-4" />
                  Lier un produit
                </button>
              </div>

              {formData.linkedItems.length > 0 ? (
                <div className="space-y-2">
                  {formData.linkedItems.map((link) => (
                    <div key={link.menuItemId} className="flex items-center justify-between bg-white p-3 rounded-lg">
                      <div>
                        <p className="font-medium">{link.menuItemName}</p>
                        <p className="text-sm text-gray-500">
                          Utilise {link.quantityPerItem} {formData.unit} par vente
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveLink(link.menuItemId)}
                        className="p-1 text-red-500 hover:bg-red-50 rounded"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">
                  Aucun produit du menu lié
                </p>
              )}
            </div>
          </div>
        </form>

        <div className="p-4 border-t flex justify-between">
          {item?.id && onDelete && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={loading}
              className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-2 transition-colors"
            >
              <Trash2 className="h-4 w-4" />
              Supprimer
            </button>
          )}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              Annuler
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 disabled:opacity-50 flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              {loading ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </div>
      </div>

      {/* Modal de liaison avec le menu */}
      {showLinkModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[70] flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full max-w-md">
            <div className="p-4 border-b">
              <h3 className="text-lg font-medium">Lier un produit du menu</h3>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Produit du menu
                </label>
                <select
                  value={selectedMenuItem}
                  onChange={(e) => setSelectedMenuItem(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="">Sélectionner un produit</option>
                  {menu
                    .filter(item => !formData.linkedItems.some(link => link.menuItemId === item.id))
                    .map(item => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))
                  }
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quantité utilisée par vente
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={quantityPerItem}
                    onChange={(e) => setQuantityPerItem(e.target.value)}
                    min="0.01"
                    step="0.01"
                    className="flex-1 px-3 py-2 border rounded-lg"
                  />
                  <span className="text-gray-500">{formData.unit}</span>
                </div>
              </div>
            </div>
            <div className="p-4 border-t flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowLinkModal(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleAddMenuLink}
                className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600"
              >
                Lier le produit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}