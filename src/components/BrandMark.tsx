import React, { useEffect, useRef } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  StyleSheet,
  View,
} from 'react-native';
import Svg, { Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import { colors } from '../theme';

/**
 * App logo: a water-blue tile with a white medical cross and a heartbeat
 * line, plus a soft ring that keeps pulsing outwards.
 */
export function BrandMark({ size = 64 }: { size?: number }) {
  const ring = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let loop: Animated.CompositeAnimation | null = null;
    let alive = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .catch(() => false)
      .then(reduce => {
        if (!alive || reduce) {
          return;
        }
        loop = Animated.loop(
          Animated.timing(ring, {
            toValue: 1,
            duration: 2200,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
        );
        loop.start();
      });
    return () => {
      alive = false;
      loop?.stop();
    };
  }, [ring]);

  const r = size * 0.28;
  return (
    <View
      style={{ width: size, height: size }}
      accessibilityRole="image"
      accessibilityLabel="MediGo"
    >
      <Animated.View
        pointerEvents="none"
        style={[
          styles.ring,
          {
            borderRadius: r,
            opacity: ring.interpolate({
              inputRange: [0, 1],
              outputRange: [0.5, 0],
            }),
            transform: [
              {
                scale: ring.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, 1.45],
                }),
              },
            ],
          },
        ]}
      />
      <Svg width={size} height={size} viewBox="0 0 64 64">
        <Defs>
          <LinearGradient id="brand" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={colors.aqua} />
            <Stop offset="1" stopColor={colors.primaryDark} />
          </LinearGradient>
        </Defs>
        <Rect width={64} height={64} rx={18} fill="url(#brand)" />
        {/* medical cross */}
        <Path
          d="M27 14 H37 V27 H50 V37 H37 V50 H27 V37 H14 V27 H27 Z"
          fill={colors.white}
          opacity={0.95}
        />
        {/* heartbeat across the cross */}
        <Path
          d="M10 32 H24 L28 24 L33 40 L37 30 H54"
          fill="none"
          stroke={colors.primary}
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  ring: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderWidth: 3,
    borderColor: colors.aqua,
  },
});
