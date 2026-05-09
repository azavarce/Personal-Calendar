import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { GoalCard } from '@/components/GoalCard';
import { PressableScale } from '@/components/PressableScale';
import { ScreenContainer } from '@/components/ScreenContainer';
import { Text } from '@/components/Text';
import { categories } from '@/lib/categories';
import { type Goal, mockGoals } from '@/lib/mock-data';
import { radius, space, useTheme } from '@/theme';

export default function Goals() {
  const router = useRouter();
  const { palette } = useTheme();

  const grouped = useMemo(() => {
    return categories.map((c) => ({
      category: c,
      goals: mockGoals.filter((g) => g.category === c.id),
    }));
  }, []);

  return (
    <ScreenContainer>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text variant="display">Goals</Text>
          <Text variant="footnote" color="tertiary" style={styles.subtitle}>
            Six categories. The week made yours.
          </Text>
        </View>

        <PressableScale
          onPress={() => router.push('/planner')}
          style={[
            styles.planCta,
            {
              backgroundColor: palette.bg.surface,
              borderColor: palette.brand.primary,
              borderRadius: radius.lg,
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Plan something"
        >
          <View
            style={[
              styles.planCtaIcon,
              { backgroundColor: palette.brand.primary },
            ]}
          >
            <Feather name="plus" size={18} color={palette.text.onBrand} />
          </View>
          <View style={styles.planCtaBody}>
            <Text variant="title">Plan something</Text>
            <Text variant="footnote" color="secondary" style={styles.planCtaSub}>
              A multi-event commitment. Bible in a year, monthly date nights, friends to keep close.
            </Text>
          </View>
          <Feather
            name="chevron-right"
            size={20}
            color={palette.text.tertiary}
          />
        </PressableScale>

        {grouped.map(({ category, goals }) => (
          <View key={category.id} style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text
                variant="headline"
                color={palette.category[category.id]}
                style={styles.sectionGlyph}
              >
                {category.glyph}
              </Text>
              <Text variant="headline">{category.label}</Text>
            </View>
            {goals.length === 0 ? (
              <View
                style={[
                  styles.empty,
                  {
                    borderColor: palette.hairline,
                    borderRadius: radius.lg,
                  },
                ]}
              >
                <Text variant="body" color="tertiary">
                  No commitments here yet.
                </Text>
              </View>
            ) : (
              <View style={styles.cards}>
                {goals.map((g: Goal) => (
                  <GoalCard
                    key={g.id}
                    goal={g}
                    onPress={() => router.push('/capture')}
                  />
                ))}
              </View>
            )}
          </View>
        ))}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingTop: space.lg,
    paddingBottom: 160,
  },
  header: {
    marginBottom: space.xl,
  },
  subtitle: {
    marginTop: 4,
  },
  planCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingVertical: space.lg,
    paddingHorizontal: space.lg,
    borderWidth: 1,
    marginBottom: space['2xl'],
  },
  planCtaIcon: {
    width: 36,
    height: 36,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  planCtaBody: {
    flex: 1,
    gap: 2,
  },
  planCtaSub: {
    marginTop: 2,
  },
  section: {
    marginBottom: space.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: space.sm,
    marginBottom: space.md,
  },
  sectionGlyph: {
    fontSize: 14,
  },
  cards: {
    gap: space.sm,
  },
  empty: {
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: space.lg,
    paddingHorizontal: space.lg,
    borderStyle: 'dashed',
  },
});
