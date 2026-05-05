import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { GoalCard } from '@/components/GoalCard';
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
                    onPress={() => {
                      // v0: tapping a goal lands you on the next instance via
                      // event/[id] when wired. For now, just acknowledge.
                      router.push('/capture');
                    }}
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
