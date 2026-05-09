import { StyleSheet, View, type ViewStyle } from 'react-native';
import { useTheme } from '@/theme';

type Props = { style?: ViewStyle };

/** 1pt warm-tinted rule. Lives between list items, never around them. */
export function HairlineDivider({ style }: Props) {
  const { palette } = useTheme();
  return (
    <View
      style={[
        { height: StyleSheet.hairlineWidth, backgroundColor: palette.hairline },
        style,
      ]}
    />
  );
}
