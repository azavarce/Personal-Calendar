import { Text as RNText } from 'react-native';
import type { CategoryId } from '@/theme';
import { useTheme } from '@/theme';
import { categoryById } from '@/lib/categories';

type Props = {
  category: CategoryId;
  /** Glyph fontSize. Default 11pt — readable inline; bump for hero spots. */
  size?: number;
};

/**
 * Renders the category's dual-encoding glyph (◆ ● ▲ ■ ▼ ✚) in the category
 * accent colour. Replaces a filled circle so categories are distinguishable
 * by shape *and* colour — a built-in win for color-blind readers (per
 * DESIGN.md doctrine on dual-encoding).
 */
export function CategoryDot({ category, size = 11 }: Props) {
  const { palette } = useTheme();
  const glyph = categoryById[category].glyph;
  return (
    <RNText
      accessibilityElementsHidden
      importantForAccessibility="no"
      style={{
        color: palette.category[category],
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
