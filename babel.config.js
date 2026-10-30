module.exports = function (api) {
  const platform = api.caller((caller) => caller && caller.platform);
  api.cache.using(() => platform);

  return {
    presets: ["babel-preset-expo"],
    plugins: [
      ...(platform === "web" ? [] : ["./plugins/strip-reanimated-native-deps"]),
      "react-native-worklets/plugin",
    ],
  };
};
