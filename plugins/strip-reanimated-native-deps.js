const HOOKS = {
  useAnimatedStyle: 1,
  useAnimatedProps: 1,
  useDerivedValue: 1,
  useAnimatedReaction: 2,
  useAnimatedScrollHandler: 1,
  useAnimatedGestureHandler: 1,
  useHandler: 1,
};

module.exports = function stripReanimatedNativeDeps() {
  return {
    name: "strip-reanimated-native-deps",
    visitor: {
      CallExpression(path) {
        const callee = path.node.callee;
        let name = null;
        if (callee.type === "Identifier") {
          name = callee.name;
        } else if (
          callee.type === "MemberExpression" &&
          !callee.computed &&
          callee.property.type === "Identifier"
        ) {
          name = callee.property.name;
        }

        const depsIndex = HOOKS[name];
        if (depsIndex === undefined) return;

        const { arguments: args } = path.node;
        if (args.length !== depsIndex + 1) return;

        path.node.arguments = args.slice(0, depsIndex);
      },
    },
  };
};
