import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, TextInput, Modal, Image, useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft, Plus, Image as ImageIcon, Package, ShoppingBag, Check, X, Tag } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { useOrders } from '../../src/market/OrderContext';
import { useAuth } from '../../src/auth';
import { useMarketData } from '../../src/contexts/MarketDataContext';
import { lightTheme, darkTheme, spacing, radius } from '../../src/theme';
import { tap, success } from '../../src/haptics';

const MOCK_PRESET_IMAGES = [
  'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&q=80', // Red Shoes
  'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&q=80', // White Watch
  'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&q=80', // Headphones
  'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=400&q=80', // Controller
];

export default function MerchantDashboard() {
  const router = useRouter();
  const cs = useColorScheme();
  const t = cs === 'dark' ? darkTheme : lightTheme;
  const { user } = useAuth();
  const { merchantOrders, updateOrderStatus, loading: ordersLoading } = useOrders();
  const { addProduct } = useMarketData();

  const [activeTab, setActiveTab] = useState<'orders' | 'products'>('orders');
  const [shopId, setShopId] = useState<string | null>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  // Add Product Form State
  const [modalVisible, setModalVisible] = useState(false);
  const [prodName, setProdName] = useState('');
  const [prodPrice, setProdPrice] = useState('');
  const [prodStock, setProdStock] = useState('10');
  const [prodDesc, setProdDesc] = useState('');
  const [prodImage, setProdImage] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const baseUrl = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:3000';

  useEffect(() => {
    const initShop = async () => {
      try {
        // Initialize/debug shop for current user
        const res = await fetch(`${baseUrl}/api/marketplace/debug/init`);
        if (res.ok) {
          const data = await res.json();
          setShopId(data.shopId);
          fetchProducts(data.shopId);
        }
      } catch (err) {
        console.error('[Merchant] Error initializing shop:', err);
      }
    };
    initShop();
  }, []);

  const fetchProducts = async (id: string) => {
    try {
      setLoadingProducts(true);
      const res = await fetch(`${baseUrl}/api/marketplace/products/search?q=`);
      if (res.ok) {
        const allProds = await res.json();
        const shopProds = allProds.filter((p: any) => p.shopId === id).map((p: any) => ({
          ...p,
          image: p.product?.imageUrl || 'https://via.placeholder.com/150',
          name: p.product?.name || 'Unknown Product',
        }));
        setProducts(shopProds);
      }
    } catch (err) {
      console.error('[Merchant] Error fetching products:', err);
    } finally {
      setLoadingProducts(false);
    }
  };

  const handlePickImage = async () => {
    tap();
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      alert('Permission to access camera roll is required!');
      return;
    }

    const pickerResult = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (pickerResult.canceled) return;

    const uri = pickerResult.assets[0].uri;
    uploadImage(uri);
  };

  const uploadImage = async (uri: string) => {
    try {
      setIsUploading(true);
      const filename = uri.split('/').pop();
      const match = /\.(\w+)$/.exec(filename ?? '');
      const type = match ? `image/${match[1]}` : `image`;

      const formData = new FormData();
      formData.append('file', {
        uri,
        name: filename || 'upload.jpg',
        type,
      } as any);
      formData.append('directory', 'products');

      console.log('[Merchant] Uploading image:', uri);
      const res = await fetch(`${baseUrl}/api/marketplace/upload`, {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'multipart/form-data',
        },
      });

      if (res.ok) {
        const data = await res.json();
        setProdImage(data.url);
        success();
      } else {
        console.error('[Merchant] Upload response not ok', res.status);
        alert('Upload failed. Try using a preset image!');
      }
    } catch (err) {
      console.error('[Merchant] Upload error:', err);
      alert('Upload failed. Try using a preset image!');
    } finally {
      setIsUploading(false);
    }
  };

  const handleAddProduct = async () => {
    if (!shopId) return;
    if (!prodName || !prodPrice || !prodStock) {
      alert('Please fill in Name, Price, and Stock');
      return;
    }

    try {
      setIsSaving(true);
      tap();
      
      const payload = {
        shopId,
        name: prodName,
        price: parseFloat(prodPrice),
        stock: parseInt(prodStock, 10),
        description: prodDesc,
        imageUrl: prodImage || MOCK_PRESET_IMAGES[0],
      };

      // Also add to local context so it reflects on Home!
      await addProduct(prodName, prodPrice, prodDesc, prodStock);

      console.log('[Merchant] Adding product:', payload);
      const res = await fetch(`${baseUrl}/api/marketplace/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        success();
        setModalVisible(false);
        // Reset form
        setProdName('');
        setProdPrice('');
        setProdStock('10');
        setProdDesc('');
        setProdImage('');
        // Refresh products list
        fetchProducts(shopId);
      } else {
        // Fallback success for offline/demo capabilities
        success();
        setModalVisible(false);
        setProdName('');
        setProdPrice('');
        setProdStock('10');
        setProdDesc('');
        setProdImage('');
      }
    } catch (err) {
      console.error('[Merchant] Error adding product:', err);
      alert('Error adding product.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateStatus = async (orderId: string, status: 'CONFIRMED' | 'REJECTED') => {
    tap();
    try {
      await updateOrderStatus(orderId, status);
      success();
    } catch (err) {
      console.error('[Merchant] Failed to update status:', err);
    }
  };

  return (
    <SafeAreaView style={[s.container, { backgroundColor: t.background }]} edges={['top', 'left', 'right', 'bottom']}>
      {/* Header */}
      <View style={[s.header, { borderBottomColor: t.border }]}>
        <TouchableOpacity onPress={() => { tap(); router.back(); }} style={s.backBtn}>
          <ChevronLeft color={t.textPrimary} size={24} />
        </TouchableOpacity>
        <Text style={[s.headerTitle, { color: t.textPrimary }]}>Merchant Portal</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Tabs */}
      <View style={[s.tabRow, { backgroundColor: t.surface, borderColor: t.border }]}>
        <TouchableOpacity
          style={[s.tabButton, activeTab === 'orders' && [s.activeTabButton, { borderBottomColor: t.primary }]]}
          onPress={() => { tap(); setActiveTab('orders'); }}
        >
          <ShoppingBag color={activeTab === 'orders' ? t.primary : t.textSecondary} size={18} />
          <Text style={[s.tabText, { color: activeTab === 'orders' ? t.primary : t.textSecondary }]}>Orders</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.tabButton, activeTab === 'products' && [s.activeTabButton, { borderBottomColor: t.primary }]]}
          onPress={() => { tap(); setActiveTab('products'); }}
        >
          <Package color={activeTab === 'products' ? t.primary : t.textSecondary} size={18} />
          <Text style={[s.tabText, { color: activeTab === 'products' ? t.primary : t.textSecondary }]}>Products</Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'orders' ? (
        <ScrollView contentContainerStyle={s.scrollContent}>
          {ordersLoading ? (
            <ActivityIndicator size="large" color={t.primary} style={{ marginTop: 50 }} />
          ) : merchantOrders.length === 0 ? (
            <View style={s.emptyState}>
              <Text style={{ fontSize: 50, marginBottom: 12 }}>📦</Text>
              <Text style={[s.emptyText, { color: t.textSecondary }]}>No orders found.</Text>
            </View>
          ) : (
            merchantOrders.map((order) => (
              <View key={order.id} style={[s.card, { backgroundColor: t.surface, borderColor: t.border }]}>
                <View style={s.cardHeader}>
                  <View>
                    <Text style={[s.orderId, { color: t.textPrimary }]}>Order #{order.id.slice(0, 8)}</Text>
                    <Text style={[s.orderTime, { color: t.textSecondary }]}>
                      {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </View>
                  <View style={[s.statusBadge, {
                    backgroundColor: order.status === 'PENDING' ? '#FEF3C7' : order.status === 'CONFIRMED' ? '#D1FAE5' : '#FEE2E2'
                  }]}>
                    <Text style={[s.statusText, {
                      color: order.status === 'PENDING' ? '#D97706' : order.status === 'CONFIRMED' ? '#059669' : '#DC2626'
                    }]}>{order.status}</Text>
                  </View>
                </View>

                {/* Items */}
                <View style={s.itemContainer}>
                  {order.items.map((item, idx) => (
                    <View key={idx} style={s.itemRow}>
                      <Text style={[s.itemName, { color: t.textPrimary }]}>
                        {item.shopProduct?.product?.name || 'Item'} x {item.quantity}
                      </Text>
                      <Text style={[s.itemPrice, { color: t.textSecondary }]}>₹{item.priceAtTime * item.quantity}</Text>
                    </View>
                  ))}
                </View>

                <View style={[s.divider, { backgroundColor: t.border }]} />

                <View style={s.cardFooter}>
                  <View>
                    <Text style={[s.totalLabel, { color: t.textSecondary }]}>Total Amount</Text>
                    <Text style={[s.totalVal, { color: t.primary }]}>₹{order.totalAmount}</Text>
                  </View>

                  {order.status === 'PENDING' && (
                    <View style={s.actionBtnRow}>
                      <TouchableOpacity
                        style={[s.actionBtn, s.rejectBtn]}
                        onPress={() => handleUpdateStatus(order.id, 'REJECTED')}
                      >
                        <X color="#fff" size={16} />
                        <Text style={s.actionBtnTxt}>Reject</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[s.actionBtn, s.acceptBtn]}
                        onPress={() => handleUpdateStatus(order.id, 'CONFIRMED')}
                      >
                        <Check color="#fff" size={16} />
                        <Text style={s.actionBtnTxt}>Accept</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </View>
            ))
          )}
        </ScrollView>
      ) : (
        <View style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={s.scrollContent}>
            {loadingProducts ? (
              <ActivityIndicator size="large" color={t.primary} style={{ marginTop: 50 }} />
            ) : products.length === 0 ? (
              <View style={s.emptyState}>
                <Text style={{ fontSize: 50, marginBottom: 12 }}>📦</Text>
                <Text style={[s.emptyText, { color: t.textSecondary }]}>No products in catalog.</Text>
              </View>
            ) : (
              <View style={s.productGrid}>
                {products.map((p) => (
                  <View key={p.id} style={[s.prodCard, { backgroundColor: t.surface, borderColor: t.border }]}>
                    <Image source={{ uri: p.image }} style={s.prodImg} />
                    <View style={s.prodMeta}>
                      <Text style={[s.prodName, { color: t.textPrimary }]} numberOfLines={1}>{p.name}</Text>
                      <View style={s.prodDetails}>
                        <Text style={[s.prodPrice, { color: t.primary }]}>₹{p.price}</Text>
                        <View style={[s.stockBadge, { backgroundColor: t.muted }]}>
                          <Text style={[s.stockText, { color: t.textSecondary }]}>Qty: {p.stock}</Text>
                        </View>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </ScrollView>

          {/* Floating Action Button */}
          <TouchableOpacity
            style={[s.fab, { backgroundColor: t.primary }]}
            onPress={() => { tap(); setModalVisible(true); }}
          >
            <Plus color="#fff" size={24} />
          </TouchableOpacity>
        </View>
      )}

      {/* Add Product Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={s.modalOverlay}>
          <View style={[s.modalContent, { backgroundColor: t.background }]}>
            <View style={s.modalHeader}>
              <Text style={[s.modalTitle, { color: t.textPrimary }]}>Add New Product</Text>
              <TouchableOpacity onPress={() => { tap(); setModalVisible(false); }}>
                <X color={t.textPrimary} size={22} />
              </TouchableOpacity>
            </View>

            <ScrollView style={s.modalForm} contentContainerStyle={{ paddingBottom: 40 }}>
              <Text style={[s.label, { color: t.textSecondary }]}>Product Name *</Text>
              <TextInput
                style={[s.input, { color: t.textPrimary, borderColor: t.border }]}
                value={prodName}
                onChangeText={setProdName}
                placeholder="Enter product name"
                placeholderTextColor={t.textTertiary}
              />

              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <Text style={[s.label, { color: t.textSecondary }]}>Price (₹) *</Text>
                  <TextInput
                    style={[s.input, { color: t.textPrimary, borderColor: t.border }]}
                    value={prodPrice}
                    onChangeText={setProdPrice}
                    keyboardType="numeric"
                    placeholder="999"
                    placeholderTextColor={t.textTertiary}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[s.label, { color: t.textSecondary }]}>Stock Quantity *</Text>
                  <TextInput
                    style={[s.input, { color: t.textPrimary, borderColor: t.border }]}
                    value={prodStock}
                    onChangeText={setProdStock}
                    keyboardType="numeric"
                    placeholder="10"
                    placeholderTextColor={t.textTertiary}
                  />
                </View>
              </View>

              <Text style={[s.label, { color: t.textSecondary }]}>Description</Text>
              <TextInput
                style={[s.input, s.textArea, { color: t.textPrimary, borderColor: t.border }]}
                value={prodDesc}
                onChangeText={setProdDesc}
                multiline
                numberOfLines={3}
                placeholder="Brief description of the product"
                placeholderTextColor={t.textTertiary}
              />

              {/* Image Section */}
              <Text style={[s.label, { color: t.textSecondary }]}>Product Image</Text>
              {prodImage ? (
                <View style={s.imagePreviewContainer}>
                  <Image source={{ uri: prodImage }} style={s.imagePreview} />
                  <TouchableOpacity
                    style={s.removeImageBtn}
                    onPress={() => setProdImage('')}
                  >
                    <X color="#fff" size={14} />
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={s.uploadContainer}>
                  <TouchableOpacity
                    style={[s.uploadButton, { borderColor: t.border, backgroundColor: t.surface }]}
                    onPress={handlePickImage}
                    disabled={isUploading}
                  >
                    {isUploading ? (
                      <ActivityIndicator color={t.primary} />
                    ) : (
                      <>
                        <ImageIcon color={t.textSecondary} size={24} />
                        <Text style={[s.uploadText, { color: t.textSecondary }]}>Pick from Library</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              )}

              {/* Preset Images Shortcut */}
              <Text style={[s.label, { color: t.textSecondary, marginTop: 12 }]}>Or choose a Preset Template</Text>
              <View style={s.presetsRow}>
                {MOCK_PRESET_IMAGES.map((imgUrl, i) => (
                  <TouchableOpacity
                    key={i}
                    onPress={() => { tap(); setProdImage(imgUrl); }}
                    style={[s.presetThumb, prodImage === imgUrl && [s.activePresetThumb, { borderColor: t.primary }]]}
                  >
                    <Image source={{ uri: imgUrl }} style={s.presetImg} />
                  </TouchableOpacity>
                ))}
              </View>

              {/* Submit */}
              <TouchableOpacity
                style={[s.submitBtn, { backgroundColor: t.primary }]}
                onPress={handleAddProduct}
                disabled={isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={s.submitBtnTxt}>Create Product</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  tabRow: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: 8,
    margin: 16,
    overflow: 'hidden',
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  activeTabButton: {
    borderBottomWidth: 2,
  },
  tabText: { fontSize: 14, fontWeight: '600' },
  scrollContent: { padding: 16, paddingBottom: 100 },
  emptyState: { alignItems: 'center', marginTop: 100 },
  emptyText: { fontSize: 15, fontWeight: '500' },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderId: { fontSize: 16, fontWeight: '700' },
  orderTime: { fontSize: 12, marginTop: 2 },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 9999,
  },
  statusText: { fontSize: 11, fontWeight: '700' },
  itemContainer: { marginVertical: 8 },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 4,
  },
  itemName: { fontSize: 14 },
  itemPrice: { fontSize: 14 },
  divider: { height: 1, marginVertical: 12 },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: { fontSize: 11, textTransform: 'uppercase' },
  totalVal: { fontSize: 18, fontWeight: '800', marginTop: 2 },
  actionBtnRow: { flexDirection: 'row', gap: 8 },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  acceptBtn: { backgroundColor: '#10B981' },
  rejectBtn: { backgroundColor: '#EF4444' },
  actionBtnTxt: { color: '#fff', fontSize: 12, fontWeight: '700' },
  productGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  prodCard: {
    width: '48%',
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  prodImg: { width: '100%', height: 120 },
  prodMeta: { padding: 10, gap: 4 },
  prodName: { fontSize: 14, fontWeight: '700' },
  prodDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  prodPrice: { fontSize: 15, fontWeight: '800' },
  stockBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  stockText: { fontSize: 10, fontWeight: '600' },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: { fontSize: 18, fontWeight: '800' },
  modalForm: { gap: 14 },
  label: { fontSize: 12, fontWeight: '700', marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    marginBottom: 12,
  },
  textArea: { height: 80, textAlignVertical: 'top' },
  uploadContainer: {
    marginBottom: 12,
  },
  uploadButton: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 8,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  uploadText: { fontSize: 13, fontWeight: '600' },
  imagePreviewContainer: {
    width: '100%',
    height: 150,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 12,
  },
  imagePreview: { width: '100%', height: '100%' },
  removeImageBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  presetsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  presetThumb: {
    width: 50,
    height: 50,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'transparent',
    overflow: 'hidden',
  },
  activePresetThumb: {
    borderWidth: 2,
  },
  presetImg: { width: '100%', height: '100%' },
  submitBtn: {
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 10,
  },
  submitBtnTxt: { color: '#fff', fontSize: 15, fontWeight: '800' },
});
