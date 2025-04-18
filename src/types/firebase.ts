import { Image, Plus, X } from 'lucide-react';
import { useState } from 'react';
import ProductSelector from './ProductSelector';

interface ComboSectionFormProps {
  section: {
    id: string;
    name: string;
    required: boolean;
    maxChoices?: number;
    items: Array<{
      id: string;
      name: string;
      price: number;
      image?: string;
      included: boolean;
    }>;
    image?: string;
    imageFile?: File;
  };
  availableProducts: any[];
  onUpdate: (sectionId: string, updates: any) => void;
  onRemove: (sectionId: string) => void;
}

export interface MenuItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  image?: string;
  categoryId: string;
  status?: 'available' | 'out_of_stock' | 'hidden';
  isCombo?: boolean;
  mainProductId?: string;
  sections?: ComboSection[];
  ingredients?: string[];
  allergens?: string[];
  tags?: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface SavedComboSection {
  id: string;
  label: string;
  name: string;
  required: boolean;
  maxChoices?: number;
  icon?: string;
  image?: string;
  items: Array<{
    id: string;
    name: string;
    price: number;
    image?: string;
    included: boolean;
  }>;
  createdAt: Date;
  updatedAt?: Date;
}

export interface ComboSection {
  id: string;
  name: string;
  required: boolean;
  maxChoices?: number;
  icon?: string;
  image?: string;
  items: Array<{
    id: string;
    name: string;
    price: number;
    image?: string;
    included: boolean;
  }>;
}

export default function ComboSectionForm({ section, availableProducts, onUpdate, onRemove }: ComboSectionFormProps) {
  const [showProductSelector, setShowProductSelector] = useState(false);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onUpdate(section.id, {
          ...section,
          image: reader.result as string,
          imageFile: file
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProductSelect = (product: any) => {
    onUpdate(section.id, {
      ...section,
      items: [...section.items, { ...product, included: false }]
    });
    setShowProductSelector(false);
  };

  const handleRemoveProduct = (productId: string) => {
    onUpdate(section.id, {
      ...section,
      items: section.items.filter(item => item.id !== productId)
    });
  };

  const handleToggleIncluded = (productId: string) => {
    onUpdate(section.id, {
      ...section,
      items: section.items.map(item =>
        item.id === productId ? { ...item, included: !item.included } : item
      )
    });
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium mb-1">Nom de la section</label>
          <input
            type="text"
            value={section.name}
            onChange={(e) => onUpdate(section.id, { ...section, name: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg"
            placeholder="Ex: Accompagnements"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Nombre de choix maximum</label>
          <input
            type="number"
            value={section.maxChoices}
            onChange={(e) => onUpdate(section.id, { ...section, maxChoices: parseInt(e.target.value) })}
            className="w-full px-3 py-2 border rounded-lg"
            min="1"
            required
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={section.required}
            onChange={(e) => onUpdate(section.id, { ...section, required: e.target.checked })}
            className="rounded border-gray-300 text-emerald-500 focus:ring-emerald-500"
          />
          <span className="text-sm font-medium">Section obligatoire</span>
        </label>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Image de la section</label>
        {section.image ? (
          <div className="relative w-32 h-32">
            <img
              src={section.image}
              alt={section.name}
              className="w-full h-full object-cover rounded-lg"
            />
            <button
              type="button"
              onClick={() => onUpdate(section.id, { ...section, image: undefined, imageFile: undefined })}
              className="absolute top-1 right-1 p-1 bg-white rounded-full shadow-md"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="w-32 h-32 border-2 border-gray-300 border-dashed rounded-lg flex items-center justify-center">
            <label className="cursor-pointer text-center block">
              <Image className="h-8 w-8 text-gray-400 mx-auto" />
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

      <div>
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-medium">Produits de la section</h4>
          <button
            type="button"
            onClick={() => setShowProductSelector(true)}
            className="px-3 py-1.5 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 flex items-center gap-1 text-sm"
          >
            <Plus className="h-4 w-4" />
            Ajouter un produit
          </button>
        </div>

        <div className="space-y-3">
          {section.items.map(item => (
            <div
              key={item.id}
              className="flex items-center gap-4 p-3 border rounded-lg"
            >
              {item.image && (
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-12 h-12 object-cover rounded-lg"
                />
              )}
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-sm truncate">{item.name}</h4>
                <p className="text-sm text-gray-500">{item.price.toFixed(2)} €</p>
              </div>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={item.included}
                    onChange={() => handleToggleIncluded(item.id)}
                    className="rounded border-gray-300 text-emerald-500 focus:ring-emerald-500"
                  />
                  <span className="text-sm">Inclus</span>
                </label>
                <button
                  type="button"
                  onClick={() => handleRemoveProduct(item.id)}
                  className="p-1 text-red-500 hover:bg-red-50 rounded"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}

          {section.items.length === 0 && (
            <div className="text-center py-6 text-gray-500 border-2 border-dashed rounded-lg">
              <p className="mb-2">Aucun produit ajouté</p>
              <button
                type="button"
                onClick={() => setShowProductSelector(true)}
                className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 inline-flex items-center gap-2"
              >
                <Plus className="h-5 w-5" />
                Ajouter un produit
              </button>
            </div>
          )}
        </div>
      </div>

      {showProductSelector && (
        <ProductSelector
          products={availableProducts.filter(
            product => !section.items.some(item => item.id === product.id)
          )}
          onSelect={handleProductSelect}
          onClose={() => setShowProductSelector(false)}
          title="Ajouter un produit à la section"
        />
      )}
    </div>
  );
}