import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator, useColorScheme, Platform } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MessageSquare, ChevronRight } from 'lucide-react-native';
import { api } from '../../src/core/api/api';
import { lightTheme, darkTheme, spacing, radius } from '../../src/core/theme/theme';
import { ScreenHeader } from '../../src/core/components/ScreenHeader';
import { VerifiedAvatar } from '../../src/core/components/VerifiedAvatar';
import { tap } from '../../src/core/utils/haptics';

export default function MessagesScreen() {
  const cs = useColorScheme();
  const t = cs === 'dark' ? darkTheme : lightTheme;
  const router = useRouter();
  const [chats, setChats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchChats = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const { data } = await api.get('/chats');
      setChats(data);
    } catch (err) {
      console.error('Failed to fetch chats:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchChats(chats.length === 0);
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchChats(false);
  };

  const handleChatPress = (chatId: string, name: string) => {
    tap();
    router.push(`/chat/${encodeURIComponent(chatId)}?name=${encodeURIComponent(name)}` as any);
  };

  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays === 1) return 'Yesterday';
      if (diffDays < 7) return `${diffDays}d ago`;

      return date.toLocaleDateString([], { day: '2-digit', month: 'short' });
    } catch {
      return '';
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.background }} edges={['top']}>
      <ScreenHeader title="Messages" />

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={t.primary} size="large" />
        </View>
      ) : (
        <FlatList
          data={chats}
          keyExtractor={(item) => item.chat_id}
          refreshControl={
            Platform.OS !== 'web' ? <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[t.primary]} tintColor={t.primary} /> : undefined
          }
          contentContainerStyle={{ paddingHorizontal: spacing.md, paddingVertical: spacing.sm, gap: 10 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => handleChatPress(item.chat_id, item.other_user.name)}
              style={[styles.chatCard, { backgroundColor: '#F9FAFB', borderColor: '#E5E7EB' }]}
            >
              <VerifiedAvatar uri={undefined} name={item.other_user.name} verified={false} t={t} size={48} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ color: t.textPrimary, fontWeight: '700', fontSize: 15 }} numberOfLines={1}>
                    {item.other_user.name}
                  </Text>
                  <Text style={{ color: t.textSecondary, fontSize: 11 }}>
                    {formatTime(item.last_time)}
                  </Text>
                </View>
                <Text style={{ color: t.textSecondary, fontSize: 13, marginTop: 4 }} numberOfLines={1}>
                  {item.last_message}
                </Text>
              </View>
              <ChevronRight color={t.textSecondary} size={16} style={{ marginLeft: 8 }} />
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={[styles.emptyIconContainer, { backgroundColor: t.isDark ? '#222' : '#F3F4F6' }]}>
                <MessageSquare color={t.textSecondary} size={32} />
              </View>
              <Text style={{ color: t.textPrimary, fontWeight: '700', fontSize: 16, marginTop: 16 }}>
                No messages yet
              </Text>
              <Text style={{ color: t.textSecondary, fontSize: 14, textAlign: 'center', marginTop: 8, paddingHorizontal: 40 }}>
                When you request a ride, split a cab, or respond to buddy requests, you can chat here.
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  chatCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
  },
  emptyIconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
