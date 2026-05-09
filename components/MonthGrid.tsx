import {
  addMonths,
  endOfMonth,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
} from 'date-fns';
import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { CategoryDot } from './CategoryDot';
import { PressableScale } from './PressableScale';
import { Text } from './Text';
import type { CalendarEvent } from '@/lib/mock-data';
import type { CategoryId } from '@/theme';
import { space, useTheme } from '@/theme';

type Props = {
  /** Anchor date — month grid renders the calendar month containing this. */
  anchor: Date;
  /** All events to consider for dot rendering. */
  events: CalendarEvent[];
  /** Currently-selected day. Tapping a cell emits onSelectDay. */
  selectedDay: Date;
  onSelectDay: (date: Date) => void;
};

const WEEKDAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

/**
 * Month-at-a-glance grid. Six rows × seven columns, leading and trailing
 * cells from neighbouring months rendered muted. Each in-month day shows
 * its date number and up to three category glyphs representing the event
 * categories scheduled that day.
 *
 * Tap a cell → onSelectDay fires. The container above renders the selected
 * day's full event list below the grid.
 */
export function MonthGrid({
  anchor,
  events,
  selectedDay,
  onSelectDay,
}: Props) {
  const { palette } = useTheme();
  const today = useMemo(() => new Date(), []);

  const cells = useMemo(() => {
    // Calendar month grid always starts on Sunday and renders 6 weeks (42 cells)
    // so the layout stays stable across months.
    const monthStart = startOfMonth(anchor);
    const gridStart = startOfWeek(monthStart, { weekStartsOn: 0 });
    const out: Date[] = [];
    for (let i = 0; i < 42; i++) {
      const d = new Date(gridStart);
      d.setDate(gridStart.getDate() + i);
      out.push(d);
    }
    return out;
  }, [anchor]);

  // Group events by yyyy-mm-dd for O(1) day lookup.
  const eventsByDay = useMemo(() => {
    const map = new Map<string, CategoryId[]>();
    for (const e of events) {
      const key = format(new Date(e.start), 'yyyy-MM-dd');
      const arr = map.get(key) ?? [];
      // De-duplicate categories so a day with three Faith events doesn't
      // render three claret glyphs.
      if (!arr.includes(e.category)) arr.push(e.category);
      map.set(key, arr);
    }
    return map;
  }, [events]);

  return (
    <View>
      <View style={styles.weekdayRow}>
        {WEEKDAY_LABELS.map((label, i) => (
          <View key={i} style={styles.weekdayCell}>
            <Text variant="label" color="tertiary">
              {label}
            </Text>
          </View>
        ))}
      </View>

      {/* Render six rows of seven days. */}
      {Array.from({ length: 6 }).map((_, rowIdx) => (
        <View key={rowIdx} style={styles.weekRow}>
          {cells
            .slice(rowIdx * 7, rowIdx * 7 + 7)
            .map((d) => {
              const inMonth = isSameMonth(d, anchor);
              const isToday = isSameDay(d, today);
              const isSelected = isSameDay(d, selectedDay);
              const dayKey = format(d, 'yyyy-MM-dd');
              const dayCategories = (eventsByDay.get(dayKey) ?? []).slice(0, 3);

              return (
                <PressableScale
                  key={dayKey}
                  scaleTo={0.95}
                  onPress={() => onSelectDay(d)}
                  haptic={false}
                  style={[
                    styles.dayCell,
                    isSelected && {
                      backgroundColor: palette.bg.surface,
                    },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={format(d, 'EEEE, MMMM d')}
                  accessibilityState={{ selected: isSelected }}
                >
                  <View
                    style={[
                      styles.dayNumberWrap,
                      isToday && {
                        backgroundColor: palette.brand.primary,
                      },
                    ]}
                  >
                    <Text
                      variant="numeric"
                      color={
                        isToday
                          ? 'onBrand'
                          : !inMonth
                            ? 'tertiary'
                            : 'primary'
                      }
                      style={[
                        styles.dayNumber,
                        !inMonth && { opacity: 0.4 },
                      ]}
                    >
                      {format(d, 'd')}
                    </Text>
                  </View>
                  <View style={styles.dotRow}>
                    {dayCategories.map((cat) => (
                      <CategoryDot
                        key={cat}
                        category={cat}
                        size={8}
                      />
                    ))}
                  </View>
                </PressableScale>
              );
            })}
        </View>
      ))}
    </View>
  );
}

// Suppress unused-imports warning for date-fns helpers we may need later
// (addMonths, endOfMonth — they're useful for the prev/next navigation we
// haven't shipped yet but will).
void addMonths;
void endOfMonth;

const styles = StyleSheet.create({
  weekdayRow: {
    flexDirection: 'row',
    marginBottom: space.sm,
    paddingHorizontal: space.xs,
  },
  weekdayCell: {
    flex: 1,
    alignItems: 'center',
  },
  weekRow: {
    flexDirection: 'row',
    paddingHorizontal: 2,
  },
  dayCell: {
    flex: 1,
    aspectRatio: 0.85,
    paddingVertical: space.xs,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'flex-start',
    margin: 1,
  },
  dayNumberWrap: {
    width: 26,
    height: 26,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayNumber: {
    fontSize: 14,
  },
  dotRow: {
    flexDirection: 'row',
    gap: 2,
    marginTop: 2,
    minHeight: 12,
    alignItems: 'center',
  },
});
