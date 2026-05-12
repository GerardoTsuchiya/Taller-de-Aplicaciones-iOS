import React from 'react';
import { TextInput, View, Text, StyleSheet } from 'react-native';
import { Colors, Fonts, MIN_TOUCH } from '@/constants/theme';

interface Props {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  secureTextEntry?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  keyboardType?: 'default' | 'email-address';
}

export default function PixelInput({ label, value, onChangeText, secureTextEntry, autoCapitalize = 'none', keyboardType = 'default' }: Props) {
  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        autoCapitalize={autoCapitalize}
        keyboardType={keyboardType}
        style={styles.input}
        placeholderTextColor={Colors.textDisabled}
        cursorColor={Colors.red}
        selectionColor={Colors.red}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: 12 },
  label: {
    fontFamily: Fonts.pixel,
    fontSize: 9,
    color: Colors.textSecondary,
    letterSpacing: 1,
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#0d0d18',
    borderWidth: 1,
    borderColor: '#2a2a44',
    borderRightColor: '#111',
    borderBottomColor: '#111',
    padding: 12,
    minHeight: MIN_TOUCH,
    color: Colors.textMain,
    fontFamily: Fonts.pixel,
    fontSize: 9,
    letterSpacing: 1,
  },
});
