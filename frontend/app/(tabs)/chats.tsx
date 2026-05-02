import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, useColorScheme, SafeAreaView, RefreshControl } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { MessageCircle } from 'lucide-react-native';
import { api } from '../../src/api';
import { lightTheme, darkTheme, spacing, radius } from '../../src/theme';
import { VerifiedAvatar } from '../../src/components';
import { Shimmer } from '../../src/Shimmer';
import { tap } from '../../src/haptics';

export default function Chats() {
  const cs = useColorScheme();
  const t = cs === 'dark' ? darkTheme : lightTheme;
  const router = useRouter();
  const [chats, setChats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get('/chats');
      setChats(data);
    } catch {} finally { setLoading(false); setRefreshing(false); }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.background }}>
      <View style={{ padding: spacing.lg }}>
        <Text style={[styles.h1, { color: t.textPrimary }]}>Messages</Text>
        <Text style={[styles.sub, { color: t.textSecondary }]}>Chat with your drivers and passengers</Text>
      </View>
      {loading ? (
        <View style={{ gap: 12, paddingHorizontal: spacing.lg }}>
          {[1, 2, 3].map(i => <Shimmer key={i} style={{ height: 72, borderRadius: 16 }} />)}
        </View>
      ) : (
        <FlatList
          data={chats}
          keyExtractor={(c) => c.chat_id}
          contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: 120 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={t.primary} />}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <MessageCircle color={t.textSecondary} size={42} />
              <Text style={[styles.emptyTitle, { color: t.textPrimary }]}>No chats yet</Text>
              <Text style={[styles.emptyHint, { color: t.textSecondary }]}>Book a ride to start a conversation</Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              testID={`chat-${item.chat_id}`}
              activeOpacity={0.85}
              onPress={() => { tap(); router.push(`/chat/${encodeURIComponent(item.chat_id)}?name=${encodeURIComponent(item.other_user.name)}` as any); }}
              style={[styles.row, { backgroundColor: t.surface, borderColor: t.border }]}
            >
              <VerifiedAvatar uri={item.other_user.avatar_url} name={item.other_user.name} verified={item.other_user.is_verified} t={t} size={48} />
              <View style={{ flex: 1, marginLeft: spacing.md }}>
                <Text style={[styles.name, { color: t.textPrimary }]} numberOfLines={1}>{item.other_user.name}</Text>
                <Text style={[styles.route, { color: t.textSecondary }]} numberOfLines={1}>{item.ride_route}</Text>
                <Text style={[styles.last, { color: t.textSecondary }]} numberOfLines={1}>{item.last_message}</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  h1: { fontSize: 28, fontWeight: '800', letterSpacing: -0.7 },
  sub: { fontSize: 13, marginTop: 4 },
  row: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, borderRadius: radius.lg, borderWidth: 1 },
  name: { fontSize: 15, fontWeight: '700' },
  route: { fontSize: 12, marginTop: 2 },
  last: { fontSize: 13, marginTop: 4 },
  empty: { alignItems: 'center', padding: 40, gap: 6 },
  emptyTitle: { fontSize: 17, fontWeight: '700', marginTop: 8 },
  emptyHint: { fontSize: 13 },
});
