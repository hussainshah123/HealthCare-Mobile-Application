import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { BottomTabBarHeightContext } from '@react-navigation/bottom-tabs';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import Svg, {
  Circle,
  Defs,
  Line,
  LinearGradient,
  Path,
  Rect,
  Stop,
} from 'react-native-svg';
import { colors } from '../theme';

type PillKind = 'capsule' | 'tablet' | 'syringe' | 'bubble';

interface Pill {
  kind: PillKind;
  /** Horizontal position, 0..1 of screen width. */
  x: number;
  /** Starting point in the float cycle, 0..1 (staggers the pills). */
  phase: number;
  /** Seconds for one trip from bottom to top. */
  duration: number;
  /** Height in dp for capsule/syringe, diameter for tablet. */
  size: number;
  angle: number;
  spin: 1 | -1;
  sway: number;
  /** Main colour (capsule cap / tablet / syringe liquid). */
  color: string;
  /** Second capsule half. */
  color2?: string;
  opacity: number;
}

// Fixed layout so every screen looks the same and nothing jumps on re-render.
// Mostly water bubbles, with a few soft medical items mixed in.
const b = (
  x: number,
  phase: number,
  duration: number,
  size: number,
  opacity: number,
): Pill => ({
  kind: 'bubble',
  x,
  phase,
  duration,
  size,
  angle: 0,
  spin: 1,
  sway: size / 2 + 6,
  color: colors.white,
  opacity,
});
const PILLS: Pill[] = [
  b(0.06, 0.1, 34, 18, 0.7),
  b(0.2, 0.55, 42, 44, 0.55),
  b(0.34, 0.3, 30, 10, 0.8),
  b(0.5, 0.8, 46, 58, 0.45),
  b(0.66, 0.2, 36, 14, 0.75),
  b(0.8, 0.65, 40, 32, 0.6),
  b(0.93, 0.4, 32, 12, 0.8),
  b(0.42, 0.95, 38, 22, 0.65),
  b(0.12, 0.75, 44, 28, 0.55),
  {
    kind: 'capsule',
    x: 0.28,
    phase: 0.05,
    duration: 40,
    size: 34,
    angle: 30,
    spin: 1,
    sway: 12,
    color: colors.pillBlue,
    color2: colors.white,
    opacity: 0.45,
  },
  {
    kind: 'capsule',
    x: 0.86,
    phase: 0.5,
    duration: 44,
    size: 30,
    angle: -40,
    spin: -1,
    sway: 10,
    color: colors.pillRed,
    color2: colors.white,
    opacity: 0.35,
  },
  {
    kind: 'tablet',
    x: 0.6,
    phase: 0.62,
    duration: 38,
    size: 18,
    angle: 0,
    spin: 1,
    sway: 10,
    color: colors.pillBlue,
    opacity: 0.45,
  },
  {
    kind: 'syringe',
    x: 0.72,
    phase: 0.9,
    duration: 48,
    size: 48,
    angle: 35,
    spin: 1,
    sway: 10,
    color: colors.aqua,
    opacity: 0.35,
  },
];

const OUTLINE = colors.primaryDark;
const STEEL = '#7C93A3';

/** Two-tone capsule, upright, `size * 0.4` wide and `size` tall. */
function CapsuleSvg({ pill, id }: { pill: Pill; id: string }) {
  const h = pill.size;
  const w = h * 0.4;
  const r = w / 2;
  const second = pill.color2 ?? colors.white;
  return (
    <Svg width={w} height={h}>
      <Defs>
        <LinearGradient id={`${id}a`} x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor={pill.color} stopOpacity={0.75} />
          <Stop offset="0.45" stopColor={pill.color} />
          <Stop offset="1" stopColor={pill.color} stopOpacity={0.8} />
        </LinearGradient>
        <LinearGradient id={`${id}b`} x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor={second} stopOpacity={0.8} />
          <Stop offset="1" stopColor={second} />
        </LinearGradient>
      </Defs>
      <Path
        d={`M0 ${r} A${r} ${r} 0 0 1 ${w} ${r} V${h / 2} H0 Z`}
        fill={`url(#${id}a)`}
      />
      <Path
        d={`M0 ${h / 2} H${w} V${h - r} A${r} ${r} 0 0 1 0 ${h - r} Z`}
        fill={`url(#${id}b)`}
      />
      <Rect
        x={0.5}
        y={0.5}
        width={w - 1}
        height={h - 1}
        rx={r - 0.5}
        fill="none"
        stroke={OUTLINE}
        strokeOpacity={0.2}
      />
      <Line
        x1={0}
        y1={h / 2}
        x2={w}
        y2={h / 2}
        stroke={OUTLINE}
        strokeOpacity={0.15}
      />
      <Rect
        x={w * 0.2}
        y={h * 0.12}
        width={w * 0.18}
        height={h * 0.3}
        rx={w * 0.09}
        fill={colors.white}
        opacity={0.6}
      />
    </Svg>
  );
}

function TabletSvg({ pill, id }: { pill: Pill; id: string }) {
  const d = pill.size;
  const r = d / 2;
  return (
    <Svg width={d} height={d}>
      <Defs>
        <LinearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={colors.white} />
          <Stop offset="1" stopColor={pill.color} />
        </LinearGradient>
      </Defs>
      <Circle
        cx={r}
        cy={r}
        r={r - 1}
        fill={`url(#${id})`}
        stroke={OUTLINE}
        strokeOpacity={0.2}
      />
      <Line
        x1={r * 0.45}
        y1={r}
        x2={r * 1.55}
        y2={r}
        stroke={OUTLINE}
        strokeOpacity={0.22}
        strokeWidth={1.5}
        strokeLinecap="round"
      />
    </Svg>
  );
}

/** Syringe pointing up, `size * 0.3` wide and `size` tall. */
function SyringeSvg({ pill }: { pill: Pill }) {
  const h = pill.size;
  const w = h * 0.3;
  const cx = w / 2;
  const bw = w * 0.62;
  const bx = cx - bw / 2;
  const barrelTop = h * 0.24;
  const barrelBottom = h * 0.72;
  const liquidTop = barrelTop + (barrelBottom - barrelTop) * 0.4;
  return (
    <Svg width={w} height={h}>
      <Line
        x1={cx}
        y1={0}
        x2={cx}
        y2={h * 0.16}
        stroke={STEEL}
        strokeWidth={1.2}
      />
      <Rect
        x={cx - w * 0.12}
        y={h * 0.15}
        width={w * 0.24}
        height={h * 0.09}
        rx={1}
        fill={STEEL}
      />
      <Rect
        x={bx}
        y={barrelTop}
        width={bw}
        height={barrelBottom - barrelTop}
        rx={2}
        fill={colors.white}
        fillOpacity={0.9}
        stroke={STEEL}
        strokeWidth={1.2}
      />
      <Rect
        x={bx + 1.5}
        y={liquidTop}
        width={bw - 3}
        height={barrelBottom - liquidTop - 1.5}
        rx={1}
        fill={pill.color}
      />
      {[0.32, 0.44, 0.56].map(t => (
        <Line
          key={t}
          x1={bx}
          y1={h * t}
          x2={bx + bw * 0.35}
          y2={h * t}
          stroke={STEEL}
          strokeWidth={0.8}
        />
      ))}
      <Rect
        x={0}
        y={barrelBottom}
        width={w}
        height={h * 0.03}
        rx={1}
        fill={STEEL}
      />
      <Rect
        x={cx - w * 0.08}
        y={barrelBottom}
        width={w * 0.16}
        height={h * 0.22}
        fill={STEEL}
      />
      <Rect
        x={cx - w * 0.36}
        y={h * 0.94}
        width={w * 0.72}
        height={h * 0.05}
        rx={1.5}
        fill={STEEL}
      />
    </Svg>
  );
}

/** Water bubble: thin white rim, faint fill and a glossy highlight. */
function BubbleSvg({ pill, id }: { pill: Pill; id: string }) {
  const d = pill.size;
  const r = d / 2;
  return (
    <Svg width={d} height={d}>
      <Defs>
        <LinearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={colors.white} stopOpacity={0.55} />
          <Stop offset="1" stopColor={colors.aqua} stopOpacity={0.12} />
        </LinearGradient>
      </Defs>
      <Circle
        cx={r}
        cy={r}
        r={r - 0.75}
        fill={`url(#${id})`}
        stroke={colors.white}
        strokeOpacity={0.9}
        strokeWidth={1.2}
      />
      <Circle
        cx={r * 0.62}
        cy={r * 0.58}
        r={Math.max(r * 0.18, 1.5)}
        fill={colors.white}
        opacity={0.85}
      />
    </Svg>
  );
}

function PillShape({ pill, id }: { pill: Pill; id: string }) {
  if (pill.kind === 'bubble') {
    return <BubbleSvg pill={pill} id={id} />;
  }
  if (pill.kind === 'syringe') {
    return <SyringeSvg pill={pill} />;
  }
  if (pill.kind === 'tablet') {
    return <TabletSvg pill={pill} id={id} />;
  }
  return <CapsuleSvg pill={pill} id={id} />;
}

function FloatingPill({
  pill,
  index,
  clock,
  width,
  height,
}: {
  pill: Pill;
  index: number;
  clock: Animated.Value;
  width: number;
  height: number;
}) {
  const t = useMemo(
    () => Animated.modulo(Animated.add(clock, pill.phase), 1),
    [clock, pill.phase],
  );
  const span = pill.size + 40;
  const translateY = t.interpolate({
    inputRange: [0, 1],
    outputRange: [height + span, -span],
  });
  const translateX = t.interpolate({
    inputRange: [0, 0.25, 0.5, 0.75, 1],
    outputRange: [0, pill.sway, 0, -pill.sway, 0],
  });
  const rotate = t.interpolate({
    inputRange: [0, 1],
    outputRange: [`${pill.angle}deg`, `${pill.angle + 360 * pill.spin}deg`],
  });

  return (
    <Animated.View
      style={[
        styles.pill,
        {
          left: pill.x * width - pill.size * 0.2,
          opacity: pill.opacity,
          transform:
            pill.kind === 'bubble'
              ? [{ translateY }, { translateX }]
              : [{ translateY }, { translateX }, { rotate }],
        },
      ]}
    >
      <PillShape pill={pill} id={`pill${index}`} />
    </Animated.View>
  );
}

/** One wave period; the strip is two periods wide so it loops seamlessly. */
const WAVE_W = 400;

function wavePath(amp: number, height: number) {
  const q = WAVE_W / 4;
  let d = `M0 ${amp}`;
  for (let i = 0; i < 2; i++) {
    const o = i * WAVE_W;
    d += ` Q${o + q} 0 ${o + 2 * q} ${amp} T${o + WAVE_W} ${amp}`;
  }
  return `${d} V${height} H0 Z`;
}

function Wave({
  clock,
  color,
  opacity,
  amp,
  height,
  reverse,
}: {
  clock: Animated.Value;
  color: string;
  opacity: number;
  amp: number;
  height: number;
  reverse?: boolean;
}) {
  const translateX = clock.interpolate({
    inputRange: [0, 1],
    outputRange: reverse ? [-WAVE_W, 0] : [0, -WAVE_W],
  });
  return (
    <Animated.View
      style={[styles.wave, { height, transform: [{ translateX }] }]}
    >
      <Svg width={WAVE_W * 2} height={height}>
        <Path d={wavePath(amp, height)} fill={color} fillOpacity={opacity} />
      </Svg>
    </Animated.View>
  );
}

/**
 * Soft medical background: a water-blue gradient, slow waves along the bottom,
 * and SVG capsules, tablets and syringes floating up the screen. Purely
 * decorative: it never takes touches and is hidden from screen readers. Stays
 * still when the system "reduce motion" setting is on.
 */
export function MedicalBackdrop({
  children,
  tone = 'light',
}: {
  children?: React.ReactNode;
  /** 'dark' sits on the primary colour (splash). */
  tone?: 'light' | 'dark';
}) {
  const { width, height } = useWindowDimensions();
  // One clock per pill so each keeps its own speed; all run on the native thread.
  const clocks = useRef(PILLS.map(() => new Animated.Value(0))).current;
  const waveClocks = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current;
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    let alive = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then(v => alive && setReduceMotion(v))
      .catch(() => {});
    const sub = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      setReduceMotion,
    );
    return () => {
      alive = false;
      sub.remove();
    };
  }, []);

  useEffect(() => {
    if (reduceMotion) {
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
      ...clocks.map((c, i) => loop(c, PILLS[i].duration)),
      loop(waveClocks[0], 14),
      loop(waveClocks[1], 20),
    ];
    loops.forEach(l => l.start());
    return () => loops.forEach(l => l.stop());
  }, [clocks, waveClocks, reduceMotion]);

  const dark = tone === 'dark';
  const top = dark ? colors.primary : colors.canvas;
  const bottom = dark ? colors.primaryDark : colors.canvasDeep;

  return (
    <View style={[styles.root, { backgroundColor: top }]}>
      <View
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
          <Defs>
            <LinearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={top} />
              <Stop offset="1" stopColor={bottom} />
            </LinearGradient>
          </Defs>
          <Rect width={width} height={height} fill="url(#bg)" />
        </Svg>
        <Wave
          clock={waveClocks[1]}
          color={dark ? colors.white : colors.aqua}
          opacity={dark ? 0.06 : 0.12}
          amp={14}
          height={110}
          reverse
        />
        <Wave
          clock={waveClocks[0]}
          color={dark ? colors.white : colors.primary}
          opacity={0.08}
          amp={10}
          height={80}
        />
        {PILLS.map((pill, i) => (
          <FloatingPill
            key={i}
            index={i}
            pill={
              dark ? { ...pill, opacity: Math.min(pill.opacity, 0.4) } : pill
            }
            clock={clocks[i]}
            width={width}
            height={height}
          />
        ))}
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, overflow: 'hidden' },
  flex: { flex: 1 },
  pill: { position: 'absolute', top: 0 },
  wave: { position: 'absolute', left: 0, bottom: 0, width: WAVE_W * 2 },
});

/**
 * Keeps tab screen content clear of the floating tab bar. The backdrop stays
 * full-height, so its bubbles and waves show around the bar.
 */
function TabBarSpace({ children }: { children: React.ReactNode }) {
  const barHeight = useContext(BottomTabBarHeightContext) ?? 0;
  return (
    <View style={[styles.flex, { paddingBottom: barHeight }]}>{children}</View>
  );
}

/** `screenLayout` for tab navigators: backdrop behind every screen + room for the bar. */
export function backdropLayout({ children }: { children: React.ReactNode }) {
  return (
    <MedicalBackdrop>
      <TabBarSpace>{children}</TabBarSpace>
    </MedicalBackdrop>
  );
}

/** Same, but skips the nested tab navigator screen (its tabs have their own). */
export function stackBackdropLayout({
  route,
  children,
}: {
  route: { name: string };
  children: React.ReactNode;
}) {
  return route.name === 'Tabs' ? (
    <>{children}</>
  ) : (
    <MedicalBackdrop>{children}</MedicalBackdrop>
  );
}
