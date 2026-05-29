import { StyleSheet, View } from 'react-native';
import { categoryById } from '@/lib/categories';
import type { Goal } from '@/lib/mock-data';
import { useResolvedCategory } from '@/lib/store';
import { radius, space, useTheme } from '@/theme';
import { CategoryDot } from './CategoryDot';
import { PressableScale } from './PressableScale';
import { Text } from './Text';

type Props = {
  goal: Goal;
  onPress?: () => void;
};

/**
 * Goal row. Per DESIGN.md:
 *   - Rounded 16pt corners.
 *   - 1pt hairline border (no shadow — flat by default).
 *   - Generous internal padding.
 *   - Small category dot beside the cadence line.
 */
export function GoalCard({ goal, onPress }: Props) {
  const { palette } = useTheme();
  const category = useResolvedCategory(goal.category) ?? categoryById[goal.category];

  const containerStyle = [
    styles.container,
    {
      backgroundColor: palette.bg.surface,
      borderColor: palette.hairline,
      borderRadius: radius.lg,
    },
  ];

  const content = (
    <View style={styles.body}>
      <Text variant="title" numberOfLines={2}>
        {goal.title}
      </Text>
      <View style={styles.metaRow}>
        <CategoryDot category={goal.category} size={6} />
        <Text variant="footnote" color="secondary">
          {category.label}
        </Text>
        <Text variant="footnote" color="tertiary">
          {' · '}
          {goal.cadence}
        </Text>
      </View>
      {goal.destination ? (
        <Text variant="label" color="tertiary" style={styles.dest}>
          Routes to {goal.destination.appName}
        </Text>
      ) : null}
    </View>
  );

  // No onPress → static informational card. Avoids the misleading
  // press-down animation when there's nothing to tap into.
  if (!onPress) {
    return <View style={containerStyle}>{content}</View>;
  }

  return (
    <PressableScale
      style={containerStyle}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${goal.title}, ${goal.cadence}, ${category.label}`}
    >
      {content}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: StyleSheet.hairlineWidth,
  },
  body: {
    paddingVertical: space.lg,
    paddingHorizontal: space.lg,
    gap: 6,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dest: {
    marginTop: 2,
  },
});
