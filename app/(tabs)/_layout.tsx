import { Feather } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { QuickCaptureFAB } from '@/components/QuickCaptureFAB';
import { fontFamily, useTheme } from '@/theme';

export default function TabsLayout() {
  const { palette } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: palette.brand.primary,
          tabBarInactiveTintColor: palette.text.tertiary,
          tabBarStyle: {
            backgroundColor: palette.bg.canvas,
            borderTopColor: palette.hairline,
            borderTopWidth: StyleSheet.hairlineWidth,
            height: 56 + insets.bottom,
            paddingTop: 6,
            paddingBottom: insets.bottom,
          },
          tabBarLabelStyle: {
            fontFamily: fontFamily.bodyMedium,
            fontSize: 11,
            letterSpacing: 0.4,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Today',
            tabBarIcon: ({ color, size }) => (
              <Feather name="sun" size={size - 2} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="calendar"
          options={{
            title: 'Calendar',
            tabBarIcon: ({ color, size }) => (
              <Feather name="calendar" size={size - 2} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="goals"
          options={{
            title: 'Goals',
            tabBarIcon: ({ color, size }) => (
              <Feather name="compass" size={size - 2} color={color} />
            ),
          }}
        />
      </Tabs>
      <View
        style={[
          styles.fabHolder,
          { bottom: 56 + insets.bottom + 12 },
        ]}
        pointerEvents="box-none"
      >
        <QuickCaptureFAB />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fabHolder: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 56,
  },
});
