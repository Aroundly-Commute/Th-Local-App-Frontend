import * as Haptics from 'expo-haptics';

export const tap = () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
export const tapMedium = () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
export const success = () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
export const errorH = () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
