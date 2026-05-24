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

export default function RegisterScreen() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuthStore();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleRegister = async () => {
    if (!username || !email || !password) {
      Alert.alert('Error', 'Completa todos los campos');
      return;
    }
    setLoading(true);
    try {
      // Backend devuelve { user: SupabaseUser, session: { access_token, ... } }
      const { user: authUser, session, message } = await apiFetch('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ username, email, password }),
      });

      //Se agrego (de aquí hasta antes de return) lo del mensaje de alerta de cuenta creada sin iniciar sesión
      const successMessage = message ?? 'La cuenta fue creada correctamente.';

      if (!session?.access_token) {
        await login(session.access_token, {
          id: authUser.id,
          email: authUser.email,
          username: authUser.username,
        });

        Alert.alert('Registro exitoso', successMessage, [
          {
            text: 'Ir a hábitos',
            onPress: () => router.replace('/(tabs)'),
          },
        ]);
        return;
      }

      Alert.alert('Registro exitoso', successMessage, [
        {
          text: 'Ir a login',
          onPress: () => router.replace('/(auth)/login'),
        },
      ]);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  };
  //

  return (
    <View style={styles.screen}>
      <GridBackground />
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: Math.max(40, insets.bottom + 24) }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
          <PixelText size={10} color={Colors.redGlow} glow="red">◄ REGISTRO</PixelText>
        </View>
        <PixelText size={18} glow="red" style={styles.title}>NUEVO ENTRENADOR</PixelText>
        <PixelInput label="USUARIO" value={username} onChangeText={setUsername} autoCapitalize="none" />
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
