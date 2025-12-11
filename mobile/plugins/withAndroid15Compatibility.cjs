const { withAndroidManifest } = require('@expo/config-plugins');

/**
 * Config plugin to add Android 15 compatibility attributes
 * This ensures the app works correctly on Android 15+ devices
 */
const withAndroid15Compatibility = config => {
  return withAndroidManifest(config, async config => {
    const androidManifest = config.modResults;
    const { manifest } = androidManifest;

    // Add enableOnBackInvokedCallback to application tag (required for Android 15)
    if (manifest.application && manifest.application[0]) {
      const application = manifest.application[0];
      application.$['android:enableOnBackInvokedCallback'] = 'true';
      application.$['android:hardwareAccelerated'] = 'true';
      application.$['android:usesCleartextTraffic'] = 'false';
    }

    // Add enableOnBackInvokedCallback to MainActivity (required for Android 15)
    if (
      manifest.application &&
      manifest.application[0] &&
      manifest.application[0].activity
    ) {
      const activities = manifest.application[0].activity;
      const mainActivity = activities.find(
        activity => activity.$['android:name'] === '.MainActivity',
      );
      if (mainActivity) {
        mainActivity.$['android:enableOnBackInvokedCallback'] = 'true';
        mainActivity.$['android:resizeableActivity'] = 'false';
      }
    }

    return config;
  });
};

module.exports = withAndroid15Compatibility;
