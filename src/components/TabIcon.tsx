import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet } from 'react-native';
import {
  Bike,
  CalendarClock,
  CalendarDays,
  History,
  House,
  Package,
  Pill,
  Stethoscope,
  UserRound,
  Wallet,
  type LucideIcon,
} from 'lucide-react-native';
import { colors } from '../theme';

const ICONS: Record<string, LucideIcon> = {
  Home: Pill,
  Pharmacy: Pill,
  Doctors: Stethoscope,
  Orders: Package,
  Appointments: CalendarDays,
  Profile: UserRound,
  Dashboard: House,
  Available: Bike,
  History,
  Earnings: Wallet,
  Availability: CalendarClock,
};

/** The SVG icon used for a tab route name. */
export function iconForTab(name: string): LucideIcon {
  return ICONS[name] ?? Pill;
}

/**
 * SVG tab icon. When its tab becomes active the icon springs up a little and
 * a soft pill fades in behind it.
 */
export function TabIcon({
  label,
  focused,
  color,
}: {
  label: string;
  focused: boolean;
  color: string;
}) {
  const Icon = ICONS[label] ?? Pill;
  const progress = useRef(new Animated.Value(focused ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(progress, {
      toValue: focused ? 1 : 0,
      friction: 6,
      tension: 140,
      useNativeDriver: true,
    }).start();
  }, [focused, progress]);

  const scale = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.12],
  });
  const translateY = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -1.5],
  });
  const pillScaleX = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0.4, 1],
  });

  return (
    <Animated.View style={styles.wrap}>
      <Animated.View
        style={[
          styles.pill,
          { opacity: progress, transform: [{ scaleX: pillScaleX }] },
        ]}
      />
      <Animated.View style={{ transform: [{ translateY }, { scale }] }}>
        <Icon size={22} color={color} strokeWidth={focused ? 2.4 : 1.8} />
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: 52,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pill: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    borderRadius: 15,
    backgroundColor: colors.primaryLight,
  },
});

/** `tabBarIcon` factory defined outside render (keeps react/no-unstable-nested-components happy). */
export const tabIconFor =
  (label: string) =>
  ({ focused, color }: { focused: boolean; color: string }) =>
    <TabIcon label={label} focused={focused} color={color} />;
