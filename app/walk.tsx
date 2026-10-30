import JoystickWalk from "@/components/simulate/joystickSimulate";
import SystemWalk from "@/components/simulate/systemSimulate";
import { useStore } from "@/lib/storage/store";
import { SafeAreaProvider } from "react-native-safe-area-context";

export default function WalkScreen() {
  return (
    <SafeAreaProvider>
      <Walk />
    </SafeAreaProvider>
  );
}

function Walk() {
  const { modes } = useStore();
  return modes.walk === "system" ? <SystemWalk /> : <JoystickWalk />;
}
