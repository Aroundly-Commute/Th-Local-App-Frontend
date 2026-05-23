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
  const { addProduct, addService, registeredRole, registeredBrandName } = useMarketData();

  const [activeTab, setActiveTab] = useState<'orders' | 'products'>('orders');
  const [shopId, setShopId] = useState<string | null>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  // Bookings state (Service Provider Mode)
  const [bookings, setBookings] = useState<any[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(false);

  // Add Product / Service Form State
  const [modalVisible, setModalVisible] = useState(false);
  const [prodName, setProdName] = useState('');
  const [prodPrice, setProdPrice] = useState('');
  const [prodStock, setProdStock] = useState('10'); // Doubles as Category for service provider mode!
  const [prodDesc, setProdDesc] = useState('');
  const [prodImage, setProdImage] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const baseUrl = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:3000';

  useEffect(() => {
    if (!user?.id) return;
    const initBusiness = async () => {
      try {
        if (registeredRole === 'provider') {
          await fetchServices();
          await fetchBookings();
        } else {
          // Merchant mode: Fetch shop for this user dynamically
          const res = await fetch(`${baseUrl}/api/marketplace/user-business?userId=${user?.id}`);
          let loadedShopId = null;
          if (res.ok) {
            const biz = await res.json();
            if (biz.role === 'merchant') {
              const shopsRes = await fetch(`${baseUrl}/api/marketplace/shops/search?q=`);
              if (shopsRes.ok) {
                const shops = await shopsRes.json();
                const userShop = shops.find((s: any) => s.ownerId === user?.id);
                if (userShop) {
                  loadedShopId = userShop.id;
                }
              }
            }
          }

          // Fallback to debug init if no shop is found
          if (!loadedShopId) {
            const fallbackRes = await fetch(`${baseUrl}/api/marketplace/debug/init`);
            if (fallbackRes.ok) {
              const data = await fallbackRes.json();
              loadedShopId = data.shopId;
            }
          }

          if (loadedShopId) {
            setShopId(loadedShopId);
            await fetchProducts(loadedShopId);
          }
        }
      } catch (err) {
        console.error('[Merchant] Error initializing business:', err);
      }
    };
    initBusiness();
  }, [user, registeredRole, registeredBrandName]);

  const fetchProducts = async (id: string) => {
    try {
      setLoadingProducts(true);
      const res = await fetch(`${baseUrl}/api/marketplace/products/search?q=`);
      if (res.ok) {
        const allProds = await res.json();
        const shopProds = allProds.filter((p: any) => p.shopId === id).map((p: any) => ({
          id: p.id,
          name: p.product?.name || p.name || 'Unknown Product',
          price: p.price || 99,
          stock: p.stock || 10,
          image: p.product?.imageUrl || MOCK_PRESET_IMAGES[0],
          description: p.product?.description || '',
        }));
        setProducts(shopProds);
      }
    } catch (err) {
      console.error('[Merchant] Error fetching products:', err);
    } finally {
      setLoadingProducts(false);
    }
  };

  const fetchServices = async () => {
    try {
      setLoadingProducts(true);
      const res = await fetch(`${baseUrl}/api/marketplace/services/search?q=`);
      if (res.ok) {
        const allServices = await res.json();
        // Filter where provider's owner is the logged in user
        const providerServices = allServices
          .filter((s: any) => s.provider?.ownerId === user?.id)
          .map((s: any) => ({
            id: s.id,
            name: s.name,
            price: s.price,
            category: s.category || 'Plumbing & Repairs',
            description: s.description || 'Professional service',
            emoji: s.emoji || '🛠️',
          }));
        setProducts(providerServices);
      }
    } catch (err) {
      console.error('[Merchant] Error fetching services:', err);
    } finally {
      setLoadingProducts(false);
    }
  };

  const fetchBookings = async () => {
    try {
      setLoadingBookings(true);
      const res = await fetch(`${baseUrl}/api/marketplace/bookings/provider?userId=${user?.id}`);
      if (res.ok) {
        const data = await res.json();
        setBookings(data);
      }
    } catch (err) {
      console.error('[Merchant] Error fetching bookings:', err);
    } finally {
      setLoadingBookings(false);
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

      const res = await fetch(`${baseUrl}/api/marketplace/upload`, {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json',
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
    if (registeredRole === 'provider') {
      if (!prodName || !prodPrice || !prodStock) {
        alert('Please fill in Name, Price, and Category');
        return;
      }
      try {
        setIsSaving(true);
        tap();
        
        await addService(prodName, prodPrice, prodDesc, registeredBrandName || 'Local Provider', prodStock);
        
        success();
        setModalVisible(false);
        // Reset form
        setProdName('');
        setProdPrice('');
        setProdStock('Plumbing & Repairs');
        setProdDesc('');
        
        // Refresh services list
        await fetchServices();
      } catch (err) {
        console.error('[Merchant] Error adding service:', err);
        alert('Error adding service.');
      } finally {
        setIsSaving(false);
      }
    } else {
      if (!shopId) return;
      if (!prodName || !prodPrice || !prodStock) {
        alert('Please fill in Name, Price, and Stock');
        return;
      }

      try {
        setIsSaving(true);
        tap();
        
        await addProduct(prodName, prodPrice, prodDesc, prodStock);

        success();
        setModalVisible(false);
        // Reset form
        setProdName('');
        setProdPrice('');
        setProdStock('10');
        setProdDesc('');
        setProdImage('');
        // Refresh products list
        await fetchProducts(shopId);
      } catch (err) {
        console.error('[Merchant] Error adding product:', err);
        alert('Error adding product.');
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handleRemoveProduct = (id: string) => {
    tap();
    setProducts(prev => prev.filter(p => p.id !== id));
    success();
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

  const handleConfirmBooking = async (bookingId: string) => {
    tap();
    try {
      const res = await fetch(`${baseUrl}/api/marketplace/bookings/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId, status: 'CONFIRMED' }),
      });
      if (res.ok) {
        setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: 'CONFIRMED' } : b));
        success();
      }
    } catch (err) {
      console.error('[Merchant] Error confirming booking:', err);
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    tap();
    try {
      const res = await fetch(`${baseUrl}/api/marketplace/bookings/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId, status: 'CANCELLED' }),
      });
      if (res.ok) {
        setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: 'CANCELLED' } : b));
        success();
      }
    } catch (err) {
      console.error('[Merchant] Error cancelling booking:', err);
    }
  };

  return (
    <SafeAreaView style={[s.container, { backgroundColor: t.background }]} edges={['top', 'left', 'right', 'bottom']}>
      {/* Header */}
      <View style={[s.header, { borderBottomColor: t.border }]}>
        <TouchableOpacity onPress={() => { tap(); if (router.canGoBack()) { router.back(); } else { router.replace('/(tabs)/profile'); } }} style={s.backBtn}>
          <ChevronLeft color={t.textPrimary} size={24} />
        </TouchableOpacity>
        <Text style={[s.headerTitle, { color: t.textPrimary }]}>
          {registeredRole === 'provider' ? 'Service Manager' : 'Merchant Portal'}
        </Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Tabs */}
      <View style={[s.tabRow, { backgroundColor: t.surface, borderColor: t.border }]}>
        <TouchableOpacity
          style={[s.tabButton, activeTab === 'orders' && [s.activeTabButton, { borderBottomColor: t.primary }]]}
          onPress={() => { tap(); setActiveTab('orders'); }}
        >
          <ShoppingBag color={activeTab === 'orders' ? t.primary : t.textSecondary} size={18} />
          <Text style={[s.tabText, { color: activeTab === 'orders' ? t.primary : t.textSecondary }]}>
            {registeredRole === 'provider' ? 'Bookings' : 'Orders'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.tabButton, activeTab === 'products' && [s.activeTabButton, { borderBottomColor: t.primary }]]}
          onPress={() => { tap(); setActiveTab('products'); }}
        >
          <Package color={activeTab === 'products' ? t.primary : t.textSecondary} size={18} />
          <Text style={[s.tabText, { color: activeTab === 'products' ? t.primary : t.textSecondary }]}>
            {registeredRole === 'provider' ? 'Services' : 'Products'}
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'orders' ? (
        <ScrollView contentContainerStyle={s.scrollContent}>
          {registeredRole === 'provider' ? (
            // --- Service Bookings List ---
            loadingBookings ? (
              <ActivityIndicator size="large" color={t.primary} style={{ marginTop: 50 }} />
            ) : bookings.length === 0 ? (
              <View style={s.emptyState}>
                <Text style={{ fontSize: 50, marginBottom: 12 }}>📅</Text>
                <Text style={[s.emptyText, { color: t.textSecondary }]}>No appointments found.</Text>
              </View>
            ) : (
              bookings.map((booking) => (
                <View key={booking.id} style={[s.card, { backgroundColor: t.surface, borderColor: t.border }]}>
                  <View style={s.cardHeader}>
                    <View>
                      <Text style={[s.orderId, { color: t.textPrimary }]}>Appointment #{booking.id.slice(0, 8)}</Text>
                      <Text style={[s.orderTime, { color: t.textSecondary }]}>
                        {booking.date} · {booking.timeSlot}
                      </Text>
                    </View>
                    <View style={[s.statusBadge, {
                      backgroundColor: booking.status === 'CONFIRMED' ? '#D1FAE5' : booking.status === 'CANCELLED' || booking.status === 'REJECTED' ? '#FEE2E2' : '#FEF3C7'
                    }]}>
                      <Text style={[s.statusText, {
                        color: booking.status === 'CONFIRMED' ? '#059669' : booking.status === 'CANCELLED' || booking.status === 'REJECTED' ? '#DC2626' : '#D97706'
                      }]}>
                        {booking.status || 'PENDING'}
                      </Text>
                    </View>
                  </View>

                  <View style={s.itemContainer}>
                    <View style={s.itemRow}>
                      <Text style={[s.itemName, { color: t.textPrimary }]}>
                        Service: {booking.service?.name || 'General Service'}
                      </Text>
                      <Text style={[s.itemPrice, { color: t.textSecondary }]}>₹{booking.service?.price || '299'}</Text>
                    </View>
                    <Text style={{ fontSize: 12, color: t.textSecondary, marginTop: 4 }}>
                      Customer: {booking.user?.name || 'Local Customer'}
                    </Text>
                  </View>

                  <View style={[s.divider, { backgroundColor: t.border }]} />

                  <View style={s.cardFooter}>
                    <TouchableOpacity
                      style={[s.actionBtn, { backgroundColor: t.primary, paddingHorizontal: 12 }]}
                      onPress={() => {
                        tap();
                        router.push({
                          pathname: `/chat/chat_${booking.id}` as any,
                          params: { name: booking.user?.name || 'Customer' }
                        });
                      }}
                    >
                      <Text style={[s.actionBtnTxt, { color: t.primaryContrast }]}>💬 Chat</Text>
                    </TouchableOpacity>

                    {booking.status !== 'CONFIRMED' && booking.status !== 'CANCELLED' && booking.status !== 'REJECTED' && (
                      <View style={s.actionBtnRow}>
                        <TouchableOpacity
                          style={[s.actionBtn, s.rejectBtn, { marginRight: 6 }]}
                          onPress={() => handleCancelBooking(booking.id)}
                        >
                          <X color="#fff" size={16} />
                          <Text style={s.actionBtnTxt}>Reject</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[s.actionBtn, s.acceptBtn]}
                          onPress={() => handleConfirmBooking(booking.id)}
                        >
                          <Check color="#fff" size={16} />
                          <Text style={s.actionBtnTxt}>Confirm</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                </View>
              ))
            )
          ) : (
            // --- Merchant Orders List ---
            ordersLoading ? (
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

                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <TouchableOpacity
                        style={[s.actionBtn, { backgroundColor: t.primary, paddingHorizontal: 12 }]}
                        onPress={() => {
                          tap();
                          router.push({
                            pathname: `/chat/chat_${order.id}` as any,
                            params: { name: (order as any).user?.name || 'Customer' }
                          });
                        }}
                      >
                        <Text style={[s.actionBtnTxt, { color: t.primaryContrast }]}>💬 Chat</Text>
                      </TouchableOpacity>

                      {order.status === 'PENDING' && (
                        <View style={s.actionBtnRow}>
                          <TouchableOpacity
                            style={[s.actionBtn, s.rejectBtn, { marginRight: 6 }]}
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
                </View>
              ))
            )
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
                <Text style={[s.emptyText, { color: t.textSecondary }]}>
                  No {registeredRole === 'provider' ? 'services' : 'products'} in catalog.
                </Text>
              </View>
            ) : (
              <View style={s.productGrid}>
                {products.map((p) => (
                  <View key={p.id} style={[s.prodCard, { backgroundColor: t.surface, borderColor: t.border }]}>
                    {registeredRole === 'provider' ? (
                      <View style={[s.prodImg, { backgroundColor: '#E8FBF9', justifyContent: 'center', alignItems: 'center' }]}>
                        <Text style={{ fontSize: 32 }}>{p.emoji || '🛠️'}</Text>
                      </View>
                    ) : (
                      <Image source={{ uri: p.image }} style={s.prodImg} />
                    )}
                    <View style={s.prodMeta}>
                      <Text style={[s.prodName, { color: t.textPrimary }]} numberOfLines={1}>{p.name}</Text>
                      <View style={s.prodDetails}>
                        <Text style={[s.prodPrice, { color: t.primary }]}>₹{p.price}</Text>
                        <View style={[s.stockBadge, { backgroundColor: t.muted }]}>
                          <Text style={[s.stockText, { color: t.textSecondary }]}>
                            {registeredRole === 'provider' ? p.category : `Qty: ${p.stock}`}
                          </Text>
                        </View>
                      </View>
                    </View>
                    {/* Trash Delete button */}
                    <TouchableOpacity
                      style={s.deleteCardBtn}
                      onPress={() => handleRemoveProduct(p.id)}
                    >
                      <X color={t.error} size={14} />
                    </TouchableOpacity>
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

      {/* Add Product / Service Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={s.modalOverlay}>
          <View style={[s.modalContent, { backgroundColor: t.background }]}>
            <View style={s.modalHeader}>
              <Text style={[s.modalTitle, { color: t.textPrimary }]}>
                {registeredRole === 'provider' ? 'Add New Service' : 'Add New Product'}
              </Text>
              <TouchableOpacity onPress={() => { tap(); setModalVisible(false); }}>
                <X color={t.textPrimary} size={22} />
              </TouchableOpacity>
            </View>

            <ScrollView style={s.modalForm} contentContainerStyle={{ paddingBottom: 40 }}>
              <Text style={[s.label, { color: t.textSecondary }]}>
                {registeredRole === 'provider' ? 'Service Name *' : 'Product Name *'}
              </Text>
              <TextInput
                style={[s.input, { color: t.textPrimary, borderColor: t.border }]}
                value={prodName}
                onChangeText={setProdName}
                placeholder={registeredRole === 'provider' ? "e.g. AC Repairing" : "Enter product name"}
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
                    placeholder="299"
                    placeholderTextColor={t.textTertiary}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[s.label, { color: t.textSecondary }]}>
                    {registeredRole === 'provider' ? 'Category *' : 'Stock Quantity *'}
                  </Text>
                  <TextInput
                    style={[s.input, { color: t.textPrimary, borderColor: t.border }]}
                    value={prodStock}
                    onChangeText={setProdStock}
                    placeholder={registeredRole === 'provider' ? "Plumbing & Repairs" : "10"}
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
                placeholder={registeredRole === 'provider' ? "Service terms, tools, or expert summary" : "Brief description of the product"}
                placeholderTextColor={t.textTertiary}
              />

              {registeredRole !== 'provider' && (
                <>
                  {/* Image Section (Merchant only) */}
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
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.presetRow}>
                    {MOCK_PRESET_IMAGES.map((img, i) => (
                      <TouchableOpacity
                        key={i}
                        onPress={() => { tap(); setProdImage(img); }}
                        style={[s.presetCard, prodImage === img && { borderColor: t.primary }]}
                      >
                        <Image source={{ uri: img }} style={s.presetImg} />
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </>
              )}

              <TouchableOpacity
                style={[s.saveBtn, { backgroundColor: t.primary }]}
                onPress={handleAddProduct}
                disabled={isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={s.saveBtnTxt}>
                    {registeredRole === 'provider' ? 'Save Service' : 'Save Product'}
                  </Text>
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
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1 },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  tabRow: { flexDirection: 'row', borderBottomWidth: 1 },
  tabButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, gap: 8, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  activeTabButton: { borderBottomWidth: 2 },
  tabText: { fontSize: 14, fontWeight: '600' },
  scrollContent: { padding: 16, paddingBottom: 80 },
  emptyState: { alignItems: 'center', marginTop: 100 },
  emptyText: { fontSize: 15, fontWeight: '500' },
  card: { padding: 16, borderRadius: 12, borderWidth: 1, marginBottom: 16, elevation: 1 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  orderId: { fontSize: 15, fontWeight: '700', letterSpacing: -0.2 },
  orderTime: { fontSize: 12, marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusText: { fontSize: 10, fontWeight: '800' },
  itemContainer: { marginVertical: 4 },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 3 },
  itemName: { fontSize: 14, fontWeight: '500' },
  itemPrice: { fontSize: 14, fontWeight: '600' },
  divider: { height: 1, marginVertical: 12 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { fontSize: 11, fontWeight: '600' },
  totalVal: { fontSize: 18, fontWeight: '800' },
  actionBtnRow: { flexDirection: 'row', gap: 8 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8 },
  rejectBtn: { backgroundColor: '#EF4444' },
  acceptBtn: { backgroundColor: '#10B981' },
  actionBtnTxt: { color: '#fff', fontSize: 12, fontWeight: '700' },
  productGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, padding: 16 },
  prodCard: { width: '47%', borderRadius: 12, borderWidth: 1, overflow: 'hidden', position: 'relative' },
  prodImg: { height: 120, width: '100%', resizeMode: 'cover' },
  prodMeta: { padding: 12 },
  prodName: { fontSize: 14, fontWeight: '700' },
  prodDetails: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  prodPrice: { fontSize: 15, fontWeight: '800' },
  stockBadge: { paddingHorizontal: 6, paddingVertical: 3, borderRadius: 6 },
  stockText: { fontSize: 10, fontWeight: '700' },
  deleteCardBtn: { position: 'absolute', top: 8, right: 8, width: 26, height: 26, borderRadius: 13, backgroundColor: 'rgba(255, 255, 255, 0.9)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#fee2e2' },
  fab: { position: 'absolute', bottom: 24, right: 24, width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', elevation: 4 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, height: '85%', padding: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: '800' },
  modalForm: { flex: 1 },
  label: { fontSize: 12, fontWeight: '700', marginBottom: 6, marginTop: 12 },
  input: { borderWidth: 1, borderRadius: 10, padding: 12, fontSize: 14, marginBottom: 12 },
  textArea: { height: 80, textAlignVertical: 'top' },
  uploadContainer: { marginBottom: 12 },
  uploadButton: { borderWidth: 1, borderStyle: 'dashed', borderRadius: 12, height: 100, alignItems: 'center', justifyContent: 'center', gap: 8 },
  uploadText: { fontSize: 13, fontWeight: '600' },
  imagePreviewContainer: { position: 'relative', height: 120, width: '100%', marginBottom: 12 },
  imagePreview: { height: '100%', width: '100%', borderRadius: 12 },
  removeImageBtn: { position: 'absolute', top: 8, right: 8, width: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(0, 0, 0, 0.6)', alignItems: 'center', justifyContent: 'center' },
  presetRow: { gap: 8, marginBottom: 12 },
  presetCard: { width: 64, height: 64, borderRadius: 8, borderWidth: 2, borderColor: 'transparent', overflow: 'hidden' },
  presetImg: { width: '100%', height: '100%' },
  saveBtn: { padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 24 },
  saveBtnTxt: { color: '#fff', fontSize: 16, fontWeight: '800' },
});
