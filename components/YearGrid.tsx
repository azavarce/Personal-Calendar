import {
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  startOfMonth,
  startOfWeek,
} from 'date-fns';
import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { PressableScale } from './PressableScale';
import { Text } from './Text';
import type { CalendarEvent } from '@/lib/mock-data';
import type { CategoryId } from '@/lib/categories';
import { useResolvedCategories } from '@/lib/store';
import { space, useTheme } from '@/theme';

type Props = {
  /** Year to render — twelve mini-month grids for Jan–Dec of this year. */
  year: number;
  events: CalendarEvent[];
  /** Tap a mini-month → caller switches to Month view focused on that month. */
  onSelectMonth: (date: Date) => void;
};

/**
 * Year-at-a-glance grid: 4 rows × 3 columns of mini-months. Each day cell
 * shows a tiny colored dot if any events fall on that day, in the primary
 * category for that day. Today gets a ring.
 *
 * Built to look like a printed almanac page — the year of your life on one
 * screen. Honors *the week is a covenant, not a queue* extended outward.
 */
export function YearGrid({ year, events, onSelectMonth }: Props) {
  const { palette, mode } = useTheme();
  const today = useMemo(() => new Date(), []);
  const categories = useResolvedCategories();

  // Resolve category colors for the active mode once for the whole grid.
  const categoryColors = useMemo(() => {
    const m: Record<string, string> = {};
    for (const c of categories) m[c.id] = c.color[mode];
    return m;
  }, [categories, mode]);

  // Group events by yyyy-MM-dd, preserving order of first appearance per day.
  const eventsByDay = useMemo(() => {
    const map = new Map<string, CategoryId[]>();
    for (const e of events) {
      const d = new Date(e.start);
      if (d.getFullYear() !== year) continue;
      const key = format(d, 'yyyy-MM-dd');
      const arr = map.get(key) ?? [];
      if (!arr.includes(e.category)) arr.push(e.category);
      map.set(key, arr);
    }
    return map;
  }, [events, year]);

  return (
    <View style={styles.grid}>
      {Array.from({ length: 12 }).map((_, monthIdx) => {
        const monthStart = new Date(year, monthIdx, 1);
        return (
          <PressableScale
            key={monthIdx}
            scaleTo={0.97}
            haptic={false}
            onPress={() => onSelectMonth(monthStart)}
            style={[
              styles.monthCell,
              {
                borderColor: palette.hairline,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel={`${format(monthStart, 'MMMM yyyy')}`}
          >
            <MiniMonth
              monthStart={monthStart}
              today={today}
              eventsByDay={eventsByDay}
              categoryColors={categoryColors}
              palette={palette}
            />
          </PressableScale>
        );
      })}
    </View>
  );
}

function MiniMonth({
  monthStart,
  today,
  eventsByDay,
  categoryColors,
  palette,
}: {
  monthStart: Date;
  today: Date;
  eventsByDay: Map<string, CategoryId[]>;
  categoryColors: Record<string, string>;
  palette: ReturnType<typeof useTheme>['palette'];
}) {
  // Build the six-week grid (42 cells) starting from the Sunday of the week
  // containing the 1st. Cells outside the month render as empty space.
  const cells = useMemo(() => {
    const gridStart = startOfWeek(startOfMonth(monthStart), { weekStartsOn: 0 });
    const monthEnd = endOfMonth(monthStart);
    const lastWeekEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
    const totalDays = Math.round(
      (lastWeekEnd.getTime() - gridStart.getTime()) / (24 * 60 * 60 * 1000),
    ) + 1;
    const out: { date: Date; inMonth: boolean }[] = [];
    for (let i = 0; i < totalDays; i++) {
      const d = new Date(gridStart);
      d.setDate(gridStart.getDate() + i);
      out.push({
        date: d,
        inMonth: d.getMonth() === monthStart.getMonth(),
      });
    }
    // Pad to 42 (six rows) for layout consistency.
    while (out.length < 42) {
      const last = out[out.length - 1]!.date;
      const next = new Date(last);
      next.setDate(last.getDate() + 1);
      out.push({ date: next, inMonth: false });
    }
    return out.slice(0, 42);
  }, [monthStart]);

  return (
    <View>
      <Text variant="headline" style={styles.monthName}>
        {format(monthStart, 'MMM')}
      </Text>
      <View style={styles.daysGrid}>
        {cells.map((cell, i) => {
          const key = format(cell.date, 'yyyy-MM-dd');
          const cats = eventsByDay.get(key);
          const dotColor =
            cell.inMonth && cats && cats.length > 0
              ? categoryColors[cats[0]!]
              : null;
          const isToday = isSameDay(cell.date, today);
          return (
            <View key={i} style={styles.dayCell}>
              <View
                style={[
                  styles.dayDot,
                  isToday && {
                    borderColor: palette.brand.primary,
                    borderWidth: 1.5,
                  },
                  dotColor
                    ? {
                        backgroundColor: dotColor,
                      }
                    : isToday
                      ? null
                      : { opacity: 0 },
                ]}
              />
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.sm,
  },
  monthCell: {
    width: '31.5%',
    paddingVertical: space.sm,
    paddingHorizontal: space.sm,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
  },
  monthName: {
    fontSize: 14,
    lineHeight: 18,
    marginBottom: 4,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: `${100 / 7}%`,
    height: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayDot: {
    width: 6,
    height: 6,
    borderRadius: 999,
  },
});
