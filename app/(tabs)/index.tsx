import { format, isSameDay, isAfter } from 'date-fns';
import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { ScreenContainer } from '@/components/ScreenContainer';
import { Text } from '@/components/Text';
import { TimeBlock } from '@/components/TimeBlock';
import { categoryById } from '@/lib/categories';
import { isPast } from '@/lib/format';
import { mockEventsThisWeek, mockEventsToday } from '@/lib/mock-data';
import { useUserEvents } from '@/lib/store';
import { space, useTheme } from '@/theme';

export default function Today() {
  const router = useRouter();
  const { palette } = useTheme();
  const now = new Date();
  const dayName = format(now, 'EEEE');
  const subDate = format(now, 'MMMM d');

  const userEvents = useUserEvents();
  // Today's events = mocks anchored to today + any user events that fall today,
  // sorted by start time so the timeline reads in order.
  const events = useMemo(() => {
    const today = new Date();
    const userToday = userEvents.filter((e) => isSameDay(new Date(e.start), today));
    return [...mockEventsToday, ...userToday].sort(
      (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime(),
    );
  }, [userEvents]);

  // Show the next 3 upcoming events for the "Looking ahead" section.
  const upcoming = useMemo(() => {
    const cutoff = new Date();
    const all = [...mockEventsThisWeek, ...userEvents].filter((e) =>
      isAfter(new Date(e.start), cutoff),
    );
    return all
      .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
      .slice(0, 3);
  }, [userEvents]);

  const ahead = events.filter((e) => !isPast(e.end));
  const todayDomains = useMemo(() => {
    const ids = Array.from(new Set(events.map((e) => e.category)));
    return ids.map((id) => categoryById[id]);
  }, [events]);

  // Insert a "now" rule before the first event that hasn't started yet,
  // but only if at least one event is already past — otherwise the day
  // hasn't begun and the rule would sit awkwardly above everything.
  const nowIndex = useMemo(() => {
    const firstFuture = events.findIndex((e) => new Date(e.start) > now);
    const hasPast = events.some((e) => isPast(e.end));
    return hasPast && firstFuture > 0 ? firstFuture : -1;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [events]);

  const nowLabel = format(now, 'h:mm a').toLowerCase();

  return (
    <ScreenContainer>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text variant="displayLarge">{dayName}</Text>
          <Text variant="headline" color="tertiary" style={styles.subdate}>
            {subDate}
          </Text>
        </View>

        <View style={styles.summaryRow}>
          <Text variant="footnote" color="secondary">
            {ahead.length === 0
              ? 'A quiet day from here.'
              : `${ahead.length} ${
                  ahead.length === 1 ? 'commitment' : 'commitments'
                } ahead`}
          </Text>
          <View style={styles.glyphRow}>
            {todayDomains.map((c) => (
              <Text
                key={c.id}
                variant="footnote"
                color={palette.category[c.id]}
                style={styles.glyph}
              >
                {c.glyph}
              </Text>
            ))}
          </View>
        </View>

        <View style={styles.list}>
          {events.map((event, idx) => (
            <View key={event.id}>
              {idx === nowIndex ? (
                <View style={styles.nowRow}>
                  <View
                    style={[
                      styles.nowDot,
                      { backgroundColor: palette.brand.primary },
                    ]}
                  />
                  <View
                    style={[
                      styles.nowLine,
                      { backgroundColor: palette.brand.primary },
                    ]}
                  />
                  <Text
                    variant="numeric"
                    color="brand"
                    style={styles.nowLabel}
                  >
                    {nowLabel}
                  </Text>
                </View>
              ) : null}
              <TimeBlock
                event={event}
                onPress={() => router.push(`/event/${event.id}`)}
              />
            </View>
          ))}
        </View>

        {upcoming.length > 0 ? (
          <View style={styles.aheadSection}>
            <View
              style={[
                styles.aheadDivider,
                { borderTopColor: palette.hairline },
              ]}
            />
            <Text variant="label" color="tertiary" style={styles.aheadLabel}>
              Looking ahead
            </Text>
            {upcoming.map((event) => {
              const eventDate = new Date(event.start);
              const isTomorrow = isSameDay(
                eventDate,
                new Date(new Date().setDate(new Date().getDate() + 1)),
              );
              const dateLabel = isTomorrow
                ? 'Tomorrow'
                : format(eventDate, 'EEEE');
              return (
                <View key={event.id} style={styles.aheadRow}>
                  <Text variant="footnote" color="tertiary" style={styles.aheadDate}>
                    {dateLabel}
                  </Text>
                  <Text variant="body" style={styles.aheadTitle} numberOfLines={1}>
                    {event.title}
                  </Text>
                  <Text variant="numeric" color="tertiary">
                    {format(eventDate, 'h:mm a')}
                  </Text>
                </View>
              );
            })}
          </View>
        ) : null}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingTop: space.lg,
    paddingBottom: 160, // clear FAB + tab bar
  },
  header: {
    marginBottom: space.lg,
  },
  subdate: {
    marginTop: 2,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: space.xl,
  },
  glyphRow: {
    flexDirection: 'row',
    gap: space.sm,
  },
  glyph: {
    fontSize: 11,
  },
  list: {
    gap: space.md,
  },
  nowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    paddingVertical: space.sm,
  },
  nowDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  nowLine: {
    flex: 1,
    height: 1,
    opacity: 0.5,
  },
  nowLabel: {
    fontSize: 11,
  },
  aheadSection: {
    marginTop: space['2xl'],
  },
  aheadDivider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    marginBottom: space.lg,
  },
  aheadLabel: {
    marginBottom: space.md,
  },
  aheadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: space.sm,
    gap: space.md,
  },
  aheadDate: {
    width: 80,
  },
  aheadTitle: {
    flex: 1,
  },
});
