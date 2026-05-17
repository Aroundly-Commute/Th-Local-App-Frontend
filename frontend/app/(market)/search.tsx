import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Dimensions
} from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { verdexColors as G } from '../../src/theme';
import { IconChevronRight } from '../../src/components/marketplace/primitives';
import { useCart } from '../../src/contexts/CartContext';

const { width } = Dimensions.get('window');
const GRID_ITEM_WIDTH = (width - 48) / 2;

export default function SearchScreen() {
  const { q } = useLocalSearchParams();
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<any[]>([]);
  const [shops, setShops] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'products' | 'shops'>('products');
  const { addItem } = useCart();

  useEffect(() => {
    const fetchResults = async () => {
      try {
        setLoading(true);
        const query = encodeURIComponent((q as string) || '');
        const baseUrl = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:3000';
        
        const [prodRes, shopRes] = await Promise.all([
          fetch(`${baseUrl}/api/marketplace/products/search?q=${query}`),
          fetch(`${baseUrl}/api/marketplace/shops/search?q=${query}`)
        ]);

        const prodData = await prodRes.json();
        const shopData = await shopRes.json();

        setProducts(Array.isArray(prodData) ? prodData : []);
        setShops(Array.isArray(shopData) ? shopData : []);
      } catch (err) {
        console.error('Search fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    if (q) {
      fetchResults();
    } else {
      setLoading(false);
    }
  }, [q]);

  const renderProduct = ({ item }: { item: any }) => (
    <View style={s.gridCard}>
      <Image 
        source={{ uri: item.product?.imageUrl || 'https://via.placeholder.com/150' }} 
        style={s.productImage} 
        contentFit="cover"
      />
      <View style={s.gridCardContent}>
        <Text style={s.cardTitle} numberOfLines={1}>{item.product?.name || 'Unknown Product'}</Text>
        <Text style={s.cardSub} numberOfLines={1}>{item.shop?.name || 'Unknown Shop'}</Text>
        
        <View style={s.priceRow}>
          <Text style={s.price}>₹{item.price}</Text>
          <Text style={s.stock}>{item.stock > 0 ? `In Stock: ${item.stock}` : 'Out of Stock'}</Text>
        </View>
        
        {item.stock > 0 && (
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
    <TouchableOpacity style={s.card} onPress={() => router.push(`/shop/${item.id}`)}>
      <View style={{ flex: 1 }}>
        <Text style={s.cardTitle}>{item.name}</Text>
        <Text style={s.cardSub}>Owner: {item.owner?.name || 'Unknown'}</Text>
        {item.description && (
          <Text style={s.cardDesc} numberOfLines={2}>{item.description}</Text>
        )}
      </View>
      <IconChevronRight c={G.g400} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={s.container} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Text style={s.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>Search Results for "{q}"</Text>
      </View>

      {/* Tabs */}
      <View style={s.tabs}>
        <TouchableOpacity 
          style={[s.tab, activeTab === 'products' && s.activeTab]}
          onPress={() => setActiveTab('products')}
        >
          <Text style={[s.tabText, activeTab === 'products' && s.activeTabText]}>
            Products ({products.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[s.tab, activeTab === 'shops' && s.activeTab]}
          onPress={() => setActiveTab('shops')}
        >
          <Text style={[s.tabText, activeTab === 'shops' && s.activeTabText]}>
            Shops ({shops.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {loading ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color={G.primary || '#000'} />
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
              <Text style={s.emptyText}>No results found.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: G.surf || '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: `${G.g200}40`,
  },
  backBtn: {
    marginRight: 16,
  },
  backBtnText: {
    fontSize: 16,
    color: G.g600 || '#666',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: G.txt || '#000',
    flex: 1,
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
    borderBottomColor: G.lime || '#000',
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
    color: G.txt2 || '#666',
  },
  activeTabText: {
    color: G.txt || '#000',
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
    backgroundColor: G.surf || '#fff',
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: `${G.g200}60`,
    overflow: 'hidden',
  },
  productImage: {
    width: '100%',
    height: GRID_ITEM_WIDTH,
    backgroundColor: G.surf3 || '#eee',
  },
  gridCardContent: {
    padding: 12,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 12,
  },
  addToCartBtn: {
    backgroundColor: G.lime || '#000',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  addToCartText: {
    color: G.g900 || '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  card: {
    flexDirection: 'row',
    backgroundColor: G.surf || '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: `${G.g200}60`,
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: G.txt || '#000',
    marginBottom: 4,
  },
  cardSub: {
    fontSize: 13,
    color: G.g500 || '#666',
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: 13,
    color: G.txt3 || '#999',
  },
  price: {
    fontSize: 16,
    fontWeight: '800',
    color: G.lime || '#000',
    marginBottom: 4,
  },
  stock: {
    fontSize: 12,
    color: G.txt2 || '#666',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
  },
  emptyText: {
    fontSize: 16,
    color: G.txt3 || '#999',
  },
});
