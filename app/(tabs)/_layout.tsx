import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts } from '../../src/theme/tokens';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

const tabs: { name: string; title: string; icon: IconName }[] = [
  { name: 'index', title: 'Home', icon: 'grid-outline' },
  { name: 'students', title: 'Students', icon: 'school-outline' },
  { name: 'academics', title: 'Academics', icon: 'book-outline' },
  { name: 'fees', title: 'Fees', icon: 'wallet-outline' },
  { name: 'more', title: 'More', icon: 'apps-outline' },
];

export default function TabsLayout() {
  // Edge-to-edge Android draws under the system nav buttons, so the bar must add the bottom inset itself.
  const insets = useSafeAreaInsets();
  const bottom = Math.max(insets.bottom, 8);
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primaryDeep,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarLabelStyle: { fontFamily: fonts.bodyMedium, fontSize: 11, marginTop: 2 },
        tabBarStyle: {
          backgroundColor: colors.cardSolid,
          borderTopColor: colors.border,
          height: 58 + bottom,
          paddingTop: 8,
          paddingBottom: bottom,
        },
      }}
    >
      {tabs.map((t) => (
        <Tabs.Screen
          key={t.name}
          name={t.name}
          options={{
            title: t.title,
            tabBarIcon: ({ color, size }) => <Ionicons name={t.icon} size={size} color={color} />,
          }}
        />
      ))}
    </Tabs>
  );
}
