// Centralized Mock Data for Cloud Kitchen Admin Dashboard

export const dashboardStats = {
  totalOrders: { value: 75, change: '+4%', isPositive: true, period: '(30 days)' },
  totalDelivered: { value: 357, change: '+4%', isPositive: true, period: '(30 days)' },
  totalCanceled: { value: 65, change: '-25%', isPositive: false, period: '(30 days)' },
  totalRevenue: { value: '$128', change: '-12%', isPositive: false, period: '(30 days)' },
};

export const pieChartData = {
  totalOrder: { percent: 81, label: 'Total Order' },
  customerGrowth: { percent: 22, label: 'Customer Growth' },
  totalRevenue: { percent: 62, label: 'Total Revenue' },
};

export const weeklyOrderTrend = [
  { day: 'Sunday', orders: 120 },
  { day: 'Monday', orders: 280 },
  { day: 'Tuesday', orders: 200 },
  { day: 'Wednesday', orders: 456, highlight: true }, // Peak Oct 18th
  { day: 'Thursday', orders: 210 },
  { day: 'Friday', orders: 390 },
  { day: 'Saturday', orders: 340 },
];

export const revenueComparisonData = [
  { month: 'Jan', year2024: 12000, year2025: 28000 },
  { month: 'Feb', year2024: 18000, year2025: 22000 },
  { month: 'Mar', year2024: 21000, year2025: 35000 },
  { month: 'Apr', year2024: 26000, year2025: 31000 },
  { month: 'May', year2024: 34000, year2025: 25000 },
  { month: 'Jun', year2024: 38753, year2025: 22000 }, // Highlight $38,753
  { month: 'Jul', year2024: 29000, year2025: 18000 },
  { month: 'Aug', year2024: 22000, year2025: 24000 },
  { month: 'Sept', year2024: 27000, year2025: 29000 },
  { month: 'Oct', year2024: 24000, year2025: 12657 }, // Highlight $12,657
  { month: 'Nov', year2024: 32000, year2025: 28000 },
  { month: 'Des', year2024: 31000, year2025: 30000 },
];

export const customerMapData = [
  { day: 'Sun', value1: 60, value2: 75 },
  { day: 'Mon', value1: 40, value2: 80 },
  { day: 'Tue', value1: 30, value2: 50 },
  { day: 'Wed', value1: 60, value2: 70 },
  { day: 'Thu', value1: 45, value2: 25 },
  { day: 'Fri', value1: 60, value2: 70 },
];

export const customerReviews = [
  {
    id: 1,
    name: 'Jons Sena',
    time: '2 days ago',
    rating: 4.5,
    comment: 'Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry standard dummy text',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    dishImage: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400&auto=format&fit=crop&q=80',
    dishName: 'Spicy Tonkotsu Ramen',
  },
  {
    id: 2,
    name: 'Sofia',
    time: '2 days ago',
    rating: 4.0,
    comment: 'Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry standard dummy text',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    dishImage: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&auto=format&fit=crop&q=80',
    dishName: 'Truffle Mushroom Pasta',
  },
  {
    id: 3,
    name: 'Anandreansyah',
    time: '2 days ago',
    rating: 4.5,
    comment: 'Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry standard dummy text',
    avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80',
    dishImage: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&auto=format&fit=crop&q=80',
    dishName: 'Wood-fired BBQ Pizza',
  },
  {
    id: 4,
    name: 'Emily Watson',
    time: '3 days ago',
    rating: 5.0,
    comment: 'Exceptional food quality! Fast delivery and hot packaging. Will definitely order from Cloud Kitchens again!',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
    dishImage: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=400&auto=format&fit=crop&q=80',
    dishName: 'Crispy Wagyu Burger',
  },
];

export const mockOrders = [
  { id: '#CK-9082', customer: 'Jons Sena', items: '2x Spicy Tonkotsu Ramen, 1x Green Tea', total: '$34.50', status: 'Completed', date: '2024-05-21 14:22', payment: 'Credit Card', address: '742 Evergreen Terrace, Suite 4B' },
  { id: '#CK-9081', customer: 'Sofia Patel', items: '1x Truffle Mushroom Pasta, 1x Garlic Bread', total: '$28.00', status: 'Preparing', date: '2024-05-21 14:15', payment: 'Apple Pay', address: '104 Beacon St, Boston MA' },
  { id: '#CK-9080', customer: 'Marcus Vance', items: '3x Crispy Wagyu Burger, 3x Fries', total: '$52.80', status: 'Completed', date: '2024-05-21 14:02', payment: 'PayPal', address: '88 Market St, Floor 12' },
  { id: '#CK-9079', customer: 'Elena Rostova', items: '1x Wood-fired BBQ Pizza, 2x Cola', total: '$22.40', status: 'Placed', date: '2024-05-21 13:50', payment: 'Cash on Delivery', address: '450 Sunset Blvd, Apt 9' },
  { id: '#CK-9078', customer: 'Anandreansyah', items: '2x Salmon Poke Bowl, 1x Coconut Water', total: '$41.00', status: 'Cancelled', date: '2024-05-21 13:10', payment: 'Credit Card', address: '12 Wall Street, NY' },
  { id: '#CK-9077', customer: 'Liam O’Connor', items: '1x Chicken Teriyaki Bento', total: '$16.90', status: 'Completed', date: '2024-05-21 12:45', payment: 'Debit Card', address: '303 Lincoln Park, Chicago' },
  { id: '#CK-9076', customer: 'Clara Oswald', items: '4x Matcha Boba Tea, 2x Cheesecake', total: '$38.20', status: 'Completed', date: '2024-05-21 12:30', payment: 'Apple Pay', address: '77 Baker Street, London' },
];

export const mockFoods = [
  { id: 1, name: 'Spicy Tonkotsu Ramen', category: 'Asian', price: 16.50, rating: 4.8, sales: 420, status: 'In Stock', image: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400&auto=format&fit=crop&q=80', description: 'Rich pork bone broth, tender chashu pork belly, bamboo shoots, and soft-boiled egg.' },
  { id: 2, name: 'Crispy Wagyu Burger', category: 'Burgers', price: 18.00, rating: 4.9, sales: 512, status: 'In Stock', image: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=400&auto=format&fit=crop&q=80', description: 'Double wagyu beef patties, aged cheddar, caramelized onions, secret sauce on brioche.' },
  { id: 3, name: 'Truffle Mushroom Pasta', category: 'Italian', price: 22.00, rating: 4.7, sales: 290, status: 'In Stock', image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&auto=format&fit=crop&q=80', description: 'Handcrafted fettuccine tossed in black truffle cream and wild forest mushrooms.' },
  { id: 4, name: 'Wood-fired BBQ Pizza', category: 'Pizza', price: 19.50, rating: 4.6, sales: 380, status: 'In Stock', image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&auto=format&fit=crop&q=80', description: 'Smoky BBQ sauce, shredded chicken, red onions, cilantro, and mozzarella.' },
  { id: 5, name: 'Salmon Poke Bowl', category: 'Asian', price: 17.50, rating: 4.9, sales: 310, status: 'In Stock', image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&auto=format&fit=crop&q=80', description: 'Fresh Atlantic salmon cubes, avocado, edamame, seaweed salad, sushi rice.' },
  { id: 6, name: 'Matcha Boba Smoothie', category: 'Drinks', price: 7.50, rating: 4.8, sales: 680, status: 'Low Stock', image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&auto=format&fit=crop&q=80', description: 'Uji matcha blended with creamy oat milk and chewy brown sugar tapioca pearls.' },
  { id: 7, name: 'New York Cheesecake', category: 'Desserts', price: 8.50, rating: 4.9, sales: 240, status: 'In Stock', image: 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=400&auto=format&fit=crop&q=80', description: 'Classic dense and creamy cheesecake with wild berry compote.' },
  { id: 8, name: 'Honey Glazed Wings', category: 'Starters', price: 12.00, rating: 4.5, sales: 490, status: 'In Stock', image: 'https://images.unsplash.com/photo-1527477396000-e27163b481c2?w=400&auto=format&fit=crop&q=80', description: 'Crispy fried chicken wings tossed in garlic honey soy glaze.' },
];

export const mockCustomers = [
  { id: 1, name: 'Jons Sena', email: 'jons.sena@example.com', ordersCount: 28, totalSpent: '$540.20', vipStatus: 'Gold VIP', avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80', lastOrder: '2 hours ago', status: 'Active' },
  { id: 2, name: 'Sofia Patel', email: 'sofia.p@example.com', ordersCount: 19, totalSpent: '$390.00', vipStatus: 'Silver VIP', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80', lastOrder: 'Today', status: 'Active' },
  { id: 3, name: 'Anandreansyah', email: 'anandre@example.com', ordersCount: 42, totalSpent: '$1,120.50', vipStatus: 'Platinum VIP', avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80', lastOrder: '1 day ago', status: 'Active' },
  { id: 4, name: 'Marcus Vance', email: 'marcus.v@example.com', ordersCount: 12, totalSpent: '$210.40', vipStatus: 'Regular', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80', lastOrder: '3 days ago', status: 'Active' },
  { id: 5, name: 'Elena Rostova', email: 'elena.r@example.com', ordersCount: 31, totalSpent: '$780.00', vipStatus: 'Gold VIP', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80', lastOrder: '5 hours ago', status: 'Active' },
];

export const mockChats = [
  { id: 1, sender: 'Jons Sena', role: 'Customer', avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80', unread: 2, lastMsg: 'Is extra chili oil available for the Ramen?', time: '14:23' },
  { id: 2, sender: 'Driver Marco (Rider #4)', role: 'Delivery Driver', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80', unread: 0, lastMsg: 'Picked up order #CK-9080. En route to customer.', time: '14:10' },
  { id: 3, sender: 'Sofia Patel', role: 'Customer', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80', unread: 0, lastMsg: 'Thank you so much! Food was delicious!', time: 'Yesterday' },
];

export const mockWalletTransactions = [
  { id: 'TXN-9941', type: 'Payout to Bank', amount: '-$1,250.00', status: 'Completed', date: '2024-05-20', method: 'Chase Bank (****4829)' },
  { id: 'TXN-9940', type: 'Order Earnings', amount: '+$345.80', status: 'Completed', date: '2024-05-21', method: 'Customer Orders' },
  { id: 'TXN-9939', type: 'Order Earnings', amount: '+$892.40', status: 'Completed', date: '2024-05-20', method: 'Customer Orders' },
  { id: 'TXN-9938', type: 'Payout to Bank', amount: '-$3,400.00', status: 'Completed', date: '2024-05-15', method: 'Chase Bank (****4829)' },
  { id: 'TXN-9937', type: 'Platform Fee Refund', amount: '+$45.00', status: 'Completed', date: '2024-05-14', method: 'System Credit' },
];

export const mockKitchens = [
  {
    id: 1,
    code: '#KITCHEN-101',
    name: 'Downtown Main Cloud Hub',
    founderName: 'Chef Robert Sterling',
    email: 'robert.sterling@cloudkitchens.io',
    phone: '+1 (555) 234-8901',
    createdAt: '2024-01-15',
    status: 'Active',
    documents: [
      { id: 101, name: 'Food Safety & Hygiene License', type: 'PDF', issueDate: '2024-01-10', expiryDate: '2026-01-10', status: 'Verified' },
      { id: 102, name: 'Commercial Kitchen Trade Permit', type: 'PDF', issueDate: '2024-01-12', expiryDate: '2027-01-12', status: 'Verified' },
      { id: 103, name: 'State Fire Safety Certificate', type: 'PDF', issueDate: '2024-01-14', expiryDate: '2025-01-14', status: 'Verified' },
    ],
    branches: [
      { id: 1, code: '#BR-01', name: 'Downtown Central Kitchen', address: '101 Main Street, Suite A, Boston MA', manager: 'Chef Marcus Vance', phone: '+1 (555) 234-8902', status: 'Active' },
      { id: 2, code: '#BR-02', name: 'Financial District Express', address: '45 Milk Street, Floor 2, Boston MA', manager: 'Sarah Jenkins', phone: '+1 (555) 234-8903', status: 'Active' },
    ]
  },
  {
    id: 2,
    code: '#KITCHEN-102',
    name: 'Westside Artisan Hub',
    founderName: 'Elena Rostova',
    email: 'elena.rostova@westsidekitchen.com',
    phone: '+1 (555) 876-5432',
    createdAt: '2024-03-20',
    status: 'Active',
    documents: [
      { id: 201, name: 'Organic Food Handler Cert', type: 'PDF', issueDate: '2024-03-01', expiryDate: '2026-03-01', status: 'Verified' },
      { id: 202, name: 'City Operating License', type: 'PDF', issueDate: '2024-03-15', expiryDate: '2026-03-15', status: 'Verified' },
    ],
    branches: [
      { id: 3, code: '#BR-03', name: 'Westside Delivery Station', address: '88 Cambridge St, Cambridge MA', manager: 'David Kim', phone: '+1 (555) 876-5433', status: 'Active' },
    ]
  },
  {
    id: 3,
    code: '#KITCHEN-103',
    name: 'Airport Express Cloud Facility',
    founderName: 'Alexander Wright',
    email: 'alex.wright@airportsnacks.com',
    phone: '+1 (555) 998-1122',
    createdAt: '2024-04-10',
    status: 'Inactive',
    documents: [
      { id: 301, name: 'Aviation Zone Food Permit', type: 'PDF', issueDate: '2024-04-01', expiryDate: '2025-04-01', status: 'Under Review' },
    ],
    branches: [
      { id: 4, code: '#BR-04', name: 'Terminal B Express Kitchen', address: 'Logan International Airport, Terminal B', manager: 'Rachel Green', phone: '+1 (555) 998-1123', status: 'Inactive' },
    ]
  }
];

export const mockCuisines = [
  { id: 1, name: 'Japanese Ramen & Sushi', slug: 'japanese-ramen', activeDishesCount: 14, status: 'Active', image: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400&auto=format&fit=crop&q=80', description: 'Traditional Japanese tonkotsu broth, hand-pulled noodles, sashimi and maki rolls.' },
  { id: 2, name: 'Italian Pasta & Wood-fired', slug: 'italian-pasta', activeDishesCount: 18, status: 'Active', image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&auto=format&fit=crop&q=80', description: 'Artisanal pasta, truffle cream sauce, wood-fired pizzas with buffalo mozzarella.' },
  { id: 3, name: 'American Smash Burgers', slug: 'american-burgers', activeDishesCount: 12, status: 'Active', image: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=400&auto=format&fit=crop&q=80', description: 'Double wagyu beef smash patties, aged cheddar, milk brioche buns and hand-cut fries.' },
  { id: 4, name: 'Mexican Street Tacos & Bowls', slug: 'mexican-tacos', activeDishesCount: 9, status: 'Active', image: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=400&auto=format&fit=crop&q=80', description: 'Birria tacos, grilled carne asada bowls, fresh guacamole and house salsas.' },
  { id: 5, name: 'Indo-Chinese & Fusion Curry', slug: 'indo-chinese', activeDishesCount: 8, status: 'Inactive', image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400&auto=format&fit=crop&q=80', description: 'Spicy chili chicken, hakka noodles, butter chicken and garlic naan.' },
];

export const mockIngredients = [
  { id: 1, sku: 'ING-101', name: 'Wagyu Beef Patty (Ground)', category: 'Meat & Poultry', qty: 45, unit: 'kg', minThreshold: 15, supplier: 'Prime Meat Co.', status: 'In Stock', pricePerUnit: '$18.50' },
  { id: 2, sku: 'ING-102', name: 'Uji Organic Matcha Powder', category: 'Spices & Flavors', qty: 1.2, unit: 'kg', minThreshold: 2.0, supplier: 'Kyoto Tea Imports', status: 'Low Stock', pricePerUnit: '$65.00' },
  { id: 3, sku: 'ING-103', name: 'Black Truffle Oil (Extra Virgin)', category: 'Oils & Condiments', qty: 3, unit: 'bottles', minThreshold: 5, supplier: 'Tuscany Fine Foods', status: 'Low Stock', pricePerUnit: '$42.00' },
  { id: 4, sku: 'ING-104', name: 'Fresh Buffalo Mozzarella', category: 'Dairy & Cheese', qty: 32, unit: 'kg', minThreshold: 10, supplier: 'Organic Dairy Farms', status: 'In Stock', pricePerUnit: '$12.00' },
  { id: 5, sku: 'ING-105', name: 'Ramen Noodles (Fresh Wheat)', category: 'Grains & Noodles', qty: 85, unit: 'packs', minThreshold: 20, supplier: 'Tokyo Noodle Works', status: 'In Stock', pricePerUnit: '$3.50' },
  { id: 6, sku: 'ING-106', name: 'Organic Hass Avocados', category: 'Produce', qty: 0, unit: 'kg', minThreshold: 10, supplier: 'Green Valley Produce', status: 'Out of Stock', pricePerUnit: '$4.20' },
];
