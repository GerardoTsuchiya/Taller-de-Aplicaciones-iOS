import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { apiFetch } from '@/api/client';
import { useAuthStore } from '@/store/authStore';
import { Colors } from '@/constants/theme';
import GridBackground from '@/components/GridBackground';
import PixelText from '@/components/PixelText';
import PixelInput from '@/components/PixelInput';
import PixelButton from '@/components/PixelButton';

export default function RegisterScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuthStore();
  const router = useRouter();

  const handleRegister = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Completa todos los campos');
      return;
    }
    setLoading(true);
    try {
      // Backend devuelve { user: SupabaseUser, session: { access_token, ... } }
      const { user: authUser, session } = await apiFetch('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      await login(session.access_token, {
        id: authUser.id,
        email: authUser.email,
        username: authUser.email,
      });
      router.replace('/(tabs)');
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.screen}>
      <GridBackground />
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <PixelText size={9} color={Colors.redGlow} glow="red">◄ REGISTRO</PixelText>
        </View>
        <PixelText size={16} glow="red" style={styles.title}>NUEVO ENTRENADOR</PixelText>
        <PixelInput label="CORREO" value={email} onChangeText={setEmail} keyboardType="email-address" />
        <PixelInput label="CONTRASEÑA" value={password} onChangeText={setPassword} secureTextEntry />
        <PixelButton label="► CREAR CUENTA" onPress={handleRegister} disabled={loading} style={styles.btn} />
        <PixelButton label="VOLVER AL LOGIN" onPress={() => router.back()} variant="outline" />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.bg },
  scroll: { padding: 20, paddingBottom: 40 },
  header: {
    borderBottomWidth: 2, borderBottomColor: Colors.red,
    backgroundColor: Colors.headerBg,
    paddingVertical: 12, paddingHorizontal: 16,
    marginBottom: 28, marginHorizontal: -20, marginTop: -20,
  },
  title: { marginBottom: 24 },
  btn: { marginBottom: 8 },
});
