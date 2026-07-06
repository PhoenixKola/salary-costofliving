import React from "react";
import { Animated, Easing, Text, type StyleProp, type TextStyle } from "react-native";

type Props = {
  value: number;
  format?: (n: number) => string;
  duration?: number;
  style?: StyleProp<TextStyle>;
};

/** Text that counts up to `value` on mount / value change. */
export function CountUp({ value, format = (n) => String(Math.round(n)), duration = 900, style }: Props) {
  const anim = React.useRef(new Animated.Value(0)).current;
  const [display, setDisplay] = React.useState(format(0));
  const fromRef = React.useRef(0);

  React.useEffect(() => {
    const from = fromRef.current;
    const id = anim.addListener(({ value: p }) => {
      setDisplay(format(from + (value - from) * p));
    });
    anim.setValue(0);
    Animated.timing(anim, {
      toValue: 1,
      duration,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false
    }).start(() => {
      fromRef.current = value;
      setDisplay(format(value));
    });
    return () => anim.removeListener(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return <Text style={style}>{display}</Text>;
}
