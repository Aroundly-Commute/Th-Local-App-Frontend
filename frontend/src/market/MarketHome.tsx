/**
 * MarketHome.tsx
 * Full Verdex marketplace home — matches verdex_app.jsx Home() 1-to-1 in React Native.
 * Modular: uses primitives, Ticker, MarketBottomNav, CartContext, data.ts
 *
 * Modified to support Home (Products + Services), Services, Super Mall, and Fresh Direct (blank).
 * Includes interactive Slot Booking for Services to show availability.
 */
import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, Modal, FlatList, RefreshControl,
} from 'react-native';
import { verdexColors as G } from '../theme';
import {
  RippleTap, FloatView, PulseView, FadeUp, FlashCountdown,
  IconZap, IconMapPin, IconChevronDown, IconSearch, IconChevronRight, IconHeart,
} from '../components/marketplace/primitives';
import { useRouter } from 'expo-router';
import { CATS, STORES, DEAL_TILES, COUPONS, OFFERS } from './data';
import { useCart } from '../contexts/CartContext';
import { useMarketData } from '../contexts/MarketDataContext';
import { ModeSwitcher } from '../components/common/ModeSwitcher';
import { Ticker } from '../components/marketplace/Ticker';

const sb = (c: string, a = '25') => ({ borderWidth: 1, borderColor: `${c}${a}` } as const);

interface Props {
  onShopPress: (shopId: string, shopType: 'shop' | 'provider') => void;
  showToast:   (msg: string) => void;
}

export const MarketHome: React.FC<Props> = ({ onShopPress, showToast }) => {
  const router = useRouter();
  const { addItem, totalCount } = useCart();
  const { shops, services, serviceProviders, products, refreshData } = useMarketData();
  const [activeCat,   setActiveCat]   = useState('all');
  const [activeStore, setActiveStore] = useState('Home');
  const [liked,       setLiked]       = useState<Record<string, boolean>>({});
  const [search,      setSearch]      = useState('');
  const [refreshing,  setRefreshing]  = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshData();
    } catch (err) {
      console.error('[MarketHome] Refresh error:', err);
    } finally {
      setRefreshing(false);
    }
  };
  
  // Interactive slot booking states
  const [bookingService, setBookingService] = useState<any | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [userBookings, setUserBookings] = useState<any[]>([]);

  const MOCK_SLOTS = [
    { time: '09:00 AM', status: 'Available' },
    { time: '11:30 AM', status: 'Available' },
    { time: '02:00 PM', status: 'Booked' },
    { time: '04:30 PM', status: 'Available' },
    { time: '07:00 PM', status: 'Available' },
  ];

  const handleBookSlot = (service: any) => {
    setBookingService(service);
    setSelectedSlot(null);
  };

  const confirmBooking = () => {
    if (!bookingService || !selectedSlot) return;
    
    const newBooking = {
      id: Math.random().toString(),
      serviceName: bookingService.name,
      provider: bookingService.provider,
      emoji: bookingService.emoji,
      timeSlot: selectedSlot,
      date: 'Today',
      price: bookingService.price,
    };

    setUserBookings([newBooking, ...userBookings]);
    showToast(`Booked ${bookingService.name} for ${selectedSlot}! 🛠️`);
    setBookingService(null);
  };

  // Filter services by category if on services-specific cat
  const filteredServices = activeCat === 'all' || activeCat === 'services'
    ? services
    : services.filter(s => s.category.toLowerCase() === activeCat.toLowerCase());

  return (
    <ScrollView
      style={{ flex: 1 }}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 160 }}
      stickyHeaderIndices={[3]}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[G.g800]} tintColor={G.g800} />
      }
    >
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
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => router.push('/(market)/cart')}
              style={[s.avatar, sb(G.g300, '30'), { position: 'relative', justifyContent: 'center', alignItems: 'center' }]}
            >
              <Text style={{ fontSize: 18 }}>🛒</Text>
              {totalCount > 0 && (
                <View style={{
                  position: 'absolute',
                  top: -4,
                  right: -4,
                  backgroundColor: '#EF4444',
                  borderRadius: 10,
                  width: 18,
                  height: 18,
                  justifyContent: 'center',
                  alignItems: 'center',
                  borderWidth: 1.5,
                  borderColor: '#fff',
                }}>
                  <Text style={{ color: '#fff', fontSize: 9, fontWeight: '800' }}>
                    {totalCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </FadeUp>

      {/* ── Store Switcher (Tab View) ── */}
      <FadeUp delay={100}>
        <View style={[s.storeRow, { backgroundColor: G.surf }]}>
          {STORES.map(st => {
            const on = activeStore === st.name;
            return (
              <TouchableOpacity key={st.name} activeOpacity={0.85} onPress={() => { setActiveStore(st.name); setActiveCat('all'); }}
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
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => router.push('/(market)/search')}
            style={[s.searchBox, sb(G.g300, '30'), { backgroundColor: G.surf3, flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 24 }]}
          >
            <IconSearch c={G.txt3} />
            <Text style={{ color: G.txt3, flex: 1, fontSize: 13 }}>
              {activeStore === 'Services' ? 'Search "Plumber, Haircut, Repair…"' : 
               activeStore === 'Home' ? 'Search "Groceries, Haircut, Soap…"' :
               'Search "Atta, Milk, Soap…"'}
            </Text>
          </TouchableOpacity>
          <RippleTap style={s.promoTile} onPress={() => router.push('/(market)/partner')}>
            <Text style={s.promoText}>Partner{'\n'}With Us ⚡</Text>
            <FloatView><Text style={{ fontSize: 18, alignSelf: 'flex-end' }}>💼</Text></FloatView>
          </RippleTap>
        </View>
      </FadeUp>

      {/* Render conditional views based on active store tab */}
      {activeStore === 'Fresh Direct' ? (
        /* ── Fresh Direct Blank Screen ── */
        <FadeUp delay={200}>
          <View style={s.blankContainer}>
            <Text style={{ fontSize: 60, marginBottom: 16 }}>🥬</Text>
            <Text style={[s.blankTitle, { color: G.txt }]}>Fresh Direct Coming Soon!</Text>
            <Text style={[s.blankSub, { color: G.txt3 }]}>
              We are partnering with local organic farms to bring fresh, direct pesticide-free harvests to your doorstep. Stay tuned for premium greens!
            </Text>
            <TouchableOpacity style={[s.blankBtn, { backgroundColor: G.g800 }]} onPress={() => setActiveStore('Home')}>
              <Text style={{ color: G.lime, fontWeight: '700' }}>Back to Home</Text>
            </TouchableOpacity>
          </View>
        </FadeUp>
      ) : (
        <>
          {/* ── Category Pills (Rendered for Home, Services, Super Mall) ── */}
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

          {/* ── Active Bookings / Appointments Banner ── */}
          {activeStore === 'Services' && userBookings.length > 0 && (
            <FadeUp delay={210}>
              <View style={{ paddingHorizontal: 14, paddingTop: 10 }}>
                <Text style={[s.secTitle, { color: G.txt, marginBottom: 8 }]}>Your Bookings 🗓️</Text>
                {userBookings.map((b) => (
                  <View key={b.id} style={[s.bookingBanner, sb(G.g300, '35'), { backgroundColor: G.g50 }]}>
                    <Text style={{ fontSize: 24 }}>{b.emoji}</Text>
                    <View style={{ flex: 1, marginLeft: 8 }}>
                      <Text style={[s.bookingTitle, { color: G.g900 }]}>{b.serviceName}</Text>
                      <Text style={[s.bookingSub, { color: G.txt2 }]}>{b.provider} · {b.timeSlot}</Text>
                    </View>
                    <View style={s.bookingStatusPill}>
                      <Text style={s.bookingStatusText}>Confirmed</Text>
                    </View>
                  </View>
                ))}
              </View>
            </FadeUp>
          )}

          {/* ── Home Stats Strip (Rendered on Home) ── */}
          {activeStore === 'Home' && (
            <FadeUp delay={220}>
              <View style={[s.statsStrip, { backgroundColor: G.g800 }]}>
                {[
                  ['150+', 'Services'],
                  ['1200+', 'Shops'],
                  ['300+', 'Brands'],
                  ['50k+', 'Bookings'],
                ].map(([v, l]) => (
                  <View key={l} style={{ alignItems: 'center' }}>
                    <Text style={[s.statsVal, { color: G.lime }]}>{v}</Text>
                    <Text style={[s.statsLabel, { color: G.g200 }]}>{l}</Text>
                  </View>
                ))}
              </View>
            </FadeUp>
          )}

          {/* ── Services Content (Rendered on Home & Services) ── */}
          {(activeStore === 'Home' || activeStore === 'Services') && (
            <>
              {/* Popular Services Section */}
              <FadeUp delay={240}>
                <View style={{ padding: 14, paddingTop: 16 }}>
                  <View style={s.secHeader}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={{ fontSize: 16 }}>🛠️</Text>
                      <Text style={[s.secTitle, { color: G.txt }]}>Popular Services</Text>
                    </View>
                    <TouchableOpacity onPress={() => setActiveStore('Services')}>
                      <Text style={[s.seeAll, { color: G.g500 }]}>See all</Text>
                    </TouchableOpacity>
                  </View>
                  
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingBottom: 4 }}>
                    {filteredServices.map((srv) => (
                      <View key={srv.id} style={[s.serviceCard, sb(G.g200, '40')]}>
                        <View style={[s.serviceImg, { backgroundColor: srv.bg }]}>
                          <Text style={{ fontSize: 36 }}>{srv.emoji}</Text>
                          <View style={s.categoryBadge}>
                            <Text style={s.categoryBadgeText}>{srv.category}</Text>
                          </View>
                        </View>
                        <View style={{ padding: 10, flex: 1, justifyContent: 'space-between' }}>
                          <View>
                            <Text style={[s.serviceName, { color: G.txt }]} numberOfLines={1}>{srv.name}</Text>
                            <Text style={[s.serviceProvider, { color: G.txt3 }]} numberOfLines={1}>{srv.provider}</Text>
                            <Text style={[s.serviceRating, { color: G.warn }]}>⭐ {srv.rating}</Text>
                          </View>
                          <View style={{ marginTop: 6 }}>
                            <Text style={[s.servicePrice, { color: G.g600 }]}>{srv.price}</Text>
                            <TouchableOpacity onPress={() => handleBookSlot(srv)} style={[s.bookBtn, { backgroundColor: G.g800 }]}>
                              <Text style={s.bookBtnText}>Book Slot</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      </View>
                    ))}
                  </ScrollView>
                </View>
              </FadeUp>

              {/* Local Service Providers Section */}
              <FadeUp delay={260}>
                <View style={s.secHeader2}>
                  <Text style={[s.secTitle, { color: G.txt }]}>Top Rated <Text style={{ color: G.g500 }}>Taskers</Text></Text>
                  <Text style={{ fontSize: 12, color: G.txt3 }}>Direct Booking</Text>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 14, gap: 10, paddingBottom: 12 }}>
                  {serviceProviders.map(sp => (
                    <TouchableOpacity key={sp.id} activeOpacity={0.88} onPress={() => onShopPress(sp.id, 'provider')}
                      style={[s.providerCard, sb(G.g200, '35'), { backgroundColor: G.surf }]}>
                      <View style={[s.providerImg, { backgroundColor: sp.bg }]}>
                        <Text style={{ fontSize: 32 }}>{sp.emoji}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[s.providerTitle, { color: G.txt }]} numberOfLines={1}>{sp.name}</Text>
                        <Text style={[s.providerSub, { color: G.txt2 }]} numberOfLines={1}>{sp.services}</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 4 }}>
                          <Text style={[s.shopRating, { color: G.warn }]}>⭐ {sp.rating}</Text>
                          <Text style={[s.shopDist, { color: G.txt3 }]}>({sp.ratingCount} reviews)</Text>
                          <Text style={[s.shopDist, { color: G.txt3 }]}>· {sp.dist}</Text>
                        </View>
                      </View>
                      <IconChevronRight c={G.g400} />
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </FadeUp>
            </>
          )}

          {/* ── Product Content (Rendered on Home & Super Mall) ── */}
          {(activeStore === 'Home' || activeStore === 'Super Mall') && (
            <>
              {/* Today's Deals Grid */}
              <FadeUp delay={280}>
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

              {/* Flash Sale Section */}
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
                    {products.map((f, i) => (
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
                          <RippleTap onPress={() => { addItem(f.name, f.name, parseFloat(f.now.replace('₹', '')) || 89, 's1', f.emoji); showToast(`Added ${f.name} 🛒`); }}
                            style={[s.addBtn, { backgroundColor: G.g400 }]}>
                            <Text style={s.addBtnText}>+ Add</Text>
                          </RippleTap>
                        </View>
                      </View>
                    ))}
                  </ScrollView>
                </View>
              </FadeUp>

              {/* Shops Near You */}
              <FadeUp delay={320}>
                <View style={s.secHeader2}>
                  <Text style={[s.secTitle, { color: G.txt }]}>Shops <Text style={{ color: G.g500 }}>Near You</Text></Text>
                  <TouchableOpacity><Text style={[s.seeAll, { color: G.g500 }]}>See all</Text></TouchableOpacity>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 14, gap: 10, paddingBottom: 4 }}>
                  {shops.map(sh => (
                    <TouchableOpacity key={sh.id} activeOpacity={0.88}
                      onPress={() => onShopPress(sh.id, 'shop')}
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
            </>
          )}

          {/* ── Partner Banner / Ad ── */}
          <FadeUp delay={330}>
            <TouchableOpacity onPress={() => router.push('/(market)/partner')} activeOpacity={0.9} style={s.partnerAdCard}>
              <View style={{ flex: 1 }}>
                <Text style={s.partnerAdBadge}>PARTNER WITH VERDEX</Text>
                <Text style={s.partnerAdTitle}>Grow Your Business Online</Text>
                <Text style={s.partnerAdSub}>Upgrade your account to Merchant or Service Provider. Setup shop in 3 steps! 🚀</Text>
              </View>
              <View style={s.partnerAdBtn}>
                <Text style={s.partnerAdBtnTxt}>Get Started</Text>
              </View>
            </TouchableOpacity>
          </FadeUp>

          {/* ── Coupons & Offers ── */}
          <FadeUp delay={340}>
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
        </>
      )}

      {/* ── Scheduling Slot Selector Modal (Availability Mechanism) ── */}
      {bookingService && (
        <Modal
          visible={true}
          transparent={true}
          animationType="fade"
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
                <Text style={{ fontSize: 32 }}>{bookingService.emoji}</Text>
                <View style={{ marginLeft: 12 }}>
                  <Text style={[s.serviceSummaryName, { color: G.txt }]}>{bookingService.name}</Text>
                  <Text style={{ fontSize: 12, color: G.txt3 }}>by {bookingService.provider}</Text>
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
                disabled={!selectedSlot}
                style={[s.confirmBtn, { backgroundColor: selectedSlot ? G.g800 : '#CCCCCC' }]}
              >
                <Text style={{ color: selectedSlot ? G.lime : '#FFFFFF', fontWeight: '800', fontSize: 14 }}>
                  Confirm Booking (Pay on Service)
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
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
  promoText:   { color: G.lime, fontSize: 10, fontWeight: '800', lineHeight: 14 },
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

  // New Services Styles
  serviceCard: { width: 160, borderRadius: 14, overflow: 'hidden', backgroundColor: G.surf },
  serviceImg: { height: 90, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  categoryBadge: { position: 'absolute', bottom: 6, left: 6, backgroundColor: G.g800, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  categoryBadgeText: { fontSize: 8.5, fontWeight: '800', color: G.lime },
  serviceName: { fontSize: 12, fontWeight: '800' },
  serviceProvider: { fontSize: 9.5, marginTop: 2 },
  serviceRating: { fontSize: 10, fontWeight: '700', marginTop: 2 },
  servicePrice: { fontSize: 14, fontWeight: '900' },
  bookBtn: { marginTop: 6, borderRadius: 8, paddingVertical: 6, alignItems: 'center' },
  bookBtnText: { color: G.lime, fontSize: 10, fontWeight: '800' },

  providerCard: { flexShrink: 0, minWidth: 280, borderRadius: 14, flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12 },
  providerImg: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  providerTitle: { fontSize: 13, fontWeight: '800' },
  providerSub: { fontSize: 10.5, marginTop: 1 },

  // Interactive booking banner
  bookingBanner: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12, marginBottom: 12 },
  bookingTitle: { fontSize: 13, fontWeight: '800' },
  bookingSub: { fontSize: 11, marginTop: 2 },
  bookingStatusPill: { backgroundColor: G.lime, borderRadius: 12, paddingHorizontal: 8, paddingVertical: 4 },
  bookingStatusText: { fontSize: 9, fontWeight: '900', color: G.g800 },

  // Modals
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, minHeight: 380 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: '900' },
  serviceSummary: { flexDirection: 'row', alignItems: 'center', paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#F3F4F6', marginBottom: 16 },
  serviceSummaryName: { fontSize: 15, fontWeight: '800' },
  serviceSummaryPrice: { fontSize: 16, fontWeight: '900', marginTop: 4 },
  modalSubtitle: { fontSize: 12, fontWeight: '800', textTransform: 'uppercase', color: G.g500, marginBottom: 10, letterSpacing: 0.5 },
  slotGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  slotTile: { width: '30%', paddingVertical: 10, borderRadius: 10, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  confirmBtn: { padding: 16, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 10 },

  // Blank Page
  blankContainer: { padding: 40, alignItems: 'center', justifyContent: 'center', minHeight: 350 },
  blankTitle: { fontSize: 18, fontWeight: '800', textAlign: 'center', marginBottom: 8 },
  blankSub: { fontSize: 12.5, textAlign: 'center', lineHeight: 18, paddingHorizontal: 10, marginBottom: 20 },
  blankBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20 },

  // Partner Ad
  partnerAdCard: { margin: 14, padding: 16, backgroundColor: G.g800, borderRadius: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
  partnerAdBadge: { color: G.lime, fontSize: 8.5, fontWeight: '900', letterSpacing: 1 },
  partnerAdTitle: { color: '#FFFFFF', fontSize: 16, fontWeight: '900', marginTop: 4 },
  partnerAdSub: { color: G.g200, fontSize: 11, lineHeight: 15, marginTop: 4 },
  partnerAdBtn: { backgroundColor: G.lime, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  partnerAdBtnTxt: { color: G.g900, fontSize: 11, fontWeight: '900' },
});
