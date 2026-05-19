import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/theme';
import PixelText from './PixelText';

interface Props {
  title: string;
  coins?: number;
  right?: React.ReactNode;
}

export default function AppHeader({ title, coins, right }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
      <PixelText size={13} glow="red">{title}</PixelText>
      {coins !== undefined && (
        <PixelText size={11} color={Colors.gold} glow="gold">💰 {coins} PTS</PixelText>
      )}
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: Colors.headerBg,
    borderBottomWidth: 2,
    borderBottomColor: Colors.red,
    paddingHorizontal: 16,
    paddingBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 44,
  },
});
