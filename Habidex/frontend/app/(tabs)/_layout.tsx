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
