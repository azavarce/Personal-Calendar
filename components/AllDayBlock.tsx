import { StyleSheet, View } from 'react-native';
import { categoryById } from '@/lib/categories';
import type { CalendarEvent } from '@/lib/mock-data';
import { useCategoryColor, useResolvedCategory } from '@/lib/store';
import { radius, space, useTheme } from '@/theme';
import { CategoryDot } from './CategoryDot';
import { PressableScale } from './PressableScale';
import { Text } from './Text';

type Props = {
  event: CalendarEvent;
  onPress?: () => void;
};

/**
 * Banner for an all-day or "blocked" event. Sits above the timeline on
 * Today and at the top of each day on Calendar.
 *
 *   isAllDay (default)   surface bg + 4pt category left edge + "All day" label
 *   isBlock              warm-oxblood bordered + brand-color "Day blocked"
 *                        label. Stronger visual weight because the user is
 *                        deliberately reserving the day.
 */
export function AllDayBlock({ event, onPress }: Props) {
  const { palette } = useTheme();
  const category = useResolvedCategory(event.category) ?? categoryById[event.category];
  const categoryColor = useCategoryColor(event.category);
  const isBlock = event.isBlock;

  return (
    <PressableScale
      onPress={onPress}
      style={[
        styles.container,
        {
          backgroundColor: palette.bg.surface,
          borderRadius: radius.md,
        },
        isBlock
          ? {
              borderColor: palette.brand.primary,
              borderWidth: 1.5,
            }
          : undefined,
      ]}
      accessibilityRole="button"
      accessibilityLabel={`${event.title}, ${
        isBlock ? 'day blocked' : 'all day'
      }, ${category.label}`}
    >
      {!isBlock ? (
        <View
          style={[
            styles.edge,
            {
              backgroundColor: categoryColor,
              borderTopLeftRadius: radius.md,
              borderBottomLeftRadius: radius.md,
            },
          ]}
        />
      ) : null}
      <View style={styles.body}>
        <Text variant="title" numberOfLines={2}>
          {event.title}
        </Text>
        <View style={styles.metaRow}>
          <Text
            variant="label"
            color={isBlock ? 'brand' : 'secondary'}
            style={styles.metaLabel}
          >
            {isBlock ? 'Day blocked' : 'All day'}
          </Text>
          <Text variant="footnote" color="tertiary">
            {'  ·  '}
          </Text>
          <CategoryDot category={event.category} size={9} />
          <Text variant="footnote" color="secondary" style={styles.catLabel}>
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
    minHeight: 56,
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
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  metaLabel: {
    marginRight: 0,
  },
  catLabel: {
    marginLeft: 4,
  },
});
