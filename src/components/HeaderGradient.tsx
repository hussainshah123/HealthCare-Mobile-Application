import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { colors } from '../theme';

/** Deep-blue → aqua gradient behind the navigation header. */
export function HeaderGradient() {
  const [size, setSize] = useState({ w: 0, h: 0 });
  return (
    <View
      style={styles.fill}
      onLayout={e =>
        setSize({
          w: e.nativeEvent.layout.width,
          h: e.nativeEvent.layout.height,
        })
      }
    >
      {size.w > 0 ? (
        <Svg width={size.w} height={size.h}>
          <Defs>
            <LinearGradient id="hdr" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor={colors.primaryDark} />
              <Stop offset="0.6" stopColor={colors.primary} />
              <Stop offset="1" stopColor={colors.aqua} />
            </LinearGradient>
          </Defs>
          <Rect width={size.w} height={size.h} fill="url(#hdr)" />
        </Svg>
      ) : null}
    </View>
  );
}

/** `headerBackground` option (defined outside render for lint). */
export const renderHeaderGradient = () => <HeaderGradient />;

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: colors.primary },
});
