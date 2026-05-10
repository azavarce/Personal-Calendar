import { Text as RNText } from 'react-native';
import { categoryById, type CategoryId } from '@/lib/categories';
import { useCategoryColor, useResolvedCategory } from '@/lib/store';

type Props = {
  category: CategoryId;
  /** Glyph fontSize. Default 11pt — readable inline; bump for hero spots. */
  size?: number;
};

/**
 * Renders the category's dual-encoding glyph (◆ ● ▲ ■ ▼ ✚ + customs) in
 * the category accent colour. Resolves both glyph and colour through the
 * store so user renames / custom categories propagate without per-component
 * changes.
 */
export function CategoryDot({ category, size = 11 }: Props) {
  const resolved = useResolvedCategory(category);
  const color = useCategoryColor(category);
  const glyph = resolved?.glyph ?? categoryById[category]?.glyph ?? '●';
  return (
    <RNText
      accessibilityElementsHidden
      importantForAccessibility="no"
      style={{
        color,
        fontSize: size,
        lineHeight: size + 1,
        // Optical alignment — glyphs sit a hair high; nudge down.
        marginTop: 1,
      }}
    >
      {glyph}
    </RNText>
  );
}
