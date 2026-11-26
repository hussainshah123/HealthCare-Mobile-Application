import { renderHeaderGradient } from '../components/HeaderGradient';
import { colors } from '../theme';

/**
 * Rounded water-blue header (gradient + bubbles, see HeaderGradient) with a
 * white title, shared by every stack and tab navigator. HeaderGradient paints
 * the screen background colour behind its rounded corners so they blend in.
 */
export const headerOptions = {
  // Transparent so HeaderGradient shows: the native stack draws the custom
  // background *under* its own header, which would otherwise paint over it.
  headerStyle: { backgroundColor: 'transparent' },
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
  // Tabs you are not looking at stop re-rendering, so switching stays quick.
  freezeOnBlur: true,
  tabBarAllowFontScaling: false,
};
