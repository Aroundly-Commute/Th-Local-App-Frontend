/**
 * src/modules/marketplace/screens/data.ts — All static data for the Verdex marketplace UI
 */
import { verdexColors as G } from '../../../core/theme/theme';

export const CATS = [
  { id: 'all', label: 'All', emoji: '🏪' },
  { id: 'wedding', label: 'Wedding', emoji: '💍' },
  { id: 'fresh', label: 'Fresh', emoji: '🥬' },
  { id: 'fashion', label: 'Fashion', emoji: '👗' },
  { id: 'electronics', label: 'Electronics', emoji: '📱' },
  { id: 'pharma', label: 'Pharma', emoji: '💊' },
  { id: 'pets', label: 'Pets', emoji: '🐾' },
];

export const STORES = [
  { name: 'Home', sub: 'Instant', emoji: '⚡' },
  { name: 'Services', sub: 'Home Services', emoji: '🌞' },
  { name: 'Super Mall', sub: '', emoji: '🏪' },
  { name: 'Other', sub: 'Farm Direct', emoji: '🥬' },
];

export const DEAL_TILES = [
  { name: 'Fresh Veggies', price: 'FROM ₹29', emoji: '🥦', bg: G.g50 },
  { name: 'Makeup Therapy', price: '50% OFF', emoji: '💄', bg: G.g100 },
  { name: 'Hair Care', price: 'AT ₹219', emoji: '🧴', bg: G.g50 },
  { name: 'Bath & Scent', price: 'AT ₹249', emoji: '🛁', bg: G.g100 },
];

export const FLASH_ITEMS = [
  { name: 'Himalaya Face Wash', emoji: '🛁', bg: G.g50, was: '₹149', now: '₹89', off: '40%' },
  { name: 'Green Tea 50 bags', emoji: '🍃', bg: '#E8FBF9', was: '₹249', now: '₹175', off: '30%' },
  { name: 'Farm Eggs 12 pcs', emoji: '🥚', bg: '#FFFBEA', was: '₹120', now: '₹96', off: '20%' },
  { name: 'Neem Soap Pack', emoji: '🧼', bg: G.g50, was: '₹99', now: '₹65', off: '35%' },
  { name: 'Aloe Vera Gel', emoji: '🌿', bg: G.g100, was: '₹189', now: '₹129', off: '32%' },
];

export const SHOPS = [
  { id: 's1', name: "Patel's General Store", rating: '4.8', dist: '0.3 km', emoji: '🛒', bg: G.g50, orders: '1.2k' },
  { id: 's2', name: 'Green Leaf Organics', rating: '4.6', dist: '0.7 km', emoji: '🌿', bg: G.g50, orders: '834' },
  { id: 's3', name: 'MedPlus Pharmacy', rating: '4.5', dist: '1.1 km', emoji: '💊', bg: G.g100, orders: '2.1k' },
  { id: 's4', name: 'SweetHome Bakes', rating: '4.7', dist: '1.4 km', emoji: '🧁', bg: G.g50, orders: '560' },
];

export const PRODS = [
  { id: 'p1', name: 'Amul Milk 1L', price: '₹66', emoji: '🥛', bg: G.g50 },
  { id: 'p2', name: 'Tomatoes 500g', price: '₹38', emoji: '🍅', bg: G.g50 },
  { id: 'p3', name: 'Basmati Rice 5kg', price: '₹349', emoji: '🌾', bg: G.g100 },
  { id: 'p4', name: 'Dettol Soap ×4', price: '₹129', emoji: '🧴', bg: G.g50 },
  { id: 'p5', name: 'Tata Tea 500g', price: '₹245', emoji: '🫙', bg: G.g50 },
  { id: 'p6', name: 'Dry Fruits 250g', price: '₹179', emoji: '🥜', bg: G.g100 },
];

export const COUPONS = [
  { pct: '20% OFF', emoji: '🛒', title: 'On first order', code: 'VERDEX20' },
  { pct: '₹50 OFF', emoji: '⚡', title: 'On groceries ₹299+', code: 'BLAZE50' },
  { pct: '15% OFF', emoji: '💊', title: 'On pharma orders', code: 'HEALTH15' },
  { pct: 'FREE', emoji: '🚚', title: 'Delivery on ₹199+', code: 'FREEDEL' },
];

export const OFFERS = [
  { emoji: '🎨', title: 'Get 20% Off', sub: "On L'Oreal Paris Hair Color" },
  { emoji: '🥛', title: 'Free Delivery', sub: 'On Dairy above ₹199' },
];

export const SERVICES = [
  { id: 'srv1', name: 'Plumbing Leak Repair', provider: 'Apex Plumbing', price: '₹249', rating: '4.8', emoji: '🔧', category: 'Plumbing & Repairs', bg: G.g50 },
  { id: 'srv2', name: 'Deep Sofa Cleaning', provider: 'ClearHome Services', price: '₹499', rating: '4.9', emoji: '🧹', category: 'Home Cleaning', bg: G.g50 },
  { id: 'srv3', name: 'Premium Haircut & Styling', provider: 'Glow Up Salon', price: '₹199', rating: '4.7', emoji: '✂️', category: 'Salon & Styling', bg: G.g100 },
  { id: 'srv4', name: 'AC Servicing & Gas Fill', provider: 'BreezeAir Solutions', price: '₹349', rating: '4.6', emoji: '❄️', category: 'Appliance Servicing', bg: G.g50 },
];

export const SERVICE_PROVIDERS = [
  { id: 'sp1', name: 'Apex Plumbing', rating: '4.8', ratingCount: '142', dist: '0.8 km', emoji: '👨‍🔧', bg: G.g50, services: 'Plumbing, Pipe fitting, Grouting' },
  { id: 'sp2', name: 'Glow Up Salon', rating: '4.7', ratingCount: '320', dist: '1.2 km', emoji: '💇‍♀️', bg: G.g100, services: 'Hair styling, Pedicure, Facial' },
  { id: 'sp3', name: 'ClearHome Services', rating: '4.9', ratingCount: '98', dist: '1.5 km', emoji: '🧹', bg: G.g50, services: 'Deep cleaning, Sofa/Carpet wash' },
];
