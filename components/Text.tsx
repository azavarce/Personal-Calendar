import { Text as RNText, type TextProps as RNTextProps } from 'react-native';
import { text as textStyles, useTheme } from '@/theme';

type Variant = keyof typeof textStyles;

export type TextProps = RNTextProps & {
  variant?: Variant;
  color?: 'primary' | 'secondary' | 'tertiary' | 'onBrand' | 'brand' | string;
};

/**
 * Typed text primitive. Resolves variant + palette colour. Defaults to body
 * variant + primary text colour.
 *
 * Pass a custom hex via `color` when you need a category accent — the four
 * named tokens (primary / secondary / tertiary / onBrand / brand) are the
 * happy path.
 */
export function Text({
  variant = 'body',
  color = 'primary',
  style,
  ...rest
}: TextProps) {
  const { palette } = useTheme();

  const resolvedColor =
    color === 'primary'
      ? palette.text.primary
      : color === 'secondary'
        ? palette.text.secondary
        : color === 'tertiary'
          ? palette.text.tertiary
          : color === 'onBrand'
            ? palette.text.onBrand
            : color === 'brand'
              ? palette.brand.primary
              : color;

  return (
    <RNText
      style={[textStyles[variant], { color: resolvedColor }, style]}
      {...rest}
    />
  );
}
