import { format, isSameDay, startOfDay } from 'date-fns';
import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { ScreenContainer } from '@/components/ScreenContainer';
import { Text } from '@/components/Text';
import { TimeBlock } from '@/components/TimeBlock';
import {
  type CalendarEvent,
  mockEventsThisWeek,
  mockEventsToday,
} from '@/lib/mock-data';
import { space, useTheme } from '@/theme';

type DayBucket = {
  date: Date;
  events: CalendarEvent[];
};

const allEvents: CalendarEvent[] = [...mockEventsToday, ...mockEventsThisWeek];

export default function Calendar() {
  const router = useRouter();
  const { palette } = useTheme();
  const today = startOfDay(new Date());

  const days = useMemo<DayBucket[]>(() => {
    const buckets: DayBucket[] = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const events = allEvents
        .filter((e) => isSameDay(new Date(e.start), date))
        .sort(
          (a, b) =>
            new Date(a.start).getTime() - new Date(b.start).getTime(),
        );
      buckets.push({ date, events });
    }
    return buckets;
  }, [today]);

  const monthYear = format(today, 'MMMM yyyy');
  const weekRange = `${format(days[0]!.date, 'MMM d')} — ${format(
    days[6]!.date,
    'MMM d',
  )}`;

  return (
    <ScreenContainer>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text variant="display">{monthYear}</Text>
          <Text variant="footnote" color="tertiary" style={styles.weekRange}>
            {weekRange}
          </Text>
        </View>

        {days.map((bucket) => {
          const isToday = isSameDay(bucket.date, today);
          const dayName = format(bucket.date, 'EEEE');
          const dayNumber = format(bucket.date, 'd');
          return (
            <View key={bucket.date.toISOString()} style={styles.daySection}>
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
                      {
                        backgroundColor: palette.brand.primary,
                      },
                    ]}
                  >
                    <Text variant="label" color="onBrand">
                      Today
                    </Text>
                  </View>
                ) : null}
              </View>
              {bucket.events.length === 0 ? (
                <Text variant="body" color="tertiary" style={styles.empty}>
                  Open. Worth defending.
                </Text>
              ) : (
                <View style={styles.eventList}>
                  {bucket.events.map((event) => (
                    <TimeBlock
                      key={event.id}
                      event={event}
                      onPress={() => router.push(`/event/${event.id}`)}
                    />
                  ))}
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingTop: space.lg,
    paddingBottom: 160,
  },
  header: {
    marginBottom: space.xl,
  },
  weekRange: {
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
  empty: {
    paddingVertical: space.sm,
  },
  eventList: {
    gap: space.sm,
  },
});
