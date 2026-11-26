import { renderHeaderGradient } from '../components/HeaderGradient';
import { colors } from '../theme';

/** Teal header with white title, shared by every stack and tab navigator. */
export const headerOptions = {
  headerStyle: { backgroundColor: colors.primary },
  headerBackground: renderHeaderGradient,
  headerTintColor: colors.white,
  headerTitleStyle: { color: colors.white, fontWeight: '700' as const },
  headerShadowVisible: false,
};

/** Tab bar look shared by the customer, doctor and rider apps. */
export const tabBarOptions = {
  ...headerOptions,
  tabBarActiveTintColor: colors.primary,
  tabBarInactiveTintColor: colors.textMuted,
  tabBarStyle: {
    backgroundColor: colors.surface,
    borderTopColor: colors.border,
  },
  tabBarLabelStyle: { fontSize: 10, fontWeight: '600' as const },
  tabBarAllowFontScaling: false,
};
