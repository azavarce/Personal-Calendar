import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { categoryById } from '@/lib/categories';
import { CategoryDot } from '@/components/CategoryDot';
import { PressableScale } from '@/components/PressableScale';
import { Text } from '@/components/Text';
import { requestPlan } from '@/lib/ai-client';
import {
  type BiblePlanType,
  type BibleTranslation,
  type DateNightBudget,
  type DateNightVibe,
  type FriendCadence,
  type FriendChannel,
  type FriendPick,
  type Plan,
  type Template,
  bibleTranslations,
  biblePlanTypes,
  dateNightBudgets,
  dateNightVibes,
  formatPlanDate,
  formatPlanTime,
  friendCadences,
  friendChannels,
  templates,
} from '@/lib/planner';
import { useStore, useUserEvents } from '@/lib/store';
import {
  type CalendarEvent,
  type Goal,
  mockEventsThisWeek,
  mockEventsToday,
} from '@/lib/mock-data';
import { fontFamily, hitSlop, radius, space, useTheme } from '@/theme';

type Step = 'pick' | 'shape' | 'preview' | 'done';

export default function PlannerScreen() {
  const router = useRouter();
  const { palette } = useTheme();
  const { addEvents, addGoal } = useStore();
  const userEvents = useUserEvents();

  const [step, setStep] = useState<Step>('pick');
  const [template, setTemplate] = useState<Template | null>(null);

  // Bible answers
  const [bibleTranslation, setBibleTranslation] = useState<BibleTranslation>('ESV');
  const [biblePlanType, setBiblePlanType] = useState<BiblePlanType>('canonical');
  // Friends answers
  const [friendPicks, setFriendPicks] = useState<FriendPick[]>([]);
  const [friendCadence, setFriendCadence] = useState<FriendCadence>('biweekly');
  // Date night answers
  const [dateMonths, setDateMonths] = useState<number>(6);
  const [dateVibes, setDateVibes] = useState<DateNightVibe[]>([]);
  const [dateBudget, setDateBudget] = useState<DateNightBudget>('moderate');
  // Custom answers
  const [customDesc, setCustomDesc] = useState<string>('');
  // Shared "what else should I know?" context, passed to Claude alongside
  // the structured params. Single state across all four templates.
  const [extraContext, setExtraContext] = useState<string>('');

  // Preview state
  const [thinking, setThinking] = useState<boolean>(false);
  const [plan, setPlan] = useState<Plan | null>(null);

  const close = () => router.back();
  const goBack = () => {
    if (step === 'pick') return close();
    if (step === 'shape') return setStep('pick');
    if (step === 'preview') return setStep('shape');
    setStep('preview');
  };

  const generate = async () => {
    if (!template) return;
    setStep('preview');
    setThinking(true);
    setPlan(null);
    const allExisting: CalendarEvent[] = [
      ...mockEventsToday,
      ...mockEventsThisWeek,
      ...userEvents,
    ];
    try {
      let out: Plan;
      switch (template.id) {
        case 'bible':
          out = await requestPlan(
            {
              template: 'bible',
              translation: bibleTranslation,
              planType: biblePlanType,
              extraContext,
            },
            allExisting,
          );
          break;
        case 'friends': {
          // Friend shape disables Plan it until the user has added at least
          // one, so picks is guaranteed non-empty by the time we get here.
          out = await requestPlan(
            {
              template: 'friends',
              picks: friendPicks,
              cadence: friendCadence,
              extraContext,
            },
            allExisting,
          );
          break;
        }
        case 'dateNights':
          out = await requestPlan(
            {
              template: 'dateNights',
              months: dateMonths,
              vibes: dateVibes,
              budget: dateBudget,
              extraContext,
            },
            allExisting,
          );
          break;
        case 'custom':
          out = await requestPlan(
            {
              template: 'custom',
              description: customDesc,
              extraContext,
            },
            allExisting,
          );
          break;
      }
      setPlan(out);
    } finally {
      setThinking(false);
    }
  };

  const confirmPlan = () => {
    if (!plan) return;
    // Persist generated events into the store so they appear on Today/Calendar.
    const events: CalendarEvent[] = plan.events.map((e) => ({
      id: `plan-${Date.now()}-${e.id}`,
      title: e.title,
      start: e.startISO,
      end: e.endISO,
      category: e.category,
      destination: e.destinationApp
        ? { appName: e.destinationApp, url: e.destinationUrl }
        : undefined,
    }));
    addEvents(events);
    // Persist a goal entry summarising the plan.
    const goal: Goal = {
      id: `plan-goal-${Date.now()}`,
      title: plan.goalTitle,
      cadence: plan.goalCadence,
      category: plan.category,
    };
    addGoal(goal);
    setStep('done');
    setTimeout(() => router.back(), 1400);
  };

  return (
    <SafeAreaView
      edges={['top', 'bottom']}
      style={[styles.root, { backgroundColor: palette.bg.canvas }]}
    >
      <View style={styles.topbar}>
        <Pressable
          onPress={goBack}
          hitSlop={hitSlop}
          accessibilityRole="button"
          accessibilityLabel={step === 'pick' ? 'Close' : 'Back'}
          style={styles.topbarBtn}
        >
          <Feather
            name={step === 'pick' ? 'x' : 'chevron-left'}
            size={22}
            color={palette.text.secondary}
          />
        </Pressable>
        <View style={{ flex: 1 }} />
        {step !== 'pick' ? (
          <Pressable
            onPress={close}
            hitSlop={hitSlop}
            accessibilityRole="button"
            accessibilityLabel="Close"
            style={styles.topbarBtn}
          >
            <Feather name="x" size={22} color={palette.text.secondary} />
          </Pressable>
        ) : null}
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          {step === 'pick' ? (
            <Animated.View
              key="pick"
              entering={FadeIn.duration(240)}
              exiting={FadeOut.duration(140)}
            >
              <PickStep
                onPick={(t) => {
                  setTemplate(t);
                  setStep('shape');
                }}
              />
            </Animated.View>
          ) : null}

          {step === 'shape' && template?.id === 'bible' ? (
            <Animated.View key="shape-bible" entering={FadeIn.duration(240)}>
              <BibleShape
                translation={bibleTranslation}
                setTranslation={setBibleTranslation}
                planType={biblePlanType}
                setPlanType={setBiblePlanType}
                extraContext={extraContext}
                setExtraContext={setExtraContext}
                onSubmit={generate}
              />
            </Animated.View>
          ) : null}

          {step === 'shape' && template?.id === 'friends' ? (
            <Animated.View key="shape-friends" entering={FadeIn.duration(240)}>
              <FriendsShape
                picks={friendPicks}
                setPicks={setFriendPicks}
                cadence={friendCadence}
                setCadence={setFriendCadence}
                extraContext={extraContext}
                setExtraContext={setExtraContext}
                onSubmit={generate}
              />
            </Animated.View>
          ) : null}

          {step === 'shape' && template?.id === 'dateNights' ? (
            <Animated.View key="shape-dn" entering={FadeIn.duration(240)}>
              <DateNightsShape
                months={dateMonths}
                setMonths={setDateMonths}
                vibes={dateVibes}
                setVibes={setDateVibes}
                budget={dateBudget}
                setBudget={setDateBudget}
                extraContext={extraContext}
                setExtraContext={setExtraContext}
                onSubmit={generate}
              />
            </Animated.View>
          ) : null}

          {step === 'shape' && template?.id === 'custom' ? (
            <Animated.View key="shape-custom" entering={FadeIn.duration(240)}>
              <CustomShape
                desc={customDesc}
                setDesc={setCustomDesc}
                extraContext={extraContext}
                setExtraContext={setExtraContext}
                onSubmit={generate}
              />
            </Animated.View>
          ) : null}

          {step === 'preview' ? (
            <Animated.View key="preview" entering={FadeIn.duration(240)}>
              <PreviewStep
                thinking={thinking}
                plan={plan}
                onConfirm={confirmPlan}
                onRetry={() => setStep('shape')}
              />
            </Animated.View>
          ) : null}

          {step === 'done' ? (
            <Animated.View key="done" entering={FadeIn.duration(240)}>
              <DoneStep />
            </Animated.View>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/* ---------- Step 1: Pick a template ---------- */

function PickStep({ onPick }: { onPick: (t: Template) => void }) {
  const { palette, mode } = useTheme();
  return (
    <View>
      <Text variant="display">What are you planning?</Text>
      <Text variant="footnote" color="tertiary" style={styles.subtitle}>
        A multi-event commitment, shaped together.
      </Text>
      <View style={styles.cards}>
        {templates.map((t) => {
          const builtin = categoryById[t.category];
          const color = builtin?.color[mode] ?? palette.text.secondary;
          return (
          <PressableScale
            key={t.id}
            onPress={() => onPick(t)}
            style={[
              styles.templateCard,
              {
                backgroundColor: palette.bg.surface,
                borderColor: palette.hairline,
                borderRadius: radius.lg,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel={t.title}
          >
            <View style={styles.templateLeft}>
              <Text
                variant="headline"
                color={color}
                style={styles.templateGlyph}
              >
                {t.glyph}
              </Text>
            </View>
            <View style={styles.templateBody}>
              <Text variant="title">{t.title}</Text>
              <Text variant="footnote" color="secondary" style={styles.templateBlurb}>
                {t.blurb}
              </Text>
            </View>
            <Feather
              name="chevron-right"
              size={20}
              color={palette.text.tertiary}
            />
          </PressableScale>
          );
        })}
      </View>
    </View>
  );
}

/* ---------- Step 2: Shape per template ---------- */

function BibleShape({
  translation,
  setTranslation,
  planType,
  setPlanType,
  extraContext,
  setExtraContext,
  onSubmit,
}: {
  translation: BibleTranslation;
  setTranslation: (t: BibleTranslation) => void;
  planType: BiblePlanType;
  setPlanType: (p: BiblePlanType) => void;
  extraContext: string;
  setExtraContext: (v: string) => void;
  onSubmit: () => void;
}) {
  return (
    <View>
      <Text variant="display">Read the Bible this year</Text>

      <SectionLabel>Translation</SectionLabel>
      <View style={styles.chipRow}>
        {bibleTranslations.map((t) => (
          <Chip
            key={t}
            label={t}
            selected={translation === t}
            onPress={() => setTranslation(t)}
          />
        ))}
      </View>

      <SectionLabel>Plan type</SectionLabel>
      <View style={styles.optionList}>
        {biblePlanTypes.map((p) => (
          <RadioOption
            key={p.id}
            label={p.label}
            sub={p.sub}
            selected={planType === p.id}
            onPress={() => setPlanType(p.id)}
          />
        ))}
      </View>

      <ContextField value={extraContext} onChange={setExtraContext} />

      <PrimaryAction label="Plan it" onPress={onSubmit} />
    </View>
  );
}

function contactPlaceholder(channel: FriendChannel): string {
  switch (channel) {
    case 'imessage':
    case 'whatsapp':
    case 'call':
      return '+1 305 555 1234';
    case 'messenger':
      return 'jane.smith';
  }
}

function contactKeyboardType(
  channel: FriendChannel,
): 'phone-pad' | 'default' {
  return channel === 'messenger' ? 'default' : 'phone-pad';
}

function FriendsShape({
  picks,
  setPicks,
  cadence,
  setCadence,
  extraContext,
  setExtraContext,
  onSubmit,
}: {
  picks: FriendPick[];
  setPicks: (p: FriendPick[]) => void;
  cadence: FriendCadence;
  setCadence: (c: FriendCadence) => void;
  extraContext: string;
  setExtraContext: (v: string) => void;
  onSubmit: () => void;
}) {
  const { palette } = useTheme();

  const updatePick = (idx: number, patch: Partial<FriendPick>) => {
    setPicks(picks.map((p, i) => (i === idx ? { ...p, ...patch } : p)));
  };
  const removePick = (idx: number) => {
    setPicks(picks.filter((_, i) => i !== idx));
  };
  const addEmptyPick = () => {
    setPicks([...picks, { name: '', channel: 'imessage', contact: '' }]);
  };

  const canPlan =
    picks.length > 0 && picks.every((p) => p.name.trim().length > 0);

  return (
    <View>
      <Text variant="display">Stay close with your people</Text>

      <SectionLabel>Who?</SectionLabel>
      <Text variant="footnote" color="tertiary" style={styles.helper}>
        Add the people you want to keep close. Each event opens the right
        app on tap — leave contact blank if you'd rather fill it later.
      </Text>

      <View style={styles.friendList}>
        {picks.map((pick, idx) => (
          <View
            key={idx}
            style={[
              styles.friendCard,
              {
                backgroundColor: palette.bg.surface,
                borderColor: palette.hairline,
                borderRadius: radius.lg,
              },
            ]}
          >
            <View style={styles.friendCardHeader}>
              <TextInput
                value={pick.name}
                onChangeText={(name) => updatePick(idx, { name })}
                placeholder="Name"
                placeholderTextColor={palette.text.tertiary}
                style={[styles.friendNameInput, { color: palette.text.primary }]}
                autoCapitalize="words"
                returnKeyType="done"
              />
              <Pressable
                onPress={() => removePick(idx)}
                hitSlop={hitSlop}
                accessibilityRole="button"
                accessibilityLabel={`Remove ${pick.name || 'friend'}`}
              >
                <Feather name="x" size={18} color={palette.text.tertiary} />
              </Pressable>
            </View>

            <View style={styles.friendCardChannels}>
              {friendChannels.map((c) => (
                <SmallChip
                  key={c.id}
                  label={c.label}
                  selected={pick.channel === c.id}
                  onPress={() => updatePick(idx, { channel: c.id })}
                />
              ))}
            </View>

            <TextInput
              value={pick.contact}
              onChangeText={(contact) => updatePick(idx, { contact })}
              placeholder={contactPlaceholder(pick.channel)}
              placeholderTextColor={palette.text.tertiary}
              keyboardType={contactKeyboardType(pick.channel)}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="done"
              style={[
                styles.friendContactInput,
                {
                  color: palette.text.primary,
                  borderColor: palette.hairline,
                  borderRadius: radius.md,
                },
              ]}
            />
          </View>
        ))}
      </View>

      <PressableScale
        onPress={addEmptyPick}
        haptic={false}
        style={[
          styles.addFriendBtn,
          { borderColor: palette.hairline, borderRadius: radius.md },
        ]}
        accessibilityRole="button"
        accessibilityLabel="Add a friend"
      >
        <Feather name="plus" size={16} color={palette.text.secondary} />
        <Text variant="bodyMedium" color="secondary">
          {picks.length === 0 ? 'Add a friend' : 'Add another'}
        </Text>
      </PressableScale>

      <SectionLabel>How often, with each?</SectionLabel>
      <View style={styles.optionList}>
        {friendCadences.map((c) => (
          <RadioOption
            key={c.id}
            label={c.label}
            sub={c.sub}
            selected={cadence === c.id}
            onPress={() => setCadence(c.id)}
          />
        ))}
      </View>

      <ContextField value={extraContext} onChange={setExtraContext} />

      <PrimaryAction label="Plan it" onPress={onSubmit} disabled={!canPlan} />
    </View>
  );
}

function DateNightsShape({
  months,
  setMonths,
  vibes,
  setVibes,
  budget,
  setBudget,
  extraContext,
  setExtraContext,
  onSubmit,
}: {
  months: number;
  setMonths: (n: number) => void;
  vibes: DateNightVibe[];
  setVibes: (v: DateNightVibe[]) => void;
  budget: DateNightBudget;
  setBudget: (b: DateNightBudget) => void;
  extraContext: string;
  setExtraContext: (v: string) => void;
  onSubmit: () => void;
}) {
  const toggleVibe = (v: DateNightVibe) => {
    if (vibes.includes(v)) setVibes(vibes.filter((x) => x !== v));
    else setVibes([...vibes, v]);
  };
  return (
    <View>
      <Text variant="display">Date nights with your wife</Text>

      <SectionLabel>How many months ahead?</SectionLabel>
      <View style={styles.chipRow}>
        {[3, 6, 12].map((n) => (
          <Chip
            key={n}
            label={`${n} months`}
            selected={months === n}
            onPress={() => setMonths(n)}
          />
        ))}
      </View>

      <SectionLabel>Vibe</SectionLabel>
      <Text variant="footnote" color="tertiary" style={styles.helper}>
        Pick any. Or skip and we'll mix it up.
      </Text>
      <View style={styles.chipRow}>
        {dateNightVibes.map((v) => (
          <Chip
            key={v.id}
            label={v.label}
            selected={vibes.includes(v.id)}
            onPress={() => toggleVibe(v.id)}
          />
        ))}
      </View>

      <SectionLabel>Budget</SectionLabel>
      <View style={styles.optionList}>
        {dateNightBudgets.map((b) => (
          <RadioOption
            key={b.id}
            label={b.label}
            sub={b.sub}
            selected={budget === b.id}
            onPress={() => setBudget(b.id)}
          />
        ))}
      </View>

      <ContextField value={extraContext} onChange={setExtraContext} />

      <PrimaryAction label="Plan it" onPress={onSubmit} />
    </View>
  );
}

function CustomShape({
  desc,
  setDesc,
  extraContext,
  setExtraContext,
  onSubmit,
}: {
  desc: string;
  setDesc: (d: string) => void;
  extraContext: string;
  setExtraContext: (v: string) => void;
  onSubmit: () => void;
}) {
  const { palette } = useTheme();
  return (
    <View>
      <Text variant="display">Tell me your goal</Text>
      <Text variant="footnote" color="tertiary" style={styles.subtitle}>
        Plain language. I'll find the shape.
      </Text>
      <View
        style={[
          styles.inputWrap,
          {
            backgroundColor: palette.bg.surface,
            borderColor: palette.hairline,
            borderRadius: radius.lg,
          },
        ]}
      >
        <TextInput
          value={desc}
          onChangeText={setDesc}
          autoFocus
          multiline
          placeholder="e.g. learn enough Italian to order dinner in Florence"
          placeholderTextColor={palette.text.tertiary}
          style={[styles.input, { color: palette.text.primary }]}
          returnKeyType="done"
          blurOnSubmit
        />
      </View>
      <ContextField value={extraContext} onChange={setExtraContext} />
      <PrimaryAction label="Plan it" onPress={onSubmit} disabled={desc.trim().length === 0} />
    </View>
  );
}

/* ---------- Step 3: Preview ---------- */

const PLAN_THINKING_MESSAGES = [
  'Looking at your week…',
  'Finding the right shape…',
  'Working through the details…',
] as const;

function PreviewStep({
  thinking,
  plan,
  onConfirm,
  onRetry,
}: {
  thinking: boolean;
  plan: Plan | null;
  onConfirm: () => void;
  onRetry: () => void;
}) {
  const { palette } = useTheme();
  const [messageIdx, setMessageIdx] = useState(0);

  useEffect(() => {
    if (!thinking) return;
    setMessageIdx(0);
    const interval = setInterval(() => {
      setMessageIdx((idx) => Math.min(idx + 1, PLAN_THINKING_MESSAGES.length - 1));
    }, 2400);
    return () => clearInterval(interval);
  }, [thinking]);

  if (thinking || !plan) {
    return (
      <View style={styles.thinking}>
        <Text variant="display">Thinking it through</Text>
        <Animated.View
          key={messageIdx}
          entering={FadeIn.duration(360)}
          style={styles.subtitle}
        >
          <Text variant="footnote" color="tertiary">
            {PLAN_THINKING_MESSAGES[messageIdx]}
          </Text>
        </Animated.View>
      </View>
    );
  }

  const more = Math.max(0, plan.totalCount - plan.events.length);

  return (
    <View>
      <Text variant="display">A quiet suggestion</Text>
      <Text variant="body" color="secondary" style={styles.reasoning}>
        {plan.reasoning}
      </Text>

      <View
        style={[
          styles.planList,
          {
            backgroundColor: palette.bg.surface,
            borderColor: palette.hairline,
            borderRadius: radius.lg,
          },
        ]}
      >
        {plan.events.map((e, idx) => (
          <View
            key={e.id}
            style={[
              styles.planRow,
              idx > 0 && {
                borderTopWidth: StyleSheet.hairlineWidth,
                borderTopColor: palette.hairline,
              },
            ]}
          >
            <View style={styles.planRowMeta}>
              <Text variant="numeric" color="secondary">
                {formatPlanDate(e.startISO)}
              </Text>
              <Text variant="footnote" color="tertiary">
                {formatPlanTime(e.startISO)}
              </Text>
            </View>
            <View style={styles.planRowBody}>
              <Text variant="title">{e.title}</Text>
              <View style={styles.planRowCat}>
                <CategoryDot category={e.category} size={9} />
                {e.destinationApp ? (
                  <Text variant="footnote" color="tertiary">
                    Opens in {e.destinationApp}
                  </Text>
                ) : null}
              </View>
            </View>
          </View>
        ))}
        {more > 0 ? (
          <View
            style={[
              styles.moreRow,
              {
                borderTopWidth: StyleSheet.hairlineWidth,
                borderTopColor: palette.hairline,
              },
            ]}
          >
            <Text variant="footnote" color="tertiary">
              + {more} more
            </Text>
          </View>
        ) : null}
      </View>

      <View style={styles.previewActions}>
        <PressableScale
          style={[
            styles.primaryBtn,
            { backgroundColor: palette.brand.primary },
          ]}
          onPress={onConfirm}
        >
          <Text variant="bodyMedium" color="onBrand">
            Put it down
          </Text>
        </PressableScale>
        <PressableScale
          style={[styles.ghostBtn, { borderColor: palette.hairline }]}
          onPress={onRetry}
          haptic={false}
        >
          <Text variant="bodyMedium" color="secondary">
            Try a different shape
          </Text>
        </PressableScale>
      </View>
    </View>
  );
}

/* ---------- Step 4: Done ---------- */

function DoneStep() {
  const { palette } = useTheme();
  return (
    <View style={styles.done}>
      <View
        style={[
          styles.doneCheck,
          { borderColor: palette.brand.primary },
        ]}
      >
        <Feather name="check" size={28} color={palette.brand.primary} />
      </View>
      <Text variant="display" style={styles.doneTitle}>
        Done.
      </Text>
      <Text variant="body" color="secondary" style={styles.doneSub}>
        Added to your Goals. The next moment lives on Today.
      </Text>
    </View>
  );
}

/* ---------- Atom helpers (planner-local) ---------- */

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

function SmallChip({
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
        styles.smallChip,
        {
          borderColor: selected ? palette.brand.primary : palette.hairline,
          backgroundColor: selected ? palette.brand.primary : 'transparent',
        },
      ]}
      accessibilityRole="button"
      accessibilityState={{ selected }}
    >
      <Text
        variant="footnote"
        style={{
          color: selected ? palette.text.onBrand : palette.text.secondary,
          fontSize: 12,
        }}
      >
        {label}
      </Text>
    </PressableScale>
  );
}

function RadioOption({
  label,
  sub,
  selected,
  onPress,
}: {
  label: string;
  sub: string;
  selected: boolean;
  onPress: () => void;
}) {
  const { palette } = useTheme();
  return (
    <PressableScale
      scaleTo={0.99}
      onPress={onPress}
      style={[
        styles.radioOption,
        {
          backgroundColor: selected ? palette.bg.surface : 'transparent',
          borderColor: selected ? palette.brand.primary : palette.hairline,
          borderRadius: radius.md,
        },
      ]}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
    >
      <View
        style={[
          styles.radioRing,
          { borderColor: selected ? palette.brand.primary : palette.text.tertiary },
        ]}
      >
        {selected ? (
          <View
            style={[styles.radioFill, { backgroundColor: palette.brand.primary }]}
          />
        ) : null}
      </View>
      <View style={{ flex: 1 }}>
        <Text variant="bodyMedium">{label}</Text>
        <Text variant="footnote" color="tertiary" style={styles.radioSub}>
          {sub}
        </Text>
      </View>
    </PressableScale>
  );
}

function ContextField({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const { palette } = useTheme();
  return (
    <>
      <SectionLabel>What else should I know?</SectionLabel>
      <View
        style={[
          styles.contextWrap,
          {
            backgroundColor: palette.bg.surface,
            borderColor: palette.hairline,
            borderRadius: radius.lg,
          },
        ]}
      >
        <TextInput
          value={value}
          onChangeText={onChange}
          multiline
          placeholder="Optional. A timezone, a season to avoid, a per-person hint."
          placeholderTextColor={palette.text.tertiary}
          textAlignVertical="top"
          style={[styles.contextInput, { color: palette.text.primary }]}
          returnKeyType="default"
          blurOnSubmit={false}
        />
      </View>
    </>
  );
}

function PrimaryAction({
  label,
  onPress,
  disabled,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  const { palette } = useTheme();
  return (
    <PressableScale
      onPress={disabled ? () => {} : onPress}
      haptic={!disabled}
      style={[
        styles.primaryBtn,
        styles.primaryBtnFullWidth,
        {
          backgroundColor: disabled
            ? palette.bg.surface
            : palette.brand.primary,
          opacity: disabled ? 0.6 : 1,
        },
      ]}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
    >
      <Text
        variant="bodyMedium"
        color={disabled ? 'tertiary' : 'onBrand'}
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
  helper: {
    marginTop: 4,
    marginBottom: space.sm,
  },
  cards: {
    gap: space.md,
    marginTop: space.lg,
  },
  templateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: space.lg,
    paddingHorizontal: space.lg,
    borderWidth: StyleSheet.hairlineWidth,
    gap: space.md,
  },
  templateLeft: {
    width: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  templateGlyph: {
    fontSize: 22,
    lineHeight: 24,
  },
  templateBody: {
    flex: 1,
    gap: 2,
  },
  templateBlurb: {
    marginTop: 2,
  },
  sectionLabel: {
    marginTop: space.xl,
    marginBottom: space.sm,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.sm,
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
  smallChip: {
    paddingHorizontal: space.sm + 2,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    minHeight: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  friendList: {
    gap: space.sm,
    marginTop: space.sm,
  },
  friendCard: {
    borderWidth: StyleSheet.hairlineWidth,
    padding: space.md,
    gap: space.sm,
  },
  friendCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
  },
  friendNameInput: {
    flex: 1,
    fontFamily: fontFamily.bodyRegular,
    fontSize: 17,
    lineHeight: 22,
    paddingVertical: 6,
  },
  friendCardChannels: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  friendContactInput: {
    fontFamily: fontFamily.bodyRegular,
    fontSize: 15,
    lineHeight: 20,
    paddingVertical: 8,
    paddingHorizontal: space.sm + 2,
    borderWidth: StyleSheet.hairlineWidth,
  },
  addFriendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: space.md,
    gap: space.sm,
    marginTop: space.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderStyle: 'dashed',
  },
  optionList: {
    gap: space.sm,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingVertical: space.md,
    paddingHorizontal: space.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  radioRing: {
    width: 18,
    height: 18,
    borderRadius: 999,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioFill: {
    width: 9,
    height: 9,
    borderRadius: 999,
  },
  radioSub: {
    marginTop: 2,
  },
  inputWrap: {
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
    minHeight: 100,
    marginTop: space.sm,
  },
  input: {
    fontFamily: fontFamily.bodyRegular,
    fontSize: 17,
    lineHeight: 24,
    minHeight: 64,
  },
  contextWrap: {
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
    minHeight: 80,
    marginTop: space.sm,
  },
  contextInput: {
    fontFamily: fontFamily.bodyRegular,
    fontSize: 15,
    lineHeight: 22,
    minHeight: 48,
  },
  primaryBtn: {
    paddingVertical: 14,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  primaryBtnFullWidth: {
    marginTop: space.xl,
  },
  ghostBtn: {
    paddingVertical: 14,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    borderWidth: StyleSheet.hairlineWidth,
  },
  thinking: {
    paddingTop: space['2xl'],
  },
  reasoning: {
    marginTop: space.md,
    marginBottom: space.xl,
    fontStyle: 'italic',
    lineHeight: 24,
  },
  planList: {
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  planRow: {
    flexDirection: 'row',
    paddingVertical: space.md,
    paddingHorizontal: space.lg,
    gap: space.lg,
  },
  planRowMeta: {
    width: 80,
    paddingTop: 1,
  },
  planRowBody: {
    flex: 1,
    gap: 4,
  },
  planRowCat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  moreRow: {
    paddingVertical: space.md,
    paddingHorizontal: space.lg,
    alignItems: 'center',
  },
  previewActions: {
    gap: space.sm,
    marginTop: space.xl,
  },
  done: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: '20%',
    gap: space.md,
  },
  doneCheck: {
    width: 64,
    height: 64,
    borderRadius: 999,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space.md,
  },
  doneTitle: {
    textAlign: 'center',
  },
  doneSub: {
    textAlign: 'center',
    paddingHorizontal: space.xl,
  },
});
