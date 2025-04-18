// Base de données des ingrédients avec leurs émojis associés
export const availableIngredients = [
  // Viandes et protéines
  { id: 'beef', name: 'Bœuf', icon: '🥩' },
  { id: 'chicken', name: 'Poulet', icon: '🍗' },
  { id: 'bacon', name: 'Bacon', icon: '🥓' },
  { id: 'ham', name: 'Jambon', icon: '🍖' },
  { id: 'egg', name: 'Œuf', icon: '🥚' },
  { id: 'fish', name: 'Poisson', icon: '🐟' },
  { id: 'shrimp', name: 'Crevettes', icon: '🦐' },
  { id: 'tofu', name: 'Tofu', icon: '🧊' },

  // Légumes et accompagnements
  { id: 'lettuce', name: 'Salade', icon: '🥬' },
  { id: 'spinach', name: 'Épinards', icon: '🌿' },
  { id: 'tomato', name: 'Tomates', icon: '🍅' },
  { id: 'onion', name: 'Oignons', icon: '🧅' },
  { id: 'pickle', name: 'Cornichons', icon: '🥒' },
  { id: 'pepper', name: 'Poivrons', icon: '🫑' },
  { id: 'mushroom', name: 'Champignons', icon: '🍄' },
  { id: 'cabbage', name: 'Chou', icon: '🥬' },
  { id: 'cucumber', name: 'Concombre', icon: '🥒' },
  { id: 'zucchini', name: 'Courgettes', icon: '🥒' },
  { id: 'avocado', name: 'Avocat', icon: '🥑' },
  { id: 'jalapeno', name: 'Jalapeños', icon: '🌶️' },
  { id: 'chili', name: 'Piments', icon: '🌶️' },
  { id: 'beans', name: 'Haricots', icon: '🫘' },
  { id: 'corn', name: 'Maïs', icon: '🌽' },
  { id: 'olives', name: 'Olives', icon: '🫒' },

  // Fromages
  { id: 'cheese', name: 'Fromage', icon: '🧀' },
  { id: 'cheddar', name: 'Cheddar', icon: '🧀' },
  { id: 'mozzarella', name: 'Mozzarella', icon: '🧀' },
  { id: 'feta', name: 'Feta', icon: '🧀' },
  { id: 'blue-cheese', name: 'Fromage bleu', icon: '🧀' },
  { id: 'brie', name: 'Brie', icon: '🧀' },
  { id: 'parmesan', name: 'Parmesan', icon: '🧀' },

  // Condiments et sauces
  { id: 'salt', name: 'Sel', icon: '🧂' },
  { id: 'pepper', name: 'Poivre', icon: '🌶️' },
  { id: 'ketchup', name: 'Ketchup', icon: '🥫' },
  { id: 'mustard', name: 'Moutarde', icon: '🥫' },
  { id: 'mayo', name: 'Mayonnaise', icon: '🥫' },
  { id: 'bbq-sauce', name: 'Sauce BBQ', icon: '🥫' },
  { id: 'hot-sauce', name: 'Sauce piquante', icon: '🌶️' },
  { id: 'olive-oil', name: 'Huile d\'olive', icon: '🫒' },
  { id: 'cream', name: 'Crème', icon: '🥛' },

  // Féculents et bases
  { id: 'bread', name: 'Pain', icon: '🍞' },
  { id: 'fries', name: 'Frites', icon: '🍟' },
  { id: 'potato', name: 'Pommes de terre', icon: '🥔' },
  { id: 'rice', name: 'Riz', icon: '🍚' },
  { id: 'pasta', name: 'Pâtes', icon: '🍝' },
  { id: 'tortilla', name: 'Tortilla', icon: '🫓' },

  // Fruits
  { id: 'lemon', name: 'Citron', icon: '🍋' },
  { id: 'pineapple', name: 'Ananas', icon: '🍍' },
  { id: 'mango', name: 'Mangue', icon: '🥭' },
  { id: 'apple', name: 'Pomme', icon: '🍎' },
  { id: 'pear', name: 'Poire', icon: '🍐' },
  { id: 'grapes', name: 'Raisins', icon: '🍇' },

  // Épices et herbes
  { id: 'garlic', name: 'Ail', icon: '🧄' },
  { id: 'herb', name: 'Herbes', icon: '🌿' },
  { id: 'ginger', name: 'Gingembre', icon: '🫃' },

  // Autres ingrédients
  { id: 'butter', name: 'Beurre', icon: '🧈' },
  { id: 'milk', name: 'Lait', icon: '🥛' },
  { id: 'nuts', name: 'Noix', icon: '🥜' },
  { id: 'seeds', name: 'Graines', icon: '🌰' }
];

// Groupes d'ingrédients pour l'organisation
export const ingredientGroups = [
  {
    id: 'proteins',
    name: 'Viandes et protéines',
    items: ['beef', 'chicken', 'bacon', 'ham', 'egg', 'fish', 'shrimp', 'tofu']
  },
  {
    id: 'vegetables',
    name: 'Légumes et accompagnements',
    items: ['lettuce', 'spinach', 'tomato', 'onion', 'pickle', 'pepper', 'mushroom', 'cabbage', 'cucumber', 'zucchini', 'avocado', 'jalapeno', 'chili', 'beans', 'corn', 'olives']
  },
  {
    id: 'cheese',
    name: 'Fromages',
    items: ['cheese', 'cheddar', 'mozzarella', 'feta', 'blue-cheese', 'brie', 'parmesan']
  },
  {
    id: 'condiments',
    name: 'Condiments et sauces',
    items: ['salt', 'pepper', 'ketchup', 'mustard', 'mayo', 'bbq-sauce', 'hot-sauce', 'olive-oil', 'cream']
  },
  {
    id: 'starches',
    name: 'Féculents et bases',
    items: ['bread', 'fries', 'potato', 'rice', 'pasta', 'tortilla']
  },
  {
    id: 'fruits',
    name: 'Fruits',
    items: ['lemon', 'pineapple', 'mango', 'apple', 'pear', 'grapes']
  },
  {
    id: 'herbs-spices',
    name: 'Épices et herbes',
    items: ['garlic', 'herb', 'ginger']
  },
  {
    id: 'others',
    name: 'Autres ingrédients',
    items: ['butter', 'milk', 'nuts', 'seeds']
  }
];