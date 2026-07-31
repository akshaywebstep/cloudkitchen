import {
  BarChart3,
  ClipboardList,
  Globe2,
  Grid2X2,
  Package,
  Puzzle,
  ReceiptText,
  Star,
  Table2,
  TrendingUp,
} from "lucide-react";
import Bell from "/assets/bell.svg";
import MessageSquareText from "/assets/comment.svg";
import Gift from "/assets/gift.svg";
import foodCollage from "../assets/food-collage.png";

export const red = "#a80509";
export const blue = "#63a9e8";

export const sidebarItems = [
  { label: "Dashboard",      icon: Grid2X2,     path: "/" },
  { label: "Ingredient Add", icon: ClipboardList, path: "/ingredients" },
  { label: "Analytics",      icon: BarChart3,    path: "/analytics" },
  { label: "Review",         icon: TrendingUp,   path: "/reviews" },
  { label: "Order",          icon: Star,         path: "/order" },
  { label: "Order List",     icon: Puzzle,       path: "/orders" },
  { label: "Customer List",  icon: Globe2,       path: "/customers" },
  { label: "Icons",          icon: ReceiptText,  path: "/icons", badge: "New" },
  { label: "Foods",          icon: ClipboardList, path: "/menu" },
  { label: "Table",          icon: Table2,       path: "/table" },
  { label: "forms",          icon: Package,      path: "/kitchen" },
];

export const topAlerts = [
  { icon: Bell, count: 12 },
  { icon: MessageSquareText, count: 5 },
  { icon: Gift, count: 2, purple: true },
];

export const foodImages = [
  foodCollage,
  "https://images.unsplash.com/photo-1604382355076-af4b0eb60143?auto=format&fit=crop&w=500&q=80",
  "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=500&q=80",
  "https://images.unsplash.com/photo-1604382355076-af4b0eb60143?auto=format&fit=crop&w=500&q=80",
  "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=500&q=80",
];

export const trendingMenus = [
  ["Chicken curry special with cucumber", "$5.6", "Order 89x", foodImages[3]],
  ["Watermelon juice with ice", "$4.8", "Order 67x", foodImages[0]],
  ["Italiano pizza with garlic", "$12.3", "Order 59x", foodImages[1]],
  ["Tuna soup spinach with himalaya salt", "$3.6", "Order 49x", foodImages[4]],
  ["Medium Spicy Spagethi Italiano", "$4.2", "Order 49x", foodImages[2]],
];

export const orderRows = [
  ["Tuna Soup spinach with himalaya salt.", "Jimmy Kueai", "South Corner st2", "$7.4", "x3", "PENDING", "#0010235", foodImages[4]],
  ["Mozarella Pizza With Random Topping", "Kinda Alexa", "Blue Ocean st.41551 London", "$8.2", "x1", "DELIVERED", "#0010299", foodImages[1]],
  ["Sweet Cheezy Pizza for Kids Meal (Small Size)", "Peter Parkur", "Franklin Avenue St.66125 London", "$4.2", "x2", "CANCELED", "#0010235", foodImages[2]],
  ["Tuna soup spinach with himalaya salt", "Jimmy Kueai", "South Corner st41256 london", "$7.4", "x3", "PENDING", "#0010235", foodImages[3]],
  ["Mozarella Pizza With Random Topping", "Cindy Alexa", "Blue Ocean St.41551 London", "$8.2", "x1", "CANCELED", "#0010299", foodImages[1]],
];

export const orderListRows = [
  ["#245883", "27 April 2021,", "02:30 PM", "Hannah Doe", "128 Mclemore Rd, Taft, TN, 38488", "$85.2", "Delivery"],
  ["#245879", "14 April 2021,", "03:13 AM", "Aaliyah clark", "1623 E Updahl Ct, Harrison, ID, 83833", "$124.6", "Delivery"],
  ["#245880", "25 April 2021,", "11:22 AM", "Boone Doe", "261 Poplar Ave, Devon, PA, 19333", "$74.99", "New Order"],
  ["#245881", "25 April 2021,", "11:52 AM", "Carlie Paton", "8959 State 405 Rte, Maceo, KY, 42355", "$66.21", "Delivery"],
  ["#245882", "27 April 2021,", "02:25 PM", "Delilah", "4480 Ka Haku Rd, Princeville, HI, 96722", "$89.32", "New Order"],
  ["#245884", "27 April 2021,", "12:42 AM", "Emerson Clark", "505 E 14th St, Scotland Neck, NC, 27874", "$18.5", "Delivery"],
  ["#245885", "27 April 2021,", "12:32 AM", "Crystal Doe", "312 S Judd St, Sioux City, IA, 51103", "$125.2", "Delivery"],
  ["#245886", "29 April 2021,", "11:12 AM", "Jenny don", "4381 Rutledge Pike, Rutledge, TN, 37861", "$39.25", "On Delivery"],
  ["#245887", "29 April 2021,", "10:35 AM", "Joanne Clark", "Po Box 232, Bimble, KY, 40915", "$55.2", "On Delivery"],
  ["#245888", "30 April 2021,", "10:42 AM", "Madeline doe", "146 Patterson Dr, Hyneville, AL, 36040", "$24.55", "On Delivery"],
];

export const orderDetailItems = [
  ["Watermelon juice with ice", "1x", "$4.12", "$4.12", foodImages[4]],
  ["Chicken curry special with cucumber", "3x", "$14.99", "$44.97", foodImages[3]],
  ["Italiano pizza with garlic", "1x", "$15.44", "$15.44", foodImages[2]],
];

export const popularDishes = [
  ["Fish Burger", "$5.59", foodImages[0], true],
  ["Beef Burger", "$5.59", "https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=700&q=80", false],
  ["Cheese Burger", "$5.59", "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=700&q=80", false],
];

export const recentCategoryOrders = [
  ["Fish Burger", "$5.59", "4.97 km • 21 min", "https://images.unsplash.com/photo-1594007654729-407eedc4be65?auto=format&fit=crop&w=700&q=80"],
  ["Japan Ramen", "$5.59", "4.97 km • 21 min", "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=700&q=80"],
  ["Fried Rice", "$5.59", "4.97 km • 21 min", "https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=700&q=80"],
];

export const orderMenu = [
  ["Pepperoni Pizza", "x1", "+ $5.59", "https://images.unsplash.com/photo-1594007654729-407eedc4be65?auto=format&fit=crop&w=300&q=80"],
  ["Cheese Burger", "x1", "+ $5.59", "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=300&q=80"],
  ["Vegan Pizza", "x1", "+ $5.59", "https://images.unsplash.com/photo-1571407970349-bc81e7e96d47?auto=format&fit=crop&w=300&q=80"],
];

export const reviewCards = [
  ["Jons Sena", "4.5", foodImages[1], "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=240&q=80"],
  ["Sofia", "40", "https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?auto=format&fit=crop&w=500&q=80", "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=240&q=80"],
  ["Anandreansyah", "4.5", "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=500&q=80", ""],
  ["Jons Sena", "4.5", "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=500&q=80", ""],
  ["Jons Sena", "4.5", "https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?auto=format&fit=crop&w=500&q=80", ""],
  ["Sofia", "40", "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&w=500&q=80", ""],
  ["Anandreansyah", "4.5", "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=500&q=80", ""],
  ["Jons Sena", "4.5", "https://images.unsplash.com/photo-1565299507177-b0ac66763828?auto=format&fit=crop&w=500&q=80", ""],
];

export const favoriteItems = [
  ["Watermelon Juice with Ice", "45%", "6732", "87%", foodImages[0]],
  ["Medium Spicy Pizza with Kemangi Leaf", "26%", "5721", "62%", foodImages[1]],
  ["Mozarella Pizza with Random Topping", "26%", "3515", "50%", foodImages[2]],
];

export const loyalCustomers = [
  ["Alexander Queqe", "651 Times order", "bg-yellow-100"],
  ["Bella Simatupang", "356 Times order", "bg-blue-100"],
  ["Jordi Alaba", "125 Times order", "bg-slate-100"],
  ["Kevin Jamet", "78 Times order", "bg-orange-100"],
];
