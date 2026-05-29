import { Feather } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CategoryDot } from '@/components/CategoryDot';
import { PressableScale } from '@/components/PressableScale';
import { Text } from '@/components/Text';
import { categoryById } from '@/lib/categories';
import {
  formatDuration,
  formatReflectedAt,
  formatRelativeDate,
  formatTime,
} from '@/lib/format';
import { mockEventsThisWeek, mockEventsToday } from '@/lib/mock-data';
import { useCategoryColor, useStore, useUserEvents } from '@/lib/store';
import { fontFamily, hitSlop, radius, space, useTheme } from '@/theme';

function openLocationInMaps(location: string) {
  const q = encodeURIComponent(location);
  // iOS native = Apple Maps; iOS web (Safari on iPhone) also Apple Maps because
  // that's the universal handler that doesn't trigger the "Google Maps can open
  // this" interception when the Google Maps app is installed.
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent ?? '' : '';
  const isIOSWeb =
    Platform.OS === 'web' && /iPhone|iPad|iPod|Macintosh/.test(ua);
  const url =
    Platform.OS === 'ios' || isIOSWeb
      ? `https://maps.apple.com/?q=${q}`
      : `https://www.google.com/maps/search/?api=1&query=${q}`;
  Linking.openURL(url).catch(() => {
    // best-effort
  });
}

export default function EventDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { palette } = useTheme();
  const userEvents = useUserEvents();
  const { editEvent } = useStore();
  const allEvents = [...mockEventsToday, ...mockEventsThisWeek, ...userEvents];
  const event = allEvents.find((e) => e.id === id);
  const eventCategoryColor = useCategoryColor(event?.category ?? 'personal');
  const isUserEvent = userEvents.some((e) => e.id === id);

  // Reflection edit state. Lives here (not in the store) so closing the
  // sheet discards an in-progress draft — matches how the rest of the
  // app treats unconfirmed edits.
  const [editingReflection, setEditingReflection] = useState(false);
  const [reflectionDraft, setReflectionDraft] = useState('');

  const beginEditReflection = () => {
    setReflectionDraft(event?.reflection ?? '');
    setEditingReflection(true);
  };
  const cancelEditReflection = () => {
    setEditingReflection(false);
    setReflectionDraft('');
  };
  const saveReflection = () => {
    if (!event) return;
    const trimmed = reflectionDraft.trim();
    editEvent(event.id, {
      reflection: trimmed || undefined,
      reflectionUpdatedAt: trimmed ? new Date().toISOString() : undefined,
    });
    setEditingReflection(false);
    setReflectionDraft('');
  };

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

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
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

        {isUserEvent ? (
          <View style={styles.reflectionSection}>
            {!editingReflection && event.reflection ? (
              <Animated.View entering={FadeIn.duration(220)}>
                <Text
                  variant="footnote"
                  color="tertiary"
                  style={styles.reflectionLabel}
                >
                  Reflected {event.reflectionUpdatedAt
                    ? formatReflectedAt(event.reflectionUpdatedAt)
                    : ''}
                </Text>
                <Pressable
                  onPress={beginEditReflection}
                  style={[
                    styles.reflectionCard,
                    {
                      backgroundColor: palette.bg.surface,
                      borderColor: palette.hairline,
                      borderRadius: radius.lg,
                    },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="Edit reflection"
                >
                  <Text style={[styles.reflectionText, { color: palette.text.primary }]}>
                    {event.reflection}
                  </Text>
                </Pressable>
                <Text
                  variant="footnote"
                  color="tertiary"
                  style={styles.reflectionEditHint}
                >
                  Tap to edit
                </Text>
              </Animated.View>
            ) : null}

            {!editingReflection && !event.reflection ? (
              <PressableScale
                onPress={beginEditReflection}
                haptic={false}
                style={[
                  styles.reflectionCard,
                  styles.reflectionPromptCard,
                  {
                    backgroundColor: palette.bg.surface,
                    borderColor: palette.hairline,
                    borderRadius: radius.lg,
                  },
                ]}
                accessibilityRole="button"
                accessibilityLabel="Add a reflection"
              >
                <Text style={[styles.reflectionPrompt, { color: palette.text.tertiary }]}>
                  What stayed with you?
                </Text>
              </PressableScale>
            ) : null}

            {editingReflection ? (
              <Animated.View entering={FadeIn.duration(220)}>
                <View
                  style={[
                    styles.reflectionCard,
                    {
                      backgroundColor: palette.bg.surface,
                      borderColor: palette.hairline,
                      borderRadius: radius.lg,
                    },
                  ]}
                >
                  <TextInput
                    value={reflectionDraft}
                    onChangeText={setReflectionDraft}
                    placeholder="What stayed with you?"
                    placeholderTextColor={palette.text.tertiary}
                    multiline
                    autoFocus
                    textAlignVertical="top"
                    style={[
                      styles.reflectionInput,
                      { color: palette.text.primary },
                    ]}
                  />
                </View>
                <View style={styles.reflectionActions}>
                  <PressableScale
                    onPress={cancelEditReflection}
                    haptic={false}
                    style={[
                      styles.reflectionGhostBtn,
                      { borderColor: palette.hairline },
                    ]}
                  >
                    <Text variant="bodyMedium" color="secondary">
                      Cancel
                    </Text>
                  </PressableScale>
                  <PressableScale
                    onPress={saveReflection}
                    style={[
                      styles.reflectionSaveBtn,
                      { backgroundColor: palette.brand.primary },
                    ]}
                  >
                    <Text variant="bodyMedium" color="onBrand">
                      {reflectionDraft.trim() === '' && event.reflection
                        ? 'Remove'
                        : 'Save'}
                    </Text>
                  </PressableScale>
                </View>
              </Animated.View>
            ) : null}
          </View>
        ) : null}

        <View style={styles.actions}>
          {event.destination ? (
            <PressableScale
              style={[
                styles.primaryBtn,
                {
                  backgroundColor: event.destination.url
                    ? palette.brand.primary
                    : palette.bg.surface,
                  opacity: event.destination.url ? 1 : 0.7,
                },
              ]}
              onPress={() => {
                if (event.destination?.url) {
                  Linking.openURL(event.destination.url).catch(() => {
                    // best-effort: if the URL can't open, do nothing
                  });
                }
              }}
              haptic={Boolean(event.destination.url)}
              accessibilityRole="button"
              accessibilityLabel={`Open in ${event.destination.appName}`}
            >
              <Text
                variant="bodyMedium"
                color={event.destination.url ? 'onBrand' : 'secondary'}
              >
                {event.destination.url
                  ? `Open in ${event.destination.appName}`
                  : `Opens in ${event.destination.appName}`}
              </Text>
              {event.destination.url ? (
                <Feather
                  name="arrow-up-right"
                  size={16}
                  color={palette.text.onBrand}
                />
              ) : null}
            </PressableScale>
          ) : null}
          {event.destination && !event.destination.url ? (
            <Text variant="footnote" color="tertiary" style={styles.destHint}>
              No link set yet. Edit and add one to tap straight into {event.destination.appName}.
            </Text>
          ) : null}
          {isUserEvent ? (
            <PressableScale
              style={[
                styles.ghostBtn,
                { borderColor: palette.hairline },
              ]}
              onPress={() => router.push(`/event/edit?id=${event.id}`)}
              haptic={false}
              accessibilityRole="button"
              accessibilityLabel="Edit"
            >
              <Text variant="bodyMedium" color="secondary">
                Edit
              </Text>
            </PressableScale>
          ) : (
            <Text variant="footnote" color="tertiary" style={styles.demoNote}>
              Demo content. Add your own with Quick Capture or the Planner.
            </Text>
          )}
        </View>
      </ScrollView>
      </KeyboardAvoidingView>
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
  destHint: {
    paddingHorizontal: space.md,
    lineHeight: 18,
    fontStyle: 'italic',
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
  reflectionSection: {
    marginBottom: space.xl,
  },
  reflectionLabel: {
    marginBottom: 6,
    letterSpacing: 0.3,
    textTransform: 'lowercase',
  },
  reflectionCard: {
    borderWidth: StyleSheet.hairlineWidth,
    padding: space.lg,
  },
  reflectionPromptCard: {
    minHeight: 64,
    justifyContent: 'center',
  },
  reflectionPrompt: {
    fontFamily: fontFamily.displayRegular,
    fontStyle: 'italic',
    fontSize: 17,
    lineHeight: 24,
  },
  reflectionText: {
    fontFamily: fontFamily.displayRegular,
    fontSize: 18,
    lineHeight: 28,
    letterSpacing: 0.1,
  },
  reflectionEditHint: {
    marginTop: 6,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  reflectionInput: {
    fontFamily: fontFamily.displayRegular,
    fontSize: 18,
    lineHeight: 28,
    letterSpacing: 0.1,
    minHeight: 120,
    padding: 0,
  },
  reflectionActions: {
    flexDirection: 'row',
    gap: space.sm,
    marginTop: space.md,
  },
  reflectionGhostBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    borderWidth: StyleSheet.hairlineWidth,
  },
  reflectionSaveBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
});
