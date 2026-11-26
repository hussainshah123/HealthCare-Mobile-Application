import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text } from 'react-native';
import { useNavigation, type NavigationProp } from '@react-navigation/native';
import { Bell, type LucideIcon } from 'lucide-react-native';
import { colors } from '../theme';

/**
 * Round icon button for the teal navigation header, with an optional count
 * badge that pops when the count goes up.
 */
export function HeaderIconButton({
  icon: Icon,
  label,
  onPress,
  badge,
}: {
  icon: LucideIcon;
  /** Screen-reader label. */
  label: string;
  onPress: () => void;
  badge?: number;
}) {
  const pop = useRef(new Animated.Value(1)).current;
  const last = useRef(badge ?? 0);

  useEffect(() => {
    const now = badge ?? 0;
    if (now > last.current) {
      pop.setValue(0.6);
      Animated.spring(pop, {
        toValue: 1,
        friction: 4,
        tension: 160,
        useNativeDriver: true,
      }).start();
    }
    last.current = now;
  }, [badge, pop]);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={badge ? `${label}, ${badge}` : label}
      hitSlop={6}
      style={({ pressed }) => [styles.btn, pressed && styles.pressed]}
    >
      <Icon size={20} color={colors.white} strokeWidth={2} />
      {badge ? (
        <Animated.View style={[styles.badge, { transform: [{ scale: pop }] }]}>
          <Text style={styles.badgeText}>{badge > 99 ? '99+' : badge}</Text>
        </Animated.View>
      ) : null}
    </Pressable>
  );
}

type WithNotifications = { Notifications: undefined };

/** Header bell; the navigate call bubbles up from the tabs to the role's stack. */
export function NotificationsHeaderButton() {
  const nav = useNavigation<NavigationProp<WithNotifications>>();
  return (
    <HeaderIconButton
      icon={Bell}
      label="Notifications"
      onPress={() => nav.navigate('Notifications')}
    />
  );
}

const styles = StyleSheet.create({
  btn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.16)',
    marginLeft: 8,
  },
  pressed: { backgroundColor: 'rgba(255,255,255,0.3)' },
  badge: {
    position: 'absolute',
    top: -3,
    right: -3,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: 9,
    backgroundColor: '#F43F5E',
    borderWidth: 1.5,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { color: colors.white, fontSize: 10, fontWeight: '700' },
});
