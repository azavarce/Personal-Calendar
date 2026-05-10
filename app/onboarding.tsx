import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PressableScale } from '@/components/PressableScale';
import { Text } from '@/components/Text';
import { useResolvedCategories, useStore } from '@/lib/store';
import { radius, space, useTheme } from '@/theme';

type Step = 'welcome' | 'lanes' | 'rhythm';

export default function OnboardingScreen() {
  const router = useRouter();
  const { palette } = useTheme();
  const { setOnboarded } = useStore();
  const categories = useResolvedCategories();
  const [step, setStep] = useState<Step>('welcome');

  const finish = () => {
    setOnboarded(true);
    router.replace('/');
  };

  return (
    <SafeAreaView
      edges={['top', 'bottom']}
      style={[styles.root, { backgroundColor: palette.bg.canvas }]}
    >
      {step === 'welcome' ? (
        <Animated.View
          key="welcome"
          entering={FadeIn.duration(420)}
          exiting={FadeOut.duration(180)}
          style={styles.body}
        >
          <View style={{ flex: 1 }} />
          <Text variant="displayLarge" style={styles.center}>
            The Personal{'\n'}Almanac
          </Text>
          <Text variant="body" color="secondary" style={[styles.lede, styles.center]}>
            A quiet calendar for the practices that make a life.
          </Text>
          <View style={{ flex: 1 }} />
          <PressableScale
            style={[
              styles.primaryBtn,
              { backgroundColor: palette.brand.primary },
            ]}
            onPress={() => setStep('lanes')}
          >
            <Text variant="bodyMedium" color="onBrand">
              Begin
            </Text>
          </PressableScale>
        </Animated.View>
      ) : null}

      {step === 'lanes' ? (
        <Animated.View
          key="lanes"
          entering={FadeIn.duration(420)}
          exiting={FadeOut.duration(180)}
          style={styles.body}
        >
          <Text variant="display">Six lanes.</Text>
          <Text variant="body" color="secondary" style={styles.lede}>
            The almanac thinks in life domains, not project deadlines. These are the lanes that ship with you. You can rename them any time in Settings.
          </Text>

          <View style={styles.laneList}>
            {categories.map((c) => (
              <View
                key={c.id}
                style={[
                  styles.laneRow,
                  {
                    backgroundColor: palette.bg.surface,
                    borderColor: palette.hairline,
                    borderRadius: radius.md,
                  },
                ]}
              >
                <Text
                  variant="headline"
                  color={palette.category[c.id]}
                  style={styles.laneGlyph}
                >
                  {c.glyph}
                </Text>
                <Text variant="title">{c.label}</Text>
              </View>
            ))}
          </View>

          <View style={{ flex: 1 }} />
          <PressableScale
            style={[
              styles.primaryBtn,
              { backgroundColor: palette.brand.primary },
            ]}
            onPress={() => setStep('rhythm')}
          >
            <Text variant="bodyMedium" color="onBrand">
              Continue
            </Text>
          </PressableScale>
        </Animated.View>
      ) : null}

      {step === 'rhythm' ? (
        <Animated.View
          key="rhythm"
          entering={FadeIn.duration(420)}
          style={styles.body}
        >
          <Text variant="display">Two ways in.</Text>
          <Text variant="body" color="secondary" style={styles.lede}>
            Capture a single moment. Plan a long arc. Both meet you on Today.
          </Text>

          <View style={styles.cardList}>
            <View
              style={[
                styles.introCard,
                {
                  backgroundColor: palette.bg.surface,
                  borderColor: palette.hairline,
                  borderRadius: radius.lg,
                },
              ]}
            >
              <View
                style={[
                  styles.introBadge,
                  { backgroundColor: palette.brand.primary },
                ]}
              >
                <Text variant="label" color="onBrand">
                  +
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text variant="title">Quick Capture</Text>
                <Text
                  variant="footnote"
                  color="secondary"
                  style={styles.introSub}
                >
                  Tap the warm + button anywhere. Speak it plainly: "find me time to fix the faucet." A slot lands on your calendar.
                </Text>
              </View>
            </View>

            <View
              style={[
                styles.introCard,
                {
                  backgroundColor: palette.bg.surface,
                  borderColor: palette.hairline,
                  borderRadius: radius.lg,
                },
              ]}
            >
              <Text
                variant="headline"
                color={palette.category.faith}
                style={styles.introBadgeGlyph}
              >
                ◆
              </Text>
              <View style={{ flex: 1 }}>
                <Text variant="title">The Planner</Text>
                <Text
                  variant="footnote"
                  color="secondary"
                  style={styles.introSub}
                >
                  Bigger arcs — a year of Bible reading, a rhythm with friends, six months of date nights. From Goals → Plan something.
                </Text>
              </View>
            </View>
          </View>

          <View style={{ flex: 1 }} />
          <PressableScale
            style={[
              styles.primaryBtn,
              { backgroundColor: palette.brand.primary },
            ]}
            onPress={finish}
          >
            <Text variant="bodyMedium" color="onBrand">
              Open Today
            </Text>
          </PressableScale>
        </Animated.View>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  body: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: space['2xl'],
    paddingBottom: space.xl,
  },
  center: {
    textAlign: 'center',
  },
  lede: {
    marginTop: space.md,
    lineHeight: 24,
    textAlign: 'left',
  },
  laneList: {
    gap: space.sm,
    marginTop: space.xl,
  },
  laneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingVertical: space.md,
    paddingHorizontal: space.lg,
    borderWidth: StyleSheet.hairlineWidth,
    minHeight: 56,
  },
  laneGlyph: {
    fontSize: 22,
    width: 28,
    textAlign: 'center',
  },
  cardList: {
    gap: space.md,
    marginTop: space.xl,
  },
  introCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: space.md,
    paddingVertical: space.lg,
    paddingHorizontal: space.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
  introBadge: {
    width: 36,
    height: 36,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  introBadgeGlyph: {
    fontSize: 28,
    width: 36,
    textAlign: 'center',
  },
  introSub: {
    marginTop: 4,
    lineHeight: 20,
  },
  primaryBtn: {
    paddingVertical: 16,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
});
