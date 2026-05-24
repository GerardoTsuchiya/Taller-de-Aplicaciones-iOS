import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { apiFetch } from '@/api/client';
import { useAuthStore } from '@/store/authStore';
import { Colors } from '@/constants/theme';
import GridBackground from '@/components/GridBackground';
import PixelText from '@/components/PixelText';
import PixelInput from '@/components/PixelInput';
import PixelButton from '@/components/PixelButton';

export default function LoginScreen() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuthStore();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleLogin = async () => {
    if (!identifier || !password) {
      Alert.alert('Error', 'Completa todos los campos');
      return;
    }
    setLoading(true);
    try {
      // Backend devuelve { user: SupabaseUser, session: { access_token, ... } }
      const { user: authUser, session } = await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ identifier, password }),
      });
      await login(session.access_token, {
        id: authUser.id,
        email: authUser.email,
        username: authUser.username,
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
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: Math.max(40, insets.bottom + 24) }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
          <PixelText size={15} glow="red">★ HABIDEX</PixelText>
        </View>
        <View style={styles.logoArea}>
          <PixelText size={24} glow="red" style={styles.logoText}>★ HABIDEX ★</PixelText>
          <PixelText size={10} color={Colors.redGlow} glow="red" style={styles.logoSub}>HABIT TRAINER</PixelText>
        </View>
        <PixelInput label="USUARIO O CORREO" value={identifier} onChangeText={setIdentifier} autoCapitalize="none" />
        <PixelInput label="CONTRASEÑA" value={password} onChangeText={setPassword} secureTextEntry />
        <PixelButton label="► INICIAR SESIÓN" onPress={handleLogin} disabled={loading} style={styles.btnTop} />
        <PixelText size={10} color="#1e1e30" style={styles.divider}>── ─ ──</PixelText>
        <PixelText size={10} color="#5a5a7a" style={styles.regText}>¿NO TIENES CUENTA?</PixelText>
        <PixelButton label="► REGISTRARSE" onPress={() => router.push('/(auth)/register')} variant="outline" />
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
    marginBottom: 32, marginHorizontal: -20, marginTop: -20,
  },
  logoArea: { alignItems: 'center', marginBottom: 28 },
  logoText: { textAlign: 'center', marginBottom: 8 },
  logoSub: { textAlign: 'center' },
  btnTop: { marginBottom: 4 },
  divider: { textAlign: 'center', marginVertical: 12 },
  regText: { textAlign: 'center', marginBottom: 8 },
});
