import {
  Fraunces_400Regular,
  Fraunces_500Medium,
  Fraunces_600SemiBold,
} from '@expo-google-fonts/fraunces';
import {
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_700Bold,
} from '@expo-google-fonts/dm-sans';
import { useFonts } from 'expo-font';
import { Stack, usePathname, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StoreProvider, useStore } from '@/lib/store';
import { getPalette } from '@/theme';

SplashScreen.preventAutoHideAsync().catch(() => {
  /* no-op: splash screen may already have hidden in dev */
});

export default function RootLayout() {
  const scheme = useColorScheme();
  const palette = getPalette(scheme === 'dark' ? 'dark' : 'light');

  const [fontsLoaded, fontError] = useFonts({
    Fraunces_400Regular,
    Fraunces_500Medium,
    Fraunces_600SemiBold,
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: palette.bg.canvas }}>
      <SafeAreaProvider>
        <StoreProvider>
          <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
          <OnboardingGate />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: palette.bg.canvas },
            }}
          >
            <Stack.Screen name="(tabs)" />
            <Stack.Screen
              name="capture"
              options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
            />
            <Stack.Screen
              name="planner"
              options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
            />
            <Stack.Screen
              name="event/[id]"
              options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
            />
            <Stack.Screen
              name="settings"
              options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
            />
            <Stack.Screen
              name="settings/categories"
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="onboarding"
              options={{
                presentation: 'fullScreenModal',
                animation: 'fade',
                gestureEnabled: false,
              }}
            />
          </Stack>
        </StoreProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

/**
 * Renders nothing visible. Watches the store; once hydrated, if the user has
 * not been onboarded yet, replaces the route with /onboarding so they don't
 * get a flash of Today first.
 */
function OnboardingGate() {
  const { state, hydrated } = useStore();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!hydrated) return;
    if (!state.hasOnboarded && pathname !== '/onboarding') {
      router.replace('/onboarding');
    }
  }, [hydrated, state.hasOnboarded, pathname, router]);

  return null;
}
