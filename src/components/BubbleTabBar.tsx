import React, { useContext, useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  BottomTabBarHeightCallbackContext,
  type BottomTabBarProps,
} from '@react-navigation/bottom-tabs';
import Svg, {
  Defs,
  Ellipse,
  LinearGradient,
  Rect,
  Stop,
} from 'react-native-svg';
import { colors } from '../theme';
import { iconForTab } from './TabIcon';

const BAR_H = 66;
const GAP = 12; // space between the bar and the bottom edge
const SIDE = 16; // space on the left and right
// The bubble sits behind the icon only; the label below it turns blue.
const PILL_H = 34; // bubble height
const PILL_MAX_W = 52; // bubble width (smaller on narrow tabs)
const ICON = 22;
const LABEL_H = 14;
const ICON_GAP = 6;
/** Top of the icon inside the bar (icon + label block is centred). */
const ICON_TOP = (BAR_H - (ICON + ICON_GAP + LABEL_H)) / 2;

/**
 * Floating bottom bar with a liquid "bubble". A glossy gradient bubble slides
 * behind the active tab, stretching while it moves; each icon and label turns
 * white exactly as the bubble passes under it (both read the same animated
 * value), and a tap sends out a ripple like a drop in water.
 *
 * Every animation uses the native driver and starts on the tap itself, so the
 * bar stays smooth even while the new screen renders. The bar floats over the
 * screen (nothing is painted around it); tab screens add bottom padding equal
 * to the height reported here.
 */
export function BubbleTabBar({
  state,
  descriptors,
  navigation,
  insets,
}: BottomTabBarProps) {
  const [barWidth, setBarWidth] = useState(0);
  const count = state.routes.length;
  const tabW = barWidth / Math.max(count, 1);
  const pillW = Math.max(Math.min(PILL_MAX_W, tabW - 12), 0);

  const position = useRef(new Animated.Value(state.index)).current;
  const stretch = useRef(new Animated.Value(1)).current;
  const ripple = useRef(new Animated.Value(1)).current;
  const rippleIndex = useRef(new Animated.Value(state.index)).current;
  const reduceMotion = useRef(false);
  /** Where the bubble is heading, so a tap and the re-render don't animate twice. */
  const target = useRef(state.index);

  // Tell the navigator how much room the bar takes, so screens can pad for it.
  const reportHeight = useContext(BottomTabBarHeightCallbackContext);
  const totalHeight = BAR_H + GAP + insets.bottom;
  useEffect(() => {
    reportHeight?.(totalHeight);
  }, [reportHeight, totalHeight]);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled()
      .then(v => (reduceMotion.current = v))
      .catch(() => {});
  }, []);

  const moveTo = (index: number, withRipple: boolean) => {
    const distance = Math.abs(index - target.current);
    target.current = index;
    if (reduceMotion.current) {
      position.setValue(index);
      return;
    }
    Animated.parallel([
      Animated.spring(position, {
        toValue: index,
        speed: 16,
        bounciness: 7,
        useNativeDriver: true,
      }),
      // Liquid feel: stretch wide while travelling, then wobble back.
      Animated.sequence([
        Animated.timing(stretch, {
          toValue: 1.08 + Math.min(distance, 3) * 0.015,
          duration: 120,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.spring(stretch, {
          toValue: 1,
          speed: 16,
          bounciness: 6,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
    if (withRipple) {
      rippleIndex.setValue(index);
      ripple.setValue(0);
      Animated.timing(ripple, {
        toValue: 1,
        duration: 520,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    }
  };
  const moveRef = useRef(moveTo);
  moveRef.current = moveTo;

  // Tab changed some other way (back button, deep link, navigate()).
  useEffect(() => {
    if (target.current !== state.index) {
      moveRef.current(state.index, false);
    }
  }, [state.index]);

  const indexes = state.routes.map((_, i) => i);
  const ready = barWidth > 0;
  const translateX = ready
    ? position.interpolate({
        inputRange: indexes,
        outputRange: indexes.map(i => i * tabW + (tabW - pillW) / 2),
      })
    : 0;
  const rippleX = ready
    ? rippleIndex.interpolate({
        inputRange: indexes,
        outputRange: indexes.map(i => i * tabW + tabW / 2 - BAR_H / 2),
      })
    : 0;

  return (
    <View
      pointerEvents="box-none"
      style={[styles.outer, { bottom: insets.bottom + GAP }]}
    >
      <View
        style={styles.bar}
        onLayout={e => setBarWidth(e.nativeEvent.layout.width)}
      >
        {ready ? (
          <>
            {/* ripple from the tapped tab */}
            <Animated.View
              pointerEvents="none"
              style={[
                styles.ripple,
                {
                  opacity: ripple.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.35, 0],
                  }),
                  transform: [
                    { translateX: rippleX },
                    {
                      scale: ripple.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.3, 1.6],
                      }),
                    },
                  ],
                },
              ]}
            />
            {/* the bubble */}
            <Animated.View
              pointerEvents="none"
              style={[
                styles.pill,
                {
                  width: pillW,
                  transform: [
                    { translateX },
                    { scaleX: stretch },
                    {
                      scaleY: stretch.interpolate({
                        inputRange: [1, 1.15],
                        outputRange: [1, 0.95],
                      }),
                    },
                  ],
                },
              ]}
            >
              <Svg width={pillW} height={PILL_H}>
                <Defs>
                  <LinearGradient id="tabPill" x1="0" y1="0" x2="1" y2="1">
                    <Stop offset="0" stopColor={colors.aqua} />
                    <Stop offset="1" stopColor={colors.primaryDark} />
                  </LinearGradient>
                </Defs>
                <Rect
                  width={pillW}
                  height={PILL_H}
                  rx={PILL_H / 2}
                  fill="url(#tabPill)"
                />
                {/* glossy highlight, like light on a water bubble */}
                <Ellipse
                  cx={pillW * 0.32}
                  cy={PILL_H * 0.24}
                  rx={pillW * 0.2}
                  ry={4}
                  fill={colors.white}
                  opacity={0.35}
                />
              </Svg>
            </Animated.View>
          </>
        ) : null}

        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const label =
            typeof options.tabBarLabel === 'string'
              ? options.tabBarLabel
              : options.title ?? route.name;
          const focused = state.index === index;
          const Icon = iconForTab(route.name);
          // 1 when the bubble is under this tab, fading to 0 one tab away.
          const on: Animated.AnimatedInterpolation<number> | number = ready
            ? position.interpolate({
                inputRange: [index - 1, index, index + 1],
                outputRange: [0, 1, 0],
                extrapolate: 'clamp',
              })
            : focused
            ? 1
            : 0;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!focused && !event.defaultPrevented) {
              moveTo(index, true); // start the bubble first, then switch screens
              navigation.navigate(route.name, route.params);
            }
          };
          const onLongPress = () =>
            navigation.emit({ type: 'tabLongPress', target: route.key });

          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              onLongPress={onLongPress}
              accessibilityRole="tab"
              accessibilityState={{ selected: focused }}
              accessibilityLabel={options.tabBarAccessibilityLabel ?? label}
              testID={options.tabBarButtonTestID}
              style={styles.item}
            >
              <View style={styles.content}>
                <View style={styles.iconSlot}>
                  <Icon size={22} color={colors.textMuted} strokeWidth={1.9} />
                  <Animated.View
                    style={[StyleSheet.absoluteFill, { opacity: on }]}
                  >
                    <Icon size={22} color={colors.white} strokeWidth={2.3} />
                  </Animated.View>
                </View>
                <View>
                  <Text numberOfLines={1} style={styles.label}>
                    {label}
                  </Text>
                  <Animated.Text
                    numberOfLines={1}
                    style={[styles.label, styles.labelOn, { opacity: on }]}
                  >
                    {label}
                  </Animated.Text>
                </View>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Floats over the screen: nothing is painted around the bar.
  outer: { position: 'absolute', left: SIDE, right: SIDE },
  bar: {
    flexDirection: 'row',
    height: BAR_H,
    borderRadius: BAR_H / 2,
    backgroundColor: colors.surface,
    shadowColor: colors.primaryDark,
    shadowOpacity: 0.22,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 14,
  },
  pill: {
    position: 'absolute',
    top: ICON_TOP + ICON / 2 - PILL_H / 2,
    left: 0,
    height: PILL_H,
    borderRadius: PILL_H / 2,
    overflow: 'hidden',
  },
  ripple: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: BAR_H,
    height: BAR_H,
    borderRadius: BAR_H / 2,
    backgroundColor: colors.aqua,
  },
  item: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { alignItems: 'center' },
  iconSlot: { width: ICON, height: ICON, marginBottom: ICON_GAP },
  label: {
    fontSize: 10,
    lineHeight: LABEL_H,
    height: LABEL_H,
    fontWeight: '700',
    color: colors.textMuted,
    textAlign: 'center',
  },
  labelOn: {
    position: 'absolute',
    left: 0,
    right: 0,
    textAlign: 'center',
    color: colors.primary,
  },
});

/** `tabBar` prop for bottom tab navigators (defined outside render for lint). */
export const renderBubbleTabBar = (props: BottomTabBarProps) => (
  <BubbleTabBar {...props} />
);
