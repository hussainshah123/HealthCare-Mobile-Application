import React, { useEffect, useRef } from 'react';
import { AccessibilityInfo, Animated, Easing } from 'react-native';
import Svg, { Path } from 'react-native-svg';

const AnimatedPath = Animated.createAnimatedComponent(Path);

// Heartbeat trace in a 120×40 box.
const ECG =
  'M0 22 H34 L40 14 L46 30 L54 4 L62 36 L68 22 H84 L88 18 L92 22 H120';
const LENGTH = 220; // a little longer than the path so the gap fully hides it

/** An ECG line that keeps drawing itself, then fading out, on a loop. */
export function PulseLine({
  width = 120,
  height = 40,
  color = '#FFFFFF',
  opacity = 0.85,
}: {
  width?: number;
  height?: number;
  color?: string;
  opacity?: number;
}) {
  const offset = useRef(new Animated.Value(LENGTH)).current;

  useEffect(() => {
    let loop: Animated.CompositeAnimation | null = null;
    let alive = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .catch(() => false)
      .then(reduce => {
        if (!alive) {
          return;
        }
        if (reduce) {
          offset.setValue(0);
          return;
        }
        // SVG props can't use the native driver; this is one small path.
        loop = Animated.loop(
          Animated.sequence([
            Animated.timing(offset, {
              toValue: 0,
              duration: 1400,
              easing: Easing.inOut(Easing.cubic),
              useNativeDriver: false,
            }),
            Animated.delay(500),
            Animated.timing(offset, {
              toValue: -LENGTH,
              duration: 900,
              easing: Easing.in(Easing.cubic),
              useNativeDriver: false,
            }),
            Animated.delay(250),
          ]),
        );
        loop.start();
      });
    return () => {
      alive = false;
      loop?.stop();
    };
  }, [offset]);

  return (
    <Svg width={width} height={height} viewBox="0 0 120 40">
      <AnimatedPath
        d={ECG}
        fill="none"
        stroke={color}
        strokeOpacity={opacity}
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={[LENGTH, LENGTH]}
        strokeDashoffset={offset}
      />
    </Svg>
  );
}
