import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle } from 'react-native';
import { Colors, Fonts, MIN_TOUCH } from '@/constants/theme';

interface Props {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'outline';
  disabled?: boolean;
  style?: ViewStyle;
}

export default function PixelButton({ label, onPress, variant = 'primary', disabled, style }: Props) {
  const isPrimary = variant === 'primary';
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      style={[styles.base, isPrimary ? styles.primary : styles.outline, disabled && styles.disabled, style]}
      activeOpacity={0.7}
    >
      <Text style={[styles.label, isPrimary ? styles.labelPrimary : styles.labelOutline]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    width: '100%',
    minHeight: MIN_TOUCH,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primary: {
    backgroundColor: Colors.red,
    borderBottomWidth: 3,
    borderRightWidth: 2,
    borderBottomColor: '#700000',
    borderRightColor: '#700000',
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.red,
  },
  disabled: { opacity: 0.4 },
  label: {
    fontFamily: Fonts.pixel,
    fontSize: 10,
    letterSpacing: 2,
  },
  labelPrimary: { color: '#ffffff' },
  labelOutline: { color: Colors.redGlow },
});
