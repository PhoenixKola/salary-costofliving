import React from "react";
import { Animated, Easing, Pressable, type StyleProp, type ViewStyle } from "react-native";
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

type Props = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  onPress?: () => void;
  disabled?: boolean;
  hitSlop?: number;
  scaleIn?: number;
  haptic?: boolean;
};

export function AnimatedPressable({
  children,
  style,
  contentStyle,
  onPress,
  disabled,
  hitSlop,
  scaleIn = 0.96,
  haptic = false
}: Props) {
  const scale = React.useRef(new Animated.Value(1)).current;

  const pressIn = () => {
    if (disabled) return;
    Animated.timing(scale, {
      toValue: scaleIn,
      duration: 90,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true
    }).start();
  };

  const pressOut = () => {
    Animated.timing(scale, {
      toValue: 1,
      duration: 120,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true
    }).start();
  };

  const handlePress = () => {
    if (haptic && Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
    onPress?.();
  };

  return (
    <Animated.View style={[{ transform: [{ scale }] }, style]}>
      <Pressable
        onPress={handlePress}
        disabled={disabled}
        hitSlop={hitSlop}
        onPressIn={pressIn}
        onPressOut={pressOut}
        style={contentStyle}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}
