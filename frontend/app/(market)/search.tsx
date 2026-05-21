import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, TextInput, Dimensions, Keyboard
} from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, X, Compass, ChevronRight } from 'lucide-react-native';
import { verdexColors as G } from '../../src/theme';
import { IconChevronRight } from '../../src/components/marketplace/primitives';
import { useCart } from '../../src/contexts/CartContext';
import { useMarketData } from '../../src/contexts/MarketDataContext';

const { width } = Dimensions.get('window');
const GRID_ITEM_WIDTH = (width - 48) / 2;

export default function SearchScreen() {
  const { q } = useLocalSearchParams();
  const router = useRouter();
  const { addItem } = useCart();
  const { products: contextProducts, shops: contextShops, services: contextServices, serviceProviders: contextProviders } = useMarketData();

  const [query, setQuery] = useState((q as string) || '');
  const [submittedQuery, setSubmittedQuery] = useState((q as string) || '');
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [shops, setShops] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'products' | 'shops'>('products');
  
  // Suggestion list
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(true);

  const inputRef = useRef<TextInput>(null);

  // Popular queries fallback
  const POPULAR_SEARCHES = ['Milk', 'Plumber', 'Atta', 'Saloon', 'Bread', 'Electrician', 'Fresh Produce'];

  // Handle typing & compute suggestions in real-time
  useEffect(() => {
    if (!query.trim()) {
      setSuggestions([]);
      return;
    }

    const val = query.toLowerCase();
    const matchesSet = new Set<string>();

    // Search local database context lists for autocomplete recommendations
    contextProducts.forEach(p => {
      if (p.name?.toLowerCase().includes(val)) matchesSet.add(p.name);
    });
    contextServices.forEach(s => {
      if (s.name?.toLowerCase().includes(val)) matchesSet.add(s.name);
    });
    contextShops.forEach(sh => {
      if (sh.name?.toLowerCase().includes(val)) matchesSet.add(sh.name);
    });
    contextProviders.forEach(p => {
      if (p.name?.toLowerCase().includes(val)) matchesSet.add(p.name);
    });

    setSuggestions(Array.from(matchesSet).slice(0, 8));
  }, [query, contextProducts, contextServices, contextShops, contextProviders]);

  // Execute actual search query against both local context & backend APIs
  const handleSearch = async (searchTerm: string) => {
    if (!searchTerm.trim()) return;
    Keyboard.dismiss();
    setSubmittedQuery(searchTerm);
    setShowSuggestions(false);
    setLoading(true);

    try {
      const encoded = encodeURIComponent(searchTerm.trim());
      const baseUrl = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:3000';
      
      const [prodRes, shopRes, servRes, provRes] = await Promise.all([
        fetch(`${baseUrl}/api/marketplace/products/search?q=${encoded}`),
        fetch(`${baseUrl}/api/marketplace/shops/search?q=${encoded}`),
        fetch(`${baseUrl}/api/marketplace/services/search?q=${encoded}`),
        fetch(`${baseUrl}/api/marketplace/service-providers?q=${encoded}`)
      ]);

      const prodData = await prodRes.json();
      const shopData = await shopRes.json();
      const servData = await servRes.json();
      const provData = await provRes.json();

      const allProds = Array.isArray(prodData) ? prodData : [];
      const allServices = Array.isArray(servData) ? servData : [];
      
      const mappedServices = allServices.map((s: any) => ({
        id: s.id,
        price: s.price,
        stock: 1,
        isService: true,
        product: {
          name: s.name,
          imageUrl: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400&q=80',
          description: s.description,
        },
        shop: {
          name: s.provider?.name || 'Local Provider',
        },
        providerId: s.providerId,
      }));

      const allShops = Array.isArray(shopData) ? shopData : [];
      const allProviders = Array.isArray(provData) ? provData : [];
      
      const mappedProviders = allProviders.map((p: any) => ({
        id: p.id,
        name: p.name,
        description: p.services || 'Professional marketplace services.',
        owner: p.owner,
        isProvider: true,
      }));

      setProducts([...allProds, ...mappedServices]);
      setShops([...allShops, ...mappedProviders]);
    } catch (err) {
      console.error('Search fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Focus search input on mount
    setTimeout(() => {
      inputRef.current?.focus();
    }, 150);

    if (q) {
      handleSearch(q as string);
    }
  }, [q]);

  const renderProduct = ({ item }: { item: any }) => (
    <View style={s.gridCard}>
      <Image 
        source={{ uri: item.product?.imageUrl || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&q=80' }} 
        style={s.productImage} 
        contentFit="cover"
      />
      <View style={s.gridCardContent}>
        <Text style={s.cardTitle} numberOfLines={1}>{item.product?.name || 'Unknown Product'}</Text>
        <Text style={s.cardSub} numberOfLines={1}>{item.shop?.name || 'Unknown Shop'}</Text>
        
        <View style={s.priceRow}>
          <Text style={s.price}>₹{item.price}</Text>
          <Text style={s.stock}>{item.isService ? 'Service' : item.stock > 0 ? `In Stock` : 'Out of Stock'}</Text>
        </View>
        
        {item.isService ? (
          <TouchableOpacity 
            style={[s.addToCartBtn, { backgroundColor: G.g800 }]}
            onPress={() => router.push(`/shop/${item.providerId}?type=provider`)}
          >
            <Text style={[s.addToCartText, { color: G.lime }]}>Book Now</Text>
          </TouchableOpacity>
        ) : item.stock > 0 && (
          <TouchableOpacity 
            style={s.addToCartBtn}
            onPress={() => addItem(item.id, item.product?.name || 'Product', item.price, item.shopId, item.product?.imageUrl)}
          >
            <Text style={s.addToCartText}>Add to Cart</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const renderShop = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={s.card} 
      onPress={() => router.push({
        pathname: `/shop/${item.id}`,
        params: item.isProvider ? { type: 'provider' } : {}
      })}
    >
      <View style={{ flex: 1 }}>
        <Text style={s.cardTitle}>{item.name}</Text>
        <Text style={s.cardSub}>{item.isProvider ? 'Service Provider' : `Owner: ${item.owner?.name || 'Local Partner'}`}</Text>
        {item.description && (
          <Text style={s.cardDesc} numberOfLines={2}>{item.description}</Text>
        )}
      </View>
      <IconChevronRight c={G.g400} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={s.container} edges={['top', 'left', 'right']}>
      {/* Search Input Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Text style={s.backBtnText}>←</Text>
        </TouchableOpacity>
        
        <View style={s.searchBarContainer}>
          <Search size={18} color={G.txt3} style={s.searchIcon} />
          <TextInput
            ref={inputRef}
            value={query}
            onChangeText={(txt) => {
              setQuery(txt);
              setShowSuggestions(true);
            }}
            placeholder="Search products, brands, services..."
            placeholderTextColor={G.txt3}
            onSubmitEditing={() => handleSearch(query)}
            returnKeyType="search"
            style={s.textInput}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => { setQuery(''); setSuggestions([]); }} style={s.clearBtn}>
              <X size={16} color={G.txt3} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Dynamic Suggestions List */}
      {showSuggestions && (
        <View style={s.suggestionsOverlay}>
          {suggestions.length > 0 ? (
            <FlatList
              data={suggestions}
              keyExtractor={(item) => item}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => (
                <TouchableOpacity 
                  onPress={() => {
                    setQuery(item);
                    handleSearch(item);
                  }}
                  style={s.suggestionRow}
                >
                  <Search size={15} color={G.txt3} style={{ marginRight: 12 }} />
                  <Text style={s.suggestionText}>{item}</Text>
                  <ChevronRight size={14} color={G.g300} style={{ marginLeft: 'auto' }} />
                </TouchableOpacity>
              )}
            />
          ) : !query.trim() ? (
            <View style={s.popularContainer}>
              <Text style={s.sectionHeader}>Popular Searches</Text>
              <View style={s.popularBadges}>
                {POPULAR_SEARCHES.map((item) => (
                  <TouchableOpacity
                    key={item}
                    onPress={() => {
                      setQuery(item);
                      handleSearch(item);
                    }}
                    style={s.popularBadge}
                  >
                    <Text style={s.popularBadgeText}>🔍 {item}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ) : null}
        </View>
      )}

      {/* Tabs */}
      {!showSuggestions && (
        <View style={s.tabs}>
          <TouchableOpacity 
            style={[s.tab, activeTab === 'products' && s.activeTab]}
            onPress={() => setActiveTab('products')}
          >
            <Text style={[s.tabText, activeTab === 'products' && s.activeTabText]}>
              Products & Services ({products.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[s.tab, activeTab === 'shops' && s.activeTab]}
            onPress={() => setActiveTab('shops')}
          >
            <Text style={[s.tabText, activeTab === 'shops' && s.activeTabText]}>
              Shops & Partners ({shops.length})
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Content Results */}
      {!showSuggestions && (
        loading ? (
          <View style={s.center}>
            <ActivityIndicator size="large" color={G.g800} />
          </View>
        ) : (
          <FlatList
            key={activeTab}
            data={activeTab === 'products' ? products : shops}
            keyExtractor={(item) => item.id}
            contentContainerStyle={s.listContent}
            numColumns={activeTab === 'products' ? 2 : 1}
            columnWrapperStyle={activeTab === 'products' ? s.columnWrapper : undefined}
            renderItem={activeTab === 'products' ? renderProduct : renderShop}
            ListEmptyComponent={
              <View style={s.center}>
                <Text style={s.emptyText}>No matching listings found for "{submittedQuery}"</Text>
              </View>
            }
          />
        )
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: G.surf,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: `${G.g200}40`,
  },
  backBtn: {
    paddingRight: 12,
  },
  backBtnText: {
    fontSize: 22,
    fontWeight: '800',
    color: G.txt,
  },
  searchBarContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: G.surf3 || '#F3F4F6',
    borderRadius: 24,
    paddingHorizontal: 12,
    height: 40,
  },
  searchIcon: {
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    height: '100%',
    color: G.txt,
    fontSize: 14,
    fontWeight: '500',
    padding: 0,
  },
  clearBtn: {
    padding: 4,
  },
  suggestionsOverlay: {
    position: 'absolute',
    top: 68,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: G.surf,
    zIndex: 999,
  },
  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: `${G.g200}20`,
  },
  suggestionText: {
    fontSize: 14,
    color: G.txt,
    fontWeight: '600',
  },
  popularContainer: {
    padding: 20,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '800',
    color: G.txt2,
    marginBottom: 12,
  },
  popularBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  popularBadge: {
    backgroundColor: G.surf3 || '#F3F4F6',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: `${G.g200}30`,
  },
  popularBadgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: G.txt,
  },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: `${G.g200}40`,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: G.g800,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '700',
    color: G.txt2,
  },
  activeTabText: {
    color: G.txt,
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  columnWrapper: {
    justifyContent: 'space-between',
  },
  gridCard: {
    width: GRID_ITEM_WIDTH,
    backgroundColor: G.surf,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: `${G.g200}60`,
    overflow: 'hidden',
  },
  productImage: {
    width: '100%',
    height: GRID_ITEM_WIDTH,
  },
  gridCardContent: {
    padding: 10,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 8,
  },
  addToCartBtn: {
    backgroundColor: G.g400,
    paddingVertical: 6,
    borderRadius: 6,
    alignItems: 'center',
  },
  addToCartText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
  },
  card: {
    flexDirection: 'row',
    backgroundColor: G.surf,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: `${G.g200}60`,
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: G.txt,
    marginBottom: 2,
  },
  cardSub: {
    fontSize: 12,
    color: G.g500,
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: 12,
    color: G.txt3,
  },
  price: {
    fontSize: 14,
    fontWeight: '800',
    color: G.g600,
  },
  stock: {
    fontSize: 11,
    color: G.txt2,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60,
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '700',
    color: G.txt3,
    textAlign: 'center',
    lineHeight: 20,
  },
});
