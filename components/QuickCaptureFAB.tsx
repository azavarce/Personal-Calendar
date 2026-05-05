import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StyleSheet } from 'react-native';
import { radius, useTheme } from '@/theme';
import { PressableScale } from './PressableScale';

/**
 * The Quick Capture floating button. Always one-thumb-reachable bottom-right,
 * sitting above the tab bar by 12pt. Warm Oxblood — its rarity is the point.
 */
export function QuickCaptureFAB() {
  const router = useRouter();
  const { palette } = useTheme();

  return (
    <PressableScale
      style={[styles.fab, { backgroundColor: palette.brand.primary }]}
      onPress={() => router.push('/capture')}
      accessibilityRole="button"
      accessibilityLabel="Quick capture"
    >
      <Feather name="plus" size={26} color={palette.text.onBrand} />
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 12,
    width: 56,
    height: 56,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
