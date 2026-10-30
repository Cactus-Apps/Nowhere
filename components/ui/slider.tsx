import { colors } from "@/theme";
import RNCSlider from "@react-native-community/slider";
import { StyleSheet } from "react-native";

export default function Slider({
  value,
  min,
  max,
  step = 0.1,
  onChange,
  onComplete,
}: {
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  onComplete?: (value: number) => void;
}) {
  return (
    <RNCSlider
      style={styles.slider}
      minimumValue={min}
      maximumValue={max}
      step={step}
      value={value}
      minimumTrackTintColor={colors.accent}
      maximumTrackTintColor={colors.surfaceElevated}
      thumbTintColor={colors.accent}
      onValueChange={onChange}
      onSlidingComplete={onComplete}
    />
  );
}

const styles = StyleSheet.create({
  slider: { width: "100%", height: 44 },
});
