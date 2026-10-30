import JoystickWalk from "@/components/simulate/joystickSimulate";
import SystemWalk from "@/components/simulate/systemSimulate";
import { useStore } from "@/lib/storage/store";
import { SafeAreaProvider } from "react-native-safe-area-context";

export default function CarScreen() {
  return (
    <SafeAreaProvider>
      <Car />
    </SafeAreaProvider>
  );
}

function Car() {
  const { modes } = useStore();
  return modes.drive === "system" ? (
    <SystemWalk feature="drive" />
  ) : (
    <JoystickWalk feature="drive" />
  );
}
