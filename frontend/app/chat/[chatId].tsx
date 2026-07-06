import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, useColorScheme, Keyboard } from 'react-native';

import { useLocalSearchParams, useRouter } from 'expo-router';
import { Send, User, ChevronDown } from 'lucide-react-native';
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
  const insets = useSafeAreaInsets();
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [inputHeight, setInputHeight] = useState(44);
  const [showScrollBottomBtn, setShowScrollBottomBtn] = useState(false);

  const handleScroll = (event: any) => {
    const { contentOffset, layoutMeasurement, contentSize } = event.nativeEvent;
    // Show arrow button if scrolled up by more than 150px from bottom
    const isNearBottom = contentSize.height - layoutMeasurement.height - contentOffset.y < 150;
    setShowScrollBottomBtn(!isNearBottom);
  };

  const getPeerUserId = () => {
    if (!chatId || !user?.id) return null;
    const parts = chatId.replace(/^chat_/, '').split('_');
    if (parts.length === 2) {
      return parts[0] === user.id ? parts[1] : parts[0];
    }
    return null;
  };
  const peerUserId = getPeerUserId();

  useEffect(() => {
    const showSubscription = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => {
        setKeyboardVisible(true);
        setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 80);
      }
    );
    const hideSubscription = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setKeyboardVisible(false);
        setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 80);
      }
    );

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  const headerHeight = Platform.OS === 'ios' ? 52 : 56;
  const keyboardOffset = insets.top + headerHeight;

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
    setInputHeight(44); // Reset multiline textinput height
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 50);
    try {
      await api.post(`/chats/${encodeURIComponent(chatId!)}/messages`, { text: body });
      success();
    } catch {}
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.background }} edges={['top', 'left', 'right']}>
      <ScreenHeader
        title={name || 'Chat'}
        rightComponent={
          peerUserId ? (
            <TouchableOpacity
              onPress={() => {
                tap();
                router.push(`/user/${peerUserId}` as any);
              }}
              activeOpacity={0.8}
              style={{ padding: 4, marginRight: 2 }}
            >
              <User color={t.textPrimary} size={22} />
            </TouchableOpacity>
          ) : undefined
        }
      />

      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={{ flex: 1, position: 'relative' }}>
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(m) => m.id}
            contentContainerStyle={{ padding: spacing.md, gap: 8, paddingBottom: 12 }}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
            onLayout={() => setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 50)}
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

          {showScrollBottomBtn && (
            <TouchableOpacity
              onPress={() => {
                tap();
                listRef.current?.scrollToEnd({ animated: true });
              }}
              activeOpacity={0.8}
              style={{
                position: 'absolute',
                right: 16,
                bottom: 16,
                width: 38,
                height: 38,
                borderRadius: 19,
                backgroundColor: t.primary,
                alignItems: 'center',
                justifyContent: 'center',
                elevation: 4,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.15,
                shadowRadius: 4,
                zIndex: 999,
              }}
            >
              <ChevronDown color={t.primaryContrast} size={20} />
            </TouchableOpacity>
          )}
        </View>

        <View style={[
          styles.inputBar, 
          { 
            backgroundColor: t.surface, 
            borderColor: t.border,
            paddingBottom: keyboardVisible ? spacing.sm : spacing.sm + insets.bottom
          }
        ]}>
          <TextInput
            testID="chat-input"
            value={text}
            onChangeText={setText}
            placeholder="Message..."
            placeholderTextColor={t.textSecondary}
            style={[
              styles.input, 
              { 
                height: Math.max(44, Math.min(120, inputHeight)), 
                color: t.textPrimary, 
                backgroundColor: t.background, 
                borderColor: t.border 
              }
            ]}
            multiline
            onContentSizeChange={(e) => {
              setInputHeight(e.nativeEvent.contentSize.height);
            }}
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
