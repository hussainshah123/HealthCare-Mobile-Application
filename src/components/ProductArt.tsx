import React from 'react';
import {
  Image,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Svg, {
  Circle,
  Defs,
  Ellipse,
  G,
  Line,
  LinearGradient,
  Path,
  Rect,
  Stop,
} from 'react-native-svg';

/**
 * Product picture for a medicine. Uses the real photo when the catalogue has
 * one; otherwise draws the pack for its form (blister strip, bottle, tube…)
 * in a colour picked from the category, so every product looks distinct.
 */

const TINTS = [
  { main: '#0EA5E9', soft: '#E0F2FE', deep: '#0369A1' }, // sky
  { main: '#14B8A6', soft: '#CCFBF1', deep: '#0F766E' }, // teal
  { main: '#8B5CF6', soft: '#EDE9FE', deep: '#6D28D9' }, // violet
  { main: '#F97316', soft: '#FFEDD5', deep: '#C2410C' }, // orange
  { main: '#EC4899', soft: '#FCE7F3', deep: '#BE185D' }, // pink
  { main: '#22C55E', soft: '#DCFCE7', deep: '#15803D' }, // green
  { main: '#EAB308', soft: '#FEF9C3', deep: '#A16207' }, // amber
  { main: '#6366F1', soft: '#E0E7FF', deep: '#4338CA' }, // indigo
];

export function tintFor(key: string) {
  let h = 0;
  for (let i = 0; i < key.length; i++) {
    h = (h * 31 + key.charCodeAt(i)) % 2147483647;
  }
  return TINTS[h % TINTS.length];
}

type Tint = (typeof TINTS)[number];

function Blister({ t }: { t: Tint }) {
  return (
    <G>
      <Rect
        x="18"
        y="28"
        width="64"
        height="44"
        rx="6"
        fill="#F8FAFC"
        stroke="#CBD5E1"
        strokeWidth="1.5"
      />
      {[0, 1, 2].map(c =>
        [0, 1].map(r => (
          <G key={`${c}${r}`}>
            <Ellipse
              cx={32 + c * 18}
              cy={40 + r * 20}
              rx="7"
              ry="6"
              fill="#E2E8F0"
            />
            <Ellipse
              cx={32 + c * 18}
              cy={39 + r * 20}
              rx="5.5"
              ry="4.5"
              fill={t.main}
            />
            <Ellipse
              cx={30 + c * 18}
              cy={37.5 + r * 20}
              rx="1.8"
              ry="1.2"
              fill="#fff"
              opacity="0.7"
            />
          </G>
        )),
      )}
    </G>
  );
}

function Capsules({ t }: { t: Tint }) {
  const cap = (x: number, y: number, rot: number) => (
    <G transform={`translate(${x} ${y}) rotate(${rot})`}>
      <Rect
        x="-7"
        y="-18"
        width="14"
        height="36"
        rx="7"
        fill="#fff"
        stroke="#CBD5E1"
        strokeWidth="1.2"
      />
      <Path d="M-7 0 V-11 A7 7 0 0 1 7 -11 V0 Z" fill={t.main} />
      <Rect
        x="-4"
        y="-14"
        width="2.5"
        height="9"
        rx="1.2"
        fill="#fff"
        opacity="0.6"
      />
    </G>
  );
  return (
    <G>
      {cap(38, 50, -25)}
      {cap(60, 48, 20)}
      {cap(50, 62, 80)}
    </G>
  );
}

function Bottle({ t, dropper = false }: { t: Tint; dropper?: boolean }) {
  return (
    <G>
      {dropper ? (
        <>
          <Path d="M46 14 h8 v10 h-8 z" fill={t.deep} />
          <Ellipse cx="50" cy="14" rx="6" ry="4" fill={t.deep} />
        </>
      ) : (
        <Rect x="40" y="16" width="20" height="10" rx="2" fill={t.deep} />
      )}
      <Rect x="43" y="25" width="14" height="6" fill="#E2E8F0" />
      <Path
        d="M36 36 Q36 31 41 31 H59 Q64 31 64 36 V80 Q64 86 58 86 H42 Q36 86 36 80 Z"
        fill={t.main}
      />
      <Rect x="39" y="46" width="22" height="24" rx="3" fill="#fff" />
      <Line
        x1="43"
        y1="53"
        x2="57"
        y2="53"
        stroke={t.main}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <Line
        x1="43"
        y1="59"
        x2="53"
        y2="59"
        stroke="#CBD5E1"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <Line
        x1="43"
        y1="64"
        x2="55"
        y2="64"
        stroke="#CBD5E1"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <Rect
        x="40"
        y="35"
        width="4"
        height="40"
        rx="2"
        fill="#fff"
        opacity="0.3"
      />
    </G>
  );
}

function Tube({ t }: { t: Tint }) {
  return (
    <G transform="rotate(-18 50 50)">
      <Rect x="44" y="14" width="12" height="10" rx="2" fill={t.deep} />
      <Path
        d="M38 24 H62 L66 80 H34 Z"
        fill="#fff"
        stroke="#CBD5E1"
        strokeWidth="1.5"
      />
      <Path d="M36.5 50 H63.5 L65 70 H35 Z" fill={t.main} />
      <Rect x="33" y="80" width="34" height="6" rx="1" fill="#E2E8F0" />
      <Line
        x1="42"
        y1="34"
        x2="58"
        y2="34"
        stroke={t.main}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </G>
  );
}

function Sachet({ t }: { t: Tint }) {
  return (
    <G>
      <Rect x="30" y="20" width="40" height="60" rx="4" fill={t.main} />
      <Path
        d="M30 26 h40 M30 74 h40"
        stroke="#fff"
        strokeOpacity="0.5"
        strokeWidth="2"
        strokeDasharray="3 3"
      />
      <Circle cx="50" cy="50" r="11" fill="#fff" />
      <Path
        d="M45 50 h10 M50 45 v10"
        stroke={t.main}
        strokeWidth="3"
        strokeLinecap="round"
      />
    </G>
  );
}

function Vial({ t }: { t: Tint }) {
  return (
    <G>
      <Rect x="42" y="18" width="16" height="8" rx="2" fill="#94A3B8" />
      <Rect x="44" y="26" width="12" height="5" fill="#E2E8F0" />
      <Rect
        x="38"
        y="31"
        width="24"
        height="52"
        rx="5"
        fill="#F8FAFC"
        stroke="#CBD5E1"
        strokeWidth="1.5"
      />
      <Rect
        x="40"
        y="52"
        width="20"
        height="29"
        rx="3"
        fill={t.main}
        opacity="0.85"
      />
      <Rect
        x="41"
        y="36"
        width="3"
        height="40"
        rx="1.5"
        fill="#fff"
        opacity="0.6"
      />
    </G>
  );
}

function Shape({ form, t }: { form: string; t: Tint }) {
  switch (form) {
    case 'capsule':
      return <Capsules t={t} />;
    case 'syrup':
    case 'suspension':
      return <Bottle t={t} />;
    case 'drops':
      return <Bottle t={t} dropper />;
    case 'cream':
    case 'ointment':
    case 'gel':
      return <Tube t={t} />;
    case 'sachet':
      return <Sachet t={t} />;
    case 'injection':
      return <Vial t={t} />;
    default:
      return <Blister t={t} />;
  }
}

export function ProductArt({
  form,
  colorKey,
  imageUrl,
  size = 120,
  style,
}: {
  form?: string | null;
  /** Any stable key (the product name): picks one of eight tints. */
  colorKey: string;
  imageUrl?: string | null;
  size?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const t = tintFor(colorKey);
  const id = `pa${colorKey.replace(/[^a-z0-9]/gi, '').slice(0, 10)}`;
  return (
    <View
      style={[
        styles.box,
        { height: size, backgroundColor: t.soft },
        style,
      ]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {imageUrl ? (
        <Image
          source={{ uri: imageUrl }}
          style={StyleSheet.absoluteFill}
          resizeMode="contain"
        />
      ) : (
        <Svg
          width="100%"
          height="100%"
          viewBox="0 0 100 100"
          preserveAspectRatio="xMidYMid meet"
        >
          <Defs>
            <LinearGradient id={id} x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor="#fff" stopOpacity="0.9" />
              <Stop offset="1" stopColor={t.soft} stopOpacity="0" />
            </LinearGradient>
          </Defs>
          <Circle cx="50" cy="52" r="40" fill={`url(#${id})`} />
          <Ellipse
            cx="50"
            cy="90"
            rx="26"
            ry="3.5"
            fill={t.deep}
            opacity="0.12"
          />
          <Shape form={(form ?? 'tablet').toLowerCase()} t={t} />
        </Svg>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
