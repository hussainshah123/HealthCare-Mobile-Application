import React, { useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import Svg, { Defs, LinearGradient, Circle, Stop } from 'react-native-svg';
import { colors } from '../theme';
import { iconForTab } from './TabIcon';

const BUBBLE = 56;
const LIFT = 22; // how far the bubble rises above the bar
const RING = 4; // white ring around the bubble
const INNER = BUBBLE - RING * 2;

/**
 * Floating bottom bar. The active tab's icon sits in a blue gradient bubble
 * that rises out of the bar; switching tabs slides the bubble across with a
 * springy squish, and the new icon pops in.
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

  const position = useRef(new Animated.Value(state.index)).current;
  const squish = useRef(new Animated.Value(1)).current;
  const iconPop = useRef(new Animated.Value(1)).current;
  const reduceMotion = useRef(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled()
      .then(v => (reduceMotion.current = v))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (reduceMotion.current) {
      position.setValue(state.index);
      return;
    }
    Animated.parallel([
      Animated.spring(position, {
        toValue: state.index,
        friction: 7,
        tension: 70,
        useNativeDriver: true,
      }),
      // Stretch sideways while moving, then settle back to a circle.
      Animated.sequence([
        Animated.timing(squish, {
          toValue: 0.82,
          duration: 120,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.spring(squish, {
          toValue: 1,
          friction: 4,
          tension: 120,
          useNativeDriver: true,
        }),
      ]),
      Animated.sequence([
        Animated.timing(iconPop, {
          toValue: 0,
          duration: 90,
          useNativeDriver: true,
        }),
        Animated.spring(iconPop, {
          toValue: 1,
          friction: 5,
          tension: 160,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, [state.index, position, squish, iconPop]);

  const translateX =
    barWidth > 0
      ? position.interpolate({
          inputRange: state.routes.map((_, i) => i),
          outputRange: state.routes.map(
            (_, i) => i * tabW + (tabW - BUBBLE) / 2,
          ),
        })
      : 0;
  const scaleX = squish.interpolate({
    inputRange: [0.82, 1],
    outputRange: [1.18, 1],
  });

  const ActiveIcon = iconForTab(state.routes[state.index].name);

  return (
    <View
      style={[styles.outer, { paddingBottom: Math.max(insets.bottom, 10) }]}
    >
      <View
        style={styles.bar}
        onLayout={e => setBarWidth(e.nativeEvent.layout.width)}
      >
        {barWidth > 0 ? (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.bubble,
              { transform: [{ translateX }, { scaleX }, { scaleY: squish }] },
            ]}
          >
            <Svg width={INNER} height={INNER} style={StyleSheet.absoluteFill}>
              <Defs>
                <LinearGradient id="tabBubble" x1="0" y1="0" x2="1" y2="1">
                  <Stop offset="0" stopColor={colors.aqua} />
                  <Stop offset="1" stopColor={colors.primaryDark} />
                </LinearGradient>
              </Defs>
              <Circle
                cx={INNER / 2}
                cy={INNER / 2}
                r={INNER / 2}
                fill="url(#tabBubble)"
              />
              {/* glossy highlight, like a water drop */}
              <Circle
                cx={INNER * 0.34}
                cy={INNER * 0.3}
                r={INNER * 0.09}
                fill={colors.white}
                opacity={0.45}
              />
            </Svg>
            <Animated.View
              style={{
                opacity: iconPop,
                transform: [
                  {
                    scale: iconPop.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.4, 1],
                    }),
                  },
                ],
              }}
            >
              <ActiveIcon size={24} color={colors.white} strokeWidth={2.2} />
            </Animated.View>
          </Animated.View>
        ) : null}

        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const label =
            typeof options.tabBarLabel === 'string'
              ? options.tabBarLabel
              : options.title ?? route.name;
          const focused = state.index === index;
          const Icon = iconForTab(route.name);

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!focused && !event.defaultPrevented) {
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
              <View style={[styles.iconSlot, focused && styles.hidden]}>
                <Icon size={22} color={colors.textMuted} strokeWidth={1.8} />
              </View>
              <Text
                numberOfLines={1}
                style={[styles.label, focused && styles.labelActive]}
              >
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    paddingHorizontal: 12,
    paddingTop: LIFT + 4,
    backgroundColor: colors.canvasDeep,
  },
  bar: {
    flexDirection: 'row',
    height: 64,
    borderRadius: 26,
    backgroundColor: colors.surface,
    shadowColor: colors.primaryDark,
    shadowOpacity: 0.18,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 10,
  },
  bubble: {
    position: 'absolute',
    top: -LIFT,
    left: 0,
    width: BUBBLE,
    height: BUBBLE,
    borderRadius: BUBBLE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    // white ring so the bubble looks like it rises out of the bar
    borderWidth: RING,
    borderColor: colors.surface,
    backgroundColor: colors.surface,
    shadowColor: colors.primary,
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 12,
    zIndex: 2,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 10,
  },
  iconSlot: { height: 24, justifyContent: 'center', marginBottom: 4 },
  hidden: { opacity: 0 },
  label: { fontSize: 10.5, fontWeight: '600', color: colors.textMuted },
  labelActive: { color: colors.primary, fontWeight: '800' },
});

/** `tabBar` prop for bottom tab navigators (defined outside render for lint). */
export const renderBubbleTabBar = (props: BottomTabBarProps) => (
  <BubbleTabBar {...props} />
);
