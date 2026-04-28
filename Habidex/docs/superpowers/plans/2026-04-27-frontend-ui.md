# Habidex Frontend UI — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir el frontend de Habidex en Expo/React Native/TypeScript implementando las 7 pantallas del diseño Pixel Neon aprobado, conectadas al backend Express existente.

**Architecture:** Expo Router con file-based routing — carpeta `(auth)/` para login/registro y `(tabs)/` para las 4 tabs principales. Los modales Completado y Atrapar son rutas raíz presentadas como modal. Un archivo `src/constants/theme.ts` centraliza todos los tokens de diseño. Los componentes visuales son wrappers delgados sobre primitivos de React Native.

**Tech Stack:** Expo SDK 51 · React Native · TypeScript · Expo Router · Zustand · expo-secure-store · expo-font · @expo-google-fonts/press-start-2p · react-native-svg · expo-notifications

**Diseño de referencia:** `Habidex/.superpowers/brainstorm/310-1777341571/content/all-screens-v3.html`
**Spec:** `docs/superpowers/specs/2026-04-21-mockups-design.md`

---

## Estructura de archivos

```
frontend/
├── app/
│   ├── _layout.tsx              ← Root layout: carga fuentes + auth guard
│   ├── completado.tsx           ← Modal pantalla 03 (presentado como modal)
│   ├── atrapar/
│   │   └── [id].tsx             ← Modal pantalla 05 con pokemon_id
│   ├── (auth)/
│   │   ├── _layout.tsx          ← Stack sin header nativo
│   │   ├── login.tsx            ← Pantalla 01
│   │   └── register.tsx         ← Registro (sin mockup, misma estética)
│   └── (tabs)/
│       ├── _layout.tsx          ← Tab navigator Pixel Neon (4 tabs)
│       ├── index.tsx            ← Pantalla 02: Hábitos
│       ├── pokedex.tsx          ← Pantalla 04: Pokédex
│       ├── stats.tsx            ← Pantalla 07: Analytics
│       └── profile.tsx          ← Pantalla 06: Perfil
├── src/
│   ├── constants/
│   │   ├── theme.ts             ← Colores, tipografía, sombras
│   │   └── api.ts               ← API_BASE_URL
│   ├── components/
│   │   ├── PixelText.tsx        ← Text con Press Start 2P + variante glow
│   │   ├── PixelButton.tsx      ← Botón primario (rojo) y outline
│   │   ├── PixelInput.tsx       ← Input estilo pixel
│   │   ├── AppHeader.tsx        ← Header sticky: logo + monedas
│   │   ├── GridBackground.tsx   ← Fondo oscuro con grid sutil (SVG)
│   │   ├── HabitRow.tsx         ← Fila de hábito con WeekDots + check
│   │   ├── WeekDots.tsx         ← 7 dots de progreso semanal
│   │   ├── StreakBox.tsx        ← Caja de racha 🔥
│   │   ├── RewardBox.tsx        ← Caja de recompensa (monedas / racha)
│   │   ├── StatBox.tsx          ← Caja de estadística (perfil)
│   │   ├── PokemonCell.tsx      ← Celda de Pokédex (atrapado / silueta)
│   │   ├── HabitBar.tsx         ← Barra horizontal de analytics
│   │   └── DonutChart.tsx       ← Donut SVG (react-native-svg)
│   ├── api/
│   │   ├── client.ts            ← fetch base con Authorization header
│   │   ├── habits.ts            ← getHabits(), completeHabit(), createHabit(), etc.
│   │   ├── collection.ts        ← getAvailable(), catchPokemon()
│   │   └── profile.ts           ← getProfile()
│   └── store/
│       └── authStore.ts         ← Zustand: token, user, login(), logout()
├── constants/
│   └── api.ts                   ← re-export de src/constants/api.ts
├── app.json
├── package.json
└── tsconfig.json
```

---

## Task 1: Setup del proyecto Expo

**Files:**
- Create: `frontend/package.json`
- Create: `frontend/app.json`
- Create: `frontend/tsconfig.json`
- Create: `frontend/constants/api.ts`

- [ ] **Step 1: Crear el proyecto Expo**

Desde la carpeta `Habidex/`:
```bash
npx create-expo-app frontend --template blank-typescript
cd frontend
```

- [ ] **Step 2: Instalar dependencias**

```bash
npx expo install expo-router expo-font @expo-google-fonts/press-start-2p
npx expo install expo-secure-store zustand react-native-svg
npx expo install expo-notifications expo-constants
npx expo install @react-native-async-storage/async-storage
```

- [ ] **Step 3: Configurar `frontend/app.json` para Expo Router**

Abrir `frontend/app.json` y reemplazar el contenido:
```json
{
  "expo": {
    "name": "Habidex",
    "slug": "habidex",
    "version": "1.0.0",
    "scheme": "habidex",
    "web": { "bundler": "metro" },
    "plugins": [
      "expo-router",
      "expo-font",
      [
        "expo-notifications",
        { "icon": "./assets/icon.png", "color": "#cc0000" }
      ]
    ],
    "android": { "adaptiveIcon": { "foregroundImage": "./assets/adaptive-icon.png", "backgroundColor": "#08080f" } },
    "ios": { "supportsTablet": false }
  }
}
```

- [ ] **Step 4: Crear `frontend/tsconfig.json`**

```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "baseUrl": ".",
    "paths": { "@/*": ["src/*"] }
  }
}
```

- [ ] **Step 5: Crear `frontend/constants/api.ts`**

```typescript
// Cambiar a la IP local de tu máquina cuando corras el backend en desarrollo
// Ejemplo: http://192.168.1.100:3000
export const API_BASE_URL = 'http://localhost:3000';
```

- [ ] **Step 6: Verificar que el proyecto arranca**

```bash
npx expo start --clear
```

Esperado: QR code en terminal, abrir con Expo Go. Se ve la pantalla default de Expo.

- [ ] **Step 7: Commit**

```bash
git add frontend/
git commit -m "feat: inicializar proyecto Expo frontend"
```

---

## Task 2: Design system (theme + componentes base)

**Files:**
- Create: `frontend/src/constants/theme.ts`
- Create: `frontend/src/components/PixelText.tsx`
- Create: `frontend/src/components/PixelButton.tsx`
- Create: `frontend/src/components/PixelInput.tsx`
- Create: `frontend/src/components/GridBackground.tsx`

- [ ] **Step 1: Crear `frontend/src/constants/theme.ts`**

```typescript
import { Platform } from 'react-native';

export const Colors = {
  bg: '#08080f',
  bgPage: '#06060d',
  red: '#cc0000',
  redGlow: '#e63946',
  gold: '#ffd700',
  green: '#4ade80',
  textMain: '#c8c8d8',
  textSecondary: '#b0b0c4',
  textDisabled: '#666666',
  headerBg: '#110000',
  tabBg: '#080810',
  border: '#1e1e30',
  borderActive: '#1a1a2e',
} as const;

export const Fonts = {
  pixel: 'PressStart2P_400Regular',
} as const;

// Tamaños en pt (dispositivo real, no mockup)
export const FontSizes = {
  logo: 20,
  title: 15,
  label: 11,
  value: 17,
  small: 9,
  tiny: 8,
} as const;

// Glow shadows para textShadow (React Native)
export const Glow = {
  red: {
    textShadowColor: 'rgba(204, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  gold: {
    textShadowColor: 'rgba(255, 215, 0, 0.8)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  green: {
    textShadowColor: 'rgba(74, 222, 128, 0.8)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
} as const;

// Touch target mínimo HIG: 44pt
export const MIN_TOUCH = 44;
```

- [ ] **Step 2: Crear `frontend/src/components/PixelText.tsx`**

```typescript
import React from 'react';
import { Text, TextStyle, StyleSheet } from 'react-native';
import { Colors, Fonts, Glow } from '@/constants/theme';

type GlowColor = 'red' | 'gold' | 'green' | 'none';

interface Props {
  children: React.ReactNode;
  size?: number;
  color?: string;
  glow?: GlowColor;
  style?: TextStyle;
}

export default function PixelText({ children, size = 11, color = Colors.textMain, glow = 'none', style }: Props) {
  const glowStyle = glow !== 'none' ? Glow[glow] : {};
  return (
    <Text style={[styles.base, { fontSize: size, color }, glowStyle, style]}>
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  base: {
    fontFamily: Fonts.pixel,
    letterSpacing: 1,
  },
});
```

- [ ] **Step 3: Crear `frontend/src/components/PixelButton.tsx`**

```typescript
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
      style={[
        styles.base,
        isPrimary ? styles.primary : styles.outline,
        disabled && styles.disabled,
        style,
      ]}
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
```

- [ ] **Step 4: Crear `frontend/src/components/PixelInput.tsx`**

```typescript
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
```

- [ ] **Step 5: Crear `frontend/src/components/GridBackground.tsx`**

```typescript
import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Svg, { Defs, Pattern, Rect, Line } from 'react-native-svg';
import { Colors } from '@/constants/theme';

const { width, height } = Dimensions.get('window');
const GRID = 18;

export default function GridBackground() {
  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
      <Svg width={width} height={height}>
        <Defs>
          <Pattern id="grid" width={GRID} height={GRID} patternUnits="userSpaceOnUse">
            <Line x1="0" y1="0" x2={GRID} y2="0" stroke="rgba(255,255,255,0.018)" strokeWidth="1" />
            <Line x1="0" y1="0" x2="0" y2={GRID} stroke="rgba(255,255,255,0.018)" strokeWidth="1" />
          </Pattern>
        </Defs>
        <Rect width={width} height={height} fill="url(#grid)" />
      </Svg>
    </View>
  );
}
```

- [ ] **Step 6: Commit**

```bash
git add frontend/src/
git commit -m "feat: design system — theme, PixelText, PixelButton, PixelInput, GridBackground"
```

---

## Task 3: Auth store + API client

**Files:**
- Create: `frontend/src/store/authStore.ts`
- Create: `frontend/src/api/client.ts`
- Create: `frontend/src/api/habits.ts`
- Create: `frontend/src/api/collection.ts`
- Create: `frontend/src/api/profile.ts`

- [ ] **Step 1: Crear `frontend/src/store/authStore.ts`**

```typescript
import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

interface User {
  id: string;
  email: string;
  username: string;
}

interface AuthState {
  token: string | null;
  user: User | null;
  hydrated: boolean;
  login: (token: string, user: User) => Promise<void>;
  logout: () => Promise<void>;
  hydrate: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  hydrated: false,

  login: async (token, user) => {
    await SecureStore.setItemAsync('token', token);
    await SecureStore.setItemAsync('user', JSON.stringify(user));
    set({ token, user });
  },

  logout: async () => {
    await SecureStore.deleteItemAsync('token');
    await SecureStore.deleteItemAsync('user');
    set({ token: null, user: null });
  },

  hydrate: async () => {
    const token = await SecureStore.getItemAsync('token');
    const userRaw = await SecureStore.getItemAsync('user');
    const user = userRaw ? JSON.parse(userRaw) : null;
    set({ token, user, hydrated: true });
  },
}));
```

- [ ] **Step 2: Crear `frontend/src/api/client.ts`**

```typescript
import { API_BASE_URL } from '@/constants/api';
import { useAuthStore } from '@/store/authStore';

export async function apiFetch(path: string, options: RequestInit = {}) {
  const token = useAuthStore.getState().token;
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
  return data;
}
```

- [ ] **Step 3: Crear `frontend/src/api/habits.ts`**

```typescript
import { apiFetch } from './client';

export interface Habit {
  id: string;
  name: string;
  description?: string;
  reminder_enabled: boolean;
  reminder_time?: string;
}

export interface CompletionResult {
  coins_earned: number;
  streak: number;
  total_coins: number;
}

export const getHabits = (): Promise<Habit[]> =>
  apiFetch('/habits');

export const createHabit = (body: { name: string; description?: string; reminder_enabled: boolean; reminder_time?: string }): Promise<Habit> =>
  apiFetch('/habits', { method: 'POST', body: JSON.stringify(body) });

export const updateHabit = (id: string, body: Partial<Habit>): Promise<Habit> =>
  apiFetch(`/habits/${id}`, { method: 'PUT', body: JSON.stringify(body) });

export const deleteHabit = (id: string): Promise<void> =>
  apiFetch(`/habits/${id}`, { method: 'DELETE' });

export const completeHabit = (id: string): Promise<CompletionResult> =>
  apiFetch(`/habits/${id}/complete`, { method: 'POST' });

export interface HabitStats {
  habit_id: string;
  habit_name: string;
  pct_30d: number;
  streak: number;
  max_streak: number;
  total: number;
}

export const getStats = (): Promise<{ habits: HabitStats[]; overall_pct: number; total_completions: number }> =>
  apiFetch('/habits/stats');
```

- [ ] **Step 4: Crear `frontend/src/api/collection.ts`**

```typescript
import { apiFetch } from './client';

export interface Pokemon {
  id: number;
  name: string;
  caught: boolean;
  sprite_url: string;
  types: string[];
}

export const getAvailable = (): Promise<Pokemon[]> =>
  apiFetch('/collection/available');

export const catchPokemon = (pokemon_id: number): Promise<{ pokemon: Pokemon; remaining_coins: number }> =>
  apiFetch('/collection/catch', { method: 'POST', body: JSON.stringify({ pokemon_id }) });
```

- [ ] **Step 5: Crear `frontend/src/api/profile.ts`**

```typescript
import { apiFetch } from './client';

export interface Profile {
  username: string;
  coins: number;
  total_completions: number;
  total_caught: number;
}

export const getProfile = (): Promise<Profile> =>
  apiFetch('/profile');
```

- [ ] **Step 6: Commit**

```bash
git add frontend/src/store/ frontend/src/api/
git commit -m "feat: auth store (Zustand + SecureStore) y API client"
```

---

## Task 4: Root layout + pantallas de auth

**Files:**
- Create: `frontend/app/_layout.tsx`
- Create: `frontend/app/(auth)/_layout.tsx`
- Create: `frontend/app/(auth)/login.tsx`
- Create: `frontend/app/(auth)/register.tsx`

- [ ] **Step 1: Crear `frontend/app/_layout.tsx`**

```typescript
import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { useRouter, useSegments } from 'expo-router';
import { useFonts, PressStart2P_400Regular } from '@expo-google-fonts/press-start-2p';
import { View, ActivityIndicator } from 'react-native';
import { useAuthStore } from '@/store/authStore';
import { Colors } from '@/constants/theme';

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
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="completado" options={{ presentation: 'modal' }} />
      <Stack.Screen name="atrapar/[id]" options={{ presentation: 'modal' }} />
    </Stack>
  );
}
```

- [ ] **Step 2: Crear `frontend/app/(auth)/_layout.tsx`**

```typescript
import { Stack } from 'expo-router';

export default function AuthLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
```

- [ ] **Step 3: Crear `frontend/app/(auth)/login.tsx`**

```typescript
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { apiFetch } from '@/api/client';
import { useAuthStore } from '@/store/authStore';
import { Colors, Fonts } from '@/constants/theme';
import GridBackground from '@/components/GridBackground';
import PixelText from '@/components/PixelText';
import PixelInput from '@/components/PixelInput';
import PixelButton from '@/components/PixelButton';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuthStore();
  const router = useRouter();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Completa todos los campos');
      return;
    }
    setLoading(true);
    try {
      const { token, user } = await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      await login(token, user);
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
        {/* Header */}
        <View style={styles.header}>
          <PixelText size={13} glow="red">★ HABIDEX</PixelText>
        </View>

        {/* Logo central */}
        <View style={styles.logoArea}>
          <PixelText size={20} glow="red" style={styles.logoText}>★ HABIDEX ★</PixelText>
          <PixelText size={9} color={Colors.redGlow} glow="red" style={styles.logoSub}>
            HABIT TRAINER
          </PixelText>
        </View>

        {/* Formulario */}
        <PixelInput
          label="CORREO"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <PixelInput
          label="CONTRASEÑA"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <PixelButton
          label="► INICIAR SESIÓN"
          onPress={handleLogin}
          disabled={loading}
          style={styles.btnTop}
        />

        <PixelText size={9} color="#1e1e30" style={styles.divider}>── ─ ──</PixelText>
        <PixelText size={9} color="#5a5a7a" style={styles.regText}>¿NO TIENES CUENTA?</PixelText>

        <PixelButton
          label="► REGISTRARSE"
          onPress={() => router.push('/(auth)/register')}
          variant="outline"
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.bg },
  scroll: { padding: 20, paddingBottom: 40 },
  header: {
    borderBottomWidth: 2,
    borderBottomColor: Colors.red,
    backgroundColor: Colors.headerBg,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 32,
    marginHorizontal: -20,
    marginTop: -20,
  },
  logoArea: { alignItems: 'center', marginBottom: 28 },
  logoText: { textAlign: 'center', marginBottom: 8 },
  logoSub: { textAlign: 'center' },
  btnTop: { marginBottom: 4 },
  divider: { textAlign: 'center', marginVertical: 12 },
  regText: { textAlign: 'center', marginBottom: 8 },
});
```

- [ ] **Step 4: Crear `frontend/app/(auth)/register.tsx`**

```typescript
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
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuthStore();
  const router = useRouter();

  const handleRegister = async () => {
    if (!email || !password || !username) {
      Alert.alert('Error', 'Completa todos los campos');
      return;
    }
    setLoading(true);
    try {
      const { token, user } = await apiFetch('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, password, username }),
      });
      await login(token, user);
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
        <PixelInput label="NOMBRE DE ENTRENADOR" value={username} onChangeText={setUsername} autoCapitalize="words" />
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
```

- [ ] **Step 5: Verificar flujo de auth**

Ejecutar `npx expo start`. Abrir en Expo Go. Debe verse la pantalla de Login con el estilo Pixel Neon. Probar navegación a Registro y vuelta.

- [ ] **Step 6: Commit**

```bash
git add frontend/app/
git commit -m "feat: root layout con auth guard y pantallas login/registro"
```

---

## Task 5: Tab navigator + pantalla Hábitos

**Files:**
- Create: `frontend/app/(tabs)/_layout.tsx`
- Create: `frontend/app/(tabs)/index.tsx`
- Create: `frontend/src/components/AppHeader.tsx`
- Create: `frontend/src/components/HabitRow.tsx`
- Create: `frontend/src/components/WeekDots.tsx`
- Create: `frontend/src/components/StreakBox.tsx`

- [ ] **Step 1: Crear `frontend/src/components/AppHeader.tsx`**

```typescript
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Colors, Fonts } from '@/constants/theme';
import PixelText from './PixelText';

interface Props {
  title: string;
  coins?: number;
  right?: React.ReactNode;
}

export default function AppHeader({ title, coins, right }: Props) {
  return (
    <View style={styles.header}>
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
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 44,
  },
});
```

- [ ] **Step 2: Crear `frontend/src/components/WeekDots.tsx`**

```typescript
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Colors } from '@/constants/theme';

interface Props {
  streak: number; // días consecutivos completados (máx 7 para los dots)
  done: boolean;  // si el hábito fue completado hoy
}

export default function WeekDots({ streak, done }: Props) {
  const filled = Math.min(streak, 7);
  const dotColor = done ? Colors.green : Colors.red;
  const glowColor = done ? 'rgba(74,222,128,0.7)' : 'rgba(204,0,0,0.7)';
  return (
    <View style={styles.row}>
      {Array.from({ length: 7 }).map((_, i) => (
        <View
          key={i}
          style={[
            styles.dot,
            i < filled
              ? { backgroundColor: dotColor, shadowColor: glowColor, shadowRadius: 4, shadowOpacity: 1, shadowOffset: { width: 0, height: 0 } }
              : { backgroundColor: '#181828' },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 4 },
  dot: { width: 8, height: 8 },
});
```

- [ ] **Step 3: Crear `frontend/src/components/StreakBox.tsx`**

```typescript
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Colors } from '@/constants/theme';
import PixelText from './PixelText';

export default function StreakBox({ streak }: { streak: number }) {
  return (
    <View style={styles.box}>
      <PixelText size={9} color={Colors.redGlow} glow="red">🔥 RACHA</PixelText>
      <PixelText size={9} color={Colors.gold} glow="gold">{streak} DÍAS</PixelText>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    backgroundColor: '#0e0000',
    borderWidth: 1,
    borderColor: Colors.red,
    borderRightColor: '#600000',
    borderBottomColor: '#600000',
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
});
```

- [ ] **Step 4: Crear `frontend/src/components/HabitRow.tsx`**

```typescript
import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors, MIN_TOUCH } from '@/constants/theme';
import { Habit } from '@/api/habits';
import PixelText from './PixelText';
import WeekDots from './WeekDots';

interface Props {
  habit: Habit;
  streak: number;
  completedToday: boolean;
  onPress: () => void;
}

export default function HabitRow({ habit, streak, completedToday, onPress }: Props) {
  const textColor = completedToday ? Colors.green : Colors.textDisabled;
  const textGlow = completedToday ? 'green' : 'none';

  return (
    <TouchableOpacity onPress={onPress} style={[styles.row, completedToday && styles.rowDone]} activeOpacity={0.7}>
      <View style={styles.top}>
        <PixelText size={9} color={textColor} glow={textGlow as any}>► {habit.name.toUpperCase()}</PixelText>
        {completedToday && <PixelText size={11} color={Colors.green} glow="green">✓</PixelText>}
      </View>
      <WeekDots streak={streak} done={completedToday} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    backgroundColor: '#0a0a0f',
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 6,
    minHeight: MIN_TOUCH,
    justifyContent: 'center',
  },
  rowDone: { borderColor: '#1a3a1a' },
  top: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
});
```

- [ ] **Step 5: Crear `frontend/app/(tabs)/_layout.tsx`**

```typescript
import { Tabs } from 'expo-router';
import { Colors, Fonts } from '@/constants/theme';
import PixelText from '@/components/PixelText';

const tabLabel = (label: string, focused: boolean) => (
  <PixelText size={7} color={focused ? Colors.redGlow : Colors.textSecondary} glow={focused ? 'red' : 'none'}>
    {label}
  </PixelText>
);

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.tabBg,
          borderTopWidth: 2,
          borderTopColor: '#1a1a2a',
          height: 49,
        },
        tabBarActiveTintColor: Colors.redGlow,
        tabBarInactiveTintColor: Colors.textSecondary,
        tabBarLabelStyle: { fontFamily: Fonts.pixel, fontSize: 7 },
      }}
    >
      <Tabs.Screen name="index" options={{ tabBarLabel: ({ focused }) => tabLabel('HÁBITOS', focused), tabBarIcon: () => null }} />
      <Tabs.Screen name="pokedex" options={{ tabBarLabel: ({ focused }) => tabLabel('POKÉDEX', focused), tabBarIcon: () => null }} />
      <Tabs.Screen name="stats" options={{ tabBarLabel: ({ focused }) => tabLabel('STATS', focused), tabBarIcon: () => null }} />
      <Tabs.Screen name="profile" options={{ tabBarLabel: ({ focused }) => tabLabel('PERFIL', focused), tabBarIcon: () => null }} />
    </Tabs>
  );
}
```

- [ ] **Step 6: Crear `frontend/app/(tabs)/index.tsx` (pantalla Hábitos)**

```typescript
import React, { useEffect, useState, useCallback } from 'react';
import { View, FlatList, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { getHabits, completeHabit, Habit } from '@/api/habits';
import { getProfile } from '@/api/profile';
import { Colors } from '@/constants/theme';
import GridBackground from '@/components/GridBackground';
import AppHeader from '@/components/AppHeader';
import StreakBox from '@/components/StreakBox';
import HabitRow from '@/components/HabitRow';
import PixelText from '@/components/PixelText';
import PixelButton from '@/components/PixelButton';

interface HabitWithState extends Habit {
  streak: number;
  completedToday: boolean;
}

export default function HabitsScreen() {
  const [habits, setHabits] = useState<HabitWithState[]>([]);
  const [coins, setCoins] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const router = useRouter();

  const load = useCallback(async () => {
    try {
      const [habitsData, profile] = await Promise.all([getHabits(), getProfile()]);
      // El backend devuelve streak y completedToday junto con cada hábito
      setHabits(habitsData as HabitWithState[]);
      setCoins(profile.coins);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleComplete = async (habit: HabitWithState) => {
    if (habit.completedToday) return;
    setSelectedId(habit.id);
    try {
      const result = await completeHabit(habit.id);
      setCoins(result.total_coins);
      router.push({
        pathname: '/completado',
        params: {
          habitName: habit.name,
          coinsEarned: result.coins_earned,
          streak: result.streak,
        },
      });
      load();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setSelectedId(null);
    }
  };

  const today = new Date();
  const dayNames = ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'];
  const monthNames = ['ENE','FEB','MAR','ABR','MAY','JUN','JUL','AGO','SEP','OCT','NOV','DIC'];
  const dateStr = `${dayNames[today.getDay()]}   ${today.getDate()}   ${monthNames[today.getMonth()]}   ${today.getFullYear()}`;

  const maxStreak = habits.length > 0 ? Math.max(...habits.map(h => h.streak)) : 0;

  if (loading) {
    return (
      <View style={styles.screen}>
        <ActivityIndicator color={Colors.red} style={{ flex: 1 }} />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <GridBackground />
      <AppHeader title="★ HABIDEX" coins={coins} />
      <FlatList
        data={habits}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <>
            <PixelText size={10} color={Colors.textMain} style={styles.date}>{dateStr}</PixelText>
            <StreakBox streak={maxStreak} />
          </>
        }
        renderItem={({ item }) => (
          <HabitRow
            habit={item}
            streak={item.streak}
            completedToday={item.completedToday}
            onPress={() => handleComplete(item)}
          />
        )}
        ListFooterComponent={
          <PixelButton label="▶ COMPLETAR HOY" onPress={() => {}} style={styles.btn} />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.bg },
  list: { padding: 14 },
  date: { marginBottom: 12, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: '#151525', letterSpacing: 2 },
  btn: { marginTop: 14 },
});
```

- [ ] **Step 7: Verificar pantalla Hábitos**

Con el backend corriendo en la IP local, iniciar sesión y ver la pantalla de hábitos con el estilo Pixel Neon.

- [ ] **Step 8: Commit**

```bash
git add frontend/
git commit -m "feat: tab navigator y pantalla de hábitos"
```

---

## Task 6: Modal Completado

**Files:**
- Create: `frontend/app/completado.tsx`
- Create: `frontend/src/components/RewardBox.tsx`

- [ ] **Step 1: Crear `frontend/src/components/RewardBox.tsx`**

```typescript
import React from 'react';
import { View, StyleSheet } from 'react-native';
import PixelText from './PixelText';
import { Colors } from '@/constants/theme';

interface Props {
  value: string;
  label: string;
  variant: 'gold' | 'red';
}

export default function RewardBox({ value, label, variant }: Props) {
  const borderColor = variant === 'gold' ? '#806000' : Colors.red;
  const valuColor = variant === 'gold' ? Colors.gold : Colors.redGlow;
  const glowColor = variant === 'gold' ? 'gold' : 'red';
  return (
    <View style={[styles.box, { borderColor, borderRightColor: variant === 'gold' ? '#403000' : '#600000', borderBottomColor: variant === 'gold' ? '#403000' : '#600000' }]}>
      <PixelText size={17} color={valuColor} glow={glowColor as any} style={styles.value}>{value}</PixelText>
      <PixelText size={8} color={variant === 'gold' ? '#806000' : '#600000'}>{label}</PixelText>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    flex: 1,
    backgroundColor: '#0e0e00',
    borderWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    padding: 10,
    alignItems: 'center',
  },
  value: { marginBottom: 4 },
});
```

- [ ] **Step 2: Crear `frontend/app/completado.tsx`**

```typescript
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors } from '@/constants/theme';
import GridBackground from '@/components/GridBackground';
import AppHeader from '@/components/AppHeader';
import PixelText from '@/components/PixelText';
import PixelButton from '@/components/PixelButton';
import RewardBox from '@/components/RewardBox';

export default function CompletadoModal() {
  const { habitName, coinsEarned, streak } = useLocalSearchParams<{
    habitName: string; coinsEarned: string; streak: string;
  }>();
  const router = useRouter();

  return (
    <View style={styles.screen}>
      <GridBackground />
      <AppHeader title="★ HABIDEX" />
      <View style={styles.content}>
        {/* Anillo verde */}
        <View style={styles.ring}>
          <PixelText size={32} color={Colors.green} glow="green">✓</PixelText>
        </View>

        <PixelText size={15} color={Colors.green} glow="green" style={styles.title}>¡COMPLETADO!</PixelText>
        <PixelText size={9} color="#888888" style={styles.habitName}>► {habitName?.toUpperCase()}</PixelText>

        <View style={styles.rewards}>
          <RewardBox value={`+${coinsEarned}`} label="💰 MONEDAS" variant="gold" />
          <View style={styles.rewardGap} />
          <RewardBox value={`🔥 ${streak}`} label="DÍAS RACHA" variant="red" />
        </View>

        <PixelButton label="► CONTINUAR" onPress={() => router.back()} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.bg },
  content: { flex: 1, padding: 20, alignItems: 'center', justifyContent: 'center' },
  ring: {
    width: 100, height: 100, borderRadius: 50,
    borderWidth: 2, borderColor: 'rgba(74,222,128,0.5)',
    backgroundColor: 'rgba(74,222,128,0.08)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 20,
  },
  title: { marginBottom: 8 },
  habitName: { marginBottom: 24 },
  rewards: { flexDirection: 'row', width: '100%', marginBottom: 24 },
  rewardGap: { width: 10 },
});
```

- [ ] **Step 3: Commit**

```bash
git add frontend/
git commit -m "feat: modal completado con recompensas"
```

---

## Task 7: Pantalla Pokédex + modal Atrapar

**Files:**
- Create: `frontend/app/(tabs)/pokedex.tsx`
- Create: `frontend/app/atrapar/[id].tsx`
- Create: `frontend/src/components/PokemonCell.tsx`

- [ ] **Step 1: Crear `frontend/src/components/PokemonCell.tsx`**

```typescript
import React from 'react';
import { View, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors, MIN_TOUCH } from '@/constants/theme';
import { Pokemon } from '@/api/collection';
import PixelText from './PixelText';

interface Props {
  pokemon: Pokemon;
  onPress: () => void;
}

export default function PokemonCell({ pokemon, onPress }: Props) {
  const numStr = `#${String(pokemon.id).padStart(3, '0')}`;
  return (
    <TouchableOpacity onPress={onPress} style={[styles.cell, pokemon.caught && styles.caught]} activeOpacity={0.7}>
      <Image
        source={{ uri: pokemon.sprite_url }}
        style={[styles.sprite, !pokemon.caught && styles.locked]}
        resizeMode="contain"
      />
      <PixelText size={7} color={pokemon.caught ? Colors.green : '#333333'} glow={pokemon.caught ? 'green' : 'none'}>
        {numStr}
      </PixelText>
      <PixelText size={7} color={pokemon.caught ? Colors.green : '#444444'}>
        {pokemon.caught ? pokemon.name.toUpperCase() : '???'}
      </PixelText>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  cell: {
    backgroundColor: '#0d0d18',
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 6,
    alignItems: 'center',
    minHeight: MIN_TOUCH,
  },
  caught: { borderColor: '#1a3a1a' },
  sprite: { width: 48, height: 48 },
  // Simula silhouette: oscurece la imagen via tintColor
  locked: { tintColor: '#111111', opacity: 0.15 },
});
```

- [ ] **Step 2: Crear `frontend/app/(tabs)/pokedex.tsx`**

```typescript
import React, { useEffect, useState } from 'react';
import { View, FlatList, StyleSheet, Alert, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { getAvailable, Pokemon } from '@/api/collection';
import { getProfile } from '@/api/profile';
import { Colors } from '@/constants/theme';
import GridBackground from '@/components/GridBackground';
import AppHeader from '@/components/AppHeader';
import PokemonCell from '@/components/PokemonCell';
import PixelText from '@/components/PixelText';

const NUM_COLS = 3;
const CELL_GAP = 4;
const PADDING = 12;
const cellWidth = (Dimensions.get('window').width - PADDING * 2 - CELL_GAP * (NUM_COLS - 1)) / NUM_COLS;

export default function PokedexScreen() {
  const [pokemon, setPokemon] = useState<Pokemon[]>([]);
  const [coins, setCoins] = useState(0);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    Promise.all([getAvailable(), getProfile()])
      .then(([pokes, profile]) => { setPokemon(pokes); setCoins(profile.coins); })
      .catch(e => Alert.alert('Error', e.message))
      .finally(() => setLoading(false));
  }, []);

  const caught = pokemon.filter(p => p.caught).length;

  return (
    <View style={styles.screen}>
      <GridBackground />
      <AppHeader title="★ POKÉDEX" coins={coins} />
      <FlatList
        data={pokemon}
        keyExtractor={item => String(item.id)}
        numColumns={NUM_COLS}
        contentContainerStyle={styles.list}
        columnWrapperStyle={styles.row}
        ListHeaderComponent={
          <View style={styles.header}>
            <PixelText size={13} color="#ffffff" glow="red">GEN I</PixelText>
            <PixelText size={9} color={Colors.green} glow="green">✓ {caught}/151</PixelText>
          </View>
        }
        renderItem={({ item }) => (
          <View style={{ width: cellWidth }}>
            <PokemonCell
              pokemon={item}
              onPress={() => !item.caught && router.push({ pathname: '/atrapar/[id]', params: { id: item.id } })}
            />
          </View>
        )}
        ItemSeparatorComponent={() => <View style={{ height: CELL_GAP }} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.bg },
  list: { padding: PADDING },
  row: { gap: CELL_GAP, marginBottom: CELL_GAP },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
});
```

- [ ] **Step 3: Crear `frontend/app/atrapar/[id].tsx`**

```typescript
import React, { useEffect, useState } from 'react';
import { View, Image, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { getAvailable, catchPokemon, Pokemon } from '@/api/collection';
import { Colors, Fonts } from '@/constants/theme';
import GridBackground from '@/components/GridBackground';
import PixelText from '@/components/PixelText';
import PixelButton from '@/components/PixelButton';

export default function AtraparModal() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [pokemon, setPokemon] = useState<Pokemon | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    getAvailable().then(list => {
      setPokemon(list.find(p => p.id === Number(id)) ?? null);
    });
  }, [id]);

  const handleCatch = async () => {
    if (!pokemon) return;
    setLoading(true);
    try {
      const result = await catchPokemon(pokemon.id);
      Alert.alert('¡ATRAPADO!', `${pokemon.name.toUpperCase()} fue capturado.\nMonedas restantes: ${result.remaining_coins}`, [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  if (!pokemon) return <View style={styles.screen}><ActivityIndicator color={Colors.red} style={{ flex: 1 }} /></View>;

  const numStr = `#${String(pokemon.id).padStart(3, '0')}`;

  return (
    <View style={styles.screen}>
      <GridBackground />
      {/* Header con volver */}
      <View style={styles.header}>
        <PixelText size={11} color={Colors.redGlow} glow="red" onPress={() => router.back()}>◄ VOLVER</PixelText>
        <PixelText size={11} color={Colors.gold} glow="gold">💰 50 PTS</PixelText>
      </View>

      <View style={styles.content}>
        {/* Anillo rojo con sprite */}
        <View style={styles.ring}>
          <View style={styles.innerRing} />
          <Image source={{ uri: pokemon.sprite_url }} style={styles.sprite} resizeMode="contain" />
        </View>

        <PixelText size={11} color={Colors.redGlow} glow="red" style={styles.num}>{numStr}</PixelText>
        <PixelText size={17} color="#ffffff" style={styles.name}>{pokemon.name.toUpperCase()}</PixelText>

        {/* Badges de tipo */}
        <View style={styles.types}>
          {pokemon.types.map(t => (
            <View key={t} style={styles.badge}>
              <PixelText size={8} color={Colors.redGlow}>{t.toUpperCase()}</PixelText>
            </View>
          ))}
        </View>

        <PixelText size={11} color={Colors.gold} glow="gold" style={styles.cost}>💰 COSTO: 50 MONEDAS</PixelText>

        <PixelButton label="► ATRAPAR POKÉMON" onPress={handleCatch} disabled={loading} style={styles.btnPrimary} />
        <PixelButton label="CANCELAR" onPress={() => router.back()} variant="outline" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.bg },
  header: {
    borderBottomWidth: 2, borderBottomColor: Colors.red,
    backgroundColor: Colors.headerBg,
    paddingHorizontal: 16, paddingVertical: 12,
    flexDirection: 'row', justifyContent: 'space-between',
  },
  content: { flex: 1, padding: 20, alignItems: 'center', justifyContent: 'center' },
  ring: {
    width: 120, height: 120, borderRadius: 60,
    borderWidth: 2, borderColor: 'rgba(204,0,0,0.4)',
    backgroundColor: 'rgba(204,0,0,0.05)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 12,
  },
  innerRing: {
    position: 'absolute', width: 84, height: 84, borderRadius: 42,
    borderWidth: 1, borderColor: 'rgba(204,0,0,0.18)',
  },
  sprite: { width: 100, height: 100 },
  num: { marginBottom: 4 },
  name: { marginBottom: 8, letterSpacing: 2 },
  types: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  badge: {
    backgroundColor: 'rgba(204,0,0,0.2)', borderWidth: 1,
    borderColor: 'rgba(204,0,0,0.5)', paddingHorizontal: 10, paddingVertical: 4,
  },
  cost: { marginBottom: 16 },
  btnPrimary: { marginBottom: 8 },
});
```

- [ ] **Step 4: Commit**

```bash
git add frontend/
git commit -m "feat: pantalla Pokédex y modal atrapar Pokémon"
```

---

## Task 8: Pantalla Perfil

**Files:**
- Create: `frontend/app/(tabs)/profile.tsx`
- Create: `frontend/src/components/StatBox.tsx`

- [ ] **Step 1: Crear `frontend/src/components/StatBox.tsx`**

```typescript
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Colors, MIN_TOUCH } from '@/constants/theme';
import PixelText from './PixelText';

type GlowColor = 'red' | 'gold' | 'green';

interface Props {
  value: string | number;
  label: string;
  glowColor: GlowColor;
}

export default function StatBox({ value, label, glowColor }: Props) {
  const colorMap: Record<GlowColor, string> = {
    gold: Colors.gold, red: Colors.redGlow, green: Colors.green,
  };
  return (
    <View style={styles.box}>
      <PixelText size={17} color={colorMap[glowColor]} glow={glowColor} style={styles.value}>
        {String(value)}
      </PixelText>
      <PixelText size={8} color="#555555">{label}</PixelText>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    flex: 1, backgroundColor: '#0a0a0f',
    borderWidth: 1, borderColor: Colors.border,
    padding: 12, minHeight: MIN_TOUCH,
    justifyContent: 'center',
  },
  value: { marginBottom: 4 },
});
```

- [ ] **Step 2: Crear `frontend/app/(tabs)/profile.tsx`**

```typescript
import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { getProfile, Profile } from '@/api/profile';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/theme';
import GridBackground from '@/components/GridBackground';
import AppHeader from '@/components/AppHeader';
import PixelText from '@/components/PixelText';
import PixelButton from '@/components/PixelButton';
import StatBox from '@/components/StatBox';

export default function ProfileScreen() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const { user, logout } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    getProfile().then(setProfile).catch(e => Alert.alert('Error', e.message));
  }, []);

  const handleLogout = async () => {
    await logout();
    router.replace('/(auth)/login');
  };

  const caught = profile?.total_caught ?? 0;
  const pctFill = (caught / 151) * 100;

  return (
    <View style={styles.screen}>
      <GridBackground />
      <AppHeader title="★ HABIDEX" coins={profile?.coins} />
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Avatar row */}
        <View style={styles.avatarRow}>
          <View style={styles.avatar}><PixelText size={24}>🎮</PixelText></View>
          <View>
            <PixelText size={9} color={Colors.textDisabled}>ENTRENADOR</PixelText>
            <PixelText size={15} color="#ffffff" style={{ marginTop: 4 }}>
              {user?.username?.toUpperCase() ?? '---'}
            </PixelText>
          </View>
        </View>

        {/* Stats grid */}
        <View style={styles.statsRow}>
          <StatBox value={profile?.coins ?? 0} label="💰 MONEDAS" glowColor="gold" />
          <View style={{ width: 6 }} />
          <StatBox value={0} label="🔥 RACHA" glowColor="red" />
        </View>
        <View style={[styles.statsRow, { marginTop: 6 }]}>
          <StatBox value={caught} label="✓ ATRAPADOS" glowColor="green" />
          <View style={{ width: 6 }} />
          <StatBox value={profile?.total_completions ?? 0} label="⭐ TOTAL" glowColor="gold" />
        </View>

        {/* Pokédex progress */}
        <PixelText size={9} color={Colors.textSecondary} style={styles.progLabel}>
          POKÉDEX: {caught} / 151
        </PixelText>
        <View style={styles.progTrack}>
          <View style={[styles.progFill, { width: `${pctFill}%` }]} />
        </View>

        <PixelButton label="► CERRAR SESIÓN" onPress={handleLogout} variant="outline" style={styles.logout} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.bg },
  scroll: { padding: 14 },
  avatarRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 16 },
  avatar: {
    width: 56, height: 56, borderRadius: 28,
    borderWidth: 2, borderColor: Colors.red,
    backgroundColor: 'rgba(204,0,0,0.08)',
    alignItems: 'center', justifyContent: 'center',
  },
  statsRow: { flexDirection: 'row' },
  progLabel: { marginTop: 14, marginBottom: 6, letterSpacing: 1 },
  progTrack: {
    backgroundColor: '#0d0d18', borderWidth: 1,
    borderColor: Colors.border, height: 10, marginBottom: 16,
  },
  progFill: { height: '100%', backgroundColor: Colors.red },
  logout: { borderColor: '#250000' },
});
```

- [ ] **Step 3: Commit**

```bash
git add frontend/
git commit -m "feat: pantalla perfil con stats y logout"
```

---

## Task 9: Pantalla Analytics (Stats)

**Files:**
- Create: `frontend/app/(tabs)/stats.tsx`
- Create: `frontend/src/components/DonutChart.tsx`
- Create: `frontend/src/components/HabitBar.tsx`

- [ ] **Step 1: Crear `frontend/src/components/DonutChart.tsx`**

```typescript
import React from 'react';
import { View } from 'react-native';
import Svg, { Circle, Text as SvgText } from 'react-native-svg';
import { Colors, Fonts } from '@/constants/theme';

interface Props {
  pct: number; // 0-100
  size?: number;
}

export default function DonutChart({ pct, size = 90 }: Props) {
  const R = size * 0.37;
  const cx = size / 2;
  const strokeW = size * 0.12;
  const circumference = 2 * Math.PI * R;
  const filled = (pct / 100) * circumference;

  return (
    <Svg width={size} height={size}>
      <Circle cx={cx} cy={cx} r={R} fill="none" stroke="#181828" strokeWidth={strokeW} />
      <Circle
        cx={cx} cy={cx} r={R} fill="none"
        stroke={Colors.green} strokeWidth={strokeW}
        strokeDasharray={`${filled} ${circumference}`}
        strokeLinecap="square"
        rotation="-90" originX={cx} originY={cx}
      />
      <SvgText x={cx} y={cx - 4} textAnchor="middle" fontFamily={Fonts.pixel} fontSize={size * 0.12} fill="#ffffff">
        {pct}%
      </SvgText>
      <SvgText x={cx} y={cx + 12} textAnchor="middle" fontFamily={Fonts.pixel} fontSize={size * 0.05} fill="#555555">
        30 DÍAS
      </SvgText>
    </Svg>
  );
}
```

- [ ] **Step 2: Crear `frontend/src/components/HabitBar.tsx`**

```typescript
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { HabitStats } from '@/api/habits';
import { Colors, MIN_TOUCH } from '@/constants/theme';
import PixelText from './PixelText';

export default function HabitBar({ stat }: { stat: HabitStats }) {
  const isGood = stat.pct_30d >= 90;
  const barColor = isGood ? Colors.green : Colors.red;
  const pctColor = isGood ? Colors.green : Colors.redGlow;
  const pctGlow = isGood ? 'green' : 'red';

  return (
    <View style={styles.row}>
      <View style={styles.top}>
        <PixelText size={9} color={Colors.textMain}>► {stat.habit_name.toUpperCase()}</PixelText>
        <PixelText size={9} color={pctColor} glow={pctGlow as any}>{stat.pct_30d}%</PixelText>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${stat.pct_30d}%`, backgroundColor: barColor }]} />
      </View>
      <View style={styles.streaks}>
        <PixelText size={8} color="#444444">ACTUAL <PixelText size={8} color={Colors.gold}>{stat.streak}D</PixelText></PixelText>
        <PixelText size={8} color="#444444">  MÁX <PixelText size={8} color={Colors.gold}>{stat.max_streak}D</PixelText></PixelText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    backgroundColor: '#0a0a0f', borderWidth: 1,
    borderColor: Colors.border, padding: 12,
    marginBottom: 6, minHeight: MIN_TOUCH,
  },
  top: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  track: { height: 8, backgroundColor: '#181828', borderWidth: 1, borderColor: Colors.border, marginBottom: 6, overflow: 'hidden' },
  fill: { height: '100%' },
  streaks: { flexDirection: 'row' },
});
```

- [ ] **Step 3: Crear `frontend/app/(tabs)/stats.tsx`**

```typescript
import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, Alert } from 'react-native';
import { getStats, HabitStats } from '@/api/habits';
import { Colors } from '@/constants/theme';
import GridBackground from '@/components/GridBackground';
import AppHeader from '@/components/AppHeader';
import PixelText from '@/components/PixelText';
import DonutChart from '@/components/DonutChart';
import HabitBar from '@/components/HabitBar';

export default function StatsScreen() {
  const [stats, setStats] = useState<{ habits: HabitStats[]; overall_pct: number; total_completions: number } | null>(null);

  useEffect(() => {
    getStats().catch(e => Alert.alert('Error', e.message)).then(s => s && setStats(s));
  }, []);

  const overall = stats?.overall_pct ?? 0;
  const total = stats?.total_completions ?? 0;
  const maxStreak = stats?.habits.reduce((m, h) => Math.max(m, h.streak), 0) ?? 0;

  return (
    <View style={styles.screen}>
      <GridBackground />
      <AppHeader title="★ ANALYTICS" right={<PixelText size={9} color={Colors.textSecondary}>ÚLT. 30 DÍAS</PixelText>} />
      <ScrollView contentContainerStyle={styles.scroll}>

        {/* Donut + chips */}
        <View style={styles.comboRow}>
          <DonutChart pct={overall} size={90} />
          <View style={styles.chips}>
            <View style={styles.chip}>
              <PixelText size={15} color={Colors.gold} glow="gold">{total}</PixelText>
              <PixelText size={7} color="#444444">TOTAL HISTÓRICO</PixelText>
            </View>
            <View style={[styles.chip, { marginTop: 6 }]}>
              <PixelText size={15} color={Colors.redGlow} glow="red">🔥 {maxStreak}</PixelText>
              <PixelText size={7} color="#444444">RACHA ACTUAL</PixelText>
            </View>
          </View>
        </View>

        <PixelText size={9} color={Colors.textSecondary} style={styles.secLabel}>▸ POR HÁBITO — 30 DÍAS</PixelText>

        {stats?.habits.map(h => <HabitBar key={h.habit_id} stat={h} />)}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.bg },
  scroll: { padding: 14 },
  comboRow: {
    backgroundColor: '#0a0a0f', borderWidth: 1,
    borderColor: Colors.border, padding: 12,
    flexDirection: 'row', alignItems: 'center',
    gap: 12, marginBottom: 12,
  },
  chips: { flex: 1 },
  chip: {
    backgroundColor: '#0d0d18', borderWidth: 1,
    borderColor: '#1a1a2a', padding: 8,
  },
  secLabel: { marginBottom: 10, paddingBottom: 6, borderBottomWidth: 1, borderBottomColor: '#151525', letterSpacing: 2 },
});
```

- [ ] **Step 4: Commit**

```bash
git add frontend/
git commit -m "feat: pantalla analytics con donut SVG y barras por hábito"
```

---

## Task 10: Verificación final e integración

**Files:**
- Modify: `frontend/constants/api.ts` (IP del backend)

- [ ] **Step 1: Actualizar `API_BASE_URL` con la IP local del backend**

En `frontend/constants/api.ts`, cambiar a la IP de la máquina donde corre el backend:
```typescript
export const API_BASE_URL = 'http://TU_IP_LOCAL:3000';
// Ejemplo: 'http://192.168.1.50:3000'
// Obtener la IP con: ipconfig (Windows) / ifconfig (Mac/Linux)
```

- [ ] **Step 2: Levantar el backend**

```bash
cd Habidex/backend
npm run dev
```

Verificar que responde: `curl http://TU_IP_LOCAL:3000/auth/login` → debe devolver error de validación (no 404).

- [ ] **Step 3: Levantar el frontend**

```bash
cd Habidex/frontend
npx expo start --clear
```

Abrir en Expo Go en dispositivo físico.

- [ ] **Step 4: Verificar flujo completo**

Recorrer en orden:
1. Abrir app → aparece Login con estilo Pixel Neon
2. Registrarse con usuario nuevo
3. Ver pantalla Hábitos (vacía si no hay hábitos)
4. Ir a Pokédex → ver los 151 Pokémon en silueta
5. Ir a Stats → ver donut y tabla (datos vacíos/cero)
6. Ir a Perfil → ver nombre de usuario y stats
7. Completar un hábito → aparece modal Completado con monedas y racha
8. Gastar monedas atrapando un Pokémon → aparece modal Atrapar

- [ ] **Step 5: Commit final**

```bash
git add frontend/constants/api.ts
git commit -m "feat: frontend UI completo — 7 pantallas Pixel Neon conectadas al backend"
```

---

## Self-review

**Cobertura del spec:**
- ✅ Pantalla 01 Login — `(auth)/login.tsx`
- ✅ Pantalla 02 Hábitos — `(tabs)/index.tsx` + `HabitRow`, `WeekDots`, `StreakBox`
- ✅ Pantalla 03 Completado — `completado.tsx` + `RewardBox`
- ✅ Pantalla 04 Pokédex — `(tabs)/pokedex.tsx` + `PokemonCell`
- ✅ Pantalla 05 Atrapar — `atrapar/[id].tsx`
- ✅ Pantalla 06 Perfil — `(tabs)/profile.tsx` + `StatBox`
- ✅ Pantalla 07 Analytics — `(tabs)/stats.tsx` + `DonutChart`, `HabitBar`
- ✅ Design system — `theme.ts`, `PixelText`, `PixelButton`, `PixelInput`, `GridBackground`
- ✅ HIG: touch targets `minHeight: MIN_TOUCH (44)`, tab bar height 49, navegación con Expo Router
- ✅ Tipografía `Press Start 2P` via `@expo-google-fonts`
- ✅ Glow effects via `textShadow*` props de React Native
- ✅ Auth guard en root layout
- ✅ Token persistido en SecureStore

**Tipos consistentes:**
- `Habit` definido en `api/habits.ts`, usado en `HabitRow`, `(tabs)/index.tsx`
- `Pokemon` definido en `api/collection.ts`, usado en `PokemonCell`, `pokedex.tsx`, `atrapar/[id].tsx`
- `HabitStats` definido en `api/habits.ts`, usado en `HabitBar`, `stats.tsx`
- `Profile` definido en `api/profile.ts`, usado en `profile.tsx`
