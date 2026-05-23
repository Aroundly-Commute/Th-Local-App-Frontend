import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Share,
  useColorScheme,
} from 'react-native';
import { inAppLogger, LogEntry, LogLevel } from '../../services/logger';
import { X, Search, Trash2, Share2, Filter } from 'lucide-react-native';

type Props = {
  visible: boolean;
  onClose: () => void;
};

export const LogViewerModal: React.FC<Props> = ({ visible, onClose }) => {
  const cs = useColorScheme();
  const isDark = cs === 'dark';

  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [search, setSearch] = useState('');
  const [filterLevel, setFilterLevel] = useState<LogLevel | 'all'>('all');

  useEffect(() => {
    if (!visible) return;
    return inAppLogger.subscribe((newLogs) => {
      setLogs(newLogs);
    });
  }, [visible]);

  const handleShare = async () => {
    try {
      const logsText = logs
        .map((l) => `[${l.timestamp}] [${l.level.toUpperCase()}] ${l.message}`)
        .join('\n');
      await Share.share({
        message: logsText,
        title: 'App Console Logs',
      });
    } catch (error: any) {
      console.error('Failed to share logs:', error.message);
    }
  };

  const getLogColor = (level: LogLevel) => {
    if (level === 'error') return '#EF4444';
    if (level === 'warn') return '#F59E0B';
    return isDark ? '#E5E7EB' : '#1F2937';
  };

  const filteredLogs = logs.filter((log) => {
    const matchesSearch = log.message.toLowerCase().includes(search.toLowerCase()) || 
                          log.level.toLowerCase().includes(search.toLowerCase());
    const matchesLevel = filterLevel === 'all' || log.level === filterLevel;
    return matchesSearch && matchesLevel;
  });

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <View style={[styles.container, { backgroundColor: isDark ? '#111827' : '#F3F4F6' }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: isDark ? '#374151' : '#E5E7EB' }]}>
          <Text style={[styles.title, { color: isDark ? '#F9FAFB' : '#111827' }]}>Console Logs</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <X color={isDark ? '#F9FAFB' : '#111827'} size={24} />
          </TouchableOpacity>
        </View>

        {/* Toolbar */}
        <View style={styles.toolbar}>
          <View style={[styles.searchBox, { backgroundColor: isDark ? '#1F2937' : '#FFFFFF' }]}>
            <Search color="#9CA3AF" size={18} style={styles.searchIcon} />
            <TextInput
              style={[styles.searchInput, { color: isDark ? '#F9FAFB' : '#111827' }]}
              placeholder="Filter logs..."
              placeholderTextColor="#9CA3AF"
              value={search}
              onChangeText={setSearch}
            />
          </View>
          <View style={styles.actionButtons}>
            <TouchableOpacity
              onPress={handleShare}
              style={[styles.iconButton, { backgroundColor: '#10B981' }]}
              title="Share Logs"
            >
              <Share2 color="#FFFFFF" size={18} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => inAppLogger.clear()}
              style={[styles.iconButton, { backgroundColor: '#EF4444' }]}
              title="Clear Logs"
            >
              <Trash2 color="#FFFFFF" size={18} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Level Filters */}
        <View style={styles.filters}>
          {(['all', 'info', 'warn', 'error'] as const).map((level) => (
            <TouchableOpacity
              key={level}
              onPress={() => setFilterLevel(level)}
              style={[
                styles.filterTab,
                {
                  backgroundColor: filterLevel === level 
                    ? (level === 'error' ? '#EF4444' : level === 'warn' ? '#F59E0B' : '#3B82F6')
                    : (isDark ? '#1F2937' : '#FFFFFF'),
                }
              ]}
            >
              <Text
                style={[
                  styles.filterText,
                  { color: filterLevel === level ? '#FFFFFF' : (isDark ? '#9CA3AF' : '#4B5563') }
                ]}
              >
                {level.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Logs List */}
        <FlatList
          data={filteredLogs}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          renderItem={({ item }) => (
            <View style={[styles.logRow, { borderBottomColor: isDark ? '#1F2937' : '#E5E7EB' }]}>
              <View style={styles.logMeta}>
                <Text style={styles.timestamp}>{item.timestamp}</Text>
                <Text
                  style={[
                    styles.levelBadge,
                    {
                      color: item.level === 'error' ? '#EF4444' : item.level === 'warn' ? '#F59E0B' : '#3B82F6',
                    }
                  ]}
                >
                  [{item.level.toUpperCase()}]
                </Text>
              </View>
              <Text selectable style={[styles.logMessage, { color: getLogColor(item.level) }]}>
                {item.message}
              </Text>
            </View>
          )}
        />
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    paddingTop: 48,
  },
  title: { fontSize: 20, fontWeight: '800' },
  closeBtn: { padding: 4 },
  toolbar: {
    flexDirection: 'row',
    padding: 12,
    gap: 8,
    alignItems: 'center',
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    paddingHorizontal: 8,
    height: 40,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 14, padding: 0 },
  actionButtons: { flexDirection: 'row', gap: 8 },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filters: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    gap: 6,
    marginBottom: 8,
  },
  filterTab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  filterText: { fontSize: 11, fontWeight: '700' },
  listContainer: { paddingBottom: 32 },
  logRow: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  logMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  timestamp: { fontSize: 11, color: '#9CA3AF', fontFamily: 'monospace' },
  levelBadge: { fontSize: 11, fontWeight: '800', fontFamily: 'monospace' },
  logMessage: { fontSize: 12, fontFamily: 'monospace', lineHeight: 16 },
});
