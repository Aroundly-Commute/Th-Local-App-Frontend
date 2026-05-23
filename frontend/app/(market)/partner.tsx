import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Image, useColorScheme, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft, Plus, X, Briefcase, Clock, Sparkles, Award, CheckCircle, Store, Wrench, Home } from 'lucide-react-native';
import { useAuth } from '../../src/core/auth/auth';
import { useMarketData } from '../../src/modules/marketplace/contexts/MarketDataContext';
import { lightTheme, darkTheme, spacing, radius } from '../../src/core/theme/theme';
import { tap, success } from '../../src/core/utils/haptics';

export default function PartnerOnboarding() {
  const router = useRouter();
  const cs = useColorScheme();
  const t = cs === 'dark' ? darkTheme : lightTheme;
  const { user } = useAuth();
  const { addShop, addProduct, addServiceProvider, addService, setRegisteredRole, setRegisteredBrandName } = useMarketData();

  const [step, setStep] = useState(1);
  const [role, setRole] = useState<'merchant' | 'provider' | null>(null);

  // Form Profile States
  const [brandName, setBrandName] = useState('');
  const [ownerName, setOwnerName] = useState(user?.name || '');
  const [mobileNumber, setMobileNumber] = useState('');
  const [address, setAddress] = useState('');
  const [category, setCategory] = useState('');
  const [profilePic, setProfilePic] = useState('https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=200&q=80');
  const [coverPage, setCoverPage] = useState('https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600&q=80');

  // Form Catalog States
  const [itemsList, setItemsList] = useState<any[]>([]);
  const [newItemName, setNewItemName] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('');
  const [newItemDesc, setNewItemDesc] = useState('');
  const [newItemStock, setNewItemStock] = useState('20');
  const [newItemExpiry, setNewItemExpiry] = useState('');

  // Service Provider Slot States
  const [selectedDays, setSelectedDays] = useState<string[]>(['Mon', 'Tue', 'Wed', 'Thu', 'Fri']);
  const [selectedHours, setSelectedHours] = useState<string[]>(['Morning (9 AM - 12 PM)', 'Afternoon (2 PM - 5 PM)']);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const WEEK_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const TIME_SLOTS = ['Morning (9 AM - 12 PM)', 'Afternoon (2 PM - 5 PM)', 'Evening (6 PM - 9 PM)'];

  const toggleDay = (day: string) => {
    tap();
    if (selectedDays.includes(day)) {
      setSelectedDays(selectedDays.filter(d => d !== day));
    } else {
      setSelectedDays([...selectedDays, day]);
    }
  };

  const toggleHour = (hour: string) => {
    tap();
    if (selectedHours.includes(hour)) {
      setSelectedHours(selectedHours.filter(h => h !== hour));
    } else {
      setSelectedHours([...selectedHours, hour]);
    }
  };

  const handleAddItem = () => {
    if (!newItemName || !newItemPrice) {
      alert('Please enter a name and price.');
      return;
    }
    tap();
    const newItem = {
      id: Math.random().toString(),
      name: newItemName,
      price: newItemPrice,
      description: newItemDesc,
      stock: newItemStock,
      expiry: newItemExpiry,
    };
    setItemsList([...itemsList, newItem]);
    
    // Reset Form fields
    setNewItemName('');
    setNewItemPrice('');
    setNewItemDesc('');
    setNewItemStock('20');
    setNewItemExpiry('');
  };

  const handleRemoveItem = (id: string) => {
    tap();
    setItemsList(itemsList.filter(item => item.id !== id));
  };

  const handleOnboardingSubmit = async () => {
    if (itemsList.length === 0) {
      alert(`Please add at least one ${role === 'merchant' ? 'product' : 'service'} to your catalog.`);
      return;
    }
    
    setIsSubmitting(true);
    tap();
    
    try {
      // Actually submit and populate dynamic context data sequentially to avoid DB lock/race conditions
      if (role === 'merchant') {
        const newShopId = await addShop(brandName, category, '🏪');
        for (const item of itemsList) {
          await addProduct(item.name, item.price, item.description || '', item.stock || '20');
        }
        await setRegisteredRole('merchant');
        await setRegisteredBrandName(brandName);
      } else if (role === 'provider') {
        const newProviderId = await addServiceProvider(brandName, category, '🛠️');
        for (const item of itemsList) {
          await addService(item.name, item.price, item.description || '', brandName, category);
        }
        await setRegisteredRole('provider');
        await setRegisteredBrandName(brandName);
      }

      success();
      setStep(4); // Success step!
    } catch (err) {
      console.error('[OnboardingSubmit] Failed to onboard partner:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCategoryOptions = () => {
    if (role === 'merchant') {
      return ['Groceries', 'Clothing & Fashion', 'Electronics', 'Pharmaceuticals', 'Bakery & Sweets', 'Organic Produce'];
    }
    return ['Plumbing & Repairs', 'Home Cleaning', 'Salon & Styling', 'Electrician', 'Appliance Servicing', 'Carpentry'];
  };

  return (
    <SafeAreaView style={[s.container, { backgroundColor: t.background }]} edges={['top', 'left', 'right', 'bottom']}>
      {/* Header */}
      {step < 4 && (
        <View style={[s.header, { borderBottomColor: t.border }]}>
          <TouchableOpacity onPress={() => { tap(); step > 1 ? setStep(step - 1) : router.back(); }} style={s.backBtn}>
            <ChevronLeft color={t.textPrimary} size={24} />
          </TouchableOpacity>
          <Text style={[s.headerTitle, { color: t.textPrimary }]}>Partner with Verdex</Text>
          <View style={{ width: 24 }} />
        </View>
      )}

      {/* Steps Indicator */}
      {step < 4 && (
        <View style={s.stepIndicatorRow}>
          {[1, 2, 3].map((num) => {
            const active = step === num;
            const completed = step > num;
            return (
              <View key={num} style={{ flex: 1, alignItems: 'center' }}>
                <View style={[
                  s.stepCircle,
                  {
                    backgroundColor: active ? t.primary : completed ? t.success : t.muted,
                    borderColor: active ? t.primary : 'transparent',
                  }
                ]}>
                  {completed ? (
                    <CheckCircle size={14} color="#FFF" />
                  ) : (
                    <Text style={{ color: active ? '#FFF' : t.textSecondary, fontWeight: '700', fontSize: 12 }}>{num}</Text>
                  )}
                </View>
                <Text style={{ fontSize: 9.5, marginTop: 4, color: active ? t.textPrimary : t.textSecondary, fontWeight: active ? '700' : '400' }}>
                  {num === 1 ? 'Role' : num === 2 ? 'Profile' : 'Catalog'}
                </Text>
              </View>
            );
          })}
        </View>
      )}

      {/* Main Content */}
      <ScrollView contentContainerStyle={s.scrollContent} keyboardShouldPersistTaps="handled">
        {step === 1 && (
          /* Step 1: Role Selection */
          <View style={s.stepWrap}>
            <Text style={[s.stepTitle, { color: t.textPrimary }]}>Select Your Business Route</Text>
            <Text style={[s.stepSub, { color: t.textSecondary }]}>
              Join the Verdex Marketplace today and connect with thousands of local customers in your sector.
            </Text>

            <TouchableOpacity
              activeOpacity={0.88}
              onPress={() => { tap(); setRole('merchant'); }}
              style={[
                s.roleCard,
                {
                  borderColor: role === 'merchant' ? t.primary : t.border,
                  backgroundColor: role === 'merchant' ? t.surfaceElevated : t.surface,
                }
              ]}
            >
              <View style={[s.roleIconWrap, { backgroundColor: t.accentBg }]}>
                <Store size={24} color={t.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.roleTitle, { color: t.textPrimary }]}>Product Merchant</Text>
                <Text style={[s.roleDesc, { color: t.textSecondary }]}>
                  Retail store, pharmacy, bakery, grocery shop, or custom products. Immediate delivery & catalog tracking.
                </Text>
              </View>
              {role === 'merchant' && <View style={[s.radioSelect, { backgroundColor: t.primary }]} />}
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.88}
              onPress={() => { tap(); setRole('provider'); }}
              style={[
                s.roleCard,
                {
                  borderColor: role === 'provider' ? t.primary : t.border,
                  backgroundColor: role === 'provider' ? t.surfaceElevated : t.surface,
                }
              ]}
            >
              <View style={[s.roleIconWrap, { backgroundColor: t.accentBg }]}>
                <Wrench size={24} color={t.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.roleTitle, { color: t.textPrimary }]}>Service Provider</Text>
                <Text style={[s.roleDesc, { color: t.textSecondary }]}>
                  Handyman repairs, plumbing, salon grooming, home deep cleaning, or appliance installation. Time-slot availability.
                </Text>
              </View>
              {role === 'provider' && <View style={[s.radioSelect, { backgroundColor: t.primary }]} />}
            </TouchableOpacity>

            <TouchableOpacity
              disabled={!role}
              onPress={() => { tap(); setStep(2); }}
              style={[s.nextBtn, { backgroundColor: role ? t.primary : '#CCCCCC', marginTop: 30 }]}
            >
              <Text style={s.btnTxt}>Next Step</Text>
            </TouchableOpacity>
          </View>
        )}

        {step === 2 && (
          /* Step 2: Business Profile Setup */
          <View style={s.stepWrap}>
            <Text style={[s.stepTitle, { color: t.textPrimary }]}>Setup Business Profile</Text>
            <Text style={[s.stepSub, { color: t.textSecondary }]}>
              Enter accurate shop details to appear in user searches & recommendations.
            </Text>

            <Text style={[s.label, { color: t.textSecondary }]}>Brand / Shop Name *</Text>
            <TextInput
              style={[s.input, { color: t.textPrimary, borderColor: t.border }]}
              value={brandName}
              onChangeText={setBrandName}
              placeholder="e.g. Apex General Store or Sparks Salon"
              placeholderTextColor={t.textTertiary}
            />

            <Text style={[s.label, { color: t.textSecondary }]}>Owner Name / Provider Name *</Text>
            <TextInput
              style={[s.input, { color: t.textPrimary, borderColor: t.border }]}
              value={ownerName}
              onChangeText={setOwnerName}
              placeholder="Full name of representative"
              placeholderTextColor={t.textTertiary}
            />

            <Text style={[s.label, { color: t.textSecondary }]}>Business Mobile Number *</Text>
            <TextInput
              style={[s.input, { color: t.textPrimary, borderColor: t.border }]}
              value={mobileNumber}
              onChangeText={setMobileNumber}
              keyboardType="phone-pad"
              placeholder="e.g. +91 98765 43210"
              placeholderTextColor={t.textTertiary}
            />

            <Text style={[s.label, { color: t.textSecondary }]}>Physical Address / Location *</Text>
            <TextInput
              style={[s.input, { color: t.textPrimary, borderColor: t.border }]}
              value={address}
              onChangeText={setAddress}
              placeholder="Detailed physical marketplace location"
              placeholderTextColor={t.textTertiary}
            />

            <Text style={[s.label, { color: t.textSecondary }]}>Business Category *</Text>
            <View style={s.optionsRow}>
              {getCategoryOptions().map((cat) => {
                const isSelected = category === cat;
                return (
                  <TouchableOpacity
                    key={cat}
                    onPress={() => { tap(); setCategory(cat); }}
                    style={[
                      s.optionPill,
                      {
                        backgroundColor: isSelected ? t.primary : t.muted,
                        borderColor: isSelected ? t.primary : t.border,
                      }
                    ]}
                  >
                    <Text style={{ color: isSelected ? '#FFF' : t.textSecondary, fontSize: 11, fontWeight: '700' }}>
                      {cat}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity
              disabled={!brandName || !ownerName || !mobileNumber || !address || !category}
              onPress={() => { tap(); setStep(3); }}
              style={[
                s.nextBtn,
                {
                  backgroundColor: (brandName && ownerName && mobileNumber && address && category) ? t.primary : '#CCCCCC',
                  marginTop: 20
                }
              ]}
            >
              <Text style={s.btnTxt}>Next Step</Text>
            </TouchableOpacity>
          </View>
        )}

        {step === 3 && (
          /* Step 3: Catalog Setup */
          <View style={s.stepWrap}>
            <Text style={[s.stepTitle, { color: t.textPrimary }]}>
              {role === 'merchant' ? 'Catalog Management' : 'Add Services & Available Slots'}
            </Text>
            <Text style={[s.stepSub, { color: t.textSecondary }]}>
              {role === 'merchant' 
                ? 'Create initial products to allow customers to order.' 
                : 'Setup services and time availability slots.'
              }
            </Text>

            {/* Catalog Add form */}
            <View style={[s.subCard, { backgroundColor: t.surfaceElevated, borderColor: t.border }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Plus size={14} color={t.textPrimary} strokeWidth={2.5} />
                <Text style={[s.subCardTitle, { color: t.textPrimary, marginTop: 0 }]}>
                  {role === 'merchant' ? 'Add Product Item' : 'Add Service Task'}
                </Text>
              </View>
              
              <Text style={[s.label, { color: t.textSecondary }]}>
                {role === 'merchant' ? 'Product Name *' : 'Service Task Name *'}
              </Text>
              <TextInput
                style={[s.input, { color: t.textPrimary, borderColor: t.border, backgroundColor: t.surface }]}
                value={newItemName}
                onChangeText={setNewItemName}
                placeholder={role === 'merchant' ? 'e.g. Basmati Rice 1kg' : 'e.g. Deep Sofa Cleaning'}
                placeholderTextColor={t.textTertiary}
              />

              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <Text style={[s.label, { color: t.textSecondary }]}>
                    {role === 'merchant' ? 'Price (₹) *' : 'Rate / Charge (₹) *'}
                  </Text>
                  <TextInput
                    style={[s.input, { color: t.textPrimary, borderColor: t.border, backgroundColor: t.surface }]}
                    value={newItemPrice}
                    onChangeText={setNewItemPrice}
                    keyboardType="numeric"
                    placeholder="99"
                    placeholderTextColor={t.textTertiary}
                  />
                </View>

                {role === 'merchant' && (
                  <View style={{ flex: 1 }}>
                    <Text style={[s.label, { color: t.textSecondary }]}>Stock Count</Text>
                    <TextInput
                      style={[s.input, { color: t.textPrimary, borderColor: t.border, backgroundColor: t.surface }]}
                      value={newItemStock}
                      onChangeText={setNewItemStock}
                      keyboardType="numeric"
                      placeholder="20"
                      placeholderTextColor={t.textTertiary}
                    />
                  </View>
                )}
              </View>

              <Text style={[s.label, { color: t.textSecondary }]}>Description</Text>
              <TextInput
                style={[s.input, { color: t.textPrimary, borderColor: t.border, backgroundColor: t.surface }]}
                value={newItemDesc}
                onChangeText={setNewItemDesc}
                placeholder="Details & specifications"
                placeholderTextColor={t.textTertiary}
              />

              <TouchableOpacity onPress={handleAddItem} style={[s.addItemBtn, { backgroundColor: t.primary }]}>
                <Text style={{ color: '#FFF', fontWeight: '800', fontSize: 12 }}>
                  {role === 'merchant' ? 'Add Product' : 'Add Service'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Added list */}
            {itemsList.length > 0 && (
              <View style={{ marginTop: 12 }}>
                <Text style={[s.listHeading, { color: t.textPrimary }]}>Added Catalog List ({itemsList.length})</Text>
                {itemsList.map((item) => (
                  <View key={item.id} style={[s.addedItemRow, { backgroundColor: t.surface, borderColor: t.border }]}>
                    <View style={{ flex: 1 }}>
                      <Text style={[s.addedItemName, { color: t.textPrimary }]}>{item.name}</Text>
                      <Text style={{ fontSize: 11, color: t.textSecondary }}>
                        ₹{item.price} {role === 'merchant' && `· Qty: ${item.stock}`}
                      </Text>
                    </View>
                    <TouchableOpacity onPress={() => handleRemoveItem(item.id)} style={s.removeItemBtn}>
                      <X size={16} color={t.error} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            {/* Slot & Scheduling Availability for Service Provider */}
            {role === 'provider' && (
              <View style={[s.subCard, { backgroundColor: t.surface, borderColor: t.border, marginTop: 16 }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Clock size={14} color={t.textPrimary} strokeWidth={2.5} />
                  <Text style={[s.subCardTitle, { color: t.textPrimary, marginTop: 0 }]}>Manage Slots & Scheduling</Text>
                </View>
                
                <Text style={[s.label, { color: t.textSecondary }]}>Available Booking Days *</Text>
                <View style={s.dayGrid}>
                  {WEEK_DAYS.map((day) => {
                    const isSelected = selectedDays.includes(day);
                    return (
                      <TouchableOpacity
                        key={day}
                        onPress={() => toggleDay(day)}
                        style={[
                          s.dayTile,
                          {
                            backgroundColor: isSelected ? t.primary : t.muted,
                            borderColor: isSelected ? t.primary : t.border,
                          }
                        ]}
                      >
                        <Text style={{ fontSize: 11, fontWeight: '700', color: isSelected ? '#FFF' : t.textSecondary }}>
                          {day}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <Text style={[s.label, { color: t.textSecondary, marginTop: 12 }]}>Active Hour Slots *</Text>
                <View style={{ gap: 8 }}>
                  {TIME_SLOTS.map((hour) => {
                    const isSelected = selectedHours.includes(hour);
                    return (
                      <TouchableOpacity
                        key={hour}
                        onPress={() => toggleHour(hour)}
                        style={[
                          s.hourRow,
                          {
                            backgroundColor: isSelected ? t.accentBg : t.surface,
                            borderColor: isSelected ? t.primary : t.border,
                          }
                        ]}
                      >
                        <Clock size={16} color={isSelected ? t.primary : t.textSecondary} />
                        <Text style={{ fontSize: 12, fontWeight: '700', color: isSelected ? t.textPrimary : t.textSecondary, flex: 1, marginLeft: 8 }}>
                          {hour}
                        </Text>
                        <View style={[s.checkbox, { borderColor: t.border, backgroundColor: isSelected ? t.primary : 'transparent' }]} />
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            <TouchableOpacity
              onPress={handleOnboardingSubmit}
              disabled={isSubmitting || itemsList.length === 0}
              style={[s.nextBtn, { backgroundColor: itemsList.length > 0 ? t.success : '#CCCCCC', marginTop: 24 }]}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={s.btnTxt}>Complete Registration & Onboard</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {step === 4 && (
          /* Step 4: Success Confetti Screen */
          <View style={s.successWrap}>
            <View style={[s.successCircle, { backgroundColor: t.successBg }]}>
              <Award size={64} color={t.success} />
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <Sparkles size={24} color={t.success} />
              <Text style={[s.successTitle, { color: t.textPrimary, marginBottom: 0 }]}>Congratulations!</Text>
            </View>
            <Text style={[s.successSub, { color: t.textSecondary }]}>
              Your business, <Text style={{ fontWeight: '800' }}>{brandName}</Text>, has been successfully onboarded as a registered {role === 'merchant' ? 'Marketplace Merchant' : 'Local Service Provider'}.
            </Text>

            <View style={[s.summaryCard, { backgroundColor: t.surface, borderColor: t.border }]}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                <Text style={{ color: t.textSecondary, fontSize: 12 }}>Owner Name:</Text>
                <Text style={{ color: t.textPrimary, fontWeight: '700', fontSize: 12 }}>{ownerName}</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                <Text style={{ color: t.textSecondary, fontSize: 12 }}>Business Address:</Text>
                <Text style={{ color: t.textPrimary, fontWeight: '700', fontSize: 12 }}>{address}</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                <Text style={{ color: t.textSecondary, fontSize: 12 }}>Catalog Size:</Text>
                <Text style={{ color: t.textPrimary, fontWeight: '700', fontSize: 12 }}>{itemsList.length} items</Text>
              </View>
              {role === 'provider' && (
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ color: t.textSecondary, fontSize: 12 }}>Scheduling Active:</Text>
                  <Text style={{ color: t.textPrimary, fontWeight: '700', fontSize: 12 }}>{selectedDays.length} Days/wk</Text>
                </View>
              )}
            </View>

            <TouchableOpacity
              onPress={() => {
                tap();
                // Redirect user to the dashboard
                if (role === 'merchant') {
                  router.replace('/(market)/merchant');
                } else {
                  // Simply redirect back to homepage
                  router.replace('/(market)');
                }
              }}
              style={[s.nextBtn, { backgroundColor: t.primary, marginTop: 30 }]}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                {role === 'merchant' ? (
                  <Store color={t.primaryContrast} size={16} strokeWidth={2.5} />
                ) : (
                  <Home color={t.primaryContrast} size={16} strokeWidth={2.5} />
                )}
                <Text style={[s.btnTxt, { color: t.primaryContrast }]}>
                  {role === 'merchant' ? 'Go to Merchant Portal' : 'Go to Marketplace Home'}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
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
  headerTitle: { fontSize: 16, fontWeight: '700' },
  stepIndicatorRow: { flexDirection: 'row', paddingHorizontal: 24, paddingVertical: 14, borderBottomWidth: 1, borderColor: '#F3F4F6', justifyContent: 'space-between' },
  stepCircle: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  scrollContent: { padding: 18, paddingBottom: 60 },
  stepWrap: { gap: 12 },
  stepTitle: { fontSize: 20, fontWeight: '900', letterSpacing: -0.5 },
  stepSub: { fontSize: 12.5, lineHeight: 18 },
  roleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1.5,
    marginTop: 12,
  },
  roleIconWrap: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  roleTitle: { fontSize: 15, fontWeight: '800' },
  roleDesc: { fontSize: 11.5, lineHeight: 15, marginTop: 4 },
  radioSelect: { width: 14, height: 14, borderRadius: 7, borderWidth: 2, borderColor: '#FFF' },
  nextBtn: { padding: 15, borderRadius: 12, alignItems: 'center', justifyContent: 'center', minHeight: 48 },
  btnTxt: { color: '#FFF', fontWeight: '800', fontSize: 14 },
  label: { fontSize: 11.5, fontWeight: '700', marginTop: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: { borderWidth: 1, borderRadius: 8, padding: 12, fontSize: 13, marginBottom: 8 },
  optionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 6, marginBottom: 12 },
  optionPill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
  subCard: { padding: 14, borderRadius: 12, borderWidth: 1, gap: 10, marginTop: 10 },
  subCardTitle: { fontSize: 13.5, fontWeight: '800' },
  addItemBtn: { paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  listHeading: { fontSize: 12, fontWeight: '700', marginBottom: 8 },
  addedItemRow: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 8, borderWidth: 1, marginBottom: 8 },
  addedItemName: { fontSize: 12.5, fontWeight: '700' },
  removeItemBtn: { padding: 4 },
  dayGrid: { flexDirection: 'row', justifyContent: 'space-between', gap: 6, marginTop: 6, marginBottom: 10 },
  dayTile: { flex: 1, paddingVertical: 8, borderRadius: 6, alignItems: 'center', borderWidth: 1 },
  hourRow: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 8, borderWidth: 1 },
  checkbox: { width: 16, height: 16, borderRadius: 4, borderWidth: 1 },
  successWrap: { alignItems: 'center', padding: 20, paddingTop: 40 },
  successCircle: { width: 100, height: 100, borderRadius: 50, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  successTitle: { fontSize: 24, fontWeight: '900', textAlign: 'center', marginBottom: 8 },
  successSub: { fontSize: 13.5, textAlign: 'center', lineHeight: 20, paddingHorizontal: 10, marginBottom: 24 },
  summaryCard: { width: '100%', padding: 16, borderRadius: 12, borderWidth: 1, gap: 8 },
});
