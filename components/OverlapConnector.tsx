import { StyleSheet, View } from 'react-native';
import { Text } from './Text';
import { space, useTheme } from '@/theme';

type Props = {
  /** The event right above this connector — named in the warning text. */
  withTitle: string;
};

/**
 * Visual connector rendered between two adjacent overlapping events.
 *
 * The vertical claret line is **absolutely positioned**, extending past
 * the connector's own bounds by the parent list's gap (12pt) at the top
 * AND the bottom. The line therefore spans the entire vertical distance
 * from the bottom-right of the event card above to the top-right of the
 * event card below — visually joining them as one shape.
 *
 * "ⓘ Overlaps with <title>" sits in italic muted text to the left of the
 * line, in the gap.
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
          { backgroundColor: palette.danger },
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
    paddingVertical: space.sm,
    paddingRight: space.sm,
    position: 'relative',
    minHeight: 32,
  },
  text: {
    fontStyle: 'italic',
    paddingRight: 12, // leaves room for the absolute line on the right
  },
  // Spans the full distance between the two cards by reaching past the
  // parent list's gap (space.md = 12pt) on both sides.
  line: {
    position: 'absolute',
    right: 0,
    top: -space.md,
    bottom: -space.md,
    width: 2,
    borderRadius: 1,
    opacity: 0.65,
  },
});
