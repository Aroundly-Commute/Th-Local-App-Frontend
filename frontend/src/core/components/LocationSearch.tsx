import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import { MapPin, X, Search } from 'lucide-react-native';
import { Theme, radius } from '../theme/theme';
import { api } from '../api/api';

interface Prediction {
  id: string;
  place_name: string;
}

interface Props {
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  onSelect: (name: string, lat: number, lng: number) => void;
  t: Theme;
  icon?: React.ReactNode;
}

export const LocationSearch: React.FC<Props> = ({
  placeholder, value, onChangeText, onSelect, t, icon
}) => {
  const [query, setQuery] = useState(value);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  const search = async (text: string) => {
    if (!text || text.length < 3) {
      setPredictions([]);
      return;
    }

    setLoading(true);
    try {
      const resp = await api.get(`/locations/suggest?q=${encodeURIComponent(text)}`);
      setPredictions(resp.data);
    } catch (e) {
      console.error('Location search error:', e);
      setPredictions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (text: string) => {
    setQuery(text);
    onChangeText(text);
    setShowDropdown(true);

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => search(text), 400);
  };

  const handleSelect = async (item: Prediction) => {
    setQuery(item.place_name);
    setShowDropdown(false);
    setPredictions([]);
    Keyboard.dismiss();

    setLoading(true);
    try {
      const resp = await api.get(`/locations/details?place_id=${item.id}`);
      if (resp.data && !resp.data.error) {
        const { lat, lng } = resp.data;
        onSelect(item.place_name, lat, lng);
      }
    } catch (e) {
      console.error('Location details fetch error:', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={[styles.inputRow, { backgroundColor: t.muted }]}>
        <View style={styles.icon}>{icon || <Search size={16} color={t.textSecondary} />}</View>
        <TextInput
          value={query}
          onChangeText={handleChange}
          placeholder={placeholder}
          placeholderTextColor={t.textSecondary}
          style={[styles.input, { color: t.textPrimary }]}
          onFocus={() => setShowDropdown(true)}
        />
        {query ? (
          <TouchableOpacity onPress={() => { setQuery(''); onChangeText(''); setPredictions([]); }}>
            <X size={16} color={t.textSecondary} />
          </TouchableOpacity>
        ) : null}
        {loading && <ActivityIndicator size="small" color={t.primary} style={{ marginLeft: 8 }} />}
      </View>

      {showDropdown && predictions.length > 0 && (
        <View style={[styles.dropdown, { backgroundColor: t.surface, borderColor: t.border }]}>
          <FlatList
            data={predictions}
            keyExtractor={(item) => item.id}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.item, { borderBottomColor: t.border }]}
                onPress={() => handleSelect(item)}
              >
                <MapPin size={14} color={t.textSecondary} style={{ marginTop: 2 }} />
                <Text style={[styles.itemText, { color: t.textPrimary }]} numberOfLines={2}>
                  {item.place_name}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { zIndex: 100 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderRadius: radius.md,
    paddingHorizontal: 12,
  },
  icon: { width: 24, alignItems: 'center' },
  input: { flex: 1, fontSize: 15, marginLeft: 8 },
  dropdown: {
    position: 'absolute',
    top: 52,
    left: 0,
    right: 0,
    borderRadius: radius.md,
    borderWidth: 1,
    maxHeight: 250,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  item: {
    flexDirection: 'row',
    padding: 14,
    borderBottomWidth: 1,
    gap: 12,
  },
  itemText: { fontSize: 14, flex: 1 },
});
