import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Text } from './Text';
import { useStore } from '@/lib/store';
import { radius, space, useTheme } from '@/theme';

type Props = {
  /** The event right above this connector — named in the warning text. */
  withTitle: string;
};

/**
 * Visual connector rendered between two adjacent overlapping events.
 * Style is user-selectable in Settings → Display.
 *
 *   tag   (default): italic text inside a small surface-tinted pill on the
 *                    right, with a short claret line beside it.
 *   icon:            minimal — just a tertiary-claret ⓘ glyph. Tap to expand
 *                    an inline explanation.
 *   tint:            the entire connector area is faintly warm-claret with
 *                    the italic text centered inside.
 */
export function OverlapConnector({ withTitle }: Props) {
  const { palette } = useTheme();
  const style = useStore().state.overlapStyle;
  const [iconExpanded, setIconExpanded] = useState(false);

  if (style === 'icon') {
    return (
      <View style={styles.iconWrap}>
        <View style={styles.iconRow}>
          <Pressable
            onPress={() => setIconExpanded((v) => !v)}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={`Overlaps with ${withTitle}. Tap to learn more.`}
            accessibilityState={{ expanded: iconExpanded }}
          >
            <Text
              variant="bodyMedium"
              style={{
                color: palette.danger,
                fontSize: 16,
                opacity: 0.75,
              }}
            >
              ⓘ
            </Text>
          </Pressable>
          <View
            style={[
              styles.line,
              { backgroundColor: palette.danger },
            ]}
          />
        </View>
        {iconExpanded ? (
          <Animated.View
            entering={FadeIn.duration(180)}
            style={styles.iconExplain}
          >
            <Text variant="footnote" color="secondary" style={styles.iconExplainText}>
              These two events share time on your calendar. Tap either card to edit one of them and clear the conflict.
            </Text>
            <Text variant="footnote" color="tertiary" style={styles.iconExplainSub}>
              Overlaps with {withTitle}.
            </Text>
          </Animated.View>
        ) : null}
      </View>
    );
  }

  if (style === 'tint') {
    return (
      <View
        style={[
          styles.tintRow,
          {
            backgroundColor: palette.danger + '20', // ~12% alpha
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

  // tag (default)
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
  // Tag variant
  tag: {
    paddingHorizontal: space.md,
    paddingVertical: 6,
    borderWidth: StyleSheet.hairlineWidth,
    marginRight: 14, // leave room for the line
  },
  tagText: {
    fontStyle: 'italic',
  },
  // Icon variant
  iconWrap: {
    position: 'relative',
  },
  iconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingVertical: space.xs,
    paddingRight: space.sm,
    minHeight: 24,
    gap: 8,
  },
  iconExplain: {
    paddingTop: space.xs,
    paddingHorizontal: space.md,
    paddingBottom: space.sm,
    alignItems: 'flex-end',
  },
  iconExplainText: {
    fontStyle: 'italic',
    textAlign: 'right',
    lineHeight: 18,
  },
  iconExplainSub: {
    marginTop: 4,
    textAlign: 'right',
  },
  // Tint variant
  tintRow: {
    paddingVertical: space.sm,
    paddingHorizontal: space.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tintText: {
    fontStyle: 'italic',
  },
});
