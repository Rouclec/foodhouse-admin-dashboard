import { ExpoConfig, ConfigContext } from '@expo/config';
import * as dotenv from 'dotenv';

// initialize dotenv
dotenv.config();

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'Foodhouse',
  slug: 'foodhouse',
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.foodhousecmr.foodhouse',
    config: {
      googleMapsApiKey: process.env.EXPO_PUBLIC_IOS_MAP_QUERY_KEY,
    },
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/images/adaptive-icon.png',
      backgroundColor: '#ffffff',
    },
    softwareKeyboardLayoutMode: 'pan',
    package: 'com.foodhousecmr.foodhouse',
    permissions: [
      'android.permission.CAMERA',
      'android.permission.RECORD_AUDIO',
      'android.permission.ACCESS_COARSE_LOCATION',
      'android.permission.ACCESS_FINE_LOCATION',
      'android.permission.ACCESS_BACKGROUND_LOCATION',
      'android.permission.FOREGROUND_SERVICE',
      'android.permission.FOREGROUND_SERVICE_LOCATION',
    ],
    edgeToEdgeEnabled: true,
    config: {
      googleMaps: {
        apiKey: process.env.EXPO_PUBLIC_ANDROID_MAP_QUERY_KEY,
      },
    },
  },
});
