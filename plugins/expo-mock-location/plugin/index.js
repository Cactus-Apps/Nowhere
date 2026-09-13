const {
  withDangerousMod,
  withAndroidManifest,
  withMainApplication,
} = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const PLUGIN_DIR = path.join(__dirname, 'android');

function copyDirSync(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirSync(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function withMockLocationAndroid(config) {
  return withDangerousMod(config, [
    'android',
    (config) => {
      const projectRoot = config.modRequest.platformProjectRoot;

      const srcMain = path.join(PLUGIN_DIR, 'src', 'main', 'java', 'com', 'mocklocation');
      const destMain = path.join(
        projectRoot,
        'app',
        'src',
        'main',
        'java',
        'com',
        'mocklocation'
      );
      copyDirSync(srcMain, destMain);

      return config;
    },
  ]);
}

function withMockLocationRegistration(config) {
  return withMainApplication(config, (config) => {
    let content = config.modResults.contents;

    const importLine = 'import com.mocklocation.MockLocationPackage';
    if (!content.includes(importLine)) {
      const lastImportIdx = content.lastIndexOf('\nimport ');
      if (lastImportIdx !== -1) {
        const endOfLine = content.indexOf('\n', lastImportIdx + 1);
        content =
          content.slice(0, endOfLine + 1) +
          importLine +
          '\n' +
          content.slice(endOfLine + 1);
      }
    }

    const packageRegistration = 'add(MockLocationPackage())';
    if (!content.includes(packageRegistration)) {
      const applyPattern = /(\.packages\.apply\s*\{[^}]*)(\})/;
      if (applyPattern.test(content)) {
        content = content.replace(applyPattern, `$1\n              ${packageRegistration}\n            $2`);
      } else {
        const addPattern = /(add\([^)]+\))/g;
        const matches = [...content.matchAll(addPattern)];
        if (matches.length > 0) {
          const lastMatch = matches[matches.length - 1];
          const insertPos = lastMatch.index + lastMatch[0].length;
          content =
            content.slice(0, insertPos) +
            '\n              ' +
            packageRegistration +
            content.slice(insertPos);
        }
      }
    }

    config.modResults.contents = content;
    return config;
  });
}

function withMockLocationPermissions(config) {
  return withAndroidManifest(config, (config) => {
    const manifest = config.modResults.manifest;

    if (!manifest['uses-permission']) {
      manifest['uses-permission'] = [];
    }

    const permissions = [
      'android.permission.ACCESS_FINE_LOCATION',
      'android.permission.ACCESS_COARSE_LOCATION',
      'android.permission.ACCESS_MOCK_LOCATION',
    ];

    for (const perm of permissions) {
      const exists = manifest['uses-permission'].some(
        (p) => p.$?.['android:name'] === perm
      );
      if (!exists) {
        manifest['uses-permission'].push({
          $: { 'android:name': perm },
        });
      }
    }

    return config;
  });
}

function withMockLocation(config) {
  config = withMockLocationPermissions(config);
  config = withMockLocationAndroid(config);
  config = withMockLocationRegistration(config);
  return config;
}

module.exports = { withMockLocation };
module.exports.default = withMockLocation;
