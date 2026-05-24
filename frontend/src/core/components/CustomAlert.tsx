import React, { useState, useEffect } from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, useColorScheme, Animated, Dimensions } from 'react-native';
import { lightTheme, darkTheme, spacing, radius } from '../theme/theme';
import { tap } from '../utils/haptics';

type AlertButton = {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
};

type AlertConfig = {
  title: string;
  message?: string;
  buttons?: AlertButton[];
  visible: boolean;
};

let alertRef: ((config: AlertConfig) => void) | null = null;

/**
 * Imperative function to show the gorgeous custom themed alert from anywhere
 */
export const showCustomAlert = (
  title: string,
  message?: string,
  buttons?: AlertButton[]
) => {
  if (alertRef) {
    alertRef({
      title,
      message,
      buttons: buttons || [{ text: 'OK' }],
      visible: true,
    });
  } else {
    console.warn('[CustomAlert] Component not mounted. Cannot show alert: ' + title);
  }
};

export const Alert = {
  alert: showCustomAlert,
};

export const CustomAlertProvider: React.FC = () => {
  const [config, setConfig] = useState<AlertConfig>({ title: '', visible: false });
  const cs = useColorScheme();
  const t = cs === 'dark' ? darkTheme : lightTheme;
  const [fadeAnim] = useState(() => new Animated.Value(0));
  const [scaleAnim] = useState(() => new Animated.Value(0.9));

  useEffect(() => {
    alertRef = setConfig;
    return () => {
      alertRef = null;
    };
  }, []);

  useEffect(() => {
    if (config.visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 220, useNativeDriver: true }),
        Animated.spring(scaleAnim, { toValue: 1, friction: 6.5, tension: 50, useNativeDriver: true })
      ]).start();
    } else {
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.95);
    }
  }, [config.visible]);

  if (!config.visible) return null;

  const handleButtonPress = (btn: AlertButton) => {
    tap();
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 0.95, duration: 150, useNativeDriver: true })
    ]).start(() => {
      setConfig(prev => ({ ...prev, visible: false }));
      if (btn.onPress) {
        btn.onPress();
      }
    });
  };

  return (
    <Modal
      visible={config.visible}
      transparent
      animationType="none"
      onRequestClose={() => setConfig(prev => ({ ...prev, visible: false }))}
    >
      <View style={styles.overlay}>
        <Animated.View style={[styles.backdrop, { backgroundColor: t.isDark ? 'rgba(5, 11, 20, 0.75)' : 'rgba(10, 22, 40, 0.6)' }, { opacity: fadeAnim }]} />
        <Animated.View 
          style={[
            styles.alertBox, 
            { backgroundColor: t.surface, borderColor: t.border },
            { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }
          ]}
        >
          <Text style={[styles.title, { color: t.textPrimary }]}>{config.title}</Text>
          {config.message ? (
            <Text style={[styles.message, { color: t.textSecondary }]}>{config.message}</Text>
          ) : null}

          <View style={styles.buttonRow}>
            {config.buttons?.map((btn, idx) => {
              const isCancel = btn.style === 'cancel';
              const isDestructive = btn.style === 'destructive';
              
              let btnBg = t.isDark ? '#00D4BC' : '#0A1628'; // Mint in dark mode, Navy in light
              let textStyle: { color: string; fontWeight: '600' | '700' } = { color: t.isDark ? '#0A1628' : '#00D4BC', fontWeight: '700' };
              
              if (isCancel) {
                btnBg = t.isDark ? '#142E58' : '#E8FBF9';
                textStyle = { color: t.isDark ? '#CCF7F3' : '#1A4060', fontWeight: '600' as const };
              } else if (isDestructive) {
                btnBg = '#EF4444';
                textStyle = { color: '#FFFFFF', fontWeight: '700' as const };
              }

              return (
                <TouchableOpacity
                  key={idx}
                  activeOpacity={0.85}
                  onPress={() => handleButtonPress(btn)}
                  style={[styles.button, { backgroundColor: btnBg, flex: config.buttons!.length > 2 ? undefined : 1 }]}
                >
                  <Text style={[styles.buttonText, textStyle]}>{btn.text}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  alertBox: {
    width: '100%',
    maxWidth: 320,
    borderRadius: 20,
    borderWidth: 1,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 16,
    elevation: 10,
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 10,
    textAlign: 'center',
    letterSpacing: -0.4,
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 24,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'center',
    width: '100%',
  },
  button: {
    height: 46,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 90,
    paddingHorizontal: 16,
  },
  buttonText: {
    fontSize: 13,
  },
});
