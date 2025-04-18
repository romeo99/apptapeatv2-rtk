export const categories = [
  {
    id: 'nos-menus',
    name: 'Nos Menus',
    image: 'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?auto=format&fit=crop&w=120&h=120',
    icon: '🍔'
  },
  {
    id: 'burgers',
    name: 'Burgers',
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=120&h=120',
    icon: '🥩'
  },
  {
    id: 'salades',
    name: 'Salades',
    image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=120&h=120',
    icon: '🥗'
  },
  {
    id: 'desserts',
    name: 'Desserts',
    image: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?auto=format&fit=crop&w=120&h=120',
    icon: '🍰'
  },
  {
    id: 'boissons',
    name: 'Boissons',
    image: 'https://images.unsplash.com/photo-1437418747212-8d9709afab22?auto=format&fit=crop&w=120&h=120',
    icon: '🥤'
  },
  {
    id: 'sides',
    name: 'Sides',
    image: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=120&h=120',
    icon: '🍟'
  }
];

export const comboOptions = {
  drinks: [
    {
      id: 'coca',
      name: 'Coca-Cola',
      image: 'https://images.unsplash.com/photo-1554866585-cd94860890b7?auto=format&fit=crop&w=200&h=200'
    },
    {
      id: 'sprite',
      name: 'Sprite',
      image: 'https://images.unsplash.com/photo-1625772299848-391b6a87d7b3?auto=format&fit=crop&w=200&h=200'
    },
    {
      id: 'fanta',
      name: 'Fanta',
      image: 'https://images.unsplash.com/photo-1624517452488-04869289c4ca?auto=format&fit=crop&w=200&h=200'
    },
    {
      id: 'ice-tea',
      name: 'Ice Tea',
      image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=200&h=200'
    }
  ],
  sides: [
    {
      id: 'fries',
      name: 'Frites Maison',
      image: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=200&h=200'
    },
    {
      id: 'sweet-potato-fries',
      name: 'Frites Patate Douce',
      image: 'https://images.unsplash.com/photo-1635030103548-aa93e4978b18?auto=format&fit=crop&w=200&h=200'
    },
    {
      id: 'onion-rings',
      name: 'Onion Rings',
      image: 'https://images.unsplash.com/photo-1639024471283-03518883512d?auto=format&fit=crop&w=200&h=200'
    },
    {
      id: 'coleslaw',
      name: 'Coleslaw',
      image: 'https://images.unsplash.com/photo-1625938144755-652e08e359b7?auto=format&fit=crop&w=200&h=200'
    }
  ],
  sauces: [
    {
      id: 'urban-sauce',
      name: 'Urban Sauce',
      image: 'https://images.unsplash.com/photo-1472476443507-c7a5948772fc?auto=format&fit=crop&w=200&h=200'
    },
    {
      id: 'bbq',
      name: 'BBQ',
      image: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=200&h=200'
    },
    {
      id: 'chipotle',
      name: 'Chipotle Mayo',
      image: 'https://images.unsplash.com/photo-1585325701956-60dd9c8553bc?auto=format&fit=crop&w=200&h=200'
    },
    {
      id: 'honey-mustard',
      name: 'Honey Mustard',
      image: 'https://images.unsplash.com/photo-1591501970729-3eb7d540a7c0?auto=format&fit=crop&w=200&h=200'
    }
  ]
};

export const ingredients = {
  'classic-burger': [
    { id: 'beef', name: 'Steak Haché Black Angus', icon: '🥩' },
    { id: 'cheddar', name: 'Cheddar Affiné', icon: '🧀' },
    { id: 'lettuce', name: 'Laitue Fraîche', icon: '🥬' },
    { id: 'tomato', name: 'Tomate', icon: '🍅' },
    { id: 'onion', name: 'Oignon Rouge', icon: '🧅' },
    { id: 'pickles', name: 'Cornichons', icon: '🥒' }
  ],
  'cheese-lover': [
    { id: 'beef', name: 'Steak Haché Black Angus', icon: '🥩' },
    { id: 'cheddar', name: 'Cheddar Affiné', icon: '🧀' },
    { id: 'raclette', name: 'Raclette', icon: '🧀' },
    { id: 'mozzarella', name: 'Mozzarella', icon: '🧀' },
    { id: 'onion', name: 'Oignon Caramélisé', icon: '🧅' }
  ],
  'chicken-burger': [
    { id: 'chicken', name: 'Poulet Croustillant', icon: '🍗' },
    { id: 'cheddar', name: 'Cheddar', icon: '🧀' },
    { id: 'lettuce', name: 'Laitue', icon: '🥬' },
    { id: 'tomato', name: 'Tomate', icon: '🍅' },
    { id: 'pickles', name: 'Cornichons', icon: '🥒' }
  ]
};

export const menuItems = [
  // Menus
  {
    id: 'menu-classic',
    name: 'Menu Classic',
    description: 'Notre burger signature avec steak Black Angus',
    price: 15.90,
    categoryId: 'nos-menus',
    image: 'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?auto=format&fit=crop&w=600&h=400',
    isCombo: true,
    baseItem: 'classic-burger',
    rating: 'Bestseller'
  },
  {
    id: 'menu-cheese-lover',
    name: 'Menu Cheese Lover',
    description: 'Pour les amoureux du fromage, triple cheese!',
    price: 16.90,
    categoryId: 'nos-menus',
    image: 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?auto=format&fit=crop&w=600&h=400',
    isCombo: true,
    baseItem: 'cheese-lover',
    rating: 'Nouveau'
  },
  {
    id: 'menu-chicken',
    name: 'Menu Chicken',
    description: 'Poulet croustillant et sauce maison',
    price: 14.90,
    categoryId: 'nos-menus',
    image: 'https://images.unsplash.com/photo-1513185158878-8d8c2a2a3da3?auto=format&fit=crop&w=600&h=400',
    isCombo: true,
    baseItem: 'chicken-burger'
  },

  // Burgers
  {
    id: 'classic-burger',
    name: 'Classic Burger',
    description: 'Notre burger signature avec steak Black Angus',
    price: 9.90,
    categoryId: 'burgers',
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&h=400',
    baseItem: 'classic-burger'
  },
  {
    id: 'cheese-lover',
    name: 'Cheese Lover',
    description: 'Triple fromage pour les plus gourmands',
    price: 10.90,
    categoryId: 'burgers',
    image: 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?auto=format&fit=crop&w=600&h=400',
    baseItem: 'cheese-lover'
  },
  {
    id: 'chicken-burger',
    name: 'Chicken Burger',
    description: 'Poulet croustillant et sauce maison',
    price: 8.90,
    categoryId: 'burgers',
    image: 'https://images.unsplash.com/photo-1513185158878-8d8c2a2a3da3?auto=format&fit=crop&w=600&h=400',
    baseItem: 'chicken-burger'
  },

  // Salades
  {
    id: 'caesar-salad',
    name: 'Salade César',
    description: 'Poulet grillé, parmesan, croûtons',
    price: 10.90,
    categoryId: 'salades',
    image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=600&h=400'
  },
  {
    id: 'goat-cheese-salad',
    name: 'Salade Chèvre Chaud',
    description: 'Chèvre, miel, noix, pommes',
    price: 11.90,
    categoryId: 'salades',
    image: 'https://images.unsplash.com/photo-1604909052743-94e838986d24?auto=format&fit=crop&w=600&h=400'
  },

  // Desserts
  {
    id: 'chocolate-cake',
    name: 'Gâteau Chocolat',
    description: 'Moelleux au chocolat noir',
    price: 6.90,
    categoryId: 'desserts',
    image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=600&h=400'
  },
  {
    id: 'cheesecake',
    name: 'Cheesecake',
    description: 'New York style, coulis fruits rouges',
    price: 7.90,
    categoryId: 'desserts',
    image: 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?auto=format&fit=crop&w=600&h=400'
  },
  {
    id: 'ice-cream',
    name: 'Glace Artisanale',
    description: '3 boules au choix',
    price: 5.90,
    categoryId: 'desserts',
    image: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?auto=format&fit=crop&w=600&h=400'
  },

  // Boissons
  {
    id: 'coca-cola',
    name: 'Coca-Cola',
    description: '33cl',
    price: 2.90,
    categoryId: 'boissons',
    image: 'https://images.unsplash.com/photo-1554866585-cd94860890b7?auto=format&fit=crop&w=600&h=400'
  },
  {
    id: 'sprite',
    name: 'Sprite',
    description: '33cl',
    price: 2.90,
    categoryId: 'boissons',
    image: 'https://images.unsplash.com/photo-1625772299848-391b6a87d7b3?auto=format&fit=crop&w=600&h=400'
  },
  {
    id: 'milkshake',
    name: 'Milkshake',
    description: 'Vanille, Chocolat ou Fraise',
    price: 4.90,
    categoryId: 'boissons',
    image: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=600&h=400'
  },

  // Sides
  {
    id: 'fries',
    name: 'Frites Maison',
    description: 'Fraîchement coupées',
    price: 3.90,
    categoryId: 'sides',
    image: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=600&h=400'
  },
  {
    id: 'onion-rings',
    name: 'Onion Rings',
    description: 'Croustillants à souhait',
    price: 4.90,
    categoryId: 'sides',
    image: 'https://images.unsplash.com/photo-1639024471283-03518883512d?auto=format&fit=crop&w=600&h=400'
  },
  {
    id: 'sweet-potato-fries',
    name: 'Frites Patate Douce',
    description: 'Légèrement épicées',
    price: 4.90,
    categoryId: 'sides',
    image: 'https://images.unsplash.com/photo-1635030103548-aa93e4978b18?auto=format&fit=crop&w=600&h=400'
  }
];