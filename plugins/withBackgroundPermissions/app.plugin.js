const { withAndroidManifest } = require('@expo/config-plugins');

/**
 * Ensures the permissions for the background location task
 * are present in AndroidManifest after every `expo prebuild`.
 *
 * Without RECEIVE_BOOT_COMPLETED the app crashes when the location simulation starts:
 *   IllegalArgumentException: Requested job cannot be persisted without
 *   holding android.permission.RECEIVE_BOOT_COMPLETED permission
 * (expo.modules.taskManager.TaskManagerUtils.scheduleJob)
 */
const REQUIRED_PERMISSIONS = [
  'android.permission.RECEIVE_BOOT_COMPLETED',
  'android.permission.ACCESS_BACKGROUND_LOCATION',
  'android.permission.FOREGROUND_SERVICE',
  'android.permission.FOREGROUND_SERVICE_LOCATION',
];

function withBackgroundPermissions(config) {
  return withAndroidManifest(config, (cfg) => {
    const manifest = cfg.modResults.manifest;
    if (!manifest['uses-permission']) {
      manifest['uses-permission'] = [];
    }
    const permissions = manifest['uses-permission'];

    for (const perm of REQUIRED_PERMISSIONS) {
      const exists = permissions.some((p) => p.$?.['android:name'] === perm);
      if (!exists) {
        permissions.push({ $: { 'android:name': perm } });
      }
    }

    return cfg;
  });
}

module.exports = withBackgroundPermissions;
module.exports.default = withBackgroundPermissions;
module.exports.REQUIRED_PERMISSIONS = REQUIRED_PERMISSIONS;
