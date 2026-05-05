import { View } from 'react-native';
import type { CategoryId } from '@/theme';
import { useTheme } from '@/theme';

type Props = {
  category: CategoryId;
  size?: number;
};

/**
 * Filled circle in the category accent colour. The dot pairs with a text
 * label everywhere it appears so colour is never the sole signal (per
 * DESIGN.md dual-encoding doctrine).
 */
export function CategoryDot({ category, size = 8 }: Props) {
  const { palette } = useTheme();
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no"
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: palette.category[category],
      }}
    />
  );
}
