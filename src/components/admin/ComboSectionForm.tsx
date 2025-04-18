import { Image, Plus, X } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { Save, BookOpen, Trash2 } from 'lucide-react';
import ProductSelector from './ProductSelector';
import { useRestaurantContext } from '../../context/RestaurantContext';
import { saveSectionTemplate, getSavedSections, deleteSavedSection } from '../../services/comboSectionService';

interface ComboSectionItem {
  id: string;
  name: string;
  price: number;
  image?: string;
  included: boolean;
}

interface ComboSection {
  id: string;
  name: string;
  required?: boolean;
  maxChoices?: number;
  items: ComboSectionItem[];
  image?: string;
  imageFile?: File;
}

interface ComboSectionFormProps {
  section: ComboSection;
  availableProducts: any[];
  onUpdate: (sectionId: string, updates: Partial<ComboSection>) => void;
  onRemove: (sectionId: string) => void;
}

export default function ComboSectionForm({ 
  section, 
  availableProducts, 
  onUpdate, 
  onRemove 
}: ComboSectionFormProps) {
  const [showProductSelector, setShowProductSelector] = useState(false);
  const [showIconSelector, setShowIconSelector] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showLoadModal, setShowLoadModal] = useState(false);
  const [savedSections, setSavedSections] = useState<any[]>([]);
  const [saveLabel, setSaveLabel] = useState('');
  const [saveError, setSaveError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { restaurant } = useRestaurantContext();

  // Ensure section has default values
  const sectionWithDefaults = {
    ...section,
    maxChoices: section.maxChoices !== undefined ? section.maxChoices : 1,
    items: section.items || []
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onUpdate(sectionWithDefaults.id, {
          image: reader.result as string,
          imageFile: file
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProductSelect = (product: any) => {
    onUpdate(sectionWithDefaults.id, {
      ...sectionWithDefaults,
      items: [...(sectionWithDefaults.items || []), { ...product, included: false }]
    });
    setShowProductSelector(false);
  };

  const handleRemoveProduct = (productId: string) => {
    onUpdate(sectionWithDefaults.id, {
      ...sectionWithDefaults,
      items: sectionWithDefaults.items.filter(item => item.id !== productId)
    });
  };

  const handleToggleIncluded = (productId: string) => {
    onUpdate(sectionWithDefaults.id, {
      ...sectionWithDefaults,
      items: sectionWithDefaults.items.map(item =>
        item.id === productId ? { ...item, included: !item.included } : item
      )
    });
  };

  const handleSaveSection = async () => {
    if (!saveLabel.trim()) {
      setSaveError('Veuillez entrer un nom pour cette section');
      return;
    }

    try {
      setLoading(true);
      setSaveError(null);

      if (!restaurant?.id) {
        throw new Error('Restaurant ID is required');
      }

      // Prepare section data for saving
      const sectionToSave = {
        name: sectionWithDefaults.name,
        label: saveLabel,
        required: sectionWithDefaults.required,
        maxChoices: sectionWithDefaults.maxChoices,
        icon: sectionWithDefaults.icon,
        image: sectionWithDefaults.image,
        items: sectionWithDefaults.items || []
      };

      await saveSectionTemplate(restaurant.id, sectionToSave);
      setShowSaveModal(false);
      setSaveLabel('');
    } catch (error) {
      console.error('Error saving section:', error);
      setSaveError('Une erreur est survenue lors de la sauvegarde');
    } finally {
      setLoading(false);
    }
  };

  const handleLoadSections = async () => {
    try {
      setLoading(true);
      setLoadError(null);

      if (!restaurant?.id) {
        throw new Error('Restaurant ID is required');
      }

      const sections = await getSavedSections(restaurant.id);
      setSavedSections(sections);
    } catch (error) {
      console.error('Error loading saved sections:', error);
      setLoadError('Une erreur est survenue lors du chargement des sections');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSavedSection = (savedSection: any) => {
    // Update current section with saved section data
    onUpdate(sectionWithDefaults.id, {
      ...sectionWithDefaults,
      name: savedSection.name,
      required: savedSection.required,
      maxChoices: savedSection.maxChoices,
      icon: savedSection.icon,
      image: savedSection.image,
      items: savedSection.items || []
    });
    setShowLoadModal(false);
  };

  const handleDeleteSavedSection = async (sectionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette section enregistrée ?')) {
      return;
    }
    
    try {
      setLoading(true);
      
      if (!restaurant?.id) {
        throw new Error('Restaurant ID is required');
      }
      
      await deleteSavedSection(restaurant.id, sectionId);
      
      // Refresh the list
      const sections = await getSavedSections(restaurant.id);
      setSavedSections(sections);
    } catch (error) {
      console.error('Error deleting saved section:', error);
      setLoadError('Une erreur est survenue lors de la suppression');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium mb-1">Nom de la section</label>
          <input
            type="text"
            value={sectionWithDefaults.name}
            onChange={(e) => onUpdate(sectionWithDefaults.id, { 
              ...sectionWithDefaults,
              name: e.target.value 
            })}
            className="w-full px-3 py-2 border rounded-lg"
            placeholder="Ex: Accompagnements"
            required
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div>
          <label className="block text-sm font-medium mb-1">Nombre de choix maximum</label>
          <input
            type="number"
            value={sectionWithDefaults.maxChoices || 1}
            onChange={(e) => {
              const maxChoices = parseInt(e.target.value) || 1;
              onUpdate(sectionWithDefaults.id, { 
                ...sectionWithDefaults,
                maxChoices
              });
            }}
            className="w-full px-3 py-2 border rounded-lg"
            min="1"
            required
          />
        </div>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={sectionWithDefaults.required}
            onChange={(e) => onUpdate(sectionWithDefaults.id, { 
              ...sectionWithDefaults,
              required: e.target.checked 
            })}
            className="rounded border-gray-300 text-emerald-500 focus:ring-emerald-500"
          />
          <span className="text-sm font-medium">Section obligatoire</span>
        </label>
      </div>
      
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setShowSaveModal(true)}
          className="text-sm text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
        >
          <Save className="h-4 w-4" /> Enregistrer
        </button>
        <button
          type="button"
          onClick={() => { setShowLoadModal(true); handleLoadSections(); }}
          className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
        >
          <BookOpen className="h-4 w-4" /> Charger
        </button>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Image de la section</label>
        {sectionWithDefaults.image ? (
          <div className="relative w-32 h-32">
            <img
              src={sectionWithDefaults.image}
              alt={sectionWithDefaults.name}
              className="w-full h-full object-cover rounded-lg"
            />
            <button
              type="button"
              onClick={() => onUpdate(sectionWithDefaults.id, { 
                ...sectionWithDefaults,
                image: undefined, 
                imageFile: undefined 
              })}
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
          <h4 className="font-medium">Produits de la section ({sectionWithDefaults.maxChoices || 1} max)</h4>
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
          {(sectionWithDefaults.items || []).map(item => (
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
                {!item.included && (
                  <div className="flex items-center gap-1">
                    <span className="text-sm text-gray-500">Prix:</span>
                    <input
                      type="number"
                      value={item.price}
                      onChange={(e) => {
                        const newPrice = parseFloat(e.target.value) || 0;
                        onUpdate(sectionWithDefaults.id, {
                          ...sectionWithDefaults,
                          items: sectionWithDefaults.items.map(i => 
                            i.id === item.id ? { ...i, price: newPrice } : i
                          )
                        });
                      }}
                      className="w-16 px-2 py-1 border rounded text-sm"
                      min="0"
                      step="0.01"
                    />
                    <span className="text-sm">€</span>
                  </div>
                )}
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

          {(!sectionWithDefaults.items || sectionWithDefaults.items.length === 0) && (
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
            product => !(sectionWithDefaults.items || []).some(item => item.id === product.id)
          )}
          onSelect={handleProductSelect}
          onClose={() => setShowProductSelector(false)}
          title="Ajouter un produit à la section"
        />
      )}
      
      {/* Modal pour sauvegarder la section */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium mb-4">Enregistrer cette section</h3>
            
            {saveError && (
              <div className="mb-4 p-3 bg-red-50 text-red-500 rounded-lg text-sm">
                {saveError}
              </div>
            )}
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nom de la section enregistrée
              </label>
              <input
                type="text"
                value={saveLabel}
                onChange={(e) => setSaveLabel(e.target.value)}
                placeholder="Ex: Boissons, Accompagnements, Desserts..."
                className="w-full px-3 py-2 border rounded-lg"
              />
              <p className="mt-1 text-xs text-gray-500">
                Ce nom vous permettra de retrouver facilement cette section
              </p>
            </div>
            
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowSaveModal(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleSaveSection}
                disabled={loading || !saveLabel.trim()}
                className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 disabled:opacity-50 flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Enregistrement...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Enregistrer
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Modal pour charger une section */}
      {showLoadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[80vh] flex flex-col">
            <h3 className="text-lg font-medium mb-4">Charger une section enregistrée</h3>
            
            {loadError && (
              <div className="mb-4 p-3 bg-red-50 text-red-500 rounded-lg text-sm">
                {loadError}
              </div>
            )}
            
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <svg className="animate-spin h-8 w-8 text-emerald-500" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
              ) : savedSections.length > 0 ? (
                <div className="space-y-2">
                  {savedSections.map((savedSection) => (
                    <div 
                      key={savedSection.id}
                      onClick={() => handleSelectSavedSection(savedSection)}
                      className="p-3 border rounded-lg hover:border-emerald-500 hover:bg-emerald-50 cursor-pointer flex items-center justify-between"
                    >
                      <div>
                        <h4 className="font-medium">{savedSection.label}</h4>
                        <p className="text-sm text-gray-500">
                          {savedSection.name} • {savedSection.items.length} produits
                        </p>
                      </div>
                      <button
                        onClick={(e) => handleDeleteSavedSection(savedSection.id, e)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>Aucune section enregistrée</p>
                  <p className="text-sm mt-2">Enregistrez des sections pour les réutiliser facilement</p>
                </div>
              )}
            </div>
            
            <div className="mt-4 pt-4 border-t flex justify-end">
              <button
                type="button"
                onClick={() => setShowLoadModal(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}