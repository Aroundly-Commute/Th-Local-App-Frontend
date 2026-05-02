import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, useColorScheme, SafeAreaView,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft, Send } from 'lucide-react-native';
import { api, wsUrl } from '../../src/api';
import { useAuth } from '../../src/auth';
import { lightTheme, darkTheme, spacing, radius } from '../../src/theme';
import { tap, success } from '../../src/haptics';

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
        const { data } = await api.get(`/chats/${encodeURIComponent(chatId!)}/messages`);
        setMessages(data);
      } catch {}
    })();

    const ws = new WebSocket(wsUrl(chatId!));
    wsRef.current = ws;
    ws.onmessage = (ev) => {
      try {
        const m = JSON.parse(ev.data);
        setMessages((prev) => prev.some((x) => x.id === m.id) ? prev : [...prev, m]);
      } catch {}
    };
    return () => { try { ws.close(); } catch {} };
  }, [chatId]);

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
    <SafeAreaView style={{ flex: 1, backgroundColor: t.background }}>
      <View style={[styles.header, { backgroundColor: t.surface, borderColor: t.border }]}>
        <TouchableOpacity testID="chat-back" onPress={() => { tap(); router.back(); }} style={{ padding: 6 }}>
          <ChevronLeft color={t.textPrimary} size={24} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: t.textPrimary }]} numberOfLines={1}>{name || 'Chat'}</Text>
        <View style={{ width: 36 }} />
      </View>

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
                <Text style={{ color: mine ? t.primaryContrast : t.textSecondary, fontSize: 10, opacity: 0.8, marginTop: 4 }}>
                  {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
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
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.md, paddingVertical: 12, borderBottomWidth: 1 },
  title: { fontSize: 17, fontWeight: '700', flex: 1, textAlign: 'center' },
  bubble: { maxWidth: '78%', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 18, borderWidth: 1 },
  inputBar: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, padding: spacing.sm, borderTopWidth: 1 },
  input: { flex: 1, minHeight: 44, maxHeight: 120, borderWidth: 1, borderRadius: 22, paddingHorizontal: 16, paddingTop: 12, fontSize: 15 },
  sendBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
});
