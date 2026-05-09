import { format } from 'date-fns';
import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { ScreenContainer } from '@/components/ScreenContainer';
import { Text } from '@/components/Text';
import { TimeBlock } from '@/components/TimeBlock';
import { categoryById } from '@/lib/categories';
import { isPast } from '@/lib/format';
import { mockEventsToday } from '@/lib/mock-data';
import { space, useTheme } from '@/theme';

export default function Today() {
  const router = useRouter();
  const { palette } = useTheme();
  const now = new Date();
  const dayName = format(now, 'EEEE');
  const subDate = format(now, 'MMMM d');
  const events = mockEventsToday;

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
});
