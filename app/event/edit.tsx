import { Feather } from '@expo/vector-icons';
import { addDays, format, isSameDay } from 'date-fns';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  TextInput,
  View,
} from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CategoryDot } from '@/components/CategoryDot';
import { PressableScale } from '@/components/PressableScale';
import { Text } from '@/components/Text';
import { overlaps } from '@/lib/conflict';
import type { CategoryId } from '@/lib/categories';
import {
  type CalendarEvent,
  mockEventsThisWeek,
  mockEventsToday,
} from '@/lib/mock-data';
import {
  useResolvedCategories,
  useStore,
  useUserEvents,
} from '@/lib/store';
import { fontFamily, hitSlop, radius, space, useTheme } from '@/theme';

type TimeChoice =
  | { kind: 'preset'; hour: number; minute: number; label: string }
  | { kind: 'custom'; raw: string };

const TIME_PRESETS: { hour: number; minute: number; label: string }[] = [
  { hour: 7, minute: 0, label: '7 AM' },
  { hour: 9, minute: 0, label: '9 AM' },
  { hour: 12, minute: 0, label: 'Noon' },
  { hour: 15, minute: 0, label: '3 PM' },
  { hour: 17, minute: 0, label: '5 PM' },
  { hour: 19, minute: 0, label: '7 PM' },
];

const DURATIONS: { minutes: number; label: string }[] = [
  { minutes: 15, label: '15 min' },
  { minutes: 30, label: '30 min' },
  { minutes: 60, label: '1 hr' },
  { minutes: 120, label: '2 hr' },
];

function parseHHMM(raw: string): { hour: number; minute: number } | null {
  const match = raw.trim().match(/^(\d{1,2}):(\d{2})\s*(am|pm)?$/i);
  if (!match) return null;
  let hour = parseInt(match[1]!, 10);
  const minute = parseInt(match[2]!, 10);
  const meridian = match[3]?.toLowerCase();
  if (Number.isNaN(hour) || Number.isNaN(minute)) return null;
  if (minute < 0 || minute > 59) return null;
  if (meridian === 'pm' && hour < 12) hour += 12;
  if (meridian === 'am' && hour === 12) hour = 0;
  if (hour < 0 || hour > 23) return null;
  return { hour, minute };
}

function matchTimePreset(d: Date) {
  return TIME_PRESETS.find(
    (p) => p.hour === d.getHours() && p.minute === d.getMinutes(),
  );
}

function closestDuration(minutes: number): number {
  return DURATIONS.reduce((closest, d) =>
    Math.abs(d.minutes - minutes) < Math.abs(closest - minutes)
      ? d.minutes
      : closest,
    DURATIONS[1]!.minutes,
  );
}

export default function EditEventScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { palette } = useTheme();
  const { editEvent, deleteEvent } = useStore();
  const userEvents = useUserEvents();
  const categories = useResolvedCategories();

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  // Find the event being edited. Only user events are editable; mocks are
  // demo content. If id doesn't match anything in userEvents, we render an
  // "event not found" fallback.
  const event = useMemo(() => userEvents.find((e) => e.id === id), [
    userEvents,
    id,
  ]);

  // Initial-state derivation. useState initializer functions so the values
  // are computed once from the resolved event.
  const [title, setTitle] = useState(() => event?.title ?? '');
  const [selectedDay, setSelectedDay] = useState<Date>(() => {
    if (!event) return today;
    const d = new Date(event.start);
    d.setHours(0, 0, 0, 0);
    return d;
  });

  const initialTime = useMemo<TimeChoice>(() => {
    if (!event) return { kind: 'preset', ...TIME_PRESETS[1]! };
    const start = new Date(event.start);
    const preset = matchTimePreset(start);
    if (preset) return { kind: 'preset', ...preset };
    return { kind: 'custom', raw: format(start, 'HH:mm') };
  }, [event]);
  const [time, setTime] = useState<TimeChoice>(initialTime);
  const [customTime, setCustomTime] = useState(() =>
    initialTime.kind === 'custom' ? initialTime.raw : '',
  );

  const initialDuration = useMemo(() => {
    if (!event) return 30;
    const duration = Math.round(
      (new Date(event.end).getTime() - new Date(event.start).getTime()) / 60000,
    );
    // For all-day, duration won't match a preset; doesn't matter — time/duration
    // sections are hidden anyway.
    return closestDuration(duration);
  }, [event]);
  const [duration, setDuration] = useState<number>(initialDuration);

  const [categoryId, setCategoryId] = useState<CategoryId>(
    event?.category ?? categories[0]?.id ?? 'personal',
  );
  const [destinationApp, setDestinationApp] = useState(
    event?.destination?.appName ?? '',
  );
  const [isAllDay, setIsAllDay] = useState<boolean>(!!event?.isAllDay);
  const [isBlock, setIsBlock] = useState<boolean>(!!event?.isBlock);
  const [notes, setNotes] = useState(event?.notes ?? '');
  const [location, setLocation] = useState(event?.location ?? '');
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  // If the event prop changes after mount (rare but possible), re-sync. This
  // also matters when navigating directly to /event/edit?id=foo from a
  // deep-link with no prior render.
  useEffect(() => {
    if (!event) return;
    setTitle(event.title);
    const start = new Date(event.start);
    const day = new Date(start);
    day.setHours(0, 0, 0, 0);
    setSelectedDay(day);
    const preset = matchTimePreset(start);
    if (preset) {
      setTime({ kind: 'preset', ...preset });
      setCustomTime('');
    } else {
      const raw = format(start, 'HH:mm');
      setTime({ kind: 'custom', raw });
      setCustomTime(raw);
    }
    const dur = Math.round(
      (new Date(event.end).getTime() - new Date(event.start).getTime()) / 60000,
    );
    setDuration(closestDuration(dur));
    setCategoryId(event.category);
    setDestinationApp(event.destination?.appName ?? '');
    setIsAllDay(!!event.isAllDay);
    setIsBlock(!!event.isBlock);
    setNotes(event.notes ?? '');
    setLocation(event.location ?? '');
  }, [event]);

  const dateChips = useMemo(() => {
    return Array.from({ length: 30 }, (_, i) => addDays(today, i));
  }, [today]);

  const resolvedTime = useMemo<{ hour: number; minute: number } | null>(() => {
    if (time.kind === 'preset') return { hour: time.hour, minute: time.minute };
    return parseHHMM(customTime);
  }, [time, customTime]);

  const prospect = useMemo<{ start: Date; end: Date } | null>(() => {
    if (isAllDay) {
      const start = new Date(selectedDay);
      start.setHours(0, 0, 0, 0);
      const end = new Date(selectedDay);
      end.setHours(23, 59, 59, 999);
      return { start, end };
    }
    if (!resolvedTime) return null;
    const start = new Date(selectedDay);
    start.setHours(resolvedTime.hour, resolvedTime.minute, 0, 0);
    const end = new Date(start);
    end.setMinutes(end.getMinutes() + duration);
    return { start, end };
  }, [selectedDay, resolvedTime, duration, isAllDay]);

  const conflict = useMemo(() => {
    if (!prospect) return null;
    const all = [
      ...mockEventsToday,
      ...mockEventsThisWeek,
      // Exclude self so editing in place doesn't conflict with yourself.
      ...userEvents.filter((e) => e.id !== id),
    ];
    return all.find((e) =>
      overlaps(prospect, { start: new Date(e.start), end: new Date(e.end) }),
    );
  }, [prospect, userEvents, id]);

  const canSave =
    title.trim().length > 0 && (isAllDay || resolvedTime !== null);

  const missingMessage = (() => {
    if (canSave) return null;
    const missing: string[] = [];
    if (title.trim().length === 0) missing.push('a title');
    if (!isAllDay && !resolvedTime) {
      if (time.kind === 'custom' && customTime.length > 0) {
        missing.push('a valid time (HH:MM or H:MM AM/PM)');
      } else if (time.kind === 'custom') {
        missing.push('a time');
      }
    }
    if (missing.length === 0) return null;
    return `Add ${missing.join(' and ')} first.`;
  })();

  const save = () => {
    if (!canSave || !prospect || !event) return;
    editEvent(event.id, {
      title: title.trim(),
      start: prospect.start.toISOString(),
      end: prospect.end.toISOString(),
      category: categoryId,
      destination:
        destinationApp.trim().length > 0
          ? { appName: destinationApp.trim() }
          : undefined,
      notes: notes.trim().length > 0 ? notes.trim() : undefined,
      location: location.trim().length > 0 ? location.trim() : undefined,
      isAllDay: isAllDay || undefined,
      isBlock: isAllDay && isBlock ? true : undefined,
    });
    router.back();
  };

  const remove = () => {
    if (!event) return;
    deleteEvent(event.id);
    router.replace('/');
  };

  // Event not found — covers two cases:
  // 1. Direct navigation to an id that doesn't exist
  // 2. Trying to edit a demo event (mocks aren't in userEvents)
  if (!event) {
    return (
      <SafeAreaView
        edges={['top', 'bottom']}
        style={[styles.root, { backgroundColor: palette.bg.canvas }]}
      >
        <View style={styles.topbar}>
          <Pressable
            onPress={() => router.back()}
            hitSlop={hitSlop}
            accessibilityRole="button"
            accessibilityLabel="Close"
            style={styles.topbarBtn}
          >
            <Feather name="x" size={22} color={palette.text.secondary} />
          </Pressable>
          <View style={{ flex: 1 }} />
        </View>
        <View style={styles.missing}>
          <Text variant="headline">This event can't be edited.</Text>
          <Text
            variant="footnote"
            color="tertiary"
            style={{ marginTop: space.sm, textAlign: 'center' }}
          >
            It's either demo content or no longer on your calendar.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      edges={['top', 'bottom']}
      style={[styles.root, { backgroundColor: palette.bg.canvas }]}
    >
      <View style={styles.topbar}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={hitSlop}
          accessibilityRole="button"
          accessibilityLabel="Close"
          style={styles.topbarBtn}
        >
          <Feather name="x" size={22} color={palette.text.secondary} />
        </Pressable>
        <View style={{ flex: 1 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <Text variant="display">Edit event</Text>
          <Text variant="footnote" color="tertiary" style={styles.subtitle}>
            Adjust whatever needs adjusting.
          </Text>

          <SectionLabel>What is it?</SectionLabel>
          <View
            style={[
              styles.titleInputWrap,
              {
                backgroundColor: palette.bg.surface,
                borderColor: palette.hairline,
                borderRadius: radius.lg,
              },
            ]}
          >
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="Title"
              placeholderTextColor={palette.text.tertiary}
              style={[styles.titleInput, { color: palette.text.primary }]}
              returnKeyType="next"
            />
          </View>

          <View style={styles.toggleRow}>
            <View style={{ flex: 1 }}>
              <Text variant="body" color="primary">
                All day
              </Text>
              <Text variant="footnote" color="tertiary" style={styles.toggleHelper}>
                Spans the whole day (a birthday, a vacation). Other events can still be scheduled alongside it.
              </Text>
            </View>
            <Switch
              value={isAllDay}
              onValueChange={(v) => {
                setIsAllDay(v);
                if (!v) setIsBlock(false);
              }}
              trackColor={{
                false: palette.hairline,
                true: palette.brand.primary,
              }}
              thumbColor={palette.bg.elevated}
              ios_backgroundColor={palette.hairline}
            />
          </View>

          {isAllDay ? (
            <Animated.View entering={FadeIn.duration(180)}>
              <View
                style={[
                  styles.toggleRow,
                  styles.toggleRowNested,
                  {
                    backgroundColor: palette.bg.surface,
                    borderColor: palette.hairline,
                    borderRadius: radius.md,
                  },
                ]}
              >
                <View style={{ flex: 1 }}>
                  <Text variant="bodyMedium" color="primary">
                    Block this day
                  </Text>
                  <Text variant="footnote" color="tertiary" style={styles.toggleHelper}>
                    Reserves the whole day. Quick Capture and the Planner will route around it.
                  </Text>
                </View>
                <Switch
                  value={isBlock}
                  onValueChange={setIsBlock}
                  trackColor={{
                    false: palette.hairline,
                    true: palette.brand.primary,
                  }}
                  thumbColor={palette.bg.elevated}
                  ios_backgroundColor={palette.hairline}
                />
              </View>
            </Animated.View>
          ) : null}

          <SectionLabel>When?</SectionLabel>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipScroll}
          >
            {dateChips.map((d) => {
              const selected = isSameDay(d, selectedDay);
              const label = isSameDay(d, today)
                ? 'Today'
                : isSameDay(d, addDays(today, 1))
                  ? 'Tomorrow'
                  : format(d, 'EEE MMM d');
              return (
                <Chip
                  key={d.toISOString()}
                  label={label}
                  selected={selected}
                  onPress={() => setSelectedDay(d)}
                />
              );
            })}
          </ScrollView>

          {!isAllDay ? (
            <>
              <SectionLabel>What time?</SectionLabel>
              <View style={styles.chipRow}>
                {TIME_PRESETS.map((p) => {
                  const selected =
                    time.kind === 'preset' &&
                    time.hour === p.hour &&
                    time.minute === p.minute;
                  return (
                    <Chip
                      key={p.label}
                      label={p.label}
                      selected={selected}
                      onPress={() => setTime({ kind: 'preset', ...p })}
                    />
                  );
                })}
                <Chip
                  label="Custom"
                  selected={time.kind === 'custom'}
                  onPress={() => setTime({ kind: 'custom', raw: customTime })}
                />
              </View>
              {time.kind === 'custom' ? (
                <View
                  style={[
                    styles.customTimeWrap,
                    {
                      backgroundColor: palette.bg.surface,
                      borderColor: palette.hairline,
                      borderRadius: radius.md,
                    },
                  ]}
                >
                  <TextInput
                    value={customTime}
                    onChangeText={(v) => {
                      setCustomTime(v);
                      setTime({ kind: 'custom', raw: v });
                    }}
                    placeholder="14:30  or  2:30 PM"
                    placeholderTextColor={palette.text.tertiary}
                    style={[
                      styles.customTimeInput,
                      { color: palette.text.primary },
                    ]}
                    returnKeyType="next"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <Text
                    variant="footnote"
                    color={
                      customTime.length > 0 && !resolvedTime
                        ? 'secondary'
                        : 'tertiary'
                    }
                    style={styles.helper}
                  >
                    {resolvedTime && time.kind === 'custom'
                      ? `Reads as ${formatResolved(resolvedTime)}.`
                      : 'Type the hour and minute. Examples: 14:30  ·  2:30 PM  ·  9:00 AM.'}
                  </Text>
                </View>
              ) : null}

              <SectionLabel>Duration</SectionLabel>
              <View style={styles.chipRow}>
                {DURATIONS.map((d) => (
                  <Chip
                    key={d.label}
                    label={d.label}
                    selected={duration === d.minutes}
                    onPress={() => setDuration(d.minutes)}
                  />
                ))}
              </View>
            </>
          ) : null}

          <SectionLabel>Category</SectionLabel>
          <View style={styles.chipRow}>
            {categories.map((c) => (
              <CategoryChip
                key={c.id}
                category={c.id}
                label={c.label}
                selected={categoryId === c.id}
                onPress={() => setCategoryId(c.id)}
              />
            ))}
          </View>

          <SectionLabel>Location (optional)</SectionLabel>
          <View
            style={[
              styles.titleInputWrap,
              {
                backgroundColor: palette.bg.surface,
                borderColor: palette.hairline,
                borderRadius: radius.md,
              },
            ]}
          >
            <TextInput
              value={location}
              onChangeText={setLocation}
              placeholder="e.g. 1234 Main St · The gym · Mom's house"
              placeholderTextColor={palette.text.tertiary}
              style={[styles.destInput, { color: palette.text.primary }]}
              autoCapitalize="words"
              returnKeyType="next"
            />
          </View>

          <SectionLabel>Notes (optional)</SectionLabel>
          <View
            style={[
              styles.notesWrap,
              {
                backgroundColor: palette.bg.surface,
                borderColor: palette.hairline,
                borderRadius: radius.md,
              },
            ]}
          >
            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder="A line for context."
              placeholderTextColor={palette.text.tertiary}
              style={[styles.notesInput, { color: palette.text.primary }]}
              multiline
              returnKeyType="default"
            />
          </View>

          <SectionLabel>Open in (optional)</SectionLabel>
          <View
            style={[
              styles.titleInputWrap,
              {
                backgroundColor: palette.bg.surface,
                borderColor: palette.hairline,
                borderRadius: radius.md,
              },
            ]}
          >
            <TextInput
              value={destinationApp}
              onChangeText={setDestinationApp}
              placeholder="e.g. Day One, YouVersion, Apple Fitness"
              placeholderTextColor={palette.text.tertiary}
              style={[styles.destInput, { color: palette.text.primary }]}
              autoCapitalize="words"
              returnKeyType="done"
            />
          </View>

          {conflict && !isAllDay ? (
            <View
              style={[
                styles.warningCard,
                {
                  backgroundColor: palette.bg.surface,
                  borderColor: palette.danger,
                  borderRadius: radius.md,
                },
              ]}
            >
              <Feather
                name="alert-circle"
                size={16}
                color={palette.danger}
              />
              <Text variant="footnote" color="secondary" style={styles.warningText}>
                {conflict.isBlock
                  ? `That day is blocked for "${conflict.title}". You can save anyway, but you'll be overriding the block.`
                  : `Overlaps with "${conflict.title}". You can save anyway, but the two will sit on the same slot.`}
              </Text>
            </View>
          ) : null}

          <PressableScale
            onPress={canSave ? save : () => {}}
            haptic={canSave}
            style={[
              styles.saveBtn,
              {
                backgroundColor: canSave
                  ? palette.brand.primary
                  : palette.bg.surface,
                opacity: canSave ? 1 : 0.6,
              },
            ]}
            accessibilityRole="button"
            accessibilityState={{ disabled: !canSave }}
          >
            <Text
              variant="bodyMedium"
              color={canSave ? 'onBrand' : 'tertiary'}
            >
              Save changes
            </Text>
          </PressableScale>
          {missingMessage ? (
            <Text
              variant="footnote"
              color="secondary"
              style={styles.missingHint}
            >
              {missingMessage}
            </Text>
          ) : null}

          {confirmingDelete ? (
            <Animated.View
              entering={FadeIn.duration(220)}
              style={[
                styles.deleteCard,
                {
                  backgroundColor: palette.bg.surface,
                  borderColor: palette.danger,
                  borderRadius: radius.md,
                },
              ]}
            >
              <Text variant="bodyMedium">Remove this event?</Text>
              <Text
                variant="footnote"
                color="tertiary"
                style={styles.deleteSub}
              >
                It'll disappear from your calendar. This can't be undone.
              </Text>
              <View style={styles.deleteActions}>
                <PressableScale
                  style={[
                    styles.ghostBtn,
                    { borderColor: palette.hairline },
                  ]}
                  onPress={() => setConfirmingDelete(false)}
                  haptic={false}
                >
                  <Text variant="bodyMedium" color="secondary">
                    Keep it
                  </Text>
                </PressableScale>
                <PressableScale
                  style={[
                    styles.deleteConfirm,
                    { backgroundColor: palette.danger },
                  ]}
                  onPress={remove}
                >
                  <Text variant="bodyMedium" color="onBrand">
                    Remove
                  </Text>
                </PressableScale>
              </View>
            </Animated.View>
          ) : (
            <PressableScale
              style={[
                styles.removeBtn,
                { borderColor: palette.hairline },
              ]}
              onPress={() => setConfirmingDelete(true)}
              haptic={false}
            >
              <Text
                variant="bodyMedium"
                style={{ color: palette.danger }}
              >
                Remove from calendar
              </Text>
            </PressableScale>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function formatResolved(t: { hour: number; minute: number }): string {
  const h12 = t.hour % 12 === 0 ? 12 : t.hour % 12;
  const meridian = t.hour < 12 ? 'AM' : 'PM';
  const m = t.minute.toString().padStart(2, '0');
  return `${h12}:${m} ${meridian}`;
}

function SectionLabel({ children }: { children: string }) {
  return (
    <Text variant="label" color="secondary" style={styles.sectionLabel}>
      {children}
    </Text>
  );
}

function Chip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  const { palette } = useTheme();
  return (
    <PressableScale
      scaleTo={0.96}
      onPress={onPress}
      haptic={false}
      style={[
        styles.chip,
        {
          borderColor: selected ? palette.brand.primary : palette.hairline,
          backgroundColor: selected ? palette.brand.primary : 'transparent',
        },
      ]}
      accessibilityRole="button"
      accessibilityState={{ selected }}
    >
      <Text
        variant="bodyMedium"
        style={{
          color: selected ? palette.text.onBrand : palette.text.primary,
          fontSize: 14,
        }}
      >
        {label}
      </Text>
    </PressableScale>
  );
}

function CategoryChip({
  category,
  label,
  selected,
  onPress,
}: {
  category: CategoryId;
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  const { palette } = useTheme();
  return (
    <PressableScale
      scaleTo={0.96}
      onPress={onPress}
      haptic={false}
      style={[
        styles.chip,
        styles.categoryChip,
        {
          borderColor: selected ? palette.brand.primary : palette.hairline,
          backgroundColor: selected ? palette.brand.primary : 'transparent',
        },
      ]}
      accessibilityRole="button"
      accessibilityState={{ selected }}
    >
      <CategoryDot category={category} size={11} />
      <Text
        variant="bodyMedium"
        style={{
          color: selected ? palette.text.onBrand : palette.text.primary,
          fontSize: 14,
        }}
      >
        {label}
      </Text>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  topbar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: 44,
  },
  topbarBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: space.md,
    paddingBottom: space['3xl'],
  },
  subtitle: {
    marginTop: 4,
    marginBottom: space.xl,
  },
  sectionLabel: {
    marginTop: space.xl,
    marginBottom: space.sm,
  },
  titleInputWrap: {
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: space.lg,
    paddingVertical: 10,
    minHeight: 48,
    justifyContent: 'center',
  },
  titleInput: {
    fontFamily: fontFamily.bodyRegular,
    fontSize: 17,
    lineHeight: 22,
  },
  chipScroll: {
    gap: 8,
    paddingRight: space.lg,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: space.md,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    minHeight: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryChip: {
    flexDirection: 'row',
    gap: 6,
    paddingLeft: space.sm + 2,
  },
  customTimeWrap: {
    marginTop: space.sm,
    paddingHorizontal: space.lg,
    paddingVertical: 10,
    borderWidth: StyleSheet.hairlineWidth,
    minHeight: 48,
    justifyContent: 'center',
  },
  customTimeInput: {
    fontFamily: fontFamily.bodyRegular,
    fontSize: 17,
    lineHeight: 22,
  },
  helper: {
    marginTop: 4,
  },
  destInput: {
    fontFamily: fontFamily.bodyRegular,
    fontSize: 16,
    lineHeight: 22,
  },
  warningCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: space.sm,
    padding: space.md,
    borderWidth: StyleSheet.hairlineWidth,
    marginTop: space.lg,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: space.md,
    gap: space.md,
    marginTop: space.lg,
  },
  toggleRowNested: {
    paddingHorizontal: space.lg,
    borderWidth: StyleSheet.hairlineWidth,
    marginTop: space.sm,
  },
  toggleHelper: {
    marginTop: 2,
    lineHeight: 18,
  },
  notesWrap: {
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
    minHeight: 88,
  },
  notesInput: {
    fontFamily: fontFamily.bodyRegular,
    fontSize: 16,
    lineHeight: 22,
    minHeight: 60,
  },
  warningText: {
    flex: 1,
    lineHeight: 20,
  },
  saveBtn: {
    paddingVertical: 16,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
    marginTop: space.xl,
  },
  missingHint: {
    textAlign: 'center',
    marginTop: space.sm,
  },
  removeBtn: {
    paddingVertical: 14,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    borderWidth: StyleSheet.hairlineWidth,
    marginTop: space.md,
  },
  deleteCard: {
    padding: space.lg,
    marginTop: space.md,
    borderWidth: StyleSheet.hairlineWidth,
    gap: space.sm,
  },
  deleteSub: {
    marginBottom: space.sm,
  },
  deleteActions: {
    flexDirection: 'row',
    gap: space.sm,
  },
  ghostBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    borderWidth: StyleSheet.hairlineWidth,
  },
  deleteConfirm: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  missing: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
});
