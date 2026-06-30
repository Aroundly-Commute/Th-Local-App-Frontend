import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Menu, X } from 'lucide-react-native';

interface HeaderProps {
  t: any;
  isDesktop: boolean;
  scrollToSection: (id: string) => void;
}

export function Header({ t, isDesktop, scrollToSection }: HeaderProps) {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleNavPress = (action: () => void) => {
    setIsMenuOpen(false);
    action();
  };

  return (
    <View style={[styles.header, { borderBottomColor: t.border }]}>
      <View style={styles.headerContent}>
        <View style={styles.logoContainer}>
          <Image
            source={require('../../../../assets/images/app_Icon_less_padding.webp')}
            style={styles.logoImage}
          />
        </View>

        {isDesktop && (
          <View style={styles.navLinks}>
            <TouchableOpacity
              disabled={true}
              style={[styles.navLink, Platform.OS === 'web' && ({ cursor: 'default' } as any)]}
            >
              <Text style={[styles.navLinkText, { color: t.textPrimary, fontWeight: '700' }]}>Features</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => scrollToSection('cab-buddy')} style={styles.navLink}>
              <Text style={[styles.navLinkText, { color: t.textSecondary }]}>Cab Buddy</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => scrollToSection('faq')} style={styles.navLink}>
              <Text style={[styles.navLinkText, { color: t.textSecondary }]}>FAQs</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/privacy')} style={styles.navLink}>
              <Text style={[styles.navLinkText, { color: t.textSecondary }]}>Privacy Policy</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/help')} style={styles.navLink}>
              <Text style={[styles.navLinkText, { color: t.textSecondary }]}>Help Support</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.headerRight}>
          <TouchableOpacity
            onPress={() => router.push('/(auth)/login')}
            style={[styles.loginBtn, { backgroundColor: t.primary }]}
          >
            <Text style={[styles.loginBtnText, { color: t.primaryContrast }]}>
              Login
            </Text>
          </TouchableOpacity>

          {!isDesktop && (
            <TouchableOpacity
              onPress={() => setIsMenuOpen(!isMenuOpen)}
              style={styles.menuBtn}
              activeOpacity={0.7}
            >
              {isMenuOpen ? (
                <X color={t.textPrimary} size={24} />
              ) : (
                <Menu color={t.textPrimary} size={24} />
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Mobile Dropdown Menu Overlay */}
      {!isDesktop && isMenuOpen && (
        <View style={[styles.dropdownMenu, { backgroundColor: '#FFFFFF', borderBottomColor: t.border }]}>
          <TouchableOpacity
            disabled={true}
            style={[styles.dropdownItem, { opacity: 0.6 }]}
          >
            <Text style={[styles.dropdownItemText, { color: t.textPrimary, fontWeight: '700' }]}>Features</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleNavPress(() => scrollToSection('cab-buddy'))}
            style={styles.dropdownItem}
          >
            <Text style={[styles.dropdownItemText, { color: t.textSecondary }]}>Cab Buddy</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleNavPress(() => scrollToSection('faq'))}
            style={styles.dropdownItem}
          >
            <Text style={[styles.dropdownItemText, { color: t.textSecondary }]}>FAQs</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleNavPress(() => router.push('/privacy'))}
            style={styles.dropdownItem}
          >
            <Text style={[styles.dropdownItemText, { color: t.textSecondary }]}>Privacy Policy</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleNavPress(() => router.push('/help'))}
            style={styles.dropdownItem}
          >
            <Text style={[styles.dropdownItemText, { color: t.textSecondary }]}>Help Support</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    height: 70,
    borderBottomWidth: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    paddingHorizontal: 24,
    zIndex: 100,
    position: 'relative',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoImage: {
    width: 68,
    height: 54,
    resizeMode: 'contain',
  },
  navLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 32,
    flex: 1,
  },
  navLink: {
    marginHorizontal: 14,
    paddingVertical: 8,
  },
  navLinkText: {
    fontSize: 14,
    fontWeight: '600',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loginBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  loginBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  menuBtn: {
    padding: 8,
    marginLeft: 12,
  },
  dropdownMenu: {
    position: 'absolute',
    top: 69,
    left: 0,
    right: 0,
    paddingVertical: 12,
    borderBottomWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 5,
    zIndex: 999,
  },
  dropdownItem: {
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  dropdownItemText: {
    fontSize: 15,
    fontWeight: '600',
  },
});

