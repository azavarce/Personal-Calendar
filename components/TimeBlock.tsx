import { View, StyleSheet } from 'react-native';
import { categoryById } from '@/lib/categories';
import { formatDuration, formatTime, isCurrent, isPast } from '@/lib/format';
import type { CalendarEvent } from '@/lib/mock-data';
import { useResolvedCategory } from '@/lib/store';
import { radius, space, useTheme } from '@/theme';
import { CategoryDot } from './CategoryDot';
import { PressableScale } from './PressableScale';
import { Text } from './Text';

type Props = {
  event: CalendarEvent;
  onPress?: () => void;
};

/**
 * The atomic event card. Per DESIGN.md:
 *   - Rounded 12pt corners
 *   - 4pt left edge in the category accent colour (the single sanctioned
 *     border-stripe in this system; no other component uses one)
 *   - Flat — no shadow. Tonal step distinguishes it from the canvas.
 *   - Past events fade slightly. Current event gets the today-marker accent.
 */
export function TimeBlock({ event, onPress }: Props) {
  const { palette } = useTheme();
  // Resolved category (label may be user-renamed in Settings); fall back to the
  // built-in default if the store hasn't hydrated yet.
  const category = useResolvedCategory(event.category) ?? categoryById[event.category];
  const past = isPast(event.end);
  const current = isCurrent(event.start, event.end);

  const containerStyle = [
    styles.container,
    {
      backgroundColor: palette.bg.surface,
      borderRadius: radius.md,
      opacity: past ? 0.55 : 1,
    },
  ];

  return (
    <PressableScale
      style={containerStyle}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${event.title}, ${formatTime(event.start)}, ${
        category.label
      }`}
    >
      <View
        style={[
          styles.edge,
          {
            backgroundColor: palette.category[event.category],
            borderTopLeftRadius: radius.md,
            borderBottomLeftRadius: radius.md,
          },
        ]}
      />
      <View style={styles.body}>
        <View style={styles.header}>
          <Text variant="title" numberOfLines={2} style={styles.title}>
            {event.title}
          </Text>
          {current ? (
            <View
              style={[
                styles.nowPill,
                { backgroundColor: palette.brand.primary },
              ]}
            >
              <Text variant="label" color="onBrand">
                Now
              </Text>
            </View>
          ) : null}
        </View>
        <View style={styles.metaRow}>
          <Text variant="numeric" color="secondary">
            {formatTime(event.start)}
          </Text>
          <Text variant="footnote" color="tertiary">
            {' · '}
            {formatDuration(event.start, event.end)}
            {' · '}
          </Text>
          <CategoryDot category={event.category} size={6} />
          <Text variant="footnote" color="secondary" style={styles.metaLabel}>
            {category.label}
          </Text>
        </View>
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    overflow: 'hidden',
    minHeight: 64,
  },
  edge: {
    width: 4,
  },
  body: {
    flex: 1,
    paddingVertical: space.md,
    paddingHorizontal: space.md + 2,
    gap: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: space.sm,
  },
  title: {
    flex: 1,
  },
  nowPill: {
    paddingHorizontal: space.sm,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  metaLabel: {
    marginLeft: 4,
  },
});
