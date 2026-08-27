import {
  BarChart3,
  Boxes,
  Building2,
  ClipboardList,
  Globe2,
  Grid2X2,
  LayoutDashboard,
  Package,
  ReceiptText,
  ShoppingBag,
  Sparkles,
  Star,
  Table2,
  TrendingUp,
  UserCheck,
  Users,
  UtensilsCrossed,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import Bell from "/assets/bell.svg";
import MessageSquareText from "/assets/comment.svg";
import Gift from "/assets/gift.svg";
import foodCollage from "../assets/food-collage.png";

export const red = "#a80509";
export const blue = "#63a9e8";

// Grouped Series-wise Sidebar Navigation
export const sidebarSections = [
  {
    title: "Operations",
    items: [
      { label: "Dashboard",        icon: LayoutDashboard, path: "/kitchen/dashboard",   module: "dashboard" },
      { label: "Orders",           icon: ShoppingBag,     path: "/kitchen/orders",      module: "order" },
      { label: "Food Menu",        icon: UtensilsCrossed, path: "/kitchen/menu",        module: "menu" },
      { label: "Ingredients",      icon: Boxes,           path: "/kitchen/ingredients", module: "ingredient" },
      { label: "Waste Management", icon: Trash2,          path: "/kitchen/waste",       module: "wasteManagement" },
    ],
  },
  {
    title: "Management",
    items: [
      { label: "Profile",         icon: UserCheck,       path: "/kitchen/profile",     module: "profile" },
      { label: "Staff",           icon: Users,           path: "/kitchen/staff",       module: "staffManagement" },
      { label: "Role Management", icon: ShieldCheck,     path: "/kitchen/roles",       module: "roleManagement" },
      { label: "Customers",       icon: UserCheck,       path: "/kitchen/customers",   module: "customer" },
      { label: "Branch Management",   icon: Building2,   path: "/kitchen/branches",    module: "branch" },
    ],
  },
  {
    title: "Feedback",
    items: [
      { label: "Reviews",         icon: Star,            path: "/kitchen/reviews",     module: "reviews" },
    ],
  },
];

// Flat list for direct iteration / backwards compatibility
export const sidebarItems = [
  { label: "Dashboard",        icon: LayoutDashboard, path: "/",             module: "dashboard" },
  { label: "Orders",           icon: ShoppingBag,     path: "/orders",       module: "order" },
  { label: "Food Menu",        icon: UtensilsCrossed, path: "/menu",         module: "menu" },
  { label: "Ingredients",      icon: Boxes,           path: "/ingredients",  module: "ingredient" },
  { label: "Waste Management", icon: Trash2,          path: "/waste",        module: "wasteManagement" },
  { label: "Profile",          icon: UserCheck,       path: "/profile",      module: "profile" },
  { label: "Staff",           icon: Users,           path: "/staff",        module: "staffManagement" },
  { label: "Role Management", icon: ShieldCheck,     path: "/roles",        module: "roleManagement" },
  { label: "Customers",       icon: UserCheck,       path: "/customers",    module: "customer" },
  { label: "Branch Management",   icon: Building2,       path: "/kitchen",      module: "branch" },
  { label: "Reviews",         icon: Star,            path: "/reviews",      module: "reviews" },
];

export const topAlerts = [
  { icon: Bell, count: 12 },
  { icon: MessageSquareText, count: 5 },
  { icon: Gift, count: 2, purple: true },
];

export const customerFeedback = [
  { name: "John Doe", rating: 5, date: "2 days ago", comment: "The Pizza was absolutely amazing and hot on delivery!" },
  { name: "Sarah Smith", rating: 4, date: "3 days ago", comment: "Great packaging and taste. Loved the fresh basil seasoning." },
  { name: "Alex Johnson", rating: 5, date: "5 days ago", comment: "Fast service and delicious food. Will definitely order again." },
];

export const foodImages = [
  "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=700&q=80",
  "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=700&q=80",
  "https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=700&q=80",
  "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=700&q=80",
  "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=700&q=80",
];

export const popularDishes = [
  ["Mozzarella Pizza", "$12.50", foodImages[1], false],
  ["Chicken Curry Special", "$14.99", foodImages[3], true],
  ["Spaghetti Italiano", "$11.20", foodImages[2], false],
];

export const recentCategoryOrders = [
  ["Mozzarella Pizza", "$12.50", "Main Course", foodImages[1]],
  ["Chicken Curry", "$14.99", "Specials", foodImages[3]],
  ["Spaghetti", "$11.20", "Pasta", foodImages[2]],
];

export const orderMenu = [
  ["Mozzarella Pizza", "x2", "$25.00", foodImages[1]],
  ["Chicken Curry Bowl", "x1", "$14.99", foodImages[3]],
  ["Watermelon Juice", "x2", "$9.60", foodImages[0]],
];

export const orderDetailItems = [
  ["Mozzarella Pizza with Basil", 2, "$12.50", "$25.00", foodImages[1]],
  ["Chicken Curry Special", 1, "$14.99", "$14.99", foodImages[3]],
  ["Fresh Watermelon Mint Juice", 2, "$4.80", "$9.60", foodImages[0]],
];

export const orderListRows = [
  ["#245883", "2026-08-18", "10:18 AM", "Rahul Sharma", "123 MG Road, Sector 15", "₹598.00", "New Order"],
  ["#245882", "2026-08-18", "09:45 AM", "Priya Patel", "45 Park Avenue, Block C", "₹1,240.00", "On Delivery"],
  ["#245881", "2026-08-17", "08:12 PM", "Amit Verma", "88 Cyber City, Phase 2", "₹890.00", "Delivery"],
];

// Dashboard Recent Order Requests
export const orderRows = [
  ["Mozzarella Pizza with Basil", "Rahul Sharma", "123 MG Road, Sector 15", "$25.00", "x2 items", "DELIVERED", "#ORD-245883", foodImages[1]],
  ["Chicken Curry Special & Rice", "Priya Patel", "45 Park Avenue, Block C", "$14.99", "x1 items", "PREPARING", "#ORD-245882", foodImages[3]],
  ["Spaghetti Aglio e Olio", "Amit Verma", "88 Cyber City, Phase 2", "$22.40", "x2 items", "DELIVERED", "#ORD-245881", foodImages[2]],
  ["Atlantic Tuna Spinach Soup", "Sneha Roy", "12 Lotus Boulevard, Flat 402", "$9.80", "x1 items", "PENDING", "#ORD-245880", foodImages[0]],
  ["Fresh Watermelon Mint Juice", "Vikram Malhotra", "67 Regency Park, Tower A", "$9.60", "x2 items", "DELIVERED", "#ORD-245879", foodImages[4]],
  ["Crispy Paneer Tikka Platter", "Ananya Deshmukh", "104 Greenfield Avenue", "$18.50", "x1 items", "DELIVERED", "#ORD-245878", foodImages[1]],
];

// Trending Dishes with 4 items: [name, price, ordersCount, image]
export const trendingMenus = [
  ["Mozzarella Pizza with Basil", "$12.50", "454 orders", foodImages[1]],
  ["Chicken Curry Special & Rice", "$14.99", "312 orders", foodImages[3]],
  ["Spaghetti Aglio e Olio", "$11.20", "280 orders", foodImages[2]],
  ["Atlantic Tuna Spinach Soup", "$9.80", "195 orders", foodImages[0]],
];

// Analytics Most Favorited Items
export const favoriteItems = [
  ["Mozzarella Pizza with Fresh Basil", "98%", "$12,450", "85%", foodImages[1]],
  ["Chicken Curry Special & Fragrant Rice", "94%", "$18,920", "92%", foodImages[3]],
  ["Spaghetti Aglio e Olio Pasta", "88%", "$9,340", "74%", foodImages[2]],
  ["Fresh Watermelon Mint Summer Drink", "91%", "$6,780", "80%", foodImages[0]],
  ["Chocolate Lava Cake Dessert", "96%", "$14,120", "89%", foodImages[4]],
];

// Analytics Loyal Customers
export const loyalCustomers = [
  ["Rahul Sharma", "48 Orders Completed", "bg-rose-100"],
  ["Priya Patel", "36 Orders Completed", "bg-amber-100"],
  ["Amit Verma", "29 Orders Completed", "bg-emerald-100"],
  ["Sneha Roy", "24 Orders Completed", "bg-sky-100"],
  ["Vikram Malhotra", "19 Orders Completed", "bg-purple-100"],
];

// Customer Reviews List
export const reviewCards = [
  ["Rahul Sharma", "4.9", foodImages[1], "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80"],
  ["Priya Patel", "5.0", foodImages[3], "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80"],
  ["Amit Verma", "4.8", foodImages[2], "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=150&q=80"],
  ["Sneha Roy", "4.7", foodImages[0], "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=150&q=80"],
];
