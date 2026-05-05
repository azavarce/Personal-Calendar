import { type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/theme';

type Props = {
  children: ReactNode;
  /** Disable horizontal padding when the screen needs full-bleed (calendar). */
  edge?: boolean;
};

export function ScreenContainer({ children, edge = false }: Props) {
  const { palette } = useTheme();
  return (
    <SafeAreaView
      edges={['top']}
      style={[styles.root, { backgroundColor: palette.bg.canvas }]}
    >
      <View style={[styles.body, edge && styles.bodyEdge]}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  body: { flex: 1, paddingHorizontal: 20 },
  bodyEdge: { paddingHorizontal: 0 },
});
