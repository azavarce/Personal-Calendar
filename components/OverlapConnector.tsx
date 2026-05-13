import { StyleSheet, View } from 'react-native';
import { Text } from './Text';
import { useTheme } from '@/theme';

type Props = {
  /** The event right above this connector (we name it in the warning). */
  withTitle: string;
};

/**
 * Visual connector rendered between two adjacent overlapping events.
 * The two event pills appear "joined on the right side" via a short
 * vertical claret line, and a small italic warning sits in the gap
 * between them. Negative margins let the pills nestle into the
 * connector so the joined-edge effect reads cleanly.
 */
export function OverlapConnector({ withTitle }: Props) {
  const { palette } = useTheme();
  return (
    <View style={styles.row}>
      <Text variant="footnote" color="tertiary" style={styles.text}>
        ⓘ Overlaps with {withTitle}
      </Text>
      <View
        style={[
          styles.line,
          {
            backgroundColor: palette.danger,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 10,
    paddingRight: 6,
    paddingVertical: 4,
    // Negative margins so the connector visually nestles between the two
    // event pills it lives between, rather than introducing extra space.
    marginTop: -4,
    marginBottom: -4,
  },
  text: {
    fontStyle: 'italic',
  },
  line: {
    width: 2,
    height: 22,
    borderRadius: 1,
    opacity: 0.6,
  },
});
