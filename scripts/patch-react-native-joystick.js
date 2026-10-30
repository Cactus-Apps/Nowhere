const fs = require("fs");
const path = require("path");

const target = path.join(
  __dirname,
  "..",
  "node_modules",
  "@korsolutions",
  "react-native-joystick",
  "lib",
  "index.js",
);

if (!fs.existsSync(target)) {
  process.exit(0);
}

let source = fs.readFileSync(target, "utf8");
let changed = false;

const gestureOriginal =
  "Gesture.Pan().onStart(handleTouchStart).onEnd(handleTouchEnd).onTouchesMove(handleTouchMove)";
const gesturePatched =
  "Gesture.Pan().runOnJS(true).onStart(handleTouchStart).onEnd(handleTouchEnd).onTouchesMove(handleTouchMove)";

if (source.includes(gestureOriginal)) {
  source = source.replace(gestureOriginal, gesturePatched);
  changed = true;
}

const rotatePattern = /\s*transform:\s*\[\{\s*rotateX:\s*"180deg"\s*\}\],?/g;
if (rotatePattern.test(source)) {
  source = source.replace(rotatePattern, "");
  changed = true;
}

if (changed) {
  fs.writeFileSync(target, source);
  console.log("Patched @korsolutions/react-native-joystick");
}
