import { Feather } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CategoryDot } from '@/components/CategoryDot';
import { PressableScale } from '@/components/PressableScale';
import { Text } from '@/components/Text';
import { categoryById } from '@/lib/categories';
import {
  formatDuration,
  formatRelativeDate,
  formatTime,
} from '@/lib/format';
import { mockEventsThisWeek, mockEventsToday } from '@/lib/mock-data';
import { useCategoryColor, useStore, useUserEvents } from '@/lib/store';
import { hitSlop, radius, space, useTheme } from '@/theme';

function openLocationInMaps(location: string) {
  const q = encodeURIComponent(location);
  const url =
    Platform.OS === 'ios'
      ? `https://maps.apple.com/?q=${q}`
      : `https://www.google.com/maps/search/?q=${q}`;
  Linking.openURL(url).catch(() => {
    // best-effort
  });
}

export default function EventDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { palette } = useTheme();
  const userEvents = useUserEvents();
  const { deleteEvent } = useStore();
  const allEvents = [...mockEventsToday, ...mockEventsThisWeek, ...userEvents];
  const event = allEvents.find((e) => e.id === id);
  const eventCategoryColor = useCategoryColor(event?.category ?? 'personal');
  const isUserEvent = userEvents.some((e) => e.id === id);

  if (!event) {
    return (
      <SafeAreaView
        edges={['top', 'bottom']}
        style={[styles.root, { backgroundColor: palette.bg.canvas }]}
      >
        <View style={styles.topbar}>
          <View style={{ flex: 1 }} />
          <Pressable
            onPress={() => router.back()}
            hitSlop={hitSlop}
            accessibilityRole="button"
            accessibilityLabel="Close"
          >
            <Feather name="x" size={22} color={palette.text.secondary} />
          </Pressable>
        </View>
        <View style={styles.missing}>
          <Text variant="headline">This event has slipped past.</Text>
          <Text
            variant="footnote"
            color="tertiary"
            style={{ marginTop: space.sm }}
          >
            We couldn't find it on the calendar.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const category = categoryById[event.category];

  return (
    <SafeAreaView
      edges={['top', 'bottom']}
      style={[styles.root, { backgroundColor: palette.bg.canvas }]}
    >
      <View style={styles.topbar}>
        <View style={{ flex: 1 }} />
        <Pressable
          onPress={() => router.back()}
          hitSlop={hitSlop}
          accessibilityRole="button"
          accessibilityLabel="Close"
        >
          <Feather name="x" size={22} color={palette.text.secondary} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.titleRow}>
          <View
            style={[
              styles.titleEdge,
              { backgroundColor: eventCategoryColor },
            ]}
          />
          <Text variant="headline" style={styles.title}>
            {event.title}
          </Text>
        </View>

        <View style={styles.metaBlock}>
          <Text variant="numericLarge" color="primary">
            {formatRelativeDate(event.start)}
          </Text>
          {event.isAllDay ? (
            <Text
              variant="numeric"
              color={event.isBlock ? 'brand' : 'secondary'}
            >
              {event.isBlock ? 'Day blocked' : 'All day'}
            </Text>
          ) : (
            <Text variant="numeric" color="secondary">
              {formatTime(event.start)} — {formatTime(event.end)}
              {' · '}
              {formatDuration(event.start, event.end)}
            </Text>
          )}
          <View style={styles.catRow}>
            <CategoryDot category={event.category} size={7} />
            <Text variant="footnote" color="secondary">
              {category.label}
            </Text>
          </View>
        </View>

        {event.location ? (
          <PressableScale
            style={[
              styles.locationCard,
              {
                backgroundColor: palette.bg.surface,
                borderColor: palette.hairline,
                borderRadius: radius.lg,
              },
            ]}
            onPress={() => openLocationInMaps(event.location!)}
            haptic={false}
            accessibilityRole="button"
            accessibilityLabel={`Open ${event.location} in Maps`}
          >
            <Feather
              name="map-pin"
              size={16}
              color={palette.text.secondary}
            />
            <View style={{ flex: 1 }}>
              <Text variant="footnote" color="tertiary">
                Location
              </Text>
              <Text variant="bodyMedium" style={{ marginTop: 2 }}>
                {event.location}
              </Text>
            </View>
            <Feather
              name="arrow-up-right"
              size={14}
              color={palette.text.tertiary}
            />
          </PressableScale>
        ) : null}

        {event.notes ? (
          <View
            style={[
              styles.notes,
              {
                backgroundColor: palette.bg.surface,
                borderColor: palette.hairline,
                borderRadius: radius.lg,
              },
            ]}
          >
            <Text variant="footnote" color="tertiary">
              Notes
            </Text>
            <Text variant="body" style={{ marginTop: 4 }}>
              {event.notes}
            </Text>
          </View>
        ) : null}

        <View style={styles.actions}>
          {event.destination ? (
            <PressableScale
              style={[
                styles.primaryBtn,
                { backgroundColor: palette.brand.primary },
              ]}
              onPress={() => {
                // v0: deep-link is mocked. The real build will fire url.
                router.back();
              }}
              accessibilityRole="button"
              accessibilityLabel={`Open in ${event.destination.appName}`}
            >
              <Text variant="bodyMedium" color="onBrand">
                Open in {event.destination.appName}
              </Text>
              <Feather
                name="arrow-up-right"
                size={16}
                color={palette.text.onBrand}
              />
            </PressableScale>
          ) : null}
          {isUserEvent ? (
            <PressableScale
              style={[
                styles.ghostBtn,
                { borderColor: palette.hairline },
              ]}
              onPress={() => {
                deleteEvent(event.id);
                router.back();
              }}
              haptic
              accessibilityRole="button"
              accessibilityLabel="Remove from calendar"
            >
              <Text
                variant="bodyMedium"
                style={{ color: palette.danger }}
              >
                Remove from calendar
              </Text>
            </PressableScale>
          ) : (
            <Text variant="footnote" color="tertiary" style={styles.demoNote}>
              Demo content. Add your own with Quick Capture or the Planner.
            </Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  topbar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    height: 44,
  },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: space.md,
    paddingBottom: space['3xl'],
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: space.md,
    marginBottom: space.lg,
  },
  titleEdge: {
    width: 4,
    alignSelf: 'stretch',
    minHeight: 28,
    borderRadius: 2,
    marginTop: 4,
  },
  title: {
    flex: 1,
    fontSize: 28,
    lineHeight: 34,
  },
  metaBlock: {
    gap: 4,
    marginBottom: space.xl,
  },
  catRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: space.sm,
  },
  notes: {
    borderWidth: StyleSheet.hairlineWidth,
    padding: space.lg,
    marginBottom: space.xl,
  },
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    padding: space.lg,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: space.lg,
  },
  missing: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  actions: {
    gap: space.sm,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
    paddingVertical: 14,
    borderRadius: 999,
    minHeight: 48,
  },
  ghostBtn: {
    paddingVertical: 14,
    borderRadius: 999,
    alignItems: 'center',
    minHeight: 48,
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
  demoNote: {
    textAlign: 'center',
    paddingVertical: space.md,
    paddingHorizontal: space.md,
  },
});
