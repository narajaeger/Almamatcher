// components/auth/CoupleAnimation.tsx
// Minimalist 2D line characters that walk toward each other; a heart blooms
// when they meet, then they drift apart and the loop repeats. Pure Animated API
// (no reanimated/worklets needed) so it runs in Expo Go, dev builds and web.

import React, { useEffect, useRef } from 'react';
import { View, Animated, Easing, StyleSheet } from 'react-native';
import Svg, { Circle, Path, Line, G } from 'react-native-svg';
import { Colors } from '../../constants/theme';

const FIG_W = 64;
const FIG_H = 96;

// One minimalist line-art figure. `facing` flips it horizontally.
function Figure({ color, facing }: { color: string; facing: 'left' | 'right' }) {
  const flip = facing === 'left' ? -1 : 1;
  return (
    <Svg width={FIG_W} height={FIG_H} viewBox="0 0 64 96">
      <G
        transform={facing === 'left' ? 'translate(64,0) scale(-1,1)' : undefined}
        stroke={color}
        strokeWidth={3.4}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      >
        {/* head */}
        <Circle cx={32} cy={15} r={11} fill={color + '22'} />
        {/* little cheek blush dot */}
        <Circle cx={37} cy={18} r={2} stroke="none" fill={Colors.primary + '88'} />
        {/* spine */}
        <Line x1={32} y1={26} x2={32} y2={56} />
        {/* reaching arm (toward partner) */}
        <Path d="M32 34 Q44 36 50 44" />
        {/* trailing arm */}
        <Path d="M32 34 Q24 40 22 50" />
        {/* legs (mid-stride) */}
        <Path d="M32 56 L24 86" />
        <Path d="M32 56 L41 84" />
      </G>
    </Svg>
  );
}

// Heart that blooms at the meeting point.
function HeartSvg({ size = 40, color = Colors.primary }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32">
      <Path
        d="M16 28 C16 28 3 20.5 3 11.5 C3 6.8 6.6 3.5 10.6 3.5 C13.2 3.5 15.1 5 16 6.6 C16.9 5 18.8 3.5 21.4 3.5 C25.4 3.5 29 6.8 29 11.5 C29 20.5 16 28 16 28 Z"
        fill={color}
      />
    </Svg>
  );
}

export default function CoupleAnimation() {
  const approach = useRef(new Animated.Value(0)).current; // 0 apart → 1 together
  const heart = useRef(new Animated.Value(0)).current;    // 0 hidden → 1 bloomed
  const bob = useRef(new Animated.Value(0)).current;      // continuous idle bob

  useEffect(() => {
    // continuous gentle bob
    const bobLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(bob, { toValue: 1, duration: 700, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(bob, { toValue: 0, duration: 700, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ]),
    );

    // main story loop
    const story = Animated.loop(
      Animated.sequence([
        // walk in
        Animated.timing(approach, { toValue: 1, duration: 1500, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        // heart blooms
        Animated.spring(heart, { toValue: 1, friction: 5, tension: 80, useNativeDriver: true }),
        // hold
        Animated.delay(900),
        // heart fades, drift apart
        Animated.parallel([
          Animated.timing(heart, { toValue: 0, duration: 450, easing: Easing.in(Easing.quad), useNativeDriver: true }),
          Animated.timing(approach, { toValue: 0, duration: 1300, easing: Easing.inOut(Easing.cubic), useNativeDriver: true }),
        ]),
        Animated.delay(500),
      ]),
    );

    bobLoop.start();
    story.start();
    return () => { bobLoop.stop(); story.stop(); };
  }, [approach, heart, bob]);

  // figures slide from spread-out (±84) to close (±28)
  const leftX = approach.interpolate({ inputRange: [0, 1], outputRange: [-84, -30] });
  const rightX = approach.interpolate({ inputRange: [0, 1], outputRange: [84, 30] });
  const bobY = bob.interpolate({ inputRange: [0, 1], outputRange: [0, -5] });
  const bobYAlt = bob.interpolate({ inputRange: [0, 1], outputRange: [-5, 0] });

  const heartScale = heart.interpolate({ inputRange: [0, 1], outputRange: [0.2, 1] });
  const heartY = heart.interpolate({ inputRange: [0, 1], outputRange: [6, -16] });
  // faint motion echo lines that appear during approach
  const echoOpacity = approach.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 0.5, 0] });

  return (
    <View style={styles.stage} pointerEvents="none">
      {/* left figure (coral) */}
      <Animated.View style={[styles.figWrap, { transform: [{ translateX: leftX }, { translateY: bobY }] }]}>
        <Figure color={Colors.primary} facing="right" />
      </Animated.View>

      {/* right figure (teal) */}
      <Animated.View style={[styles.figWrap, { transform: [{ translateX: rightX }, { translateY: bobYAlt }] }]}>
        <Figure color={Colors.secondary} facing="left" />
      </Animated.View>

      {/* motion echo dots */}
      <Animated.View style={[styles.echoL, { opacity: echoOpacity }]} />
      <Animated.View style={[styles.echoR, { opacity: echoOpacity }]} />

      {/* heart bloom */}
      <Animated.View
        style={[
          styles.heart,
          { opacity: heart, transform: [{ translateY: heartY }, { scale: heartScale }] },
        ]}
      >
        <HeartSvg size={42} color={Colors.primary} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  stage: {
    height: 130,
    alignItems: 'center',
    justifyContent: 'center',
  },
  figWrap: {
    position: 'absolute',
    bottom: 12,
  },
  heart: {
    position: 'absolute',
    top: 6,
  },
  echoL: {
    position: 'absolute',
    left: '32%',
    width: 5, height: 5, borderRadius: 3,
    backgroundColor: Colors.primaryMid,
  },
  echoR: {
    position: 'absolute',
    right: '32%',
    width: 5, height: 5, borderRadius: 3,
    backgroundColor: Colors.secondaryMid,
  },
});
