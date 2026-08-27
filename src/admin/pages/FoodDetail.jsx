import React, { useState } from 'react';
import Select from 'react-select';
import {
  Flame, Clock, Edit, ArrowLeft, CheckCircle2, TrendingUp, AlertTriangle,
  BarChart2, Star, Users, Wheat, Beef, Droplet, Sparkles, ChefHat,
  DollarSign, PackageCheck, Layers, Printer, Check, X, ShieldAlert,
  ArrowRight, RefreshCw, PieChart, UtensilsCrossed, ExternalLink, Activity
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell, CartesianGrid } from 'recharts';
import { createPortal } from 'react-dom';
import { useToast } from '../context/ToastContext';
import { useTheme } from '../context/ThemeContext';

/* ─── Detailed Mock Dataset for Cloud Kitchen Dishes ─── */
const initialDishes = [
  {
    id: 1,
    name: 'Spicy Tonkotsu Ramen Bowl',
    category: 'Asian',
    price: 16.50,
    cost: 5.20,
    margin: '68.5%',
    station: 'Station 2 • Wok & Noodle Line',
    status: 'In Stock',
    rating: 4.9,
    reviewsCount: 384,
    prepTime: '12-15 Mins',
    calories: '680 kcal',
    salesTotal: '420 Orders',
    mainImage: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800&auto=format&fit=crop&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&auto=format&fit=crop&q=80',
    ],
    ingredients: [
      '12-Hour Simmered Pork Bone Broth',
      'Hand-crafted Artisan Ramen Noodles',
      'Slow-Braised Chashu Pork Belly',
      'Soft-boiled Ajitsuke Tamago Egg',
      'Toasted Nori Seaweed & Green Onions',
      'Signature Roasted Chili Garlic Oil'
    ],
    allergens: ['Gluten (Wheat)', 'Soy', 'Egg', 'Sesame'],
    nutrition: { protein: '34g', carbs: '78g', fat: '24g', sodium: '1,120mg' },
    description: 'Our signature Cloud Kitchen bowl! Slow-cooked 12-hour rich pork bone broth paired with hand-crafted thin noodles, melt-in-your-mouth braised pork belly, and aromatic toasted chili oil.',
    prepSteps: [
      'Heat 320ml of signature Tonkotsu broth to 92°C in station saucepan.',
      'Boil fresh artisan noodles in basket for exactly 85 seconds.',
      'Torch braised Chashu pork belly slices until lightly caramelized.',
      'Plate noodles, pour scalding broth, and add halved Ajitsuke egg & nori sheet.',
      'Drizzle 15ml signature chili garlic oil on top and dispatch to hot box.'
    ],
    channels: [
      { name: 'Delivery Apps (DoorDash / UberEats)', percent: 64, color: 'bg-rose-500' },
      { name: 'Direct Cloud Kitchen Web App', percent: 26, color: 'bg-[#8C0D0D]' },
      { name: 'Takeout / Pickup Station', percent: 10, color: 'bg-amber-500' },
    ],
    weeklySales: [
      { day: 'Mon', sales: 45 },
      { day: 'Tue', sales: 52 },
      { day: 'Wed', sales: 78 },
      { day: 'Thu', sales: 64 },
      { day: 'Fri', sales: 95 },
      { day: 'Sat', sales: 110 },
      { day: 'Sun', sales: 88 },
    ],
    reviews: [
      { name: 'Jons Sena', rating: 5, comment: 'Best ramen in town! The broth depth is unreal and arrived scalding hot in insulated packaging.', time: '2 hours ago', avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80' },
      { name: 'Marcus Vance', rating: 4.8, comment: 'Chashu was melt-in-the-mouth good. Extra chili oil option is a must try!', time: '1 day ago', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80' }
    ]
  },
  {
    id: 2,
    name: 'Crispy Wagyu Beef Burger',
    category: 'Burgers',
    price: 18.00,
    cost: 5.90,
    margin: '67.2%',
    station: 'Station 1 • Main Grill Line',
    status: 'In Stock',
    rating: 4.8,
    reviewsCount: 290,
    prepTime: '10-12 Mins',
    calories: '820 kcal',
    salesTotal: '512 Orders',
    mainImage: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=800&auto=format&fit=crop&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1550547660-d9450f859349?w=400&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&auto=format&fit=crop&q=80',
    ],
    ingredients: [
      'A5 Wagyu Beef Patty (180g)',
      'Aged Vermont Sharp Cheddar',
      'Sweet Caramelized Red Onions',
      'Butter-Toasted Brioche Bun',
      'House Secret Smoked BBQ Aioli'
    ],
    allergens: ['Gluten (Wheat)', 'Dairy', 'Egg'],
    nutrition: { protein: '42g', carbs: '55g', fat: '38g', sodium: '980mg' },
    description: 'Juicy 100% Wagyu beef patty seared on high heat to seal flavors, layered with sharp aged cheddar, sweet caramelized onions, and secret smoked aioli on toasted brioche.',
    prepSteps: [
      'Sear Wagyu patty on 220°C flat top grill for 3 mins per side.',
      'Melt aged cheddar slice over patty during final 60 seconds.',
      'Toast brioche bun with clarified butter until golden brown.',
      'Spread secret BBQ aioli generously on top and bottom buns.',
      'Assemble with caramelized onions & wrap in heat-retentive foil packaging.'
    ],
    channels: [
      { name: 'Delivery Apps (DoorDash / UberEats)', percent: 58, color: 'bg-rose-500' },
      { name: 'Direct Cloud Kitchen Web App', percent: 32, color: 'bg-[#8C0D0D]' },
      { name: 'Takeout / Pickup Station', percent: 10, color: 'bg-amber-500' },
    ],
    weeklySales: [
      { day: 'Mon', sales: 60 },
      { day: 'Tue', sales: 68 },
      { day: 'Wed', sales: 72 },
      { day: 'Thu', sales: 85 },
      { day: 'Fri', sales: 112 },
      { day: 'Sat', sales: 125 },
      { day: 'Sun', sales: 90 },
    ],
    reviews: [
      { name: 'Emily Watson', rating: 5, comment: 'Juiciest burger I have ordered online. Arrived fresh, warm, and crisp!', time: '3 hours ago', avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80' }
    ]
  },
  {
    id: 3,
    name: 'Truffle Mushroom Pasta',
    category: 'Italian',
    price: 22.00,
    cost: 6.80,
    margin: '69.1%',
    station: 'Station 3 • Pasta & Saute Line',
    status: 'In Stock',
    rating: 4.7,
    reviewsCount: 290,
    prepTime: '12-14 Mins',
    calories: '740 kcal',
    salesTotal: '290 Orders',
    mainImage: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&auto=format&fit=crop&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&auto=format&fit=crop&q=80'
    ],
    ingredients: [
      'Handcrafted Egg Fettuccine',
      'Black Truffle Cream Reduction',
      'Wild Forest Mushrooms (Porcini & Cremini)',
      '24-Month Aged Parmigiano-Reggiano',
      'Fresh Micro Herbs & Garlic Olive Oil'
    ],
    allergens: ['Gluten (Wheat)', 'Dairy', 'Egg'],
    nutrition: { protein: '22g', carbs: '82g', fat: '31g', sodium: '840mg' },
    description: 'Handcrafted fettuccine tossed in aromatic black truffle cream and sautéed wild forest mushrooms, finished with aged Parmigiano Reggiano and fresh herb drizzle.',
    prepSteps: [
      'Boil handcrafted fettuccine in salted water for 3 mins.',
      'Sauté wild mushrooms with shallots and garlic olive oil.',
      'Deglaze pan with truffle cream reduction and simmer.',
      'Toss pasta in sauce until glossy coating forms.',
      'Garnish with freshly shaved Parmigiano & micro herbs.'
    ],
    channels: [
      { name: 'Delivery Apps (DoorDash / UberEats)', percent: 50, color: 'bg-rose-500' },
      { name: 'Direct Cloud Kitchen Web App', percent: 40, color: 'bg-[#8C0D0D]' },
      { name: 'Takeout / Pickup Station', percent: 10, color: 'bg-amber-500' },
    ],
    weeklySales: [
      { day: 'Mon', sales: 30 },
      { day: 'Tue', sales: 35 },
      { day: 'Wed', sales: 42 },
      { day: 'Thu', sales: 50 },
      { day: 'Fri', sales: 75 },
      { day: 'Sat', sales: 88 },
      { day: 'Sun', sales: 70 },
    ],
    reviews: [
      { name: 'Sofia Patel', rating: 4.9, comment: 'Rich truffle aroma right when you open the eco box. Pure luxury!', time: 'Yesterday', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80' }
    ]
  },
  {
    id: 4,
    name: 'Wood-fired BBQ Pizza',
    category: 'Pizza',
    price: 19.50,
    cost: 5.10,
    margin: '73.8%',
    station: 'Station 4 • Stone Oven Deck',
    status: 'In Stock',
    rating: 4.6,
    reviewsCount: 380,
    prepTime: '14-16 Mins',
    calories: '950 kcal',
    salesTotal: '380 Orders',
    mainImage: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&auto=format&fit=crop&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1550547660-d9450f859349?w=400&auto=format&fit=crop&q=80'
    ],
    ingredients: [
      '72-Hr Fermented Sourdough Crust',
      'Smoky Hickory BBQ Base Sauce',
      'Shredded Oven-Roasted Chicken Breast',
      'Low-Moisture Whole Milk Mozzarella',
      'Red Onion Rings & Fresh Cilantro'
    ],
    allergens: ['Gluten (Wheat)', 'Dairy'],
    nutrition: { protein: '38g', carbs: '110g', fat: '28g', sodium: '1,240mg' },
    description: 'Artisanal sourdough crust baked in a 450°C stone oven, topped with hickory BBQ sauce, tender shredded chicken, melted mozzarella, red onions, and fresh cilantro.',
    prepSteps: [
      'Hand-stretch sourdough dough ball to 12 inches.',
      'Spread hickory BBQ base evenly leaving 1-inch crust edge.',
      'Scatter mozzarella, roasted chicken, and red onion rings.',
      'Bake in stone oven at 450°C for 4.5 minutes.',
      'Slice into 8 triangles and garnish with fresh cilantro.'
    ],
    channels: [
      { name: 'Delivery Apps (DoorDash / UberEats)', percent: 70, color: 'bg-rose-500' },
      { name: 'Direct Cloud Kitchen Web App', percent: 20, color: 'bg-[#8C0D0D]' },
      { name: 'Takeout / Pickup Station', percent: 10, color: 'bg-amber-500' },
    ],
    weeklySales: [
      { day: 'Mon', sales: 40 },
      { day: 'Tue', sales: 45 },
      { day: 'Wed', sales: 50 },
      { day: 'Thu', sales: 60 },
      { day: 'Fri', sales: 90 },
      { day: 'Sat', sales: 115 },
      { day: 'Sun', sales: 80 },
    ],
    reviews: [
      { name: 'Anandreansyah', rating: 4.8, comment: 'Crust has amazing leopard spots and crunch. Top quality pizza.', time: '2 days ago', avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80' }
    ]
  },
  {
    id: 5,
    name: 'Salmon Poke Bowl',
    category: 'Asian',
    price: 17.50,
    cost: 5.80,
    margin: '66.8%',
    station: 'Station 5 • Cold Prep & Salad',
    status: 'In Stock',
    rating: 4.9,
    reviewsCount: 310,
    prepTime: '8-10 Mins',
    calories: '540 kcal',
    salesTotal: '310 Orders',
    mainImage: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&auto=format&fit=crop&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&auto=format&fit=crop&q=80'
    ],
    ingredients: [
      'Sashimi-Grade Norwegian Atlantic Salmon',
      'Seasoned Calrose Sushi Rice',
      'Hass Avocado & Steamed Edamame',
      'Japanese Seaweed Salad & Tobiko',
      'Sesame Ponzu Vinaigrette'
    ],
    allergens: ['Fish', 'Soy', 'Sesame'],
    nutrition: { protein: '31g', carbs: '62g', fat: '18g', sodium: '720mg' },
    description: 'Fresh sashimi-grade Atlantic salmon cubes tossed in sesame ponzu, served over warm sushi rice with Hass avocado, edamame, and crispy shallots.',
    prepSteps: [
      'Scoop 180g warm seasoned sushi rice into eco bowl.',
      'Dice 120g fresh salmon into uniform cubes & toss with ponzu.',
      'Arrange avocado fan, edamame, and seaweed salad in sections.',
      'Top with salmon cubes, tobiko caviar, and toasted sesame seeds.',
      'Serve cold with chopsticks and extra soy sauce packet.'
    ],
    channels: [
      { name: 'Delivery Apps (DoorDash / UberEats)', percent: 60, color: 'bg-rose-500' },
      { name: 'Direct Cloud Kitchen Web App', percent: 30, color: 'bg-[#8C0D0D]' },
      { name: 'Takeout / Pickup Station', percent: 10, color: 'bg-amber-500' },
    ],
    weeklySales: [
      { day: 'Mon', sales: 42 },
      { day: 'Tue', sales: 48 },
      { day: 'Wed', sales: 55 },
      { day: 'Thu', sales: 50 },
      { day: 'Fri', sales: 65 },
      { day: 'Sat', sales: 70 },
      { day: 'Sun', sales: 60 },
    ],
    reviews: [
      { name: 'Elena Rostova', rating: 5, comment: 'Super fresh salmon and light on stomach. Perfect healthy lunch.', time: '5 hours ago', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80' }
    ]
  },
  {
    id: 6,
    name: 'Matcha Boba Smoothie',
    category: 'Drinks',
    price: 7.50,
    cost: 1.90,
    margin: '74.6%',
    station: 'Station 6 • Beverage Bar',
    status: 'Low Stock',
    rating: 4.8,
    reviewsCount: 680,
    prepTime: '4-6 Mins',
    calories: '320 kcal',
    salesTotal: '680 Orders',
    mainImage: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=800&auto=format&fit=crop&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&auto=format&fit=crop&q=80'
    ],
    ingredients: [
      'Ceremonial Grade Uji Japanese Matcha',
      'Organic Oat Milk & Cream',
      'Warm Brown Sugar Tapioca Pearls',
      'Crushed Ice & Natural Cane Syrup'
    ],
    allergens: ['Dairy (Optional)'],
    nutrition: { protein: '6g', carbs: '52g', fat: '8g', sodium: '110mg' },
    description: 'Ceremonial grade Japanese Uji matcha whisked to perfection, poured over creamy oat milk and warm brown sugar boba tapioca pearls.',
    prepSteps: [
      'Scoop 50g warm brown sugar boba into cup base.',
      'Whisk 4g Uji matcha powder with 60ml warm water until frothy.',
      'Fill cup with ice cubes and 180ml oat milk.',
      'Layer whisked green matcha on top for gradient effect.',
      'Seal cup with eco dome lid and jumbo straw.'
    ],
    channels: [
      { name: 'Delivery Apps (DoorDash / UberEats)', percent: 55, color: 'bg-rose-500' },
      { name: 'Direct Cloud Kitchen Web App', percent: 35, color: 'bg-[#8C0D0D]' },
      { name: 'Takeout / Pickup Station', percent: 10, color: 'bg-amber-500' },
    ],
    weeklySales: [
      { day: 'Mon', sales: 80 },
      { day: 'Tue', sales: 90 },
      { day: 'Wed', sales: 95 },
      { day: 'Thu', sales: 100 },
      { day: 'Fri', sales: 120 },
      { day: 'Sat', sales: 145 },
      { day: 'Sun', sales: 110 },
    ],
    reviews: [
      { name: 'Clara Oswald', rating: 4.9, comment: 'Super chewy boba pearls and not overly sweet. My daily addiction!', time: 'Yesterday', avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80' }
    ]
  },
  {
    id: 7,
    name: 'New York Cheesecake',
    category: 'Desserts',
    price: 8.50,
    cost: 2.20,
    margin: '74.1%',
    station: 'Station 6 • Pastry & Dessert',
    status: 'In Stock',
    rating: 4.9,
    reviewsCount: 240,
    prepTime: '3-5 Mins',
    calories: '480 kcal',
    salesTotal: '240 Orders',
    mainImage: 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=800&auto=format&fit=crop&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=400&auto=format&fit=crop&q=80'
    ],
    ingredients: [
      'Philadelphia Cream Cheese Blend',
      'Graham Cracker Butter Crust',
      'Vanilla Bean Extract & Lemon Zest',
      'Wild Berry Compote Drizzle'
    ],
    allergens: ['Gluten (Wheat)', 'Dairy', 'Egg'],
    nutrition: { protein: '8g', carbs: '44g', fat: '28g', sodium: '320mg' },
    description: 'Classic dense, velvety rich New York style cheesecake on a buttery Graham cracker crust, topped with house-made wild raspberry compote.',
    prepSteps: [
      'Slice chilled cheesecake with hot wire slice to clean edge.',
      'Place on parchment paper insert inside pastry box.',
      'Drizzle 30ml warm wild berry compote over top.',
      'Garnish with fresh mint leaf and powdered sugar dust.'
    ],
    channels: [
      { name: 'Delivery Apps (DoorDash / UberEats)', percent: 65, color: 'bg-rose-500' },
      { name: 'Direct Cloud Kitchen Web App', percent: 25, color: 'bg-[#8C0D0D]' },
      { name: 'Takeout / Pickup Station', percent: 10, color: 'bg-amber-500' },
    ],
    weeklySales: [
      { day: 'Mon', sales: 25 },
      { day: 'Tue', sales: 30 },
      { day: 'Wed', sales: 35 },
      { day: 'Thu', sales: 40 },
      { day: 'Fri', sales: 55 },
      { day: 'Sat', sales: 65 },
      { day: 'Sun', sales: 50 },
    ],
    reviews: [
      { name: 'Liam O’Connor', rating: 5, comment: 'Silky smooth texture and the raspberry drizzle cuts through the richness nicely.', time: '4 hours ago', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80' }
    ]
  },
  {
    id: 8,
    name: 'Honey Glazed Wings',
    category: 'Starters',
    price: 12.00,
    cost: 3.40,
    margin: '71.6%',
    station: 'Station 1 • Fryer Line',
    status: 'In Stock',
    rating: 4.5,
    reviewsCount: 490,
    prepTime: '10-12 Mins',
    calories: '610 kcal',
    salesTotal: '490 Orders',
    mainImage: 'https://images.unsplash.com/photo-1527477396000-e27163b481c2?w=800&auto=format&fit=crop&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1527477396000-e27163b481c2?w=400&auto=format&fit=crop&q=80'
    ],
    ingredients: [
      'Jumbo Fresh Chicken Drumettes & Flats',
      'Double-Crisp Potato Starch Coating',
      'Wildflower Honey & Soy Garlic Glaze',
      'Toasted White Sesame & Green Onions'
    ],
    allergens: ['Soy', 'Sesame'],
    nutrition: { protein: '36g', carbs: '32g', fat: '26g', sodium: '910mg' },
    description: 'Double-fried extra crispy jumbo chicken wings glazed in sticky garlic honey soy reduction, sprinkled with toasted sesame seeds and fresh scallions.',
    prepSteps: [
      'Drop 8 jumbo wings in 175°C oil for 7 minutes.',
      'Rest for 1 minute then double-fry for 90 seconds until golden.',
      'Toss immediately in hot honey garlic glaze wok.',
      'Garnish with toasted sesame seeds and sliced scallions.',
      'Pack in ventilated steam-release wing box.'
    ],
    channels: [
      { name: 'Delivery Apps (DoorDash / UberEats)', percent: 72, color: 'bg-rose-500' },
      { name: 'Direct Cloud Kitchen Web App', percent: 20, color: 'bg-[#8C0D0D]' },
      { name: 'Takeout / Pickup Station', percent: 8, color: 'bg-amber-500' },
    ],
    weeklySales: [
      { day: 'Mon', sales: 50 },
      { day: 'Tue', sales: 55 },
      { day: 'Wed', sales: 65 },
      { day: 'Thu', sales: 70 },
      { day: 'Fri', sales: 105 },
      { day: 'Sat', sales: 120 },
      { day: 'Sun', sales: 85 },
    ],
    reviews: [
      { name: 'Jons Sena', rating: 4.7, comment: 'Crunchy even after 20 minutes delivery time. Sauce is killer!', time: '1 day ago', avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80' }
    ]
  }
];

/* ─── Custom Chart Tooltip ─── */
const CustomChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-900/95 backdrop-blur-md text-white px-3.5 py-2.5 rounded-2xl shadow-2xl border border-slate-700/80 text-xs font-semibold">
      <div className="text-slate-400 text-[10px] font-extrabold uppercase tracking-wider border-b border-slate-800 pb-1 mb-1.5 flex items-center justify-between">
        <span>{label}</span>
        <Activity className="w-3 h-3 text-rose-400 opacity-70" />
      </div>
      <div className="text-rose-400 font-black text-sm">
        {payload[0].value} <span className="text-xs font-medium text-slate-300">Portions Sold</span>
      </div>
    </div>
  );
};

export const FoodDetail = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [dishList, setDishList] = useState(initialDishes);
  const [selectedDishId, setSelectedDishId] = useState(1);
  const dish = dishList.find((d) => d.id === selectedDishId) || dishList[0];
  const [activeImage, setActiveImage] = useState(dish.mainImage);

  // Edit Modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editPrice, setEditPrice] = useState(dish.price);
  const [editPrepTime, setEditPrepTime] = useState(dish.prepTime);
  const [editStatus, setEditStatus] = useState(dish.status);
  const [editDescription, setEditDescription] = useState(dish.description);

  const openEditModal = () => {
    setEditPrice(dish.price);
    setEditPrepTime(dish.prepTime);
    setEditStatus(dish.status);
    setEditDescription(dish.description);
    setIsEditModalOpen(true);
  };

  const handleSaveRecipe = (e) => {
    e.preventDefault();
    setDishList((prev) =>
      prev.map((d) =>
        d.id === dish.id
          ? {
              ...d,
              price: parseFloat(editPrice) || d.price,
              prepTime: editPrepTime,
              status: editStatus,
              description: editDescription,
            }
          : d
      )
    );
    toast.success(`Recipe specs updated for ${dish.name}!`);
    setIsEditModalOpen(false);
  };

  const toggleStockStatus = () => {
    const newStatus = dish.status === 'In Stock' ? 'Out of Stock' : 'In Stock';
    setDishList((prev) =>
      prev.map((d) => (d.id === dish.id ? { ...d, status: newStatus } : d))
    );
    toast.info(`${dish.name} status toggled to: ${newStatus}`);
  };

  const dishOptions = dishList.map((d) => ({
    value: d.id,
    label: `${d.name} ($${d.price.toFixed(2)})`,
  }));

  const selectedOption = dishOptions.find((opt) => opt.value === selectedDishId);

  const customSelectStyles = {
    control: (base, state) => ({
      ...base,
      backgroundColor: isDark ? '#151c28' : '#ffffff',
      borderColor: isDark ? '#334155' : '#e2e8f0',
      borderRadius: '1rem',
      padding: '3px 6px',
      minWidth: '280px',
      boxShadow: state.isFocused ? '0 0 0 2px rgba(140, 13, 13, 0.3)' : 'none',
      '&:hover': {
        borderColor: isDark ? '#475569' : '#cbd5e1',
      },
    }),
    menuPortal: (base) => ({
      ...base,
      zIndex: 9999,
    }),
    menu: (base) => ({
      ...base,
      backgroundColor: isDark ? '#151c28' : '#ffffff',
      borderRadius: '1rem',
      border: isDark ? '1px solid #334155' : '1px solid #e2e8f0',
      overflow: 'hidden',
      boxShadow: '0 20px 30px -10px rgba(0, 0, 0, 0.4)',
      zIndex: 9999,
    }),
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isSelected
        ? '#8C0D0D'
        : state.isFocused
        ? isDark ? '#1e293b' : '#f8fafc'
        : 'transparent',
      color: state.isSelected
        ? '#ffffff'
        : isDark ? '#f8fafc' : '#0f172a',
      fontSize: '0.75rem',
      fontWeight: '700',
      cursor: 'pointer',
      padding: '10px 14px',
    }),
    singleValue: (base) => ({
      ...base,
      color: isDark ? '#ffffff' : '#0f172a',
      fontSize: '0.75rem',
      fontWeight: '800',
    }),
  };

  const handleDishChange = (selected) => {
    if (!selected) return;
    const found = dishList.find((d) => d.id === selected.value);
    setSelectedDishId(selected.value);
    if (found) setActiveImage(found.mainImage);
    toast.info(`Dish spotlight switched to: ${found?.name}`);
  };

  const bestDay = dish.weeklySales.reduce((a, b) => (b.sales > a.sales ? b : a), dish.weeklySales[0]);
  const avgSales = Math.round(dish.weeklySales.reduce((sum, d) => sum + d.sales, 0) / dish.weeklySales.length);

  const nutritionRows = [
    { label: 'Protein', value: dish.nutrition.protein, icon: Beef, color: 'text-rose-500', bg: 'bg-rose-500/10' },
    { label: 'Carbs', value: dish.nutrition.carbs, icon: Wheat, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    { label: 'Fats', value: dish.nutrition.fat, icon: Droplet, color: 'text-sky-500', bg: 'bg-sky-500/10' },
    { label: 'Sodium', value: dish.nutrition.sodium, icon: Sparkles, color: 'text-violet-500', bg: 'bg-violet-500/10' },
  ];

  /* Dynamic card styles */
  const cardBg = isDark ? 'bg-[#151c28] border-slate-800' : 'bg-white border-slate-100 shadow-sm';
  const textPrimary = isDark ? 'text-slate-100' : 'text-slate-900';
  const textMuted = isDark ? 'text-slate-400' : 'text-slate-500';
  const cardInnerBg = isDark ? 'bg-[#1b2434] border-slate-800' : 'bg-slate-50 border-slate-200';

  return (
    <div className="space-y-6 pb-12 animate-fade-in">

      {/* ═══════════ TOP HERO BANNER ═══════════ */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-[#8C0D0D] via-[#a81010] to-[#5a0606] text-white p-6 sm:p-7 shadow-xl">
        <div className="absolute -top-16 -right-16 w-80 h-80 rounded-full bg-white/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-64 h-64 rounded-full bg-amber-400/15 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3 flex-wrap">
              <button
                onClick={() => navigate('/admin/foods')}
                className="px-3 py-1 rounded-full bg-white/20 hover:bg-white/30 text-white font-extrabold text-[11px] backdrop-blur-md border border-white/10 flex items-center gap-1.5 transition-all"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back to Menu Catalog
              </button>

              <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 font-extrabold text-[11px] backdrop-blur-md border border-emerald-400/20 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                {dish.station}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2.5">
              <span>{dish.name}</span>
            </h1>
            <p className="text-xs sm:text-sm text-rose-100 font-medium max-w-2xl">
              Master culinary specifications, recipe ingredient ratios, order channels, and weekly sales velocity for kitchen line cooks.
            </p>
          </div>

          {/* Controls Right */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-white/10 p-1.5 rounded-2xl backdrop-blur-md border border-white/10">
              <span className="text-[11px] font-bold text-rose-200 pl-2 hidden xl:inline">Switch Dish:</span>
              <Select
                options={dishOptions}
                value={selectedOption}
                onChange={handleDishChange}
                styles={customSelectStyles}
                isSearchable={false}
                menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                menuPosition="fixed"
              />
            </div>

            <button
              onClick={toggleStockStatus}
              className={`px-4 py-2.5 rounded-2xl font-extrabold text-xs flex items-center gap-2 backdrop-blur-md border transition-all active:scale-95 shadow-sm ${
                dish.status === 'In Stock'
                  ? 'bg-emerald-500/20 text-emerald-200 border-emerald-400/30 hover:bg-emerald-500/30'
                  : 'bg-amber-500/20 text-amber-200 border-amber-400/30 hover:bg-amber-500/30'
              }`}
            >
              <PackageCheck className="w-4 h-4" />
              <span>{dish.status}</span>
            </button>

            <button
              onClick={() => toast.success(`Spec Sheet printed for ${dish.name}`)}
              className="px-4 py-2.5 rounded-2xl bg-white/15 hover:bg-white/25 border border-white/15 text-white font-extrabold text-xs flex items-center gap-2 backdrop-blur-md transition-all active:scale-95 shadow-sm"
            >
              <Printer className="w-4 h-4 text-amber-300" />
              <span>Print Spec</span>
            </button>

            <button
              onClick={openEditModal}
              className="px-4 py-2.5 rounded-2xl bg-white text-[#8C0D0D] hover:bg-rose-50 font-extrabold text-xs flex items-center gap-2 transition-all active:scale-95 shadow-lg"
            >
              <Edit className="w-4 h-4" />
              <span>Edit Recipe Specs</span>
            </button>
          </div>
        </div>
      </div>

      {/* ═══════════ ROW 1: MAIN SHOWCASE CARD ═══════════ */}
      <div className={`p-6 sm:p-8 rounded-3xl border grid grid-cols-1 lg:grid-cols-12 gap-8 items-start ${cardBg}`}>

        {/* Left Column: Interactive Image & Thumbnail Gallery */}
        <div className="lg:col-span-5 space-y-4">
          <div className="relative h-80 sm:h-96 rounded-3xl overflow-hidden shadow-2xl border border-slate-100 dark:border-slate-800 group">
            <img
              src={activeImage || dish.mainImage}
              alt={dish.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent pointer-events-none" />

            {/* Badges Overlay */}
            <div className="absolute top-4 left-4 flex items-center gap-2">
              <span className="px-3 py-1.5 rounded-full bg-slate-900/80 backdrop-blur-md text-amber-400 font-extrabold text-xs flex items-center gap-1 shadow">
                <Star className="w-3.5 h-3.5 fill-current" />
                {dish.rating} <span className="text-slate-400 font-semibold">({dish.reviewsCount} reviews)</span>
              </span>
            </div>

            <div className="absolute top-4 right-4">
              <span className={`px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-wider backdrop-blur-md shadow ${
                dish.status === 'In Stock'
                  ? 'bg-emerald-500/90 text-white'
                  : 'bg-amber-500/90 text-white'
              }`}>
                {dish.status}
              </span>
            </div>

            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-white text-xs font-extrabold">
              <span className="px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-md border border-white/10">
                {dish.category}
              </span>
              <span className="text-slate-300 text-[11px]">Click gallery below to view details</span>
            </div>
          </div>

          {/* Gallery Thumbnails */}
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-2.5">
            {dish.gallery.map((img, idx) => (
              <button
                key={idx}
                onClick={() => setActiveImage(img)}
                className={`relative h-20 rounded-2xl overflow-hidden border-2 transition-all duration-200 ${
                  activeImage === img
                    ? 'border-[#8C0D0D] ring-4 ring-[#8C0D0D]/20 scale-105 shadow-md'
                    : 'border-slate-200 dark:border-slate-800 hover:opacity-90'
                }`}
              >
                <img src={img} alt="Gallery" className="w-full h-full object-cover" />
                {activeImage === img && (
                  <div className="absolute inset-0 bg-[#8C0D0D]/20 backdrop-blur-[1px] flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-white drop-shadow-md" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Right Column: Key Recipe Metrics & Info */}
        <div className="lg:col-span-7 space-y-6">

          {/* Title & Price Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-[#8C0D0D]/10 text-[#8C0D0D] dark:text-rose-400 font-extrabold text-[11px] uppercase tracking-wider">
                  {dish.category}
                </span>
                <span className={`text-xs font-semibold ${textMuted}`}>{dish.station}</span>
              </div>
              <h2 className={`text-2xl sm:text-3xl font-black mt-2 tracking-tight ${textPrimary}`}>{dish.name}</h2>
            </div>

            <div className="text-left sm:text-right shrink-0">
              <span className={`text-xs font-bold block ${textMuted}`}>Menu Retail Price</span>
              <span className="text-3xl font-black text-[#8C0D0D] dark:text-rose-400 block">${dish.price.toFixed(2)}</span>
            </div>
          </div>

          {/* 3 Metric Cards: Cost, Profit Margin, Station */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className={`p-4 rounded-2xl border ${cardInnerBg}`}>
              <span className={`text-[10px] font-extrabold uppercase tracking-wider block ${textMuted}`}>Unit Ingredient Cost</span>
              <div className="flex items-center gap-2 mt-1">
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-xs">
                  $
                </div>
                <span className={`text-lg font-black ${textPrimary}`}>${dish.cost.toFixed(2)}</span>
              </div>
            </div>

            <div className={`p-4 rounded-2xl border ${cardInnerBg}`}>
              <span className={`text-[10px] font-extrabold uppercase tracking-wider block ${textMuted}`}>Gross Profit Margin</span>
              <div className="flex items-center gap-2 mt-1">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xs">
                  %
                </div>
                <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">{dish.margin}</span>
              </div>
            </div>

            <div className={`p-4 rounded-2xl border ${cardInnerBg}`}>
              <span className={`text-[10px] font-extrabold uppercase tracking-wider block ${textMuted}`}>All-Time Portion Sales</span>
              <div className="flex items-center gap-2 mt-1">
                <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-[#8C0D0D] dark:text-rose-400 flex items-center justify-center font-bold text-xs">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <span className={`text-lg font-black ${textPrimary}`}>{dish.salesTotal}</span>
              </div>
            </div>
          </div>

          {/* Quick Metrics Bar: Prep Time, Calories, Avg Rating */}
          <div className={`p-4 rounded-2xl border grid grid-cols-3 gap-3 text-center ${cardInnerBg}`}>
            <div className="border-r border-slate-200 dark:border-slate-800">
              <span className={`text-[10px] font-extrabold uppercase tracking-wider block ${textMuted}`}>Target Prep Time</span>
              <span className={`text-sm font-black flex items-center justify-center gap-1.5 mt-1 ${textPrimary}`}>
                <Clock className="w-4 h-4 text-sky-500" />
                {dish.prepTime}
              </span>
            </div>

            <div className="border-r border-slate-200 dark:border-slate-800">
              <span className={`text-[10px] font-extrabold uppercase tracking-wider block ${textMuted}`}>Caloric Value</span>
              <span className={`text-sm font-black flex items-center justify-center gap-1.5 mt-1 ${textPrimary}`}>
                <Flame className="w-4 h-4 text-amber-500" />
                {dish.calories}
              </span>
            </div>

            <div>
              <span className={`text-[10px] font-extrabold uppercase tracking-wider block ${textMuted}`}>Rating Score</span>
              <span className={`text-sm font-black flex items-center justify-center gap-1.5 mt-1 ${textPrimary}`}>
                <Star className="w-4 h-4 text-amber-400 fill-current" />
                {dish.rating} / 5
              </span>
            </div>
          </div>

          {/* Description */}
          <div>
            <h4 className={`text-xs font-black uppercase tracking-wider mb-2 ${textPrimary}`}>Culinary Description</h4>
            <p className={`text-xs leading-relaxed font-medium ${textMuted}`}>{dish.description}</p>
          </div>

          {/* Key Ingredients List */}
          <div>
            <h4 className={`text-xs font-black uppercase tracking-wider mb-2.5 ${textPrimary}`}>Master Ingredient Ratios</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {dish.ingredients.map((ing, i) => (
                <div key={i} className={`p-2.5 rounded-xl border flex items-center gap-2.5 text-xs font-bold ${cardInnerBg}`}>
                  <CheckCircle2 className="w-4 h-4 text-[#8C0D0D] dark:text-rose-400 shrink-0" />
                  <span className={textPrimary}>{ing}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════ ROW 2: NUTRITION & ALLERGENS + WEEKLY VELOCITY CHART ═══════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">

        {/* Nutrition & Allergens */}
        <div className={`lg:col-span-5 p-6 rounded-3xl border flex flex-col justify-between space-y-5 ${cardBg}`}>
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className={`text-base font-black tracking-tight ${textPrimary}`}>Nutrition & Allergen Profile</h3>
              <span className={`text-xs font-extrabold ${textMuted}`}>Per Standard Portion</span>
            </div>

            {/* Nutrition Cards */}
            <div className="grid grid-cols-2 gap-3">
              {nutritionRows.map(({ label, value, icon: Icon, color, bg }) => (
                <div key={label} className={`p-3.5 rounded-2xl border flex items-center gap-3 ${cardInnerBg}`}>
                  <div className={`w-10 h-10 rounded-xl ${bg} ${color} flex items-center justify-center shrink-0`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <span className={`text-[10px] font-extrabold uppercase tracking-wider block ${textMuted}`}>{label}</span>
                    <span className={`text-base font-black block leading-tight ${textPrimary}`}>{value}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Allergen Pills */}
            <div className="pt-2">
              <span className={`text-xs font-black uppercase tracking-wider block mb-2 ${textPrimary}`}>Allergen Safety Warnings</span>
              <div className="flex flex-wrap gap-2">
                {dish.allergens.map((alg) => (
                  <span
                    key={alg}
                    className="px-3 py-1.5 rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20 text-xs font-extrabold flex items-center gap-1.5"
                  >
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                    {alg}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Health Spec Disclaimer */}
          <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-2.5">
            <ShieldAlert className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>Formulated according to FDA food safety & kitchen allergen separation compliance standards.</span>
          </div>
        </div>

        {/* Weekly Velocity Chart */}
        <div className={`lg:col-span-7 p-6 rounded-3xl border flex flex-col justify-between ${cardBg}`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-xl bg-rose-500/10 dark:bg-rose-500/20 text-[#8C0D0D] dark:text-rose-400">
                  <BarChart2 className="w-4 h-4" />
                </div>
                <h3 className={`text-base font-black tracking-tight ${textPrimary}`}>Weekly Order Velocity</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  ↑ 18.2% vs last week
                </span>
              </div>
              <p className={`text-xs mt-1 font-medium ${textMuted}`}>
                Day-by-day portion sales breakdown highlighting peak kitchen demand
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs font-semibold px-1 mb-2">
            <span className={textMuted}>Average: <strong className={textPrimary}>{avgSales} orders / day</strong></span>
            <span className="text-[#8C0D0D] dark:text-rose-400 font-extrabold">
              Peak Day: {bestDay.day} ({bestDay.sales} portions)
            </span>
          </div>

          <div className="h-56 w-full mt-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dish.weeklySales} margin={{ top: 15, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="dishBarGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8C0D0D" />
                    <stop offset="100%" stopColor="#b91c1c" />
                  </linearGradient>
                  <linearGradient id="dishBarGradPeak" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f59e0b" />
                    <stop offset="100%" stopColor="#d97706" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#1e293b' : '#f1f5f9'} />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: isDark ? '#94a3b8' : '#64748b', fontSize: 11, fontWeight: 700 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: isDark ? '#94a3b8' : '#64748b', fontSize: 11, fontWeight: 600 }} />
                <Tooltip cursor={false} content={<CustomChartTooltip />} />
                <Bar dataKey="sales" name="Portions" radius={[10, 10, 0, 0]}>
                  {dish.weeklySales.map((entry, idx) => (
                    <Cell key={idx} fill={entry.day === bestDay.day ? 'url(#dishBarGradPeak)' : 'url(#dishBarGrad)'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ═══════════ ROW 3: KITCHEN PREP STEPS & SALES CHANNELS ═══════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">

        {/* Kitchen Line Prep Steps */}
        <div className={`lg:col-span-7 p-6 rounded-3xl border space-y-4 ${cardBg}`}>
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <UtensilsCrossed className="w-4 h-4" />
              </div>
              <h3 className={`text-base font-black tracking-tight ${textPrimary}`}>Kitchen Assembly Protocol</h3>
            </div>
            <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-rose-500/10 text-[#8C0D0D] dark:text-rose-400 border border-rose-500/20 uppercase tracking-wider">
              Standard Operating Procedure
            </span>
          </div>

          <div className="space-y-3">
            {dish.prepSteps.map((step, idx) => (
              <div key={idx} className={`p-3.5 rounded-2xl border flex items-start gap-3.5 ${cardInnerBg}`}>
                <span className="w-7 h-7 rounded-xl bg-[#8C0D0D] text-white flex items-center justify-center font-black text-xs shrink-0 shadow-sm">
                  {idx + 1}
                </span>
                <p className={`text-xs font-semibold leading-relaxed pt-1 ${textPrimary}`}>{step}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Order Channel Breakdown & Feedback */}
        <div className={`lg:col-span-5 p-6 rounded-3xl border flex flex-col justify-between space-y-6 ${cardBg}`}>
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                  <PieChart className="w-4 h-4" />
                </div>
                <h3 className={`text-base font-black tracking-tight ${textPrimary}`}>Sales Channel Share</h3>
              </div>
              <span className={`text-xs font-extrabold ${textMuted}`}>Last 30 Days</span>
            </div>

            {/* Channels Progress Bars */}
            <div className="space-y-3.5">
              {dish.channels.map((ch) => (
                <div key={ch.name} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className={textMuted}>{ch.name}</span>
                    <span className={textPrimary}>{ch.percent}%</span>
                  </div>
                  <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5">
                    <div className={`${ch.color} h-full rounded-full transition-all duration-1000 shadow-sm`} style={{ width: `${ch.percent}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Customer Reviews Spotlight */}
          <div className="space-y-3 pt-2">
            <h4 className={`text-xs font-black uppercase tracking-wider ${textPrimary}`}>Customer Feedback Spotlight</h4>
            {dish.reviews.map((rev, i) => (
              <div key={i} className={`p-3.5 rounded-2xl border space-y-2 ${cardInnerBg}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <img src={rev.avatar} alt={rev.name} className="w-7 h-7 rounded-full object-cover border border-slate-300 dark:border-slate-700" />
                    <span className={`text-xs font-extrabold ${textPrimary}`}>{rev.name}</span>
                  </div>
                  <div className="flex items-center gap-1 text-amber-400 text-xs font-extrabold">
                    <Star className="w-3.5 h-3.5 fill-current" />
                    <span>{rev.rating}</span>
                  </div>
                </div>
                <p className={`text-xs italic ${textMuted}`}>"{rev.comment}"</p>
                <span className="text-[10px] text-slate-400 block font-semibold">{rev.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ═══════════ EDIT RECIPE SPECS MODAL ═══════════ */}
      {isEditModalOpen && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className={`rounded-3xl shadow-2xl border max-w-lg w-full overflow-hidden animate-modal-pop ${isDark ? 'bg-[#151c28] border-slate-800' : 'bg-white border-slate-100'}`}>

            {/* Modal Header */}
            <div className="bg-[#8C0D0D] text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-white/20">
                  <Edit className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-base font-black">Edit Recipe Specifications</h3>
                  <p className="text-xs text-rose-200">{dish.name}</p>
                </div>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveRecipe} className="p-6 space-y-4 text-xs font-semibold">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 uppercase tracking-wider mb-1 text-[10px] font-extrabold">Retail Price ($)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={editPrice}
                    onChange={(e) => setEditPrice(e.target.value)}
                    required
                    className={`w-full px-3 py-2.5 rounded-xl border text-xs font-bold ${cardInnerBg} ${textPrimary}`}
                  />
                </div>

                <div>
                  <label className="block text-slate-400 uppercase tracking-wider mb-1 text-[10px] font-extrabold">Target Prep Time</label>
                  <input
                    type="text"
                    value={editPrepTime}
                    onChange={(e) => setEditPrepTime(e.target.value)}
                    required
                    className={`w-full px-3 py-2.5 rounded-xl border text-xs font-bold ${cardInnerBg} ${textPrimary}`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 uppercase tracking-wider mb-1 text-[10px] font-extrabold">Stock Availability Status</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className={`w-full px-3 py-2.5 rounded-xl border text-xs font-bold ${cardInnerBg} ${textPrimary}`}
                >
                  <option value="In Stock">In Stock</option>
                  <option value="Low Stock">Low Stock</option>
                  <option value="Out of Stock">Out of Stock</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 uppercase tracking-wider mb-1 text-[10px] font-extrabold">Culinary Description</label>
                <textarea
                  rows={3}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  required
                  className={`w-full px-3 py-2.5 rounded-xl border text-xs font-medium ${cardInnerBg} ${textPrimary}`}
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border text-slate-500 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#8C0D0D] text-white font-extrabold flex items-center gap-1.5 shadow-md hover:bg-[#720a0a]"
                >
                  <Check className="w-4 h-4" /> Save Specs
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};