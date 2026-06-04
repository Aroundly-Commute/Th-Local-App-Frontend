import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, useColorScheme } from 'react-native';

import { useLocalSearchParams, useRouter } from 'expo-router';
import { Send } from 'lucide-react-native';
import { api, wsUrl } from '../../src/core/api/api';
import { useAuth } from '../../src/core/auth/auth';
import { lightTheme, darkTheme, spacing, radius } from '../../src/core/theme/theme';
import { tap, success } from '../../src/core/utils/haptics';
import { ScreenHeader } from '../../src/core/components/ScreenHeader';

export default function ChatScreen() {
  const cs = useColorScheme();
  const t = cs === 'dark' ? darkTheme : lightTheme;
  const router = useRouter();
  const { chatId, name } = useLocalSearchParams<{ chatId: string; name?: string }>();
  const { user } = useAuth();
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState('');
  const wsRef = useRef<WebSocket | null>(null);
  const listRef = useRef<FlatList>(null);

  useEffect(() => {
    (async () => {
      try {
        await api.patch(`/chats/${encodeURIComponent(chatId!)}/read`).catch(() => {});
        const { data } = await api.get(`/chats/${encodeURIComponent(chatId!)}/messages`);
        setMessages(data);
      } catch {}
    })();

    const ws = new WebSocket(wsUrl(chatId!) + (user?.id ? `/${user.id}` : ''));
    wsRef.current = ws;
    ws.onmessage = (ev) => {
      try {
        const data = JSON.parse(ev.data);
        if (data.type === 'status_update') {
          setMessages((prev) =>
            prev.map((msg) =>
              data.messageIds.includes(msg.id)
                ? { ...msg, status: data.status }
                : msg
            )
          );
        } else {
          setMessages((prev) => {
            if (prev.some((x) => x.id === data.id)) {
              return prev.map((x) => (x.id === data.id ? data : x));
            }
            return [...prev, data];
          });
        }
      } catch {}
    };
    return () => { try { ws.close(); } catch {} };
  }, [chatId, user?.id]);

  useEffect(() => {
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 50);
  }, [messages.length]);

  const send = async () => {
    if (!text.trim()) return;
    tap();
    const body = text.trim();
    setText('');
    try {
      await api.post(`/chats/${encodeURIComponent(chatId!)}/messages`, { text: body });
      success();
    } catch {}
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.background }} edges={['top', 'left', 'right']}>
      <ScreenHeader title={name || 'Chat'} />

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(m) => m.id}
          contentContainerStyle={{ padding: spacing.md, gap: 8, paddingBottom: 12 }}
          renderItem={({ item }) => {
            const mine = item.sender_id === user?.id;
            return (
              <View style={[styles.bubble, {
                alignSelf: mine ? 'flex-end' : 'flex-start',
                backgroundColor: mine ? t.primary : t.surface,
                borderColor: mine ? t.primary : t.border,
              }]}>
                <Text style={{ color: mine ? t.primaryContrast : t.textPrimary, fontSize: 15 }}>
                  {item.text}
                </Text>
                <View style={{ flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 4, marginTop: 4 }}>
                  <Text style={{ color: mine ? t.primaryContrast : t.textSecondary, fontSize: 10, opacity: 0.8 }}>
                    {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                  {mine && (
                    <Text style={{
                      fontSize: 12,
                      fontWeight: 'bold',
                      color: item.status === 'READ' ? '#4fc3f7' : (mine ? 'rgba(255, 255, 255, 0.7)' : t.textSecondary)
                    }}>
                      {item.status === 'READ' || item.status === 'DELIVERED' ? '✓✓' : '✓'}
                    </Text>
                  )}
                </View>
              </View>
            );
          }}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', padding: 40 }}>
              <Text style={{ color: t.textSecondary }}>Say hi 👋</Text>
            </View>
          }
        />

        <View style={[styles.inputBar, { backgroundColor: t.surface, borderColor: t.border }]}>
          <TextInput
            testID="chat-input"
            value={text}
            onChangeText={setText}
            placeholder="Message..."
            placeholderTextColor={t.textSecondary}
            style={[styles.input, { color: t.textPrimary, backgroundColor: t.background, borderColor: t.border }]}
            multiline
          />
          <TouchableOpacity testID="chat-send" onPress={send} activeOpacity={0.85} style={[styles.sendBtn, { backgroundColor: t.primary }]}>
            <Send color={t.primaryContrast} size={18} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  bubble: { maxWidth: '78%', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 18, borderWidth: 1 },
  inputBar: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, padding: spacing.sm, borderTopWidth: 1 },
  input: { flex: 1, minHeight: 44, maxHeight: 120, borderWidth: 1, borderRadius: 22, paddingHorizontal: 16, paddingTop: 12, fontSize: 15 },
  sendBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
});
