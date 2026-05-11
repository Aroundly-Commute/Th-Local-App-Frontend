/**
 * Mock data for the marketplace — used when the backend endpoints are not yet available.
 * All API calls in market screens fall back to this via the interceptor in api.ts.
 */

export const mockStories = [
  { id: 's1', name: 'Green Grocer', avatar: 'https://i.pravatar.cc/150?img=11' },
  { id: 's2', name: 'Bike & Brew', avatar: 'https://i.pravatar.cc/150?img=22' },
  { id: 's3', name: 'Local Bakery', avatar: 'https://i.pravatar.cc/150?img=33' },
  { id: 's4', name: 'Artisan Co.', avatar: 'https://i.pravatar.cc/150?img=44' },
  { id: 's5', name: 'Eco Threads', avatar: 'https://i.pravatar.cc/150?img=55' },
];

export const mockCategories = [
  { id: 'food', name: 'Food & Drink', icon: '🍜', featured: true },
  { id: 'fashion', name: 'Fashion', icon: '👗', featured: true },
  { id: 'wellness', name: 'Wellness', icon: '🧘', featured: true },
  { id: 'services', name: 'Services', icon: '🔧', featured: true },
  { id: 'books', name: 'Books', icon: '📚', featured: false },
  { id: 'home', name: 'Home & Garden', icon: '🏡', featured: false },
  { id: 'pets', name: 'Pets', icon: '🐾', featured: false },
  { id: 'tech', name: 'Tech & Repair', icon: '💻', featured: false },
];

export const mockShops = [
  {
    id: 'sh1', name: 'The Green Grocer', description: 'Fresh local produce & organic goods delivered to your door.',
    image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=600', avatar: 'https://i.pravatar.cc/80?img=11',
    rating: 4.8, distance_km: 0.4, category: 'food', featured: true, followers: 312,
  },
  {
    id: 'sh2', name: 'Bike & Brew Coffee', description: 'Specialty coffee shop with a bike-repair corner. Community-first.',
    image: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=600', avatar: 'https://i.pravatar.cc/80?img=22',
    rating: 4.6, distance_km: 0.9, category: 'food', featured: true, followers: 198,
  },
  {
    id: 'sh3', name: 'Artisan Collective', description: 'Handcrafted goods by local makers — ceramics, textiles & more.',
    image: 'https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=600', avatar: 'https://i.pravatar.cc/80?img=33',
    rating: 4.9, distance_km: 1.2, category: 'fashion', featured: false, followers: 547,
  },
  {
    id: 'sh4', name: 'Eco Threads', description: 'Sustainable fashion — pre-loved & upcycled garments for every style.',
    image: 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=600', avatar: 'https://i.pravatar.cc/80?img=44',
    rating: 4.5, distance_km: 1.8, category: 'fashion', featured: false, followers: 134,
  },
  {
    id: 'sh5', name: 'Neighbourhood Fix-It', description: 'Appliance & electronics repair by certified local technicians.',
    image: 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=600', avatar: 'https://i.pravatar.cc/80?img=55',
    rating: 4.7, distance_km: 0.6, category: 'services', featured: false, followers: 89,
  },
  {
    id: 'sh6', name: 'Zen & Well', description: 'Yoga studio, massage therapy & holistic wellness, all in one space.',
    image: 'https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=600', avatar: 'https://i.pravatar.cc/80?img=66',
    rating: 4.9, distance_km: 2.1, category: 'wellness', featured: true, followers: 421,
  },
];

export const mockFeatured = mockShops.filter((s) => s.featured);

export const mockFlashSale = [
  {
    id: 'fl1', name: 'Sourdough Loaf', shop_name: 'The Green Grocer',
    image: 'https://images.unsplash.com/photo-1586444248902-2f64eddc13df?w=400',
    price: 8.5, sale_price: 5.0, seconds_left: 5400, on_flash_sale: true,
  },
  {
    id: 'fl2', name: 'Flat White × 2', shop_name: 'Bike & Brew',
    image: 'https://images.unsplash.com/photo-1534040385115-33dcb3acba5b?w=400',
    price: 12.0, sale_price: 7.5, seconds_left: 3600, on_flash_sale: true,
  },
  {
    id: 'fl3', name: 'Linen Tote Bag', shop_name: 'Artisan Collective',
    image: 'https://images.unsplash.com/photo-1591561954557-26941169b49e?w=400',
    price: 28.0, sale_price: 18.0, seconds_left: 7200, on_flash_sale: true,
  },
];

export const mockProducts: Record<string, any[]> = {
  sh1: [
    { id: 'p1', name: 'Organic Veg Box', price: 22.0, sale_price: 16.0, image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400', on_flash_sale: true },
    { id: 'p2', name: 'Sourdough Loaf', price: 8.5, sale_price: 5.0, image: 'https://images.unsplash.com/photo-1586444248902-2f64eddc13df?w=400', on_flash_sale: true },
    { id: 'p3', name: 'Farm Eggs (12)', price: 6.0, sale_price: 6.0, image: 'https://images.unsplash.com/photo-1506976785307-8732e854ad03?w=400', on_flash_sale: false },
    { id: 'p4', name: 'Honey Jar 250g', price: 9.0, sale_price: 9.0, image: 'https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?w=400', on_flash_sale: false },
  ],
  sh2: [
    { id: 'p5', name: 'Flat White', price: 5.5, sale_price: 5.5, image: 'https://images.unsplash.com/photo-1534040385115-33dcb3acba5b?w=400', on_flash_sale: false },
    { id: 'p6', name: 'Oat Latte', price: 6.0, sale_price: 6.0, image: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=400', on_flash_sale: false },
    { id: 'p7', name: 'Bike Tune-Up', price: 45.0, sale_price: 30.0, image: 'https://images.unsplash.com/photo-1571068316344-75bc76f77890?w=400', on_flash_sale: true },
  ],
  sh3: [
    { id: 'p8', name: 'Ceramic Mug', price: 24.0, sale_price: 24.0, image: 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=400', on_flash_sale: false },
    { id: 'p9', name: 'Linen Tote', price: 28.0, sale_price: 18.0, image: 'https://images.unsplash.com/photo-1591561954557-26941169b49e?w=400', on_flash_sale: true },
  ],
};

export const mockFollowStatus: Record<string, { is_following: boolean; followers: number }> = {
  sh1: { is_following: false, followers: 312 },
  sh2: { is_following: true, followers: 198 },
  sh3: { is_following: false, followers: 547 },
  sh4: { is_following: false, followers: 134 },
  sh5: { is_following: false, followers: 89 },
  sh6: { is_following: false, followers: 421 },
};
