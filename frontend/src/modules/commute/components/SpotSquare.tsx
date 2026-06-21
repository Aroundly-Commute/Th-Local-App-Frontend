import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface SpotState {
  id: string;
  spotName: string;
  level: number;
  section: 'LEFT' | 'MIDDLE' | 'RIGHT';
  row: number;
  col: number;
}

interface SpotSquareProps {
  spot?: any;
  status?: 'UNAVAILABLE' | 'MINE_CONFIRMED' | 'MINE_REQUESTED' | 'MINE_REJECTED' | 'OTHER_BOOKED' | 'OTHER_REQUESTED' | 'AVAILABLE';
  isSelected?: boolean;
  t: any;
  onPress?: (spot: any) => void;
  level: number;
  section: 'LEFT' | 'MIDDLE' | 'RIGHT';
  row: number;
  col: number;
}

export function SpotSquare({
  spot,
  status,
  isSelected,
  t,
  onPress,
  level,
  section,
  row,
  col,
}: SpotSquareProps) {
  if (!spot) {
    return (
      <View
        style={[
          styles.spotMock,
          { borderColor: t.border },
        ]}
      />
    );
  }

  let bgColor = t.surface;
  let borderColor = t.border;
  let textColor = t.textSecondary;
  let borderWidth = 1;

  if (status === 'UNAVAILABLE') {
    bgColor = t.background;
    borderColor = t.border;
    textColor = t.textTertiary;
  } else if (status === 'MINE_CONFIRMED') {
    bgColor = t.successBg;
    borderColor = t.success;
    textColor = t.success;
    borderWidth = 2;
  } else if (status === 'MINE_REQUESTED') {
    bgColor = t.warningBg;
    borderColor = t.warning;
    textColor = t.warning;
    borderWidth = 2;
  } else if (status === 'OTHER_BOOKED') {
    bgColor = t.errorBg;
    borderColor = t.error;
    textColor = t.error;
  } else if (status === 'OTHER_REQUESTED') {
    bgColor = t.accentBg;
    borderColor = t.accent;
    textColor = t.accent;
  } else if (status === 'AVAILABLE') {
    bgColor = '#10B981'; // Vibrant Green
    borderColor = '#059669';
    textColor = '#FFFFFF';
  }

  if (isSelected) {
    borderColor = t.primary;
    borderWidth = 2.5;
  }

  const label = section === 'MIDDLE' ? `${row}-${col}` : `${row}`;

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => onPress && onPress(spot)}
      style={[
        styles.spotSquare,
        {
          backgroundColor: bgColor,
          borderColor: borderColor,
          borderWidth: borderWidth,
        },
      ]}
    >
      <Text style={[styles.spotLabel, { color: textColor }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  spotSquare: {
    width: 25,
    height: 25,
    borderRadius: 4,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spotMock: {
    width: 25,
    height: 25,
    borderRadius: 4,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  spotLabel: {
    fontSize: 9,
    fontWeight: '800',
  },
});
