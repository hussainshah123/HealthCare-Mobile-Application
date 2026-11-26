import React, { useRef, useState } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import type { LucideIcon } from 'lucide-react-native';
import { colors, radius, spacing, typography } from '../theme';

let gradientSeq = 0;

/**
 * Pressable action card with an SVG gradient background, an icon chip and
 * an optional decoration in the corner. Shrinks slightly while pressed.
 */
export function GradientCard({
  from,
  to,
  icon: Icon,
  title,
  subtitle,
  onPress,
  decoration,
  style,
}: {
  from: string;
  to: string;
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  onPress: () => void;
  decoration?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const [size, setSize] = useState({ w: 0, h: 0 });
  const id = useRef(`gc${gradientSeq++}`).current;
  const press = useRef(new Animated.Value(1)).current;
  const to1 = (v: number) =>
    Animated.spring(press, {
      toValue: v,
      friction: 6,
      tension: 200,
      useNativeDriver: true,
    }).start();

  return (
    <Animated.View style={[style, { transform: [{ scale: press }] }]}>
      <Pressable
        onPress={onPress}
        onPressIn={() => to1(0.97)}
        onPressOut={() => to1(1)}
        accessibilityRole="button"
        accessibilityLabel={subtitle ? `${title}. ${subtitle}` : title}
        style={styles.card}
        onLayout={e =>
          setSize({
            w: e.nativeEvent.layout.width,
            h: e.nativeEvent.layout.height,
          })
        }
      >
        {size.w > 0 ? (
          <Svg width={size.w} height={size.h} style={StyleSheet.absoluteFill}>
            <Defs>
              <LinearGradient id={id} x1="0" y1="0" x2="1" y2="1">
                <Stop offset="0" stopColor={from} />
                <Stop offset="1" stopColor={to} />
              </LinearGradient>
            </Defs>
            <Rect
              width={size.w}
              height={size.h}
              rx={radius.lg}
              fill={`url(#${id})`}
            />
          </Svg>
        ) : null}
        {decoration ? (
          <View style={styles.decoration} pointerEvents="none">
            {decoration}
          </View>
        ) : null}
        <View style={styles.chip}>
          <Icon size={22} color={colors.white} strokeWidth={2} />
        </View>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    padding: spacing.lg,
    minHeight: 150,
    overflow: 'hidden',
    backgroundColor: colors.primary,
    shadowColor: colors.primaryDark,
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  decoration: { position: 'absolute', right: 8, top: 10 },
  chip: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  title: { ...typography.h3, color: colors.white, marginBottom: 2 },
  subtitle: { ...typography.caption, color: 'rgba(255,255,255,0.88)' },
});
