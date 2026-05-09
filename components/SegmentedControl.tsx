import { StyleSheet, View } from 'react-native';
import { PressableScale } from './PressableScale';
import { Text } from './Text';
import { fontFamily, radius, space, useTheme } from '@/theme';

type Props<T extends string> = {
  options: ReadonlyArray<{ value: T; label: string }>;
  value: T;
  onChange: (next: T) => void;
};

/**
 * Two-or-three-option pill toggle. Active segment gets a tonal-step
 * background; no shadow (Flat-by-Default rule). 1pt hairline border around
 * the whole control. Sits comfortably as a top-right control on a screen.
 */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: Props<T>) {
  const { palette } = useTheme();
  return (
    <View
      style={[
        styles.row,
        {
          backgroundColor: palette.bg.canvas,
          borderColor: palette.hairline,
          borderRadius: radius.pill,
        },
      ]}
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <PressableScale
            key={opt.value}
            scaleTo={0.98}
            haptic
            onPress={() => onChange(opt.value)}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            accessibilityLabel={opt.label}
            style={[
              styles.cell,
              active && {
                backgroundColor: palette.bg.surface,
              },
            ]}
          >
            <Text
              style={{
                fontFamily: fontFamily.bodyMedium,
                fontSize: 12,
                color: active ? palette.text.primary : palette.text.tertiary,
              }}
            >
              {opt.label}
            </Text>
          </PressableScale>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    borderWidth: StyleSheet.hairlineWidth,
    padding: 2,
    alignSelf: 'flex-start',
  },
  cell: {
    paddingHorizontal: space.md,
    paddingVertical: 6,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 64,
  },
});
