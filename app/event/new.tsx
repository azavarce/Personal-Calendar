import { Feather } from '@expo/vector-icons';
import { addDays, format, isSameDay } from 'date-fns';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CategoryDot } from '@/components/CategoryDot';
import { PressableScale } from '@/components/PressableScale';
import { Text } from '@/components/Text';
import { findFreeSlot, overlaps } from '@/lib/conflict';
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
import type { CategoryId } from '@/lib/categories';
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

export default function NewEventScreen() {
  const router = useRouter();
  const { palette } = useTheme();
  const { addEvent } = useStore();
  const userEvents = useUserEvents();
  const categories = useResolvedCategories();

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const [title, setTitle] = useState('');
  const [selectedDay, setSelectedDay] = useState<Date>(today);
  const [time, setTime] = useState<TimeChoice>({ kind: 'preset', ...TIME_PRESETS[1]! });
  const [customTime, setCustomTime] = useState('');
  const [duration, setDuration] = useState<number>(30);
  const [categoryId, setCategoryId] = useState<CategoryId>(
    categories[0]?.id ?? 'personal',
  );
  const [destinationApp, setDestinationApp] = useState('');

  // 30-day rolling chip list for date selection.
  const dateChips = useMemo(() => {
    return Array.from({ length: 30 }, (_, i) => addDays(today, i));
  }, [today]);

  // Resolve the chosen time to hour/minute (preset or parsed custom).
  const resolvedTime = useMemo<{ hour: number; minute: number } | null>(() => {
    if (time.kind === 'preset') return { hour: time.hour, minute: time.minute };
    return parseHHMM(customTime);
  }, [time, customTime]);

  // Build the prospective event window from the three pickers.
  const prospect = useMemo<{ start: Date; end: Date } | null>(() => {
    if (!resolvedTime) return null;
    const start = new Date(selectedDay);
    start.setHours(resolvedTime.hour, resolvedTime.minute, 0, 0);
    const end = new Date(start);
    end.setMinutes(end.getMinutes() + duration);
    return { start, end };
  }, [selectedDay, resolvedTime, duration]);

  // Live conflict check against mocks + user events.
  const conflict = useMemo(() => {
    if (!prospect) return null;
    const all = [...mockEventsToday, ...mockEventsThisWeek, ...userEvents];
    return all.find((e) =>
      overlaps(prospect, { start: new Date(e.start), end: new Date(e.end) }),
    );
  }, [prospect, userEvents]);

  const canSave = title.trim().length > 0 && resolvedTime !== null;

  const save = () => {
    if (!canSave || !prospect) return;
    const event: CalendarEvent = {
      id: `manual-${Date.now()}`,
      title: title.trim(),
      start: prospect.start.toISOString(),
      end: prospect.end.toISOString(),
      category: categoryId,
      destination: destinationApp.trim().length > 0
        ? { appName: destinationApp.trim() }
        : undefined,
    };
    addEvent(event);
    router.back();
  };

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
          <Text variant="display">Set a time</Text>
          <Text variant="footnote" color="tertiary" style={styles.subtitle}>
            For when you already know the moment.
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
              placeholder="e.g. Doctor appointment"
              placeholderTextColor={palette.text.tertiary}
              style={[styles.titleInput, { color: palette.text.primary }]}
              returnKeyType="next"
              autoFocus
            />
          </View>

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
                  onPress={() =>
                    setTime({ kind: 'preset', ...p })
                  }
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
                placeholder="e.g. 14:30 or 2:30 PM"
                placeholderTextColor={palette.text.tertiary}
                style={[styles.customTimeInput, { color: palette.text.primary }]}
                returnKeyType="next"
                autoCapitalize="none"
                autoCorrect={false}
              />
              {customTime.length > 0 && !resolvedTime ? (
                <Text variant="footnote" color="tertiary" style={styles.helper}>
                  Use HH:MM (24h) or H:MM AM/PM.
                </Text>
              ) : null}
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
              style={[
                styles.destInput,
                { color: palette.text.primary },
              ]}
              autoCapitalize="words"
              returnKeyType="done"
            />
          </View>

          {conflict ? (
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
                Overlaps with "{conflict.title}". You can save anyway, but the
                two will sit on the same slot.
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
              Put it on the calendar
            </Text>
          </PressableScale>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
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
});

// Suppress unused import warning
void findFreeSlot;
