import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
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
import { requestSuggestion } from '@/lib/ai-client';
import { categoryById } from '@/lib/categories';
import { formatLongDate, formatTime } from '@/lib/format';
import {
  type CalendarEvent,
  type CaptureResponse,
  mockEventsThisWeek,
  mockEventsToday,
} from '@/lib/mock-data';
import { useStore, useUserEvents } from '@/lib/store';
import { fontFamily, hitSlop, radius, space, useTheme } from '@/theme';

export default function CaptureScreen() {
  const router = useRouter();
  const { palette } = useTheme();
  const { addEvent } = useStore();
  const userEvents = useUserEvents();
  const [input, setInput] = useState('');
  const [response, setResponse] = useState<CaptureResponse | null>(null);
  const [thinking, setThinking] = useState(false);

  const confirm = () => {
    if (!response) return;
    const newEvent: CalendarEvent = {
      id: `cap-${Date.now()}`,
      title: response.proposedTitle,
      start: response.proposedStart,
      end: response.proposedEnd,
      category: response.category,
    };
    addEvent(newEvent);
    router.back();
  };

  const submit = async () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    setThinking(true);
    const allEvents = [...mockEventsToday, ...mockEventsThisWeek, ...userEvents];
    try {
      const result = await requestSuggestion(trimmed, allEvents);
      setResponse(result);
    } finally {
      setThinking(false);
    }
  };

  // "Try another time" — keep the task, treat the previous suggestion as a
  // taken slot, ask Claude for a different window.
  const retry = async () => {
    const trimmed = input.trim();
    if (!response || !trimmed) return;
    const previousSlot: CalendarEvent = {
      id: 'prev-suggestion',
      title: response.proposedTitle,
      start: response.proposedStart,
      end: response.proposedEnd,
      category: response.category,
    };
    setThinking(true);
    const allEvents = [
      ...mockEventsToday,
      ...mockEventsThisWeek,
      ...userEvents,
      previousSlot,
    ];
    try {
      const result = await requestSuggestion(trimmed, allEvents);
      setResponse(result);
    } finally {
      setThinking(false);
    }
  };

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
          <Text variant="display">Find me time to</Text>
          <Text variant="footnote" color="tertiary" style={styles.subtitle}>
            Speak it plainly. I'll find a slot.
          </Text>

          <View
            style={[
              styles.inputWrap,
              {
                backgroundColor: palette.bg.surface,
                borderColor: palette.hairline,
              },
            ]}
          >
            <TextInput
              value={input}
              onChangeText={setInput}
              onSubmitEditing={submit}
              autoFocus
              multiline
              placeholder="fix the leaky faucet for my wife this weekend"
              placeholderTextColor={palette.text.tertiary}
              style={[styles.input, { color: palette.text.primary }]}
              returnKeyType="done"
              blurOnSubmit
            />
          </View>

          <View style={styles.actions}>
            <PressableScale
              style={[
                styles.primaryBtn,
                { backgroundColor: palette.brand.primary },
              ]}
              onPress={submit}
              accessibilityRole="button"
              accessibilityLabel="Find me a slot"
            >
              <Text variant="bodyMedium" color="onBrand">
                {thinking ? 'Thinking…' : 'Find me a slot'}
              </Text>
            </PressableScale>
            <Pressable
              onPress={() => {
                /* v0: voice is mocked; real wiring later */
              }}
              hitSlop={hitSlop}
              style={styles.voiceBtn}
              accessibilityRole="button"
              accessibilityLabel="Dictate (coming soon)"
            >
              <Feather
                name="mic"
                size={20}
                color={palette.text.tertiary}
              />
            </Pressable>
          </View>

          {response ? (
            <Animated.View
              entering={FadeIn.duration(280)}
              style={[
                styles.responseCard,
                {
                  backgroundColor: palette.bg.surface,
                  borderColor: palette.hairline,
                  borderRadius: radius.lg,
                },
              ]}
            >
              <Text variant="footnote" color="tertiary">
                A quiet suggestion
              </Text>
              <Text variant="bodyMedium" style={styles.reasoning}>
                {response.reasoning}
              </Text>
              <View
                style={[
                  styles.proposedRow,
                  { borderTopColor: palette.hairline },
                ]}
              >
                <View style={styles.proposedLeft}>
                  <Text variant="title">{response.proposedTitle}</Text>
                  <View style={styles.proposedMeta}>
                    <Text variant="numeric" color="secondary">
                      {formatLongDate(response.proposedStart)}
                    </Text>
                    <Text variant="footnote" color="tertiary">
                      {' · '}
                      {formatTime(response.proposedStart)} —{' '}
                      {formatTime(response.proposedEnd)}
                    </Text>
                  </View>
                  <View style={styles.proposedCat}>
                    <CategoryDot category={response.category} size={6} />
                    <Text variant="footnote" color="secondary">
                      {categoryById[response.category].label}
                    </Text>
                  </View>
                </View>
              </View>
              <View style={styles.responseActions}>
                <PressableScale
                  style={[
                    styles.confirmBtn,
                    { backgroundColor: palette.brand.primary },
                  ]}
                  onPress={confirm}
                >
                  <Text variant="bodyMedium" color="onBrand">
                    Put it down
                  </Text>
                </PressableScale>
                <PressableScale
                  style={[
                    styles.ghostBtn,
                    { borderColor: palette.hairline },
                  ]}
                  onPress={retry}
                  haptic={false}
                >
                  <Text variant="bodyMedium" color="secondary">
                    {thinking ? 'Looking…' : 'Try another time'}
                  </Text>
                </PressableScale>
              </View>
            </Animated.View>
          ) : null}

          <PressableScale
            onPress={() => {
              // Dismiss this modal first, then push manual entry. Using
              // router.replace here breaks the back stack on the web build
              // (router.back from /event/new returns 404). dismiss + push
              // gives /event/new a clean stack rooted at the tabs.
              router.back();
              setTimeout(() => router.push('/event/new'), 80);
            }}
            haptic={false}
            style={styles.manualLink}
            accessibilityRole="button"
            accessibilityLabel="Set a specific time instead"
          >
            <Text variant="footnote" color="tertiary">
              Or set a specific time →
            </Text>
          </PressableScale>
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
  subtitle: {
    marginTop: 4,
    marginBottom: space.xl,
  },
  inputWrap: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.lg,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
    minHeight: 96,
  },
  input: {
    fontFamily: fontFamily.bodyRegular,
    fontSize: 17,
    lineHeight: 24,
    minHeight: 64,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    marginTop: space.lg,
  },
  primaryBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 999,
    alignItems: 'center',
    minHeight: 48,
    justifyContent: 'center',
  },
  voiceBtn: {
    width: 48,
    height: 48,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  responseCard: {
    borderWidth: StyleSheet.hairlineWidth,
    padding: space.lg,
    marginTop: space['2xl'],
    gap: space.md,
  },
  reasoning: {
    lineHeight: 23,
  },
  proposedRow: {
    paddingTop: space.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
  },
  proposedLeft: { flex: 1, gap: 4 },
  proposedMeta: { flexDirection: 'row', alignItems: 'center' },
  proposedCat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  responseActions: {
    flexDirection: 'row',
    gap: space.sm,
    marginTop: space.sm,
  },
  confirmBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 999,
    alignItems: 'center',
    minHeight: 44,
    justifyContent: 'center',
  },
  ghostBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 999,
    alignItems: 'center',
    minHeight: 44,
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
  manualLink: {
    alignSelf: 'center',
    marginTop: space.xl,
    paddingVertical: 12,
    paddingHorizontal: space.lg,
  },
});
