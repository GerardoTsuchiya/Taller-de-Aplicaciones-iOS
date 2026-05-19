import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Fonts } from '@/constants/theme';
import PixelText from '@/components/PixelText';

const tabLabel = (label: string, focused: boolean) => (
  <PixelText size={7} color={focused ? Colors.redGlow : Colors.textSecondary} glow={focused ? 'red' : 'none'}>
    {label}
  </PixelText>
);

const tabIcon = (icon: string, focused: boolean) => (
  <PixelText size={8} color={focused ? Colors.redGlow : Colors.textSecondary} glow={focused ? 'red' : 'none'}>
    {icon}
  </PixelText>
);

export default function TabsLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.tabBg,
          borderTopWidth: 2,
          borderTopColor: '#1a1a2a',
          height: 68 + insets.bottom,
          paddingTop: 8,
          paddingBottom: Math.max(insets.bottom, 8),
        },
        tabBarActiveTintColor: Colors.redGlow,
        tabBarInactiveTintColor: Colors.textSecondary,
        tabBarLabelStyle: {
          fontFamily: Fonts.pixel,
          fontSize: 7,
          lineHeight: 14,
          marginTop: 0,
          marginBottom: 0,
        },
        tabBarIconStyle: { marginBottom: 3 },
        tabBarItemStyle: { justifyContent: 'center', paddingVertical: 0 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused }) => tabIcon('▾', focused),
          tabBarLabel: ({ focused }) => tabLabel('HÁBITOS', focused),
        }}
      />
      <Tabs.Screen
        name="pokedex"
        options={{
          tabBarIcon: ({ focused }) => tabIcon('●', focused),
          tabBarLabel: ({ focused }) => tabLabel('POKÉDEX', focused),
        }}
      />
      <Tabs.Screen
        name="stats"
        options={{
          tabBarIcon: ({ focused }) => tabIcon('▲', focused),
          tabBarLabel: ({ focused }) => tabLabel('STATS', focused),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ focused }) => tabIcon('◆', focused),
          tabBarLabel: ({ focused }) => tabLabel('PERFIL', focused),
        }}
      />
    </Tabs>
  );
}
