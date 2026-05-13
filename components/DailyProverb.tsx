import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from './Text';
import { getProverbForDate } from '@/lib/proverbs';
import { space } from '@/theme';

/**
 * Small almanac proverb that closes every primary screen. Picked
 * deterministically per date — same day always shows the same line.
 */
export function DailyProverb() {
  const proverb = useMemo(() => getProverbForDate(new Date()), []);

  return (
    <View style={styles.proverb}>
      <Text variant="footnote" color="tertiary" style={styles.glyph}>
        ✦
      </Text>
      <Text variant="body" color="secondary" style={styles.text}>
        "{proverb.text}"
      </Text>
      {proverb.attribution ? (
        <Text variant="footnote" color="tertiary" style={styles.attribution}>
          — {proverb.attribution}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  proverb: {
    marginTop: space['2xl'],
    paddingHorizontal: space.md,
    alignItems: 'center',
  },
  glyph: {
    fontSize: 13,
    marginBottom: space.sm,
    letterSpacing: 4,
  },
  text: {
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 24,
  },
  attribution: {
    marginTop: space.sm,
    textAlign: 'center',
  },
});
