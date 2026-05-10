import {
  format,
  isSameDay,
  isSameMonth,
  startOfDay,
  startOfMonth,
} from 'date-fns';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { MonthGrid } from '@/components/MonthGrid';
import { ScreenContainer } from '@/components/ScreenContainer';
import { SegmentedControl } from '@/components/SegmentedControl';
import { Text } from '@/components/Text';
import { TimeBlock } from '@/components/TimeBlock';
import {
  type CalendarEvent,
  mockEventsThisWeek,
  mockEventsToday,
} from '@/lib/mock-data';
import { useUserEvents } from '@/lib/store';
import { space, useTheme } from '@/theme';

type Mode = 'week' | 'month';

export default function Calendar() {
  const router = useRouter();
  const { palette } = useTheme();
  const today = startOfDay(new Date());

  const [mode, setMode] = useState<Mode>('week');
  const [anchor, setAnchor] = useState<Date>(today);
  const [selectedDay, setSelectedDay] = useState<Date>(today);

  const userEvents = useUserEvents();
  const allEvents = useMemo<CalendarEvent[]>(
    () => [...mockEventsToday, ...mockEventsThisWeek, ...userEvents],
    [userEvents],
  );

  // Week mode: rolling next 7 days starting today.
  const weekDays = useMemo(() => {
    const out: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      out.push(d);
    }
    return out;
  }, [today]);

  const eventsForSelectedDay = useMemo(
    () =>
      allEvents
        .filter((e) => isSameDay(new Date(e.start), selectedDay))
        .sort(
          (a, b) =>
            new Date(a.start).getTime() - new Date(b.start).getTime(),
        ),
    [selectedDay, allEvents],
  );

  const monthYearLabel = format(
    mode === 'month' ? anchor : today,
    'MMMM yyyy',
  );

  return (
    <ScreenContainer>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.toggleRow}>
          <SegmentedControl<Mode>
            value={mode}
            onChange={(next) => {
              setMode(next);
              if (next === 'month' && !isSameMonth(anchor, today)) {
                setAnchor(startOfMonth(today));
              }
            }}
            options={[
              { value: 'week', label: 'Week' },
              { value: 'month', label: 'Month' },
            ]}
          />
        </View>

        <View style={styles.header}>
          <Text variant="display">{monthYearLabel}</Text>
          {mode === 'week' ? (
            <Text variant="footnote" color="tertiary" style={styles.subtitle}>
              {`${format(weekDays[0]!, 'MMM d')} — ${format(
                weekDays[6]!,
                'MMM d',
              )}`}
            </Text>
          ) : null}
        </View>

        {mode === 'week' ? (
          <WeekView
            days={weekDays}
            today={today}
            allEvents={allEvents}
            onSelectEvent={(id) => router.push(`/event/${id}`)}
          />
        ) : (
          <>
            <MonthGrid
              anchor={anchor}
              events={allEvents}
              selectedDay={selectedDay}
              onSelectDay={setSelectedDay}
            />
            <View
              style={[
                styles.selectedHeader,
                { borderTopColor: palette.hairline },
              ]}
            >
              <Text variant="headline">
                {isSameDay(selectedDay, today)
                  ? 'Today'
                  : format(selectedDay, 'EEEE')}
              </Text>
              <Text variant="footnote" color="tertiary">
                {format(selectedDay, 'MMMM d')}
              </Text>
            </View>
            {eventsForSelectedDay.length === 0 ? (
              <Text
                variant="body"
                color="tertiary"
                style={styles.empty}
              >
                Open. Worth defending.
              </Text>
            ) : (
              <View style={styles.eventList}>
                {eventsForSelectedDay.map((event) => (
                  <TimeBlock
                    key={event.id}
                    event={event}
                    onPress={() => router.push(`/event/${event.id}`)}
                  />
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

function WeekView({
  days,
  today,
  allEvents,
  onSelectEvent,
}: {
  days: Date[];
  today: Date;
  allEvents: CalendarEvent[];
  onSelectEvent: (id: string) => void;
}) {
  const { palette } = useTheme();
  return (
    <>
      {days.map((d) => {
        const isToday = isSameDay(d, today);
        const dayName = format(d, 'EEEE');
        const dayNumber = format(d, 'd');
        const dayEvents = allEvents
          .filter((e) => isSameDay(new Date(e.start), d))
          .sort(
            (a, b) =>
              new Date(a.start).getTime() - new Date(b.start).getTime(),
          );
        return (
          <View key={d.toISOString()} style={styles.daySection}>
            <View style={styles.dayHeader}>
              <View style={styles.dayHeaderLeft}>
                <Text
                  variant="headline"
                  color={isToday ? 'brand' : 'primary'}
                >
                  {dayName}
                </Text>
                <Text
                  variant="numericLarge"
                  color={isToday ? 'brand' : 'tertiary'}
                >
                  {dayNumber}
                </Text>
              </View>
              {isToday ? (
                <View
                  style={[
                    styles.todayChip,
                    { backgroundColor: palette.brand.primary },
                  ]}
                >
                  <Text variant="label" color="onBrand">
                    Today
                  </Text>
                </View>
              ) : null}
            </View>
            {dayEvents.length === 0 ? (
              <Text variant="body" color="tertiary" style={styles.empty}>
                Open. Worth defending.
              </Text>
            ) : (
              <View style={styles.eventList}>
                {dayEvents.map((event) => (
                  <TimeBlock
                    key={event.id}
                    event={event}
                    onPress={() => onSelectEvent(event.id)}
                  />
                ))}
              </View>
            )}
          </View>
        );
      })}
    </>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingTop: space.lg,
    paddingBottom: 160,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: space.md,
  },
  header: {
    marginBottom: space.xl,
  },
  subtitle: {
    marginTop: 4,
  },
  daySection: {
    marginBottom: space.xl,
  },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: space.md,
  },
  dayHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: space.md,
  },
  todayChip: {
    paddingHorizontal: space.md,
    paddingVertical: 4,
    borderRadius: 999,
  },
  selectedHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingTop: space.lg,
    marginTop: space.lg,
    marginBottom: space.md,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  empty: {
    paddingVertical: space.sm,
  },
  eventList: {
    gap: space.sm,
  },
});
