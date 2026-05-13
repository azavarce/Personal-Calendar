import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { OverlapConnector } from '@/components/OverlapConnector';
import { PressableScale } from '@/components/PressableScale';
import { SegmentedControl } from '@/components/SegmentedControl';
import { Text } from '@/components/Text';
import { TimeBlock } from '@/components/TimeBlock';
import type { CalendarEvent } from '@/lib/mock-data';
import { type OverlapStyle, useStore } from '@/lib/store';
import { hitSlop, radius, space, useTheme } from '@/theme';

// Two preview events used by the overlap-style picker. They overlap at
// 9:00 AM so the live preview always renders a conflict the user can see.
const PREVIEW_TODAY = (() => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
})();

const PREVIEW_EVENT_A: CalendarEvent = {
  id: 'overlap-preview-a',
  title: 'At the office',
  start: (() => {
    const d = new Date(PREVIEW_TODAY);
    d.setHours(9, 0, 0, 0);
    return d.toISOString();
  })(),
  end: (() => {
    const d = new Date(PREVIEW_TODAY);
    d.setHours(17, 0, 0, 0);
    return d.toISOString();
  })(),
  category: 'personal',
};

const PREVIEW_EVENT_B: CalendarEvent = {
  id: 'overlap-preview-b',
  title: 'Doctor',
  start: (() => {
    const d = new Date(PREVIEW_TODAY);
    d.setHours(9, 0, 0, 0);
    return d.toISOString();
  })(),
  end: (() => {
    const d = new Date(PREVIEW_TODAY);
    d.setHours(9, 30, 0, 0);
    return d.toISOString();
  })(),
  category: 'faith',
};

const OVERLAP_OPTIONS: { value: OverlapStyle; label: string }[] = [
  { value: 'line', label: 'Line' },
  { value: 'tag', label: 'Tag' },
  { value: 'icon', label: 'Icon' },
  { value: 'tint', label: 'Tint' },
];

export default function SettingsScreen() {
  const router = useRouter();
  const { palette } = useTheme();
  const { state, setThemeOverride, setOverlapStyle, resetAll } = useStore();
  const [confirmingReset, setConfirmingReset] = useState(false);

  const userEventCount = state.events.length;
  const userGoalCount = state.goals.length;

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
          style={styles.topbarBtn}
        >
          <Feather name="x" size={22} color={palette.text.secondary} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Text variant="display" style={styles.title}>
          Settings
        </Text>

        <Section title="Appearance">
          <View style={styles.themeRow}>
            <Text variant="body" color="primary" style={styles.themeLabel}>
              Theme
            </Text>
            <SegmentedControl
              value={state.themeOverride}
              onChange={setThemeOverride}
              options={[
                { value: 'system', label: 'System' },
                { value: 'light', label: 'Light' },
                { value: 'dark', label: 'Dark' },
              ]}
            />
          </View>
          <Text variant="footnote" color="tertiary" style={styles.helper}>
            "System" follows your device. The almanac is designed to look right in both modes.
          </Text>
        </Section>

        <Section title="Categories">
          <Row
            label="Manage categories"
            sub="Rename and reorder the six lanes of your life"
            onPress={() => router.push('/settings/categories')}
          />
        </Section>

        <Section title="Display">
          <Text variant="body" color="primary" style={styles.displayLabel}>
            Overlap visualization
          </Text>
          <Text variant="footnote" color="tertiary" style={styles.displayHelper}>
            How conflicts read between adjacent events on Today. Pick one — the preview below updates as you tap.
          </Text>
          <View style={styles.displayPicker}>
            <SegmentedControl<OverlapStyle>
              value={state.overlapStyle}
              onChange={setOverlapStyle}
              options={OVERLAP_OPTIONS}
            />
          </View>

          <View style={styles.preview}>
            <Text variant="label" color="tertiary" style={styles.previewLabel}>
              Preview
            </Text>
            <View style={styles.previewList}>
              <TimeBlock event={PREVIEW_EVENT_A} />
              <OverlapConnector withTitle={PREVIEW_EVENT_B.title} />
              <TimeBlock event={PREVIEW_EVENT_B} />
            </View>
          </View>
        </Section>

        <Section title="Your data">
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text variant="numericLarge" color="primary">
                {userEventCount}
              </Text>
              <Text variant="footnote" color="tertiary">
                events you've added
              </Text>
            </View>
            <View
              style={[
                styles.statDivider,
                { backgroundColor: palette.hairline },
              ]}
            />
            <View style={styles.stat}>
              <Text variant="numericLarge" color="primary">
                {userGoalCount}
              </Text>
              <Text variant="footnote" color="tertiary">
                goals you've set
              </Text>
            </View>
          </View>

          {confirmingReset ? (
            <View
              style={[
                styles.resetCard,
                {
                  backgroundColor: palette.bg.surface,
                  borderColor: palette.danger,
                  borderRadius: radius.lg,
                },
              ]}
            >
              <Text variant="bodyMedium">Clear everything you've added?</Text>
              <Text variant="footnote" color="secondary" style={styles.resetSub}>
                Your events and goals will be removed. The demo content stays. Categories reset to default.
              </Text>
              <View style={styles.resetActions}>
                <PressableScale
                  style={[
                    styles.resetGhost,
                    { borderColor: palette.hairline },
                  ]}
                  onPress={() => setConfirmingReset(false)}
                  haptic={false}
                >
                  <Text variant="bodyMedium" color="secondary">
                    Keep it
                  </Text>
                </PressableScale>
                <PressableScale
                  style={[
                    styles.resetConfirm,
                    { backgroundColor: palette.danger },
                  ]}
                  onPress={() => {
                    resetAll();
                    setConfirmingReset(false);
                  }}
                >
                  <Text variant="bodyMedium" color="onBrand">
                    Clear
                  </Text>
                </PressableScale>
              </View>
            </View>
          ) : (
            <Row
              label="Clear everything you've added"
              sub="Removes your events and goals. Demo content stays."
              danger
              onPress={() => setConfirmingReset(true)}
            />
          )}
        </Section>

        <Section title="About">
          <Row label="Personal Almanac" sub="v0.2 — alpha" />
          <Row
            label="Visual direction"
            sub="The Personal Almanac. Warm clay, Fraunces + DM Sans."
          />
        </Section>
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text variant="label" color="tertiary" style={styles.sectionTitle}>
        {title}
      </Text>
      {children}
    </View>
  );
}

function Row({
  label,
  sub,
  onPress,
  danger,
}: {
  label: string;
  sub?: string;
  onPress?: () => void;
  danger?: boolean;
}) {
  const { palette } = useTheme();
  const Wrapper = onPress ? PressableScale : View;
  const wrapperProps = onPress
    ? {
        onPress,
        haptic: false,
        accessibilityRole: 'button' as const,
        accessibilityLabel: label,
      }
    : {};
  return (
    <Wrapper
      {...(wrapperProps as object)}
      style={[
        styles.row,
        {
          backgroundColor: palette.bg.surface,
          borderColor: palette.hairline,
          borderRadius: radius.md,
        },
      ]}
    >
      <View style={{ flex: 1 }}>
        <Text
          variant="bodyMedium"
          style={danger ? { color: palette.danger } : undefined}
        >
          {label}
        </Text>
        {sub ? (
          <Text variant="footnote" color="tertiary" style={styles.rowSub}>
            {sub}
          </Text>
        ) : null}
      </View>
      {onPress ? (
        <Feather
          name="chevron-right"
          size={18}
          color={palette.text.tertiary}
        />
      ) : null}
    </Wrapper>
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
  title: {
    marginBottom: space['2xl'],
  },
  section: {
    marginBottom: space.xl,
  },
  sectionTitle: {
    marginBottom: space.sm,
  },
  themeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: space.md,
  },
  themeLabel: {
    flex: 1,
  },
  helper: {
    marginTop: 4,
  },
  displayLabel: {
    marginTop: space.sm,
  },
  displayHelper: {
    marginTop: 4,
    marginBottom: space.md,
    lineHeight: 18,
  },
  displayPicker: {
    marginBottom: space.lg,
  },
  preview: {
    marginTop: space.sm,
  },
  previewLabel: {
    marginBottom: space.md,
  },
  previewList: {
    gap: space.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: space.md,
    paddingHorizontal: space.lg,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: space.sm,
    minHeight: 56,
  },
  rowSub: {
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    paddingVertical: space.md,
    paddingHorizontal: space.lg,
    gap: space.lg,
    alignItems: 'center',
    marginBottom: space.md,
  },
  stat: {
    flex: 1,
    alignItems: 'flex-start',
  },
  statDivider: {
    width: StyleSheet.hairlineWidth,
    alignSelf: 'stretch',
  },
  resetCard: {
    borderWidth: StyleSheet.hairlineWidth,
    padding: space.lg,
    gap: space.sm,
  },
  resetSub: {
    marginBottom: space.sm,
  },
  resetActions: {
    flexDirection: 'row',
    gap: space.sm,
    marginTop: space.sm,
  },
  resetGhost: {
    flex: 1,
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: 12,
    borderRadius: 999,
    alignItems: 'center',
  },
  resetConfirm: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 999,
    alignItems: 'center',
  },
});
