import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  StyleSheet,
  View,
} from 'react-native';
import Svg, { Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import { colors } from '../theme';

const RADIUS = 28;

// Small water bubbles rising through the header (like the website hero).
const BUBBLES = [
  { x: 0.06, size: 10, duration: 7, phase: 0.1, opacity: 0.55 },
  { x: 0.2, size: 18, duration: 10, phase: 0.6, opacity: 0.4 },
  { x: 0.36, size: 7, duration: 6, phase: 0.35, opacity: 0.6 },
  { x: 0.52, size: 14, duration: 9, phase: 0.85, opacity: 0.45 },
  { x: 0.66, size: 8, duration: 7.5, phase: 0.2, opacity: 0.55 },
  { x: 0.8, size: 20, duration: 11, phase: 0.5, opacity: 0.35 },
  { x: 0.93, size: 9, duration: 8, phase: 0.75, opacity: 0.5 },
];

/** One wave period is WAVE_W wide; the strip is two periods so it loops. */
const WAVE_W = 360;
function wavePath(amp: number, h: number) {
  const q = WAVE_W / 4;
  let d = `M0 ${amp}`;
  for (let i = 0; i < 2; i++) {
    const o = i * WAVE_W;
    d += ` Q${o + q} 0 ${o + 2 * q} ${amp} T${o + WAVE_W} ${amp}`;
  }
  return `${d} V${h} H0 Z`;
}

function useReduceMotion() {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    let alive = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then(v => alive && setReduce(v))
      .catch(() => {});
    const sub = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      setReduce,
    );
    return () => {
      alive = false;
      sub.remove();
    };
  }, []);
  return reduce;
}

/**
 * Header background: deep-blue → aqua gradient with rounded bottom corners,
 * water bubbles rising through it and soft waves sliding along the bottom.
 * All motion runs on the native thread and stops for "reduce motion".
 */
export function HeaderGradient() {
  const [size, setSize] = useState({ w: 0, h: 0 });
  const reduce = useReduceMotion();
  const clocks = useRef(BUBBLES.map(() => new Animated.Value(0))).current;
  const waves = useRef([new Animated.Value(0), new Animated.Value(0)]).current;

  useEffect(() => {
    if (reduce) {
      return;
    }
    const loop = (v: Animated.Value, seconds: number) =>
      Animated.loop(
        Animated.timing(v, {
          toValue: 1,
          duration: seconds * 1000,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      );
    const loops = [
      ...clocks.map((c, i) => loop(c, BUBBLES[i].duration)),
      loop(waves[0], 9),
      loop(waves[1], 14),
    ];
    loops.forEach(l => l.start());
    return () => loops.forEach(l => l.stop());
  }, [clocks, waves, reduce]);

  const bubbleStyles = useMemo(
    () =>
      BUBBLES.map((b, i) => {
        const t = Animated.modulo(Animated.add(clocks[i], b.phase), 1);
        return {
          left: b.x * size.w,
          width: b.size,
          height: b.size,
          borderRadius: b.size / 2,
          opacity: t.interpolate({
            inputRange: [0, 0.15, 0.8, 1],
            outputRange: [0, b.opacity, b.opacity, 0],
          }),
          transform: [
            {
              translateY: t.interpolate({
                inputRange: [0, 1],
                outputRange: [size.h + b.size, -b.size],
              }),
            },
            {
              translateX: t.interpolate({
                inputRange: [0, 0.5, 1],
                outputRange: [0, 6, -4],
              }),
            },
          ],
        };
      }),
    [clocks, size.w, size.h],
  );

  return (
    <View
      style={styles.outer}
      onLayout={e =>
        setSize({
          w: e.nativeEvent.layout.width,
          h: e.nativeEvent.layout.height,
        })
      }
    >
      <View style={styles.inner}>
        {size.w > 0 ? (
          <>
            <Svg width={size.w} height={size.h} style={StyleSheet.absoluteFill}>
              <Defs>
                <LinearGradient id="hdr" x1="0" y1="0" x2="1" y2="1">
                  <Stop offset="0" stopColor={colors.primaryDark} />
                  <Stop offset="0.6" stopColor={colors.primary} />
                  <Stop offset="1" stopColor={colors.aqua} />
                </LinearGradient>
              </Defs>
              <Rect width={size.w} height={size.h} fill="url(#hdr)" />
            </Svg>

            {/* soft waves along the bottom edge */}
            {waves.map((w, i) => (
              <Animated.View
                key={i}
                pointerEvents="none"
                style={[
                  styles.wave,
                  i === 0 ? styles.waveBack : styles.waveFront,
                  {
                    transform: [
                      {
                        translateX: w.interpolate({
                          inputRange: [0, 1],
                          outputRange: i === 0 ? [0, -WAVE_W] : [-WAVE_W, 0],
                        }),
                      },
                    ],
                  },
                ]}
              >
                <Svg width={WAVE_W * 2} height={i === 0 ? 26 : 20}>
                  <Path
                    d={wavePath(i === 0 ? 8 : 6, i === 0 ? 26 : 20)}
                    fill={colors.white}
                    fillOpacity={i === 0 ? 0.08 : 0.12}
                  />
                </Svg>
              </Animated.View>
            ))}

            {/* rising bubbles */}
            {BUBBLES.map((b, i) => (
              <Animated.View
                key={i}
                pointerEvents="none"
                style={[styles.bubble, bubbleStyles[i]]}
              >
                <View
                  style={[
                    styles.shine,
                    {
                      width: Math.max(2, b.size * 0.22),
                      height: Math.max(2, b.size * 0.22),
                      borderRadius: b.size,
                      top: b.size * 0.2,
                      left: b.size * 0.22,
                    },
                  ]}
                />
              </Animated.View>
            ))}
          </>
        ) : null}
      </View>
    </View>
  );
}

/** `headerBackground` option (defined outside render for lint). */
export const renderHeaderGradient = () => <HeaderGradient />;

const styles = StyleSheet.create({
  // The corners show this colour: the same as the top of every screen.
  outer: { flex: 1, backgroundColor: colors.canvas },
  inner: {
    flex: 1,
    overflow: 'hidden',
    backgroundColor: colors.primary,
    borderBottomLeftRadius: RADIUS,
    borderBottomRightRadius: RADIUS,
  },
  wave: { position: 'absolute', left: 0, bottom: 0, width: WAVE_W * 2 },
  waveBack: { height: 26 },
  waveFront: { height: 20 },
  bubble: {
    position: 'absolute',
    top: 0,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.85)',
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  shine: { position: 'absolute', backgroundColor: 'rgba(255,255,255,0.9)' },
});
