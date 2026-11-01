const { withGradleProperties } = require('@expo/config-plugins');

const GRADLE_PROPERTIES = {
  reactNativeArchitectures: 'armeabi-v7a,arm64-v8a',
  'android.enableMinifyInReleaseBuilds': 'true',
  'android.enableShrinkResourcesInReleaseBuilds': 'true',
};

function setGradleProperty(properties, key, value) {
  const existing = properties.find(
    (item) => item.type === 'property' && item.key === key,
  );

  if (existing) {
    existing.value = value;
  } else {
    properties.push({ type: 'property', key, value });
  }
}

function withAndroidSizeOptimization(config) {
  return withGradleProperties(config, (cfg) => {
    for (const [key, value] of Object.entries(GRADLE_PROPERTIES)) {
      setGradleProperty(cfg.modResults, key, value);
    }

    return cfg;
  });
}

module.exports = withAndroidSizeOptimization;
module.exports.default = withAndroidSizeOptimization;
