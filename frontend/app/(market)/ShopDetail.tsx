/**
 * ShopDetail.tsx — Verdex-style shop detail view (matches verdex_app.jsx Detail())
 */
import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { verdexColors as G } from '../../src/theme';
import { RippleTap, FloatView, FadeUp, IconChevronLeft, IconShare } from './components/primitives';
import { PRODS } from './data';
import { useCart } from './CartContext';

const sb = (c: string, a = '35') => ({ borderWidth: 1, borderColor: `${c}${a}` } as const);

interface Props {
  onBack:    () => void;
  showToast: (msg: string) => void;
}

export const ShopDetail: React.FC<Props> = ({ onBack, showToast }) => {
  const { items, addItem, removeItem } = useCart();
  const [following, setFollowing] = useState(false);

  return (
    <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>

      {/* Hero */}
      <FadeUp delay={0}>
        <View style={[s.hero, { backgroundColor: G.g50 }]}>
          <FloatView style={{ alignItems: 'center' }}>
            <Text style={{ fontSize: 72 }}>🛒</Text>
          </FloatView>
          <TouchableOpacity onPress={onBack} style={s.circleBtn}>
            <IconChevronLeft c={G.txt} sz={18} />
          </TouchableOpacity>
          <TouchableOpacity style={[s.circleBtn, { right: 14, left: undefined }]}>
            <IconShare c={G.txt} sz={16} />
          </TouchableOpacity>
          <View style={s.statusBadge}>
            <View style={s.greenDot} />
            <Text style={{ color: '#fff', fontSize: 10, fontWeight: '800' }}>OPEN NOW · CLOSES 9PM</Text>
          </View>
        </View>
      </FadeUp>

      {/* Shop Info */}
      <FadeUp delay={80}>
        <View style={[s.infoCard, { backgroundColor: G.surf }]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <View style={{ flex: 1 }}>
              <Text style={[s.shopName, { color: G.txt }]}>Patel's General Store</Text>
              <Text style={[s.shopSub, { color: G.txt2 }]}>🛒 Grocery · Sector 12, Delhi</Text>
            </View>
            <RippleTap onPress={() => { setFollowing(p => !p); showToast(following ? 'Unfollowed' : "Following Patel's! 💚"); }}
              style={[s.followBtn, { backgroundColor: following ? G.g50 : G.g800, borderColor: following ? `${G.g300}50` : 'transparent' }]}>
              <Text style={{ color: following ? G.g700 : G.lime, fontSize: 13, fontWeight: '800' }}>
                {following ? '✓ Following' : '+ Follow'}
              </Text>
            </RippleTap>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
            <Text style={{ fontSize: 12, fontWeight: '700', color: G.warn }}>⭐ 4.8</Text>
            <Text style={{ fontSize: 11, color: G.txt3 }}>320+ ratings · 0.3 km</Text>
            <View style={[s.openPill, { backgroundColor: G.g50 }]}>
              <Text style={{ color: G.g600, fontSize: 10, fontWeight: '700' }}>Open Now</Text>
            </View>
          </View>
        </View>
      </FadeUp>

      {/* About */}
      <FadeUp delay={120}>
        <View style={[s.aboutBox, { backgroundColor: G.g50 }]}>
          <Text style={{ fontSize: 12.5, color: G.txt2, lineHeight: 20 }}>
            Your neighbourhood store since 1994. Fresh produce, dairy, packaged goods, spices &amp; household essentials. Free delivery above ₹299.
          </Text>
        </View>
      </FadeUp>

      {/* Stats bar */}
      <FadeUp delay={160}>
        <View style={[s.statsBar, sb(G.g200)]}>
          {[['4.8⭐','Rating'],['1.2k','Orders'],['8am–9pm','Hours'],['30 min','Delivery']].map(([v,l],i,arr)=>(
            <View key={l} style={[s.statItem, i < arr.length-1 && { borderRightWidth: 1, borderRightColor: `${G.g200}35` }]}>
              <Text style={[s.statVal, { color: G.g700 }]}>{v}</Text>
              <Text style={[s.statLabel, { color: G.txt3 }]}>{l}</Text>
            </View>
          ))}
        </View>
      </FadeUp>

      {/* Products */}
      <View style={s.prodHeader}>
        <Text style={[s.prodTitle, { color: G.txt }]}>Products</Text>
        <TouchableOpacity><Text style={{ fontSize: 12, fontWeight: '700', color: G.g500 }}>See all</Text></TouchableOpacity>
      </View>
      <View style={s.prodGrid}>
        {PRODS.map((p, i) => {
          const qty = items[p.id]?.quantity || 0;
          return (
            <FadeUp key={p.id} delay={200 + i * 50}>
              <View style={[s.prodCard, sb(G.g200), { backgroundColor: G.surf }]}>
                <View style={[s.prodImg, { backgroundColor: p.bg }]}>
                  <Text style={{ fontSize: 26 }}>{p.emoji}</Text>
                </View>
                <View style={{ padding: 8 }}>
                  <Text style={[s.prodName, { color: G.txt }]}>{p.name}</Text>
                  <Text style={[s.prodPrice, { color: G.g500 }]}>{p.price}</Text>
                  {qty === 0 ? (
                    <RippleTap onPress={() => { addItem(p.id, p.name); showToast(`Added ${p.name} 🛒`); }}
                      style={[s.addBtn, { backgroundColor: G.g400 }]}>
                      <Text style={s.addBtnText}>+</Text>
                    </RippleTap>
                  ) : (
                    <View style={s.qtyRow}>
                      <TouchableOpacity onPress={() => removeItem(p.id)} style={[s.qtyBtn, sb(G.g300,'50'), { backgroundColor: G.g50 }]}>
                        <Text style={{ color: G.g600, fontWeight: '800', fontSize: 14 }}>−</Text>
                      </TouchableOpacity>
                      <Text style={{ flex: 1, textAlign: 'center', fontWeight: '800', color: G.g700 }}>{qty}</Text>
                      <TouchableOpacity onPress={() => { addItem(p.id, p.name); showToast(`Added ${p.name} 🛒`); }}
                        style={[s.qtyBtn, { backgroundColor: G.g400 }]}>
                        <Text style={{ color: '#fff', fontWeight: '800', fontSize: 14 }}>+</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </View>
            </FadeUp>
          );
        })}
      </View>

      {/* WhatsApp CTA */}
      <View style={{ padding: 14, paddingBottom: 0 }}>
        <RippleTap onPress={() => showToast('Opening WhatsApp… 📲')}
          style={[s.ctaBtn, { backgroundColor: G.g800 }]}>
          <Text style={{ color: G.lime, fontSize: 14, fontWeight: '800' }}>🛒 Visit Store · Chat on WhatsApp</Text>
        </RippleTap>
      </View>
    </ScrollView>
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
  prodGrid:   { flexDirection: 'row', flexWrap: 'wrap', gap: 9, paddingHorizontal: 14 },
  prodCard:   { width: '30%', borderRadius: 12, overflow: 'hidden', flexGrow: 1 },
  prodImg:    { height: 72, alignItems: 'center', justifyContent: 'center' },
  prodName:   { fontSize: 10, fontWeight: '700', lineHeight: 14 },
  prodPrice:  { fontSize: 11, fontWeight: '800', marginTop: 3 },
  addBtn:     { marginTop: 5, borderRadius: 6, height: 22, alignItems: 'center', justifyContent: 'center' },
  addBtnText: { color: '#fff', fontWeight: '800', fontSize: 13 },
  qtyRow:     { flexDirection: 'row', alignItems: 'center', marginTop: 5, gap: 4 },
  qtyBtn:     { width: 22, height: 22, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  ctaBtn:     { borderRadius: 14, padding: 15, alignItems: 'center' },
});
