import * as Haptics from 'expo-haptics';
import { useCallback } from 'react';
import {
  Pressable,
  type GestureResponderEvent,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// ease-out-quart per impeccable motion-design.md (no bounce, exponential).
const easeOutQuart = Easing.bezier(0.165, 0.84, 0.44, 1);

type Props = Omit<PressableProps, 'style'> & {
  style?: StyleProp<ViewStyle>;
  scaleTo?: number;
  haptic?: boolean;
};

/**
 * The base interactive surface for the app. Every Pressable goes through this
 * so we never ship a tap with no visual response (DESIGN.md doctrine).
 *
 * - Scales to 0.97 on press-in over 60ms, returns over 120ms.
 * - Light haptic on press-in (selectionAsync).
 * - 44pt minimum touch target enforced via minHeight/minWidth in caller.
 */
export function PressableScale({
  scaleTo = 0.97,
  haptic = true,
  onPressIn,
  onPressOut,
  style,
  children,
  ...rest
}: Props) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = useCallback(
    (e: GestureResponderEvent) => {
      scale.value = withTiming(scaleTo, { duration: 60, easing: easeOutQuart });
      if (haptic) {
        Haptics.selectionAsync().catch(() => {
          // Haptics may be unavailable on some devices; never block the tap.
        });
      }
      onPressIn?.(e);
    },
    [scale, scaleTo, haptic, onPressIn],
  );

  const handlePressOut = useCallback(
    (e: GestureResponderEvent) => {
      scale.value = withTiming(1, { duration: 120, easing: easeOutQuart });
      onPressOut?.(e);
    },
    [scale, onPressOut],
  );

  return (
    <AnimatedPressable
      style={[animatedStyle, style]}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      {...rest}
    >
      {children}
    </AnimatedPressable>
  );
}
