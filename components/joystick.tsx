import { colors } from "@/theme";
import {
  IReactNativeJoystickEvent,
  ReactNativeJoystick,
} from "@korsolutions/react-native-joystick";
import { useState } from "react";
import { StyleSheet, View, ViewStyle } from "react-native";

export type JoystickValue = {
  /** -1..1, negative = left, positive = right */
  x: number;
  /** -1..1, negative = up, positive = down */
  y: number;
  /** 0..1 deflection */
  force: number;
};

export default function Joystick({
  size = 120,
  onChange,
  onStart,
  onEnd,
  style,
}: {
  size?: number;
  onChange: (value: JoystickValue) => void;
  onStart?: () => void;
  onEnd?: () => void;
  style?: ViewStyle;
}) {
  const padRadius = size / 2;
  const nippleRadius = padRadius / 3;
  const [used, setUsed] = useState<boolean>();

  const handleMove = (event: IReactNativeJoystickEvent) => {
    setUsed(true);
    const rawX = (event.position.x + nippleRadius - padRadius) / padRadius;
    const rawY = (event.position.y + nippleRadius - padRadius) / padRadius;
    const length = Math.hypot(rawX, rawY) || 1;
    const scale = length > 1 ? 1 / length : 1;
    onChange({
      x: rawX * scale,
      y: rawY * scale,
      force: Math.min(event.force, 1),
    });
  };

  return (
    <View
      style={[
        styles.container,
        { width: size, height: size, borderRadius: padRadius },
        style,
      ]}
    >
      <ReactNativeJoystick
        radius={padRadius}
        color={colors.accent}
        onStart={() => onStart?.()}
        onMove={handleMove}
        onStop={() => onEnd?.()}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderColor: "rgba(52, 58, 65, 0.6)",
    backgroundColor: "rgba(21, 23, 26, 0.72)",
    overflow: "hidden",
  },
});
