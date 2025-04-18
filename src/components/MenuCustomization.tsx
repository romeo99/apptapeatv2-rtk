import { X, Plus, Minus, Info, AlertCircle } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useCart } from '../context/CartContext';
import { useRestaurantContext } from '../context/RestaurantContext';
import { availableIngredients } from '../data/ingredients';

interface SectionItemQuantity {
  itemId: string;
  quantity: number;
}

interface MenuCustomizationProps {
  item: any;
  themeColor: string;
  onClose: () => void;
  onShowIngredients?: () => void;
}

export default function MenuCustomization({ item, themeColor, onClose, onShowIngredients }: MenuCustomizationProps) {
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, any>>({});
  const [remarks, setRemarks] = useState('');
  const { menu } = useRestaurantContext();
  const [mainProductIngredients, setMainProductIngredients] = useState<any[]>([]);
  const [excludedIngredients, setExcludedIngredients] = useState<string[]>([]);
  const [invalidSections, setInvalidSections] = useState<string[]>([]);
  const sectionRefs = useRef<{[key: string]: HTMLDivElement | null}>({});
  const containerRef = useRef<HTMLDivElement>(null);
  const [itemQuantities, setItemQuantities] = useState<Record<string, SectionItemQuantity[]>>({});

  // Handle combo sections if this is a combo
  const [selectedChoices, setSelectedChoices] = useState<Record<string, string[]>>({});

  // Load ingredients from the main product if this is a combo
  useEffect(() => {
    if (item.isCombo && item.mainProductId && menu) {
      const mainProduct = menu.find(p => p.id === item.mainProductId);
      if (mainProduct?.ingredients?.length) {
        const ingredients = mainProduct.ingredients
          .map((id: string) => {
            const ingredient = availableIngredients.find(ing => ing.id === id);
            return ingredient || null;
          })
          .filter(Boolean);
        
        setMainProductIngredients(ingredients);
      }
    }
  }, [item, menu]);

  const validateRequiredSections = () => {
    if (!item.isCombo || !item.sections) return true;
    
    const newInvalidSections: string[] = [];
    
    item.sections?.forEach((section: any) => {
      if (section.required && (!selectedChoices[section.id] || selectedChoices[section.id].length === 0)) {
        newInvalidSections.push(section.id);
      }
    });
    
    if (newInvalidSections.length > 0) {
      setInvalidSections(newInvalidSections);
      
      // Scroll to the first invalid section
      if (newInvalidSections.length > 0 && sectionRefs.current[newInvalidSections[0]]) {
        sectionRefs.current[newInvalidSections[0]]?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        });
      }
      
      // Flash effect - remove after animation completes
      setTimeout(() => {
        setInvalidSections([]);
      }, 1500);
      
      return false;
    }
    
    return true;
  };

  const handleAddToCart = () => {
    // Validate required sections
    if (!validateRequiredSections()) {
      return;
    }
    
    // For combos, prepare sections data
    const sections = item.sections?.map((section: any) => {
      const choiceIds = selectedChoices[section.id] || [];
      
      if (choiceIds.length === 0) {
        return {
          name: section.name,
          choice: 'Aucun choix',
          included: false
        };
      }
      
      // If only one choice, return a simple object
      if (choiceIds.length === 1) {
        const choiceItem = section.items?.find((i: any) => i.id === choiceIds[0]);
        return {
          name: section.name,
          choice: choiceItem?.name || 'Aucun choix',
          included: choiceItem?.included || false
        };
      }
      
      // If multiple choices, return a formatted string with all choices
      const choiceItems = choiceIds.map(id => 
        section.items?.find((i: any) => i.id === id)
      ).filter(Boolean);

      // Get quantities for each item
      const sectionQuantities = itemQuantities[section.id] || [];
      const choiceItemsWithQuantities = choiceItems.map(item => {
        const quantityEntry = sectionQuantities.find(q => q.itemId === item.id);
        const quantity = quantityEntry?.quantity || 1;
        return {
          ...item,
          quantity
        };
      });
      
      // Format choice names with quantities
      const choiceNames = choiceItemsWithQuantities.map(item => 
        item.quantity > 1 ? `${item.name} (x${item.quantity})` : item.name
      ).join(', ');
      
      const allIncluded = choiceItems.every(item => item.included);
      
      return {
        name: section.name,
        choice: choiceNames,
        included: allIncluded
      };
    });

    // Calculate total price including supplements
    let totalPrice = item.price;
    
    // Add price for non-included combo options
    if (item.sections) {
      item.sections.forEach((section: any) => {
        const selectedItemIds = selectedChoices[section.id] || [];
        if (selectedItemIds.length > 0) {
          // Add price for each non-included item
          selectedItemIds.forEach(itemId => {
            const selectedItem = section.items.find((i: any) => i.id === itemId);
            if (selectedItem && !selectedItem.included) {
              totalPrice += selectedItem.price * quantity;
            }
          });
        }
      });
    }

    addItem({
      ...item,
      price: totalPrice,
      quantity,
      menuOptions: selectedOptions,
      remarks: remarks.trim() || null,
      sections,
      excludedIngredients: excludedIngredients.length > 0 ? 
        mainProductIngredients
          .filter(ing => excludedIngredients.includes(ing.id))
          .map(ing => ing.name) : 
        undefined,
      restaurantId: window.location.search.split('restaurantId=')[1]?.split('&')[0] || ''
    });
    
    onClose();
  };

  const handleQuantityChange = (change: number) => {
    setQuantity(Math.max(1, quantity + change));
  };

  const handleOptionSelect = (sectionName: string, option: string) => {
    setSelectedOptions(prev => ({
      ...prev,
      [sectionName]: option
    }));
  };

  const handleSectionChoice = (sectionId: string, itemId: string) => {
    // Find the section to get maxChoices
    const section = item.sections?.find((s: any) => s.id === sectionId);
    const maxChoices = section?.maxChoices || 1;
    
    // Calculate total quantity of currently selected items
    const currentChoices = selectedChoices[sectionId] || [];
    const totalCurrentQuantity = currentChoices.reduce((total, choiceId) => {
      return total + getItemQuantity(sectionId, choiceId);
    }, 0);
    
    setSelectedChoices(prev => {
      const currentChoices = prev[sectionId] || [];
      
      // If item is already selected, remove it (toggle behavior)
      if (currentChoices.includes(itemId)) {
        return {
          ...prev,
          [sectionId]: currentChoices.filter(id => id !== itemId)
        };
      }
      
      // If maxChoices is 1, replace the current choice
      if (maxChoices === 1) {
        return {
          ...prev,
          [sectionId]: [itemId]
        };
      }
      
      // If we already have max choices (considering quantities), don't add more
      if (totalCurrentQuantity >= maxChoices) {
        return prev;
      }
      
      // Otherwise add this choice to the array
      return {
        ...prev,
        [sectionId]: [...currentChoices, itemId]
      };
    });
    
    // Remove from invalid sections if it was marked as invalid
    setInvalidSections(prev => prev.filter(id => id !== sectionId));
    
    // Find the current section and the next one
    if (item.sections) {
      const currentSectionIndex = item.sections.findIndex((s: any) => s.id === sectionId);
      const nextSection = item.sections[currentSectionIndex + 1];
      
      // If there's a next section, scroll to it
      if (nextSection && sectionRefs.current[nextSection.id]) {
        // Use a longer delay to ensure DOM updates are complete
        setTimeout(() => {
          const sectionElement = sectionRefs.current[nextSection.id];
          if (sectionElement && containerRef.current) {
            // Calculate the section's position relative to the container
            const containerRect = containerRef.current.getBoundingClientRect();
            const sectionRect = sectionElement.getBoundingClientRect();
            
            // Calculate the offset to center the section in the viewport
            const offset = sectionRect.top - containerRect.top - 20;
            
            // Scroll the container to show the section
            containerRef.current.scrollBy({
              top: offset,
              behavior: 'smooth'
            });
          }
        }, 500);
      }
    }
  };

  const handleItemQuantityChange = (sectionId: string, itemId: string, change: number) => {
    // Find the section to get maxChoices
    const section = item.sections?.find((s: any) => s.id === sectionId);
    const maxChoices = section?.maxChoices || 1;
    
    // Calculate total quantity of currently selected items
    const currentChoices = selectedChoices[sectionId] || [];
    const currentQuantities = itemQuantities[sectionId] || [];
    
    // Calculate total quantity excluding the current item
    const totalOtherQuantities = currentChoices.reduce((total, choiceId) => {
      if (choiceId === itemId) return total;
      const entry = currentQuantities.find(q => q.itemId === choiceId);
      return total + (entry?.quantity || 1);
    }, 0);
    
    // Get current quantity of this item
    const currentItemQuantity = getItemQuantity(sectionId, itemId);
    
    // Check if increasing would exceed max choices
    if (change > 0 && (totalOtherQuantities + currentItemQuantity + change) > maxChoices) {
      // Don't allow exceeding max choices
      return;
    }
    
    setItemQuantities(prev => {
      const sectionQuantities = prev[sectionId] || [];
      const existingEntry = sectionQuantities.find(q => q.itemId === itemId);
      
      if (existingEntry) {
        // Update existing entry
        const newQuantity = Math.max(1, existingEntry.quantity + change);
        return {
          ...prev,
          [sectionId]: sectionQuantities.map(q => 
            q.itemId === itemId ? { ...q, quantity: newQuantity } : q
          )
        };
      } else {
        // Add new entry
        return {
          ...prev,
          [sectionId]: [...sectionQuantities, { itemId, quantity: Math.max(1, 1 + change) }]
        };
      }
    });
  };

  const getItemQuantity = (sectionId: string, itemId: string): number => {
    const sectionQuantities = itemQuantities[sectionId] || [];
    const entry = sectionQuantities.find(q => q.itemId === itemId);
    return entry?.quantity || 1;
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const toggleIngredientExclusion = (ingredientId: string) => {
    setExcludedIngredients(prev => 
      prev.includes(ingredientId) 
        ? prev.filter(id => id !== ingredientId) 
        : [...prev, ingredientId]
    );
  };

  // Calculate total price including options
  const calculateTotalPrice = () => {
    let total = item.price;
    
    // Add price for non-included combo options
    if (item.sections) {
      item.sections.forEach((section: any) => {
        const selectedItemIds = selectedChoices[section.id] || [];
        if (selectedItemIds.length > 0) {
          // Add price for each non-included item
          selectedItemIds.forEach(itemId => {
            const selectedItem = section.items.find((i: any) => i.id === itemId);
            if (selectedItem && !selectedItem.included) {
              total += selectedItem.price * quantity;
            }
          });
        }
      });
    }
    
    return (total * quantity).toFixed(2);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end md:items-center justify-center" onClick={handleBackdropClick}>
      <div 
        className="bg-white w-full max-w-lg rounded-t-2xl md:rounded-2xl max-h-[90vh] flex flex-col" 
        onClick={e => e.stopPropagation()}
      >
        {/* Fixed header */}
        <div className="sticky top-0 z-10 bg-white border-b px-4 py-3 flex items-center rounded-t-2xl md:rounded-t-2xl">
          {item.image && (
            <div className="w-12 h-12 mr-3 flex-shrink-0">
              <img 
                src={item.image}
                alt={item.name}
                className="w-full h-full object-cover rounded-lg"
              />
            </div>
          )}
          <h2 className="text-xl font-semibold flex-1">{item.name}</h2>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        
        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6" ref={containerRef}>
          {/* Combo sections */}
          {item.isCombo && item.sections?.map((section: any, index: number) => (
            <div 
              key={index} 
              ref={el => sectionRefs.current[section.id] = el}
              className={`space-y-3 p-4 rounded-lg ${
                invalidSections.includes(section.id) 
                  ? 'animate-pulse bg-red-50 border border-red-300'
                  : 'border border-transparent'
              }`}
              id={`section-${section.id}`}
            >
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-lg">
                  {section.name}
                  {section.required && <span className="text-red-500 ml-1">*</span>}
                </h3>
                {section.maxChoices > 1 && (
                  <span className="text-sm text-gray-500">
                    Choisissez jusqu'à {section.maxChoices}
                  </span>
                )}
              </div>
              
              {invalidSections.includes(section.id) && (
                <div className="flex items-center gap-2 text-red-500 text-sm">
                  <AlertCircle className="h-4 w-4" />
                  <span>Veuillez faire un choix pour cette section</span>
                </div>
              )}
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {section.items.map((option: any) => (
                  <div 
                    key={option.id}
                    onClick={() => handleSectionChoice(section.id, option.id)}
                    className={`p-3 border rounded-lg cursor-pointer flex items-center gap-3 transition-all ${
                      selectedChoices[section.id]?.includes(option.id)
                        ? 'border-2 border-emerald-500 bg-emerald-50' 
                        : 'hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {option.image && (
                        <img 
                          src={option.image} 
                          alt={option.name} 
                          className="w-12 h-12 object-cover rounded-lg"
                        />
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          {section.maxChoices > 1 && (
                            <div className={`w-5 h-5 flex items-center justify-center border rounded ${
                              selectedChoices[section.id]?.includes(option.id) 
                                ? 'bg-emerald-500 border-emerald-500 text-white' 
                                : 'border-gray-300'
                            }`}>
                              {selectedChoices[section.id]?.includes(option.id) && '✓'}
                            </div>
                          )}
                          <span className="font-medium">{option.name}</span>
                        </div>
                        {!option.included && (
                          <span className="text-emerald-600">+{option.price} €</span>
                        )}
                      </div>
                    </div>
                    
                    {/* Quantity selector - only shown when selected */}
                    {selectedChoices[section.id]?.includes(option.id) && section.maxChoices > 0 && (
                      <div className="flex items-center gap-2 ml-auto">
                        {/* Calculate if we can add more of this item */}
                        {(() => {
                          const currentChoices = selectedChoices[section.id] || [];
                          const totalQuantity = currentChoices.reduce((total, choiceId) => {
                            return total + getItemQuantity(section.id, choiceId);
                          }, 0);
                          const currentQuantity = getItemQuantity(section.id, option.id);
                          const canIncrease = totalQuantity < section.maxChoices;
                          
                          return (
                            <>
                        <button 
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleItemQuantityChange(section.id, option.id, -1);
                          }}
                          className="w-6 h-6 rounded-full flex items-center justify-center border border-gray-300 text-gray-500"
                        >
                          -
                        </button>
                        <span className="text-sm font-medium w-4 text-center">
                          {getItemQuantity(section.id, option.id)}
                        </span>
                        <button 
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleItemQuantityChange(section.id, option.id, 1);
                          }}
                          disabled={!canIncrease}
                          className="w-6 h-6 rounded-full flex items-center justify-center border border-gray-300 text-gray-500"
                          style={{ opacity: canIncrease ? 1 : 0.5 }}
                        >
                          +
                        </button>
                            </>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Main product ingredients */}
          {mainProductIngredients.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-medium">Ingrédients</h3>
              <p className="text-sm text-gray-500">
                Vous pouvez exclure les ingrédients que vous ne souhaitez pas
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {mainProductIngredients.map((ingredient) => (
                  <button
                    key={ingredient.id}
                    onClick={() => toggleIngredientExclusion(ingredient.id)}
                    className={`flex flex-col items-center p-2 rounded-xl transition-all ${
                      excludedIngredients.includes(ingredient.id)
                        ? 'bg-red-50 text-red-500'
                        : 'bg-gray-50 hover:bg-gray-100'
                    }`}
                    type="button"
                  >
                    <span className="text-2xl mb-1">{ingredient.icon}</span>
                    <span className="text-xs text-center leading-tight">
                      {ingredient.name}
                    </span>
                    {excludedIngredients.includes(ingredient.id) && (
                      <span className="text-xs text-red-500 mt-1">Exclu</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {/* Remarques */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Remarques pour le restaurant
            </label>
            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Ex: Sans sauce, bien cuit..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              rows={3}
            />
          </div>
        </div>
        
        {/* Fixed footer */}
        <div className="sticky bottom-0 bg-white border-t p-4 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => handleQuantityChange(-1)}
                type="button"
                className="w-10 h-10 rounded-full flex items-center justify-center text-white"
                style={{ backgroundColor: themeColor }}
              >
                <Minus className="h-5 w-5" />
              </button>
              <span className="text-xl font-medium">{quantity}</span>
              <button 
                onClick={() => handleQuantityChange(1)}
                type="button"
                className="w-10 h-10 rounded-full flex items-center justify-center text-white"
                style={{ backgroundColor: themeColor }}
              >
                <Plus className="h-5 w-5" />
              </button>
            </div>
            
            <button
              onClick={handleAddToCart}
              type="button"
              className="px-6 py-3 rounded-xl text-white font-medium"
              style={{ backgroundColor: themeColor }}
            >
              Ajouter • {calculateTotalPrice()} €
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}