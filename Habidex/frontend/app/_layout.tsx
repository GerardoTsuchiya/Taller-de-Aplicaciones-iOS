import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useFonts, PressStart2P_400Regular } from '@expo-google-fonts/press-start-2p';
import { View, ActivityIndicator } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useAuthStore } from '@/store/authStore';
import { Colors } from '@/constants/theme';
import '@/services/reminders';

export default function RootLayout() {
  const [fontsLoaded] = useFonts({ PressStart2P_400Regular });
  const { token, hydrated, hydrate } = useAuthStore();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => { hydrate(); }, []);

  useEffect(() => {
    if (!hydrated || !fontsLoaded) return;
    const inAuth = segments[0] === '(auth)';
    if (!token && !inAuth) router.replace('/(auth)/login');
    if (token && inAuth) router.replace('/(tabs)');
  }, [token, hydrated, fontsLoaded]);

  if (!hydrated || !fontsLoaded) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.bg, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color={Colors.red} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="completado" options={{ presentation: 'modal' }} />
        <Stack.Screen name="atrapar/[id]" options={{ presentation: 'modal' }} />
        <Stack.Screen name="habito" options={{ presentation: 'modal' }} />
      </Stack>
    </SafeAreaProvider>
  );
}
