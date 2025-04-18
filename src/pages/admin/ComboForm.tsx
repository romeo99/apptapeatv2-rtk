import { ChevronLeft, GripVertical, Image, Loader2, Plus, Upload, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'; 
import AdminLayout from '../../components/admin/AdminLayout';
import ComboSectionForm from '../../components/admin/ComboSectionForm';
import ProductSelector from '../../components/admin/ProductSelector';
import { useRestaurantContext } from '../../context/RestaurantContext';
import useOrderNotification from '../../hooks/useOrderNotification';
import { createCombo, updateMenuItem } from '../../services/menuService';
import { uploadImage } from '../../services/uploadService';

export default function ComboForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { restaurant, menu = [], categories = [] } = useRestaurantContext();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showProductSelector, setShowProductSelector] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [activeSection, setActiveSection] = useState<string | null>(null);

  useOrderNotification();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: 0,
    categoryId: '',
    mainProductId: '',
    mainProduct: null as any,
    sections: [] as Array<{
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
    }>
  });

  useEffect(() => {
    if (id) {
      const combo = menu.find(item => item.id === id);
      if (combo) {
        const mainProduct = menu.find(item => item.id === combo.mainProductId);
        // Set image preview from combo image or main product image
        setImagePreview(combo.image || (mainProduct?.image || ''));
        
        setFormData({
          name: combo.name,
          description: combo.description || '',
          price: combo.price,
          categoryId: combo.categoryId,
          mainProductId: combo.mainProductId || '',
          mainProduct: mainProduct || null,
          sections: (combo.sections || []).map(section => ({
            ...section,
            maxChoices: section.maxChoices || 1, // Ensure maxChoices is set
            items: section.items || [] // Ensure items is always an array
          }))
        });
        // Set the first section as active if there are sections
        if (combo.sections && combo.sections.length > 0) {
          setActiveSection(combo.sections[0].id);
        }
      }
    }
  }, [id, menu]);

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

  const handleMainProductSelect = (product: any) => {
    setFormData(prev => ({
      ...prev,
      mainProductId: product.id,
      mainProduct: product
    }));
    // Si aucune image personnalisée n'a été uploadée, utiliser l'image du produit principal
    if (!imageFile && !imagePreview) {
      setImagePreview(product.image);
    }
    // Fermer automatiquement le sélecteur après la sélection
    setShowProductSelector(false);
  };

  const handleAddSection = () => {
    const newSection = {
      id: `section-${Date.now()}`,
      name: '',
      required: true,
      maxChoices: 1,
      items: [] // Initialize with empty array
    };
    
    setFormData(prev => ({
      ...prev,
      sections: [...prev.sections, newSection]
    }));
    // Set the new section as active
    setActiveSection(newSection.id);
  };

  const handleUpdateSection = (sectionId: string, updates: any) => {
    setFormData(prev => ({
      ...prev,
      sections: prev.sections.map(section => {
        if (section.id === sectionId) {
          // Preserve maxChoices if it's not explicitly provided in updates
          const maxChoices = updates.maxChoices !== undefined ? 
            updates.maxChoices : section.maxChoices;
          
          return {
            ...updates,
            maxChoices,
            items: updates.items || [] // Ensure items is always an array
          };
        }
        return section;
      })
    }));
  };

  const handleRemoveSection = (sectionId: string) => {
    setFormData(prev => ({
      ...prev,
      sections: prev.sections.filter(section => section.id !== sectionId)
    }));
    
    // If the removed section was active, set the first remaining section as active
    if (activeSection === sectionId) {
      const remainingSections = formData.sections.filter(section => section.id !== sectionId);
      setActiveSection(remainingSections.length > 0 ? remainingSections[0].id : null);
    }
  };

  const handleDragEnd = (result: DropResult) => {
    // Dropped outside the list
    if (!result.destination) {
      return;
    }

    // Reorder sections
    const reorderedSections = Array.from(formData.sections);
    const [removed] = reorderedSections.splice(result.source.index, 1);
    reorderedSections.splice(result.destination.index, 0, removed);

    setFormData(prev => ({
      ...prev,
      sections: reorderedSections
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restaurant?.id || !formData.mainProduct) return;

    try {
      setSaving(true);
      setError(null);

      // Upload section images first
      const sectionsWithImages = await Promise.all(formData.sections.map(async (section) => {
        if (section.imageFile) {
          const imageUrl = await uploadImage(section.imageFile, `restaurants/${restaurant.id}/combos/sections`);
          return {
            ...section,
            image: imageUrl,
            imageFile: undefined
          };
        }
        return section;
      }));

      const comboData = {
        ...formData,
        sections: sectionsWithImages,
        // Ensure maxChoices is properly set for each section
        sections: sectionsWithImages.map(section => ({
          ...section,
          maxChoices: section.maxChoices || 1
        })),
        image: imagePreview,
        isCombo: true,
        status: 'available' as const
      };

      if (id) {
        await updateMenuItem(id, restaurant.id, comboData, imageFile || undefined);
      } else {
        await createCombo(restaurant.id, comboData, imageFile || undefined);
      }

      navigate('/admin/menu/combos');
    } catch (err) {
      console.error('Error saving combo:', err);
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setSaving(false);
    }
  };

  const availableProducts = menu.filter(item => !item.isCombo);

  return (
    <AdminLayout>
      <div className="bg-white shadow mb-6">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/admin/menu/combos')}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <h1 className="text-xl font-semibold">
              {id ? 'Modifier le combo' : 'Nouveau combo'}
            </h1>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 pb-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-500 rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
                    onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value === '' ? 0 : Number(e.target.value) }))}
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
                    <option value="">Sélectionner</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-medium mb-4">Image du combo</h2>
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
                      // Réutiliser l'image du produit principal si disponible
                      if (formData.mainProduct) {
                        setImagePreview(formData.mainProduct.image);
                      }
                    }}
                    className="absolute top-2 right-2 p-1 bg-white rounded-full shadow-md"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="border-2 border-gray-300 border-dashed rounded-lg p-8 h-48 flex items-center justify-center">
                  <label className="cursor-pointer text-center block">
                    <Upload className="h-8 w-8 text-gray-400 mx-auto" />
                    <span className="mt-2 block text-sm text-gray-600">
                      Ajouter une image
                    </span>
                    <span className="mt-1 block text-xs text-gray-500">
                      Ou utiliser l'image du produit principal
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
            
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-medium mb-4">Produit principal</h2>
              {formData.mainProduct ? (
                <div className="flex items-center gap-4 p-4 border rounded-lg">
                  <img
                    src={formData.mainProduct.image}
                    alt={formData.mainProduct.name}
                    className="w-16 h-16 object-cover rounded-lg"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-sm truncate">{formData.mainProduct.name}</h3>
                    <p className="text-xs text-gray-500 line-clamp-2">{formData.mainProduct.description}</p>
                    <button
                      type="button"
                      onClick={() => setShowProductSelector(true)}
                      className="mt-2 text-emerald-500 text-xs hover:underline"
                    >
                      Changer de produit
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowProductSelector(true)}
                  className="w-full h-48 flex flex-col items-center justify-center px-4 py-4 border-2 border-dashed rounded-lg text-gray-500 hover:text-gray-700 hover:border-gray-400"
                >
                  <Image className="h-8 w-8 mb-2 text-gray-400" />
                  <span>Sélectionner un produit principal</span>
                </button>
              )}
            </div>
            
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => navigate('/admin/menu/combos')}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={saving || !formData.mainProduct}
                className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 disabled:opacity-50 flex items-center gap-2"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                {saving ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            </div>
          </div>
          
          {/* Right column - Sections */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <DragDropContext onDragEnd={handleDragEnd}>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-medium">Sections du combo</h2>
                  <button
                    type="button"
                    onClick={handleAddSection}
                    className="px-3 py-1.5 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 flex items-center gap-1 text-sm"
                  >
                    <Plus className="h-4 w-4" />
                    Ajouter une section
                  </button>
                </div>
                
                {formData.sections.length > 0 ? (
                  <Droppable droppableId="sections" type="section" direction="horizontal">
                    {(provided) => (
                      <div 
                        className="flex flex-wrap gap-3 mb-6 min-h-[100px]" 
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                      >
                        {formData.sections.map((section, index) => (
                          <Draggable 
                            key={section.id} 
                            draggableId={section.id} 
                            index={index}
                          >
                            {(provided) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                className="relative"
                              >
                                <div 
                                  {...provided.dragHandleProps}
                                  className="absolute -top-2 -right-2 w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center cursor-move z-10 shadow-sm hover:bg-gray-200"
                                >
                                  <GripVertical className="h-3 w-3 text-gray-500" />
                                </div>
                                <button
                                  onClick={() => setActiveSection(section.id)}
                                  type="button"
                                  className={`flex flex-col items-center p-3 rounded-xl transition-all ${
                                    activeSection === section.id 
                                      ? 'bg-emerald-50 border-2 border-emerald-500 shadow-md' 
                                      : 'bg-white border border-gray-200 hover:border-emerald-500'
                                  }`}
                                >
                                  <div className="w-16 h-16 rounded-full overflow-hidden mb-2 bg-gray-100 flex items-center justify-center">
                                    {section.image ? (
                                      <img 
                                        src={section.image} 
                                        alt={section.name} 
                                        className="w-full h-full object-cover"
                                      />
                                    ) : section.icon ? (
                                      <span className="text-3xl">{section.icon}</span>
                                    ) : (
                                      <Plus className="h-6 w-6 text-gray-400" />
                                    )}
                                  </div>
                                  <span className="text-sm font-medium text-center max-w-[80px] truncate">
                                    {section.name || 'Nouvelle section'}
                                  </span>
                                  <div className="flex items-center mt-1">
                                    <span className="text-xs text-gray-500">
                                      {(section.items || []).length} produit{(section.items || []).length !== 1 ? 's' : ''}
                                    </span>
                                    {section.required && (
                                      <span className="ml-1 w-2 h-2 bg-red-500 rounded-full" title="Obligatoire"></span>
                                    )}
                                  </div>
                                </button>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                ) : (
                  <div className="text-center py-6 text-gray-500">
                    <p className="mb-2">Aucune section ajoutée</p>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        handleAddSection();
                      }}
                      className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 inline-flex items-center gap-2"
                    >
                      <Plus className="h-5 w-5" />
                      Ajouter une section
                    </button>
                  </div>
                )}
              </DragDropContext>
            </div>
            
            {/* Section editor */}
            {activeSection ? (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium">Modifier la section</h3>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      handleRemoveSection(activeSection);
                    }}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                
                {formData.sections.map(section => (
                  section.id === activeSection && (
                    <ComboSectionForm
                      key={section.id}
                      section={section}
                      availableProducts={availableProducts}
                      onUpdate={handleUpdateSection}
                      onRemove={handleRemoveSection}
                    />
                  )
                ))}
              </div>
            ) : formData.sections.length > 0 ? (
              <div className="bg-white rounded-lg shadow-sm p-8 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Plus className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-700 mb-2">Sélectionnez une section</h3>
                  <p className="text-gray-500 mb-4">Cliquez sur une des bulles ci-dessus pour modifier une section</p>
                </div>
              </div>
            ) : null}
          </div>
        </form>
      </div>

      {showProductSelector && (
        <ProductSelector
          products={availableProducts}
          onSelect={handleMainProductSelect}
          onClose={() => setShowProductSelector(false)}
          title="Sélectionner le produit principal"
        />
      )}
    </AdminLayout>
  );
}