import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, useColorScheme,
  ImageBackground, Dimensions, ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft, Star, MapPin, Heart, BadgeCheck } from 'lucide-react-native';
import { lightTheme, darkTheme, spacing, radius } from '../../src/theme';
import { tap, success } from '../../src/haptics';
import { useCart } from '../../src/market/CartContext';

const { width: SCREEN_W } = Dimensions.get('window');

export default function ShopDetail() {
  const cs = useColorScheme();
  const t = cs === 'dark' ? darkTheme : lightTheme;
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [shop, setShop] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [follow, setFollow] = useState<{ is_following: boolean; followers: number }>({ is_following: false, followers: 0 });
  const [loading, setLoading] = useState(true);

  const { addItem } = useCart();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const baseUrl = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:3000';
        const [prodRes, shopRes] = await Promise.all([
          fetch(`${baseUrl}/api/marketplace/products/search?q=`),
          fetch(`${baseUrl}/api/marketplace/shops/search?q=`)
        ]);

        const prodData = await prodRes.json();
        const shopData = await shopRes.json();
        
        const allShops = Array.isArray(shopData) ? shopData : [];
        const found = allShops.find((s: any) => s.id === id);
        
        const allProds = Array.isArray(prodData) ? prodData : [];
        const shopProds = allProds.filter((p: any) => p.shopId === id).map((p: any) => ({
          ...p,
          image: p.product?.imageUrl || 'https://via.placeholder.com/150',
          name: p.product?.name || 'Unknown',
        }));

        setShop(found ?? { id, name: 'Unknown Shop', rating: 0, distance_km: 0, image: 'https://via.placeholder.com/500', avatar: 'https://via.placeholder.com/150', description: 'No description' });
        setProducts(shopProds);
        setFollow({ is_following: false, followers: found?.followers ?? 0 });
      } catch (err) {
        console.error('Error fetching shop data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const toggleFollow = () => {
    tap();
    setFollow((prev) => {
      const nowFollowing = !prev.is_following;
      if (nowFollowing) success();
      return { is_following: nowFollowing, followers: prev.followers + (nowFollowing ? 1 : -1) };
    });
  };

  if (loading || !shop) {
    return (
      <View style={{ flex: 1, backgroundColor: t.background, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={t.textPrimary} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: t.background }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Hero */}
        <ImageBackground source={{ uri: shop.image }} style={styles.hero}>
          <LinearGradient colors={['rgba(0,0,0,0.4)', 'transparent', 'rgba(0,0,0,0.5)']} style={StyleSheet.absoluteFill} />
          <TouchableOpacity testID="shop-back" onPress={() => { tap(); router.back(); }}
            style={[styles.back, { backgroundColor: 'rgba(255,255,255,0.95)' }]}>
            <ChevronLeft color="#0A0A0A" size={22} />
          </TouchableOpacity>
        </ImageBackground>

        {/* Card */}
        <View style={[styles.card, { backgroundColor: t.background }]}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
            <View style={[styles.avatarWrap, { backgroundColor: t.background, borderColor: t.background }]}>
              <Image source={{ uri: shop.avatar }} style={styles.avatar} contentFit="cover" />
            </View>
            <View style={{ flex: 1, marginTop: 6 }}>
              <Text style={[styles.name, { color: t.textPrimary }]}>{shop.name}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
                <Star color={t.warning} size={12} fill={t.warning} />
                <Text style={[styles.meta, { color: t.textSecondary }]}>{(shop.rating ?? 4.5).toFixed(1)}</Text>
                <Text style={[styles.meta, { color: t.textTertiary }]}>·</Text>
                <MapPin color={t.textSecondary} size={11} />
                <Text style={[styles.meta, { color: t.textSecondary }]}>{shop.distance_km ?? 1.2} km</Text>
                <Text style={[styles.meta, { color: t.textTertiary }]}>·</Text>
                <Text style={[styles.meta, { color: t.textSecondary }]}>{(follow.followers ?? 0).toLocaleString()} followers</Text>
              </View>
            </View>
          </View>

          <TouchableOpacity
            testID="follow-btn"
            onPress={toggleFollow}
            activeOpacity={0.85}
            style={[styles.followBtn, {
              backgroundColor: follow.is_following ? t.surface : t.primary,
              borderColor: follow.is_following ? t.border : t.primary,
            }]}
          >
            <Heart
              color={follow.is_following ? t.error : t.primaryContrast}
              size={14}
              fill={follow.is_following ? t.error : 'transparent'}
            />
            <Text style={{
              color: follow.is_following ? t.textPrimary : t.primaryContrast,
              fontSize: 14, fontWeight: '700',
            }}>{follow.is_following ? 'Following' : 'Follow'}</Text>
          </TouchableOpacity>

          {/* Description */}
          <View style={[styles.section, { borderTopColor: t.border }]}>
            <Text style={[styles.sectionTitle, { color: t.textPrimary }]}>About</Text>
            <Text style={[styles.description, { color: t.textSecondary }]}>{shop.description}</Text>
          </View>

          {/* Verified-style badges */}
          <View style={[styles.badgeRow, { backgroundColor: t.mintBg }]}>
            <BadgeCheck color={t.mint} size={14} />
            <Text style={[styles.badgeText, { color: t.mint }]}>Trusted local business · {follow.followers} followers</Text>
          </View>

          {/* Products */}
          <View style={[styles.section, { borderTopColor: t.border }]}>
            <Text style={[styles.sectionTitle, { color: t.textPrimary }]}>Products & services</Text>
          </View>

          <View style={styles.productGrid}>
            {products.length === 0 ? (
              <Text style={{ color: t.textSecondary }}>No products listed yet.</Text>
            ) : products.map((p) => (
              <TouchableOpacity
                key={p.id} testID={`product-${p.id}`} activeOpacity={0.85} onPress={() => tap()}
                style={[styles.product, { backgroundColor: t.surface, borderColor: t.border }]}
              >
                <Image source={{ uri: p.image }} style={styles.productImg} contentFit="cover" />
                {p.on_flash_sale && (
                  <View style={[styles.saleTag, { backgroundColor: t.error }]}>
                    <Text style={styles.saleTagText}>SALE</Text>
                  </View>
                )}
                <View style={{ padding: 10, gap: 4 }}>
                  <Text style={[styles.productName, { color: t.textPrimary }]} numberOfLines={2}>{p.name}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
                    <Text style={[styles.productPrice, { color: t.textPrimary }]}>
                      ₹{p.price}
                    </Text>
                  </View>
                  {p.stock > 0 && (
                    <TouchableOpacity 
                      style={[styles.addToCartBtn, { backgroundColor: t.primary }]}
                      onPress={() => addItem(p.id, p.name, p.price, p.shopId, p.image)}
                    >
                      <Text style={[styles.addToCartText, { color: t.primaryContrast }]}>Add</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Sticky CTA */}
      <View style={[styles.fab, { backgroundColor: t.background, borderTopColor: t.border }]}>
        <TouchableOpacity testID="visit-btn" activeOpacity={0.85}
          style={[styles.cta, { backgroundColor: t.primary }]}
          onPress={() => router.push('/(market)/cart')}>
          <Text style={{ color: t.primaryContrast, fontSize: 15, fontWeight: '700' }}>View Cart</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { width: SCREEN_W, height: 240, justifyContent: 'flex-start' },
  back: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', margin: spacing.md, marginTop: 50 },
  card: { marginTop: -32, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: spacing.lg, paddingTop: spacing.lg },
  avatarWrap: { width: 64, height: 64, borderRadius: 32, padding: 3, borderWidth: 3, marginTop: -50 },
  avatar: { width: '100%', height: '100%', borderRadius: 32 },
  name: { fontSize: 22, fontWeight: '700', letterSpacing: -0.5 },
  meta: { fontSize: 12 },
  followBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: spacing.md, paddingVertical: 12, borderRadius: 9999, borderWidth: 1 },
  section: { paddingTop: spacing.lg, marginTop: spacing.lg, borderTopWidth: 1 },
  sectionTitle: { fontSize: 15, fontWeight: '700', marginBottom: spacing.sm, letterSpacing: -0.2 },
  description: { fontSize: 14, lineHeight: 20 },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: spacing.md, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 9999 },
  badgeText: { fontSize: 12, fontWeight: '600' },
  productGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  product: { width: '47.5%', borderRadius: radius.md, borderWidth: 1, overflow: 'hidden' },
  productImg: { width: '100%', height: 120 },
  productName: { fontSize: 13, fontWeight: '600' },
  productPrice: { fontSize: 14, fontWeight: '700' },
  productOrig: { fontSize: 11, textDecorationLine: 'line-through' },
  saleTag: { position: 'absolute', top: 8, left: 8, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  saleTagText: { color: '#fff', fontSize: 9, fontWeight: '800' },
  fab: { position: 'absolute', left: 0, right: 0, bottom: 0, padding: spacing.md, borderTopWidth: 1 },
  cta: { height: 50, borderRadius: 9999, alignItems: 'center', justifyContent: 'center' },
  addToCartBtn: {
    marginTop: 8,
    paddingVertical: 6,
    borderRadius: 6,
    alignItems: 'center',
  },
  addToCartText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
});
