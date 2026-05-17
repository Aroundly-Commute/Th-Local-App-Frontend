/**
 * MarketHome.tsx
 * Full Verdex marketplace home — matches verdex_app.jsx Home() 1-to-1 in React Native.
 * Modular: uses primitives, Ticker, MarketBottomNav, CartContext, data.ts
 */
import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet,
} from 'react-native';
import { verdexColors as G } from '../theme';
import {
  RippleTap, FloatView, PulseView, FadeUp, FlashCountdown,
  IconZap, IconMapPin, IconChevronDown, IconSearch, IconChevronRight, IconHeart,
} from '../components/marketplace/primitives';
import { useRouter } from 'expo-router';
import { CATS, STORES, DEAL_TILES, FLASH_ITEMS, SHOPS, COUPONS, OFFERS } from './data';
import { useCart } from '../contexts/CartContext';
import { ModeSwitcher } from '../components/common/ModeSwitcher';
import { Ticker } from '../components/marketplace/Ticker';

const sb = (c: string, a = '25') => ({ borderWidth: 1, borderColor: `${c}${a}` } as const);

interface Props {
  onShopPress: (shopId: string) => void;
  showToast:   (msg: string) => void;
}

export const MarketHome: React.FC<Props> = ({ onShopPress, showToast }) => {
  const { addItem, totalCount } = useCart();
  const [activeCat,   setActiveCat]   = useState('all');
  const [activeStore, setActiveStore] = useState('Verdex');
  const [liked,       setLiked]       = useState<Record<string, boolean>>({});
  const [search,      setSearch]      = useState('');
  const router = useRouter();

  return (
    <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }} stickyHeaderIndices={[4]}>
      <ModeSwitcher />
      <Ticker />
      {/* ── Delivery Header ── */}
      <FadeUp delay={50}>
        <View style={[s.delivRow, { backgroundColor: G.surf }]}>
          <View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <PulseView style={s.zapBox}>
                <IconZap c={G.lime} sz={14} filled />
              </PulseView>
              <Text style={s.delivTitle}>10 minutes</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 }}>
              <IconMapPin c={G.g400} />
              <Text style={s.delivAddr} numberOfLines={1}>Home · 42B, Sunrise Colony, Sector 12…</Text>
              <IconChevronDown c={G.g400} />
            </View>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <RippleTap style={s.referBtn}>
              <Text style={s.referText}>REFER &amp;{'\n'}<Text style={{ fontSize: 9, color: G.g200 }}>EARN ⚡</Text></Text>
            </RippleTap>
            <View style={[s.avatar, sb(G.g300, '30')]}>
              <Text style={{ fontSize: 18 }}>👤</Text>
            </View>
          </View>
        </View>
      </FadeUp>

      {/* ── Store Switcher ── */}
      <FadeUp delay={100}>
        <View style={[s.storeRow, { backgroundColor: G.surf }]}>
          {STORES.map(st => {
            const on = activeStore === st.name;
            return (
              <TouchableOpacity key={st.name} activeOpacity={0.85} onPress={() => setActiveStore(st.name)}
                style={[s.storeTile, { borderColor: on ? `${G.g400}70` : `${G.g200}40`, backgroundColor: on ? G.g50 : G.surf, elevation: on ? 4 : 0 }]}>
                <FloatView delay={Math.random() * 800}>
                  <Text style={{ fontSize: 16 }}>{st.emoji}</Text>
                </FloatView>
                <Text style={[s.storeName, { color: on ? G.g700 : G.txt2 }]}>{st.name}</Text>
                {st.sub ? <Text style={s.storeSub}>{st.sub}</Text> : null}
              </TouchableOpacity>
            );
          })}
        </View>
      </FadeUp>

      {/* ── Search + Promo ── */}
      <FadeUp delay={150}>
        <View style={[s.searchRow, { backgroundColor: G.surf }]}>
          <View style={[s.searchBox, sb(G.g300, '30'), { backgroundColor: G.surf3 }]}>
            <IconSearch c={G.txt3} />
            <TextInput
              value={search} onChangeText={setSearch}
              onSubmitEditing={() => {
                if (search.trim()) {
                  router.push(`/search?q=${encodeURIComponent(search.trim())}`);
                }
              }}
              returnKeyType="search"
              placeholder='Search "Atta, Milk, Soap…"' placeholderTextColor={G.txt3}
              style={[s.searchInput, { color: G.txt }]}
            />
          </View>
          <RippleTap style={s.promoTile}>
            <Text style={s.promoText}>Flash{'\n'}Deals 🔥</Text>
            <FloatView><Text style={{ fontSize: 18, alignSelf: 'flex-end' }}>🛍️</Text></FloatView>
          </RippleTap>
        </View>
      </FadeUp>

      {/* ── Category Pills ── */}
      <FadeUp delay={200}>
        <View style={{ backgroundColor: G.surf, marginTop: 2 }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 14 }}>
            {CATS.map(c => {
              const on = activeCat === c.id;
              return (
                <TouchableOpacity key={c.id} onPress={() => setActiveCat(c.id)} activeOpacity={0.85}
                  style={s.catItem}>
                  <View style={[s.catCircle, { backgroundColor: on ? G.g50 : G.surf3, borderColor: on ? `${G.g300}70` : 'transparent', transform: [{ scale: on ? 1.08 : 1 }] }]}>
                    <Text style={{ fontSize: 22 }}>{c.emoji}</Text>
                  </View>
                  <Text style={[s.catLabel, { color: on ? G.g600 : G.txt2, fontWeight: on ? '800' : '600' }]}>{c.label}</Text>
                  {on && <View style={[s.catLine, { backgroundColor: G.g500 }]} />}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
          <View style={{ height: 1, backgroundColor: `${G.g200}40`, marginHorizontal: 14 }} />
        </View>
      </FadeUp>

      {/* ── Stats Strip ── */}
      <FadeUp delay={220}>
        <View style={[s.statsStrip, { backgroundColor: G.g800 }]}>
          {[['1200+', 'shops'], ['24', 'cities'], ['50k+', 'orders'], ['300+', 'brands']].map(([v, l]) => (
            <View key={l} style={{ alignItems: 'center' }}>
              <Text style={[s.statsVal, { color: G.lime }]}>{v}</Text>
              <Text style={[s.statsLabel, { color: G.g200 }]}>{l}</Text>
            </View>
          ))}
        </View>
      </FadeUp>

      {/* ── Deal Grid ── */}
      <FadeUp delay={250}>
        <View style={{ padding: 14, paddingTop: 12 }}>
          <View style={s.secHeader}>
            <Text style={[s.secTitle, { color: G.txt }]}>Today's <Text style={{ color: G.g500 }}>Deals</Text></Text>
            <FlashCountdown t={null} />
          </View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {/* Hero tile */}
            <RippleTap style={[s.heroTile, { backgroundColor: G.g800 }]}>
              <View style={s.heroGlow} />
              <Text style={[s.heroLabel, { color: G.g200 }]}>TODAY'S DEAL</Text>
              <Text style={[s.heroTitle, { color: G.lime }]}>{'Self-Care\nSTEALS'}</Text>
              <FloatView style={{ marginTop: 10, marginBottom: 'auto' as any }}>
                <Text style={{ fontSize: 44 }}>✨</Text>
              </FloatView>
              <View style={s.heroCta}><Text style={[s.heroCtaText, { color: G.g900 }]}>STARTS AT ₹49</Text></View>
            </RippleTap>
            {/* 2×2 grid */}
            <View style={{ flex: 1, gap: 8 }}>
              {([[0,1],[2,3]] as [number,number][]).map((row, ri) => (
                <View key={ri} style={{ flexDirection: 'row', gap: 8, flex: 1 }}>
                  {row.map(i => (
                    <RippleTap key={i} style={s.dealTile}>
                      <View style={[StyleSheet.absoluteFillObject, { backgroundColor: DEAL_TILES[i].bg, alignItems: 'center', justifyContent: 'center' }]}>
                        <Text style={{ fontSize: 30 }}>{DEAL_TILES[i].emoji}</Text>
                      </View>
                      <View style={s.dealOverlay}>
                        <Text style={s.dealName}>{DEAL_TILES[i].name}</Text>
                        <Text style={[s.dealPrice, { color: G.lime }]}>{DEAL_TILES[i].price}</Text>
                      </View>
                    </RippleTap>
                  ))}
                </View>
              ))}
            </View>
          </View>
        </View>
      </FadeUp>

      {/* ── Flash Sale ── */}
      <FadeUp delay={300}>
        <View style={{ padding: 14, paddingTop: 16 }}>
          <View style={s.secHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={{ fontSize: 14 }}>⚡</Text>
              <Text style={[s.secTitle, { color: G.txt }]}>Flash Sale</Text>
            </View>
            <TouchableOpacity><Text style={[s.seeAll, { color: G.g500 }]}>See all</Text></TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingBottom: 4 }}>
            {FLASH_ITEMS.map((f, i) => (
              <View key={i} style={[s.flashCard, sb(G.g200, '40')]}>
                <View style={[s.flashImg, { backgroundColor: f.bg }]}>
                  <Text style={{ fontSize: 34 }}>{f.emoji}</Text>
                  <View style={s.offBadge}><Text style={s.offText}>{f.off} OFF</Text></View>
                </View>
                <View style={{ padding: 9 }}>
                  <Text style={[s.flashName, { color: G.txt }]}>{f.name}</Text>
                  <View style={{ flexDirection: 'row', gap: 5, alignItems: 'baseline', marginTop: 4 }}>
                    <Text style={[s.flashNow, { color: G.g500 }]}>{f.now}</Text>
                    <Text style={[s.flashWas, { color: G.txt3 }]}>{f.was}</Text>
                  </View>
                  <RippleTap onPress={() => { addItem(f.name, f.name); showToast(`Added ${f.name} 🛒`); }}
                    style={[s.addBtn, { backgroundColor: G.g400 }]}>
                    <Text style={s.addBtnText}>+ Add</Text>
                  </RippleTap>
                </View>
              </View>
            ))}
          </ScrollView>
        </View>
      </FadeUp>

      {/* ── Offer Strip ── */}
      <FadeUp delay={350}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 14, gap: 10, paddingBottom: 4 }}>
          {OFFERS.map((o, i) => (
            <TouchableOpacity key={i} activeOpacity={0.85}
              style={[s.offerCard, sb(G.g200, '40'), { backgroundColor: G.surf }]}>
              <Text style={{ fontSize: 28, flexShrink: 0 }}>{o.emoji}</Text>
              <View style={{ flex: 1 }}>
                <Text style={[s.offerTitle, { color: G.txt }]}>{o.title}</Text>
                <Text style={[s.offerSub, { color: G.txt2 }]}>{o.sub}</Text>
              </View>
              <IconChevronRight c={G.g300} />
            </TouchableOpacity>
          ))}
        </ScrollView>
      </FadeUp>

      {/* ── Shops Near You ── */}
      <FadeUp delay={380}>
        <View style={s.secHeader2}>
          <Text style={[s.secTitle, { color: G.txt }]}>Shops <Text style={{ color: G.g500 }}>Near You</Text></Text>
          <TouchableOpacity><Text style={[s.seeAll, { color: G.g500 }]}>See all</Text></TouchableOpacity>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 14, gap: 10, paddingBottom: 4 }}>
          {SHOPS.map(sh => (
            <TouchableOpacity key={sh.id} activeOpacity={0.88}
              onPress={() => onShopPress(sh.id)}
              style={[s.shopCard, sb(G.g200, '35'), { backgroundColor: G.surf }]}>
              <View style={[s.shopImg, { backgroundColor: sh.bg }]}>
                <Text style={{ fontSize: 34 }}>{sh.emoji}</Text>
                <TouchableOpacity
                  onPress={() => { setLiked(p => ({ ...p, [sh.id]: !p[sh.id] })); showToast(liked[sh.id] ? 'Removed from saved' : 'Saved! 💚'); }}
                  style={s.heartBtn}>
                  <IconHeart c={liked[sh.id] ? '#EF4444' : '#999'} sz={14} filled={liked[sh.id]} />
                </TouchableOpacity>
              </View>
              <View style={{ padding: 10 }}>
                <Text style={[s.shopName, { color: G.txt }]} numberOfLines={1}>{sh.name}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 4 }}>
                  <Text style={[s.shopRating, { color: G.warn }]}>⭐ {sh.rating}</Text>
                  <Text style={[s.shopDist, { color: G.txt3 }]}>· {sh.dist}</Text>
                </View>
                <Text style={[s.shopOrders, { color: G.txt3 }]}>{sh.orders} orders</Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </FadeUp>

      {/* ── Coupons ── */}
      <FadeUp delay={420}>
        <View style={s.secHeader2}>
          <Text style={[s.secTitle, { color: G.txt }]}>Coupons <Text style={{ color: G.g500 }}>&amp; Offers</Text></Text>
          <TouchableOpacity><Text style={[s.seeAll, { color: G.g500 }]}>See all</Text></TouchableOpacity>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 14, gap: 10, paddingBottom: 16 }}>
          {COUPONS.map((c, i) => (
            <TouchableOpacity key={i} activeOpacity={0.85}
              onPress={() => showToast(`Coupon ${c.code} copied! 🎉`)}
              style={[s.couponCard, { borderColor: `${G.g300}60`, backgroundColor: G.surf }]}>
              <View style={[s.couponTop, { backgroundColor: G.g50 }]}>
                <Text style={[s.couponPct, { color: G.g700 }]}>{c.pct}</Text>
                <Text style={{ fontSize: 22 }}>{c.emoji}</Text>
              </View>
              <View style={{ padding: 12, paddingTop: 8 }}>
                <Text style={[s.couponTitle, { color: G.txt }]}>{c.title}</Text>
                <Text style={[s.couponCode, { color: G.g500 }]}>TAP TO COPY: {c.code}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </FadeUp>
    </ScrollView>
  );
};

const s = StyleSheet.create({
  delivRow:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', padding: 14 },
  zapBox:      { width: 28, height: 28, backgroundColor: G.g800, borderRadius: 7, alignItems: 'center', justifyContent: 'center' },
  delivTitle:  { fontSize: 22, fontWeight: '900', color: G.txt, letterSpacing: -0.5 },
  delivAddr:   { fontSize: 12, color: G.txt2, maxWidth: 200 },
  referBtn:    { backgroundColor: G.g800, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20 },
  referText:   { color: G.lime, fontSize: 10, fontWeight: '800', textAlign: 'center', lineHeight: 14 },
  avatar:      { width: 36, height: 36, borderRadius: 18, backgroundColor: G.g50, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  storeRow:    { flexDirection: 'row', gap: 10, paddingHorizontal: 14, paddingBottom: 14 },
  storeTile:   { flex: 1, borderRadius: 10, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', paddingVertical: 8, minHeight: 54 },
  storeName:   { fontSize: 10.5, fontWeight: '700', textAlign: 'center', marginTop: 2 },
  storeSub:    { fontSize: 9, color: G.txt3, marginTop: 1 },
  searchRow:   { flexDirection: 'row', gap: 10, paddingHorizontal: 14, paddingBottom: 12 },
  searchBox:   { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 12, padding: 10 },
  searchInput: { flex: 1, fontSize: 13, padding: 0 },
  promoTile:   { width: 88, backgroundColor: G.g700, borderRadius: 12, padding: 9, justifyContent: 'space-between', minHeight: 56 },
  promoText:   { color: G.lime, fontSize: 11, fontWeight: '800', lineHeight: 14 },
  catItem:     { alignItems: 'center', gap: 5, paddingVertical: 6, paddingHorizontal: 10, paddingBottom: 12, position: 'relative' },
  catCircle:   { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5 },
  catLabel:    { fontSize: 11 },
  catLine:     { height: 2.5, borderRadius: 2, position: 'absolute', bottom: 0, left: 10, right: 10 },
  statsStrip:  { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 14, marginTop: 8 },
  statsVal:    { fontSize: 15, fontWeight: '800' },
  statsLabel:  { fontSize: 9.5, marginTop: 1, textTransform: 'uppercase', letterSpacing: 0.5 },
  secHeader:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  secHeader2:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 14, paddingTop: 16, paddingBottom: 10 },
  secTitle:    { fontSize: 15, fontWeight: '700' },
  seeAll:      { fontSize: 12, fontWeight: '700' },
  heroTile:    { flex: 1.05, borderRadius: 16, padding: 14, minHeight: 234, overflow: 'hidden' },
  heroGlow:    { position: 'absolute', bottom: -20, right: -20, width: 100, height: 100, backgroundColor: G.lime, borderRadius: 50, opacity: 0.08 },
  heroLabel:   { fontSize: 10, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase' },
  heroTitle:   { fontSize: 18, fontWeight: '800', marginTop: 4, lineHeight: 22, color: G.lime },
  heroCta:     { backgroundColor: G.lime, borderRadius: 8, paddingVertical: 6, alignItems: 'center' },
  heroCtaText: { fontSize: 10, fontWeight: '800' },
  dealTile:    { flex: 1, borderRadius: 14, minHeight: 109, overflow: 'hidden' },
  dealOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 8, backgroundColor: 'rgba(0,0,0,0.5)' },
  dealName:    { fontSize: 10, fontWeight: '700', color: '#fff' },
  dealPrice:   { fontSize: 10, fontWeight: '800', marginTop: 1 },
  flashCard:   { flexShrink: 0, width: 128, borderRadius: 14, overflow: 'hidden', backgroundColor: G.surf },
  flashImg:    { height: 86, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  offBadge:    { position: 'absolute', top: 6, right: 6, backgroundColor: G.lime, borderRadius: 20, paddingHorizontal: 7, paddingVertical: 2 },
  offText:     { fontSize: 9, fontWeight: '800', color: G.g900 },
  flashName:   { fontSize: 11, fontWeight: '700', lineHeight: 1.3 * 11 },
  flashNow:    { fontSize: 13, fontWeight: '800' },
  flashWas:    { fontSize: 10, textDecorationLine: 'line-through' },
  addBtn:      { marginTop: 6, borderRadius: 7, paddingVertical: 5, alignItems: 'center' },
  addBtnText:  { color: '#fff', fontSize: 10, fontWeight: '800' },
  offerCard:   { flexShrink: 0, minWidth: 248, borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12 },
  offerTitle:  { fontSize: 13, fontWeight: '700' },
  offerSub:    { fontSize: 11, marginTop: 2 },
  shopCard:    { width: 150, borderRadius: 14, overflow: 'hidden' },
  shopImg:     { height: 80, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  heartBtn:    { position: 'absolute', top: 6, right: 6, width: 26, height: 26, borderRadius: 13, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', elevation: 2 },
  shopName:    { fontSize: 11.5, fontWeight: '700' },
  shopRating:  { fontSize: 11, fontWeight: '700' },
  shopDist:    { fontSize: 10 },
  shopOrders:  { fontSize: 9.5, marginTop: 2 },
  couponCard:  { width: 155, borderRadius: 14, overflow: 'hidden', borderWidth: 1.5, borderStyle: 'dashed' },
  couponTop:   { padding: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  couponPct:   { fontSize: 17, fontWeight: '800' },
  couponTitle: { fontSize: 11.5, fontWeight: '700' },
  couponCode:  { fontSize: 9.5, fontWeight: '800', marginTop: 3, letterSpacing: 0.5 },
});
