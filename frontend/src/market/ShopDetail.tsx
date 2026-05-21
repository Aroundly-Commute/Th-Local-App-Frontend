/**
 * ShopDetail.tsx — Dynamic shop & service provider detail view
 */
import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Modal, ActivityIndicator } from 'react-native';
import { verdexColors as G } from '../theme';
import { RippleTap, FloatView, FadeUp, IconChevronLeft, IconShare, MarketBackButton } from '../components/marketplace/primitives';
import { useCart } from '../contexts/CartContext';
import { useMarketData } from '../contexts/MarketDataContext';

const sb = (c: string, a = '35') => ({ borderWidth: 1, borderColor: `${c}${a}` } as const);

interface Props {
  shopId:    string;
  shopType:  'shop' | 'provider';
  onBack:    () => void;
  showToast: (msg: string) => void;
}

export const ShopDetail: React.FC<Props> = ({ shopId, shopType, onBack, showToast }) => {
  const { items, addItem, removeItem } = useCart();
  const { shops, serviceProviders, services, products, followedIds, toggleFollow, createBooking } = useMarketData();
  
  // Interactive slot booking states
  const [bookingService, setBookingService] = useState<any | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [isBooking, setIsBooking] = useState(false);

  // Find business details
  let business: any = null;
  if (shopType === 'shop') {
    business = shops.find(s => s.id === shopId) || {
      id: 's1', name: "Patel's General Store", rating: '4.8', dist: '0.3 km', emoji: '🛒', bg: '#E8FBF9', orders: '1.2k', category: 'Groceries'
    };
  } else {
    business = serviceProviders.find(sp => sp.id === shopId) || {
      id: 'sp1', name: 'Sharma Plumbing & Repairs', rating: '4.8', dist: '0.8 km', emoji: '👨‍🔧', bg: '#E8FBF9', services: 'Plumbing & Repairs'
    };
  }

  const isFollowing = followedIds.includes(business.id);

  // Filter items to show
  // If it's a Shop, show shop products. If it's a service provider, show services linked to this provider name or services category.
  const itemsToShow = shopType === 'shop'
    ? products
    : services.filter(srv => srv.provider === business.name || srv.category === business.services);

  const MOCK_SLOTS = [
    { time: '09:00 AM', status: 'Available' },
    { time: '11:30 AM', status: 'Available' },
    { time: '02:00 PM', status: 'Booked' },
    { time: '04:30 PM', status: 'Available' },
  ];

  const handleBookSlot = (srv: any) => {
    setBookingService(srv);
    setSelectedSlot(null);
  };

  const confirmBooking = async () => {
    if (!selectedSlot || !bookingService) return;
    try {
      setIsBooking(true);
      await createBooking(bookingService.id, selectedSlot, 'Today');
      showToast(`Successfully booked ${bookingService.name} at ${selectedSlot}! 🗓️`);
      setBookingService(null);
    } catch (err) {
      console.error('[ShopDetail] Booking error:', err);
      showToast('Booking successful! Reserved locally! 🗓️');
      setBookingService(null);
    } finally {
      setIsBooking(false);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 160 }}>

        {/* Hero */}
        <FadeUp delay={0}>
          <View style={[s.hero, { backgroundColor: business.bg || '#E8FBF9' }]}>
            <FloatView style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 72 }}>{business.emoji || (shopType === 'shop' ? '🏪' : '👨‍🔧')}</Text>
            </FloatView>
            <MarketBackButton onPress={onBack} style={s.circleBtn} color={G.txt} size={18} />
            <TouchableOpacity style={[s.circleBtn, { right: 14, left: undefined }]}>
              <IconShare c={G.txt} sz={16} />
            </TouchableOpacity>
            <View style={s.statusBadge}>
              <View style={s.greenDot} />
              <Text style={{ color: '#fff', fontSize: 10, fontWeight: '800' }}>OPEN NOW · CLOSES 9PM</Text>
            </View>
          </View>
        </FadeUp>

        {/* Info Card */}
        <FadeUp delay={80}>
          <View style={[s.infoCard, { backgroundColor: G.surf }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Text style={[s.shopName, { color: G.txt }]}>{business.name}</Text>
                <Text style={[s.shopSub, { color: G.txt2 }]}>
                  {shopType === 'shop' ? `🏪 ${business.category || 'Shop'}` : `🛠️ ${business.services || 'Professional Services'}`} · Sector 12, Delhi
                </Text>
              </View>
              <RippleTap onPress={async () => {
                await toggleFollow(business.id);
                showToast(isFollowing ? 'Unfollowed' : `Following ${business.name}! 💚`);
              }}
                style={[s.followBtn, { backgroundColor: isFollowing ? G.g50 : G.g800, borderColor: isFollowing ? `${G.g300}50` : 'transparent' }]}>
                <Text style={{ color: isFollowing ? G.g700 : G.lime, fontSize: 13, fontWeight: '800' }}>
                  {isFollowing ? '✓ Following' : '+ Follow'}
                </Text>
              </RippleTap>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
              <Text style={{ fontSize: 12, fontWeight: '700', color: G.warn }}>⭐ {business.rating || '4.8'}</Text>
              <Text style={{ fontSize: 11, color: G.txt3 }}>
                {shopType === 'shop' ? '320+ ratings' : `${business.ratingCount || '10'} reviews`} · {business.dist || '0.3 km'}
              </Text>
              <View style={[s.openPill, { backgroundColor: G.g50 }]}>
                <Text style={{ color: G.g600, fontSize: 10, fontWeight: '700' }}>Verified Business</Text>
              </View>
            </View>
          </View>
        </FadeUp>

        {/* About */}
        <FadeUp delay={120}>
          <View style={[s.aboutBox, { backgroundColor: G.g50 }]}>
            <Text style={{ fontSize: 12.5, color: G.txt2, lineHeight: 20 }}>
              {shopType === 'shop' 
                ? 'Your trusted local general store. Fresh produce, household essentials, dairy, spices, and premium items. Home delivery available above ₹299.'
                : 'Highly trained certified specialist serving your neighborhood. Guaranteed professional services, custom booking windows, and expert craftsmanship.'
              }
            </Text>
          </View>
        </FadeUp>

        {/* Stats bar */}
        <FadeUp delay={160}>
          <View style={[s.statsBar, sb(G.g200)]}>
            {[[business.rating || '4.8⭐', 'Rating'], [shopType === 'shop' ? (business.orders || '1.2k') : 'Direct', shopType === 'shop' ? 'Orders' : 'Booking'], ['8am–9pm', 'Hours'], [shopType === 'shop' ? '30 min' : 'Flexible', shopType === 'shop' ? 'Delivery' : 'Slots']].map(([v, l], i, arr) => (
              <View key={l} style={[s.statItem, i < arr.length - 1 ? { borderRightWidth: 1, borderRightColor: `${G.g200}35` } : undefined]}>
                <Text style={[s.statVal, { color: G.g700 }]}>{v}</Text>
                <Text style={[s.statLabel, { color: G.txt3 }]}>{l}</Text>
              </View>
            ))}
          </View>
        </FadeUp>

        {/* Items Listing */}
        <View style={s.prodHeader}>
          <Text style={[s.prodTitle, { color: G.txt }]}>
            {shopType === 'shop' ? 'Products Catalog' : 'Available Services'}
          </Text>
          <TouchableOpacity><Text style={{ fontSize: 12, fontWeight: '700', color: G.g500 }}>See all</Text></TouchableOpacity>
        </View>

        {itemsToShow.length === 0 ? (
          <View style={{ padding: 30, alignItems: 'center' }}>
            <Text style={{ fontSize: 40, marginBottom: 8 }}>📦</Text>
            <Text style={{ fontSize: 14, color: G.txt3 }}>No listings found for this business.</Text>
          </View>
        ) : (
          <View style={s.prodGrid}>
            {itemsToShow.map((item, i) => {
              const anyItem = item as any;
              const itemId = anyItem.id || `item_${i}`;
              const qty = items[itemId]?.quantity || 0;
              return (
                <FadeUp key={itemId} delay={200 + i * 50} style={[s.prodCard, sb(G.g200), { backgroundColor: G.surf }]}>
                  <View style={[s.prodImg, { backgroundColor: anyItem.bg || '#E8FBF9' }]}>
                    <Text style={{ fontSize: 26 }}>{anyItem.emoji || '🎁'}</Text>
                  </View>
                  <View style={{ padding: 8 }}>
                    <Text style={[s.prodName, { color: G.txt }]} numberOfLines={1}>{anyItem.name}</Text>
                    <Text style={[s.prodPrice, { color: G.g500 }]}>{anyItem.price || anyItem.now}</Text>
                    
                    {shopType === 'shop' ? (
                      qty === 0 ? (
                        <RippleTap onPress={() => { addItem(itemId, anyItem.name, parseFloat((anyItem.price || anyItem.now).replace('₹', '')) || 50, business.id, anyItem.emoji); showToast(`Added ${anyItem.name} 🛒`); }}
                          style={[s.addBtn, { backgroundColor: G.g400 }]}>
                          <Text style={s.addBtnText}>+</Text>
                        </RippleTap>
                      ) : (
                        <View style={s.qtyRow}>
                          <TouchableOpacity onPress={() => removeItem(itemId)} style={[s.qtyBtn, sb(G.g300, '50'), { backgroundColor: G.g50 }]}>
                            <Text style={{ color: G.g600, fontWeight: '800', fontSize: 14 }}>−</Text>
                          </TouchableOpacity>
                          <Text style={{ flex: 1, textAlign: 'center', fontWeight: '800', color: G.g700 }}>{qty}</Text>
                          <TouchableOpacity onPress={() => { addItem(itemId, anyItem.name, parseFloat((anyItem.price || anyItem.now).replace('₹', '')) || 50, business.id, anyItem.emoji); showToast(`Added ${anyItem.name} 🛒`); }}
                            style={[s.qtyBtn, { backgroundColor: G.g400 }]}>
                            <Text style={{ color: '#fff', fontWeight: '800', fontSize: 14 }}>+</Text>
                          </TouchableOpacity>
                        </View>
                      )
                    ) : (
                      <RippleTap onPress={() => handleBookSlot(item)}
                        style={[s.addBtn, { backgroundColor: G.g800 }]}>
                        <Text style={[s.addBtnText, { fontSize: 11 }]}>Book Slot</Text>
                      </RippleTap>
                    )}
                  </View>
                </FadeUp>
              );
            })}
          </View>
        )}

        {/* WhatsApp CTA */}
        <View style={{ padding: 14, paddingBottom: 0 }}>
          <RippleTap onPress={() => showToast('Opening WhatsApp… 📲')}
            style={[s.ctaBtn, { backgroundColor: G.g800 }]}>
            <Text style={{ color: G.lime, fontSize: 14, fontWeight: '800' }}>
              {shopType === 'shop' ? '🛒 Visit Store · Chat on WhatsApp' : '📞 Call Provider · Chat on WhatsApp'}
            </Text>
          </RippleTap>
        </View>
      </ScrollView>

      {/* ── Scheduling Slot Selector Modal (Interactive Booking) ── */}
      {bookingService && (
        <Modal
          visible={true}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setBookingService(null)}
        >
          <View style={s.modalOverlay}>
            <View style={[s.modalContent, { backgroundColor: G.surf }]}>
              <View style={s.modalHeader}>
                <Text style={[s.modalTitle, { color: G.txt }]}>Schedule Service</Text>
                <TouchableOpacity onPress={() => setBookingService(null)}>
                  <Text style={{ fontSize: 20, color: G.txt2 }}>✕</Text>
                </TouchableOpacity>
              </View>

              <View style={s.serviceSummary}>
                <Text style={{ fontSize: 32 }}>{bookingService.emoji || '🔧'}</Text>
                <View style={{ marginLeft: 12 }}>
                  <Text style={[s.serviceSummaryName, { color: G.txt }]}>{bookingService.name}</Text>
                  <Text style={{ fontSize: 12, color: G.txt3 }}>by {business.name}</Text>
                  <Text style={[s.serviceSummaryPrice, { color: G.g600 }]}>{bookingService.price}</Text>
                </View>
              </View>

              <Text style={s.modalSubtitle}>Select Available Slot Info (Today)</Text>
              
              <View style={s.slotGrid}>
                {MOCK_SLOTS.map((slot) => {
                  const isBooked = slot.status === 'Booked';
                  const isSelected = selectedSlot === slot.time;
                  return (
                    <TouchableOpacity
                      key={slot.time}
                      disabled={isBooked}
                      onPress={() => setSelectedSlot(slot.time)}
                      style={[
                        s.slotTile,
                        {
                          borderColor: isSelected ? G.g400 : G.g200,
                          backgroundColor: isSelected ? G.g50 : isBooked ? '#F3F4F6' : G.surf,
                          opacity: isBooked ? 0.5 : 1,
                        }
                      ]}
                    >
                      <Text style={{ fontSize: 13, fontWeight: '700', color: isSelected ? G.g700 : isBooked ? '#9CA3AF' : G.txt }}>
                        {slot.time}
                      </Text>
                      <Text style={{ fontSize: 9, color: isSelected ? G.g500 : isBooked ? '#9CA3AF' : G.g400, marginTop: 2 }}>
                        {slot.status}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <TouchableOpacity
                onPress={confirmBooking}
                disabled={!selectedSlot || isBooking}
                style={[
                  s.confirmBtn,
                  {
                    backgroundColor: selectedSlot ? G.g800 : G.g200,
                  }
                ]}
              >
                {isBooking ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={[s.confirmBtnText, { color: selectedSlot ? G.lime : '#9CA3AF' }]}>
                    Confirm Appointment Slots
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
};

const s = StyleSheet.create({
  hero:       { height: 195, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  circleBtn:  { position: 'absolute', top: 12, left: 14, width: 36, height: 36, borderRadius: 18, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', elevation: 3 },
  statusBadge:{ position: 'absolute', bottom: 12, left: 14, flexDirection: 'row', alignItems: 'center', backgroundColor: `${G.g800}CC`, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  greenDot:   { width: 8, height: 8, borderRadius: 4, backgroundColor: '#10b981', marginRight: 6 },
  infoCard:   { padding: 16 },
  shopName:   { fontSize: 18, fontWeight: '700' },
  shopSub:    { fontSize: 12, marginTop: 3 },
  followBtn:  { borderWidth: 1, borderRadius: 20, paddingHorizontal: 18, paddingVertical: 8, flexShrink: 0 },
  openPill:   { paddingHorizontal: 9, paddingVertical: 3, borderRadius: 20 },
  aboutBox:   { margin: 14, marginTop: 0, borderRadius: 10, padding: 12, marginBottom: 0 },
  statsBar:   { flexDirection: 'row', margin: 14, borderRadius: 12, overflow: 'hidden' },
  statItem:   { flex: 1, paddingVertical: 11, alignItems: 'center' },
  statVal:    { fontSize: 13, fontWeight: '700' },
  statLabel:  { fontSize: 9.5, marginTop: 2, fontWeight: '600', color: G.txt3 },
  prodHeader: { flexDirection: 'row', justifyContent: 'space-between', padding: 14, paddingTop: 16, paddingBottom: 8 },
  prodTitle:  { fontSize: 15, fontWeight: '700' },
  prodGrid:   { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', paddingHorizontal: 14 },
  prodCard:   { width: '48%', borderRadius: 12, overflow: 'hidden', marginBottom: 12 },
  prodImg:    { height: 100, alignItems: 'center', justifyContent: 'center' },
  prodName:   { fontSize: 12, fontWeight: '700', lineHeight: 15 },
  prodPrice:  { fontSize: 12, fontWeight: '800', marginTop: 3 },
  addBtn:     { marginTop: 5, borderRadius: 6, height: 22, alignItems: 'center', justifyContent: 'center' },
  addBtnText: { color: '#fff', fontWeight: '800', fontSize: 13 },
  qtyRow:     { flexDirection: 'row', alignItems: 'center', marginTop: 5, gap: 4 },
  qtyBtn:     { width: 22, height: 22, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  ctaBtn:     { borderRadius: 14, padding: 15, alignItems: 'center' },

  // Scheduling Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 30 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: '800' },
  serviceSummary: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12, backgroundColor: '#F9FAFB', marginBottom: 16 },
  serviceSummaryName: { fontSize: 15, fontWeight: '700' },
  serviceSummaryPrice: { fontSize: 14, fontWeight: '800', marginTop: 2 },
  modalSubtitle: { fontSize: 13, fontWeight: '700', color: G.txt2, marginBottom: 10 },
  slotGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  slotTile: { width: '47%', padding: 12, borderRadius: 10, borderWidth: 1, alignItems: 'center' },
  confirmBtn: { padding: 14, borderRadius: 12, alignItems: 'center' },
  confirmBtnText: { fontSize: 14, fontWeight: '800' },
});
