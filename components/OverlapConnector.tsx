import { StyleSheet, View } from 'react-native';
import { Text } from './Text';
import { useStore } from '@/lib/store';
import { radius, space, useTheme } from '@/theme';

type Props = {
  /** The event right above this connector — named in the warning text. */
  withTitle: string;
};

/**
 * Visual connector rendered between two adjacent overlapping events.
 * The style is user-selectable in Settings → Display:
 *   - line  (default): vertical claret line on the right + italic text on the left
 *   - tag:    italic text inside a small surface-tinted pill on the right
 *   - icon:   just a small ⓘ glyph at the right; the cards say nothing else
 *   - tint:   the entire gap is faintly warm-tinted with the text centered
 *
 * All four variants honor the parent list's gap so the connector reads as
 * inside the gap between two adjacent cards.
 */
export function OverlapConnector({ withTitle }: Props) {
  const { palette } = useTheme();
  const style = useStore().state.overlapStyle;

  if (style === 'tag') {
    return (
      <View style={styles.row}>
        <View
          style={[
            styles.tag,
            {
              backgroundColor: palette.bg.surface,
              borderColor: palette.hairline,
              borderRadius: radius.pill,
            },
          ]}
        >
          <Text variant="footnote" color="tertiary" style={styles.tagText}>
            ⓘ Overlaps with {withTitle}
          </Text>
        </View>
        <View
          style={[
            styles.line,
            { backgroundColor: palette.danger },
          ]}
        />
      </View>
    );
  }

  if (style === 'icon') {
    return (
      <View style={styles.iconRow}>
        <Text
          variant="bodyMedium"
          style={{
            color: palette.danger,
            fontSize: 14,
            opacity: 0.75,
          }}
          accessibilityLabel={`Overlaps with ${withTitle}`}
        >
          ⓘ
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

  if (style === 'tint') {
    return (
      <View
        style={[
          styles.tintRow,
          {
            // Apply ~12% alpha to the danger hex (8-digit hex = #RRGGBBAA).
            backgroundColor: palette.danger + '20',
            borderRadius: radius.sm,
          },
        ]}
      >
        <Text
          variant="footnote"
          color="secondary"
          style={styles.tintText}
        >
          ⓘ Overlaps with {withTitle}
        </Text>
      </View>
    );
  }

  // line (default)
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
    paddingRight: 12,
  },
  // Spans the parent list's gap on both sides so it visually bridges the
  // two adjacent cards.
  line: {
    position: 'absolute',
    right: 0,
    top: -space.md,
    bottom: -space.md,
    width: 2,
    borderRadius: 1,
    opacity: 0.65,
  },
  // Tag variant — text inside a rounded pill on the right.
  tag: {
    paddingHorizontal: space.md,
    paddingVertical: 6,
    borderWidth: StyleSheet.hairlineWidth,
    marginRight: 14, // leave room for the line
  },
  tagText: {
    fontStyle: 'italic',
  },
  // Icon variant — minimal: just a ⓘ glyph.
  iconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingVertical: space.xs,
    paddingRight: space.sm,
    position: 'relative',
    minHeight: 20,
    gap: 8,
  },
  // Tint variant — entire gap is faintly warm-claret with centered text.
  tintRow: {
    paddingVertical: space.sm,
    paddingHorizontal: space.md,
    alignItems: 'center',
    justifyContent: 'center',
    // Opacity baked into the wrapper view so the text stays legible.
    // 0.10 — a whisper, not a flag.
  },
  tintText: {
    fontStyle: 'italic',
  },
});
