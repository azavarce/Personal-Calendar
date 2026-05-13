import { format } from 'date-fns';
import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from './Text';
import {
  DEFAULT_LOCATION,
  getMoonPhase,
  getSunTimes,
} from '@/lib/astronomy';
import { space } from '@/theme';

/**
 * Small italic line of almanac data — sunrise, sunset, and the current
 * moon phase. Sits under the date heading on Today.
 *
 * Times are computed for DEFAULT_LOCATION (New York). Surfacing a
 * location setting is on the roadmap; for now the chosen city is noted
 * subtly so the user understands the basis of the times.
 */
export function AlmanacLine() {
  const data = useMemo(() => {
    const now = new Date();
    const { sunrise, sunset } = getSunTimes(now);
    const moon = getMoonPhase(now);
    return {
      sunrise: format(sunrise, 'h:mm a'),
      sunset: format(sunset, 'h:mm a'),
      moonName: moon.name,
      moonGlyph: moon.glyph,
      city: DEFAULT_LOCATION.label,
    };
  }, []);

  return (
    <View style={styles.row}>
      <Text variant="footnote" color="tertiary" style={styles.text}>
        Sunrise {data.sunrise}  ·  Sunset {data.sunset}  ·  {data.moonGlyph}{' '}
        {data.moonName}
      </Text>
      <Text variant="footnote" color="tertiary" style={styles.subtle}>
        — almanac for {data.city}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    marginTop: space.xs,
    marginBottom: space.lg,
  },
  text: {
    fontStyle: 'italic',
    fontVariant: ['tabular-nums'],
  },
  subtle: {
    marginTop: 2,
    opacity: 0.7,
  },
});
