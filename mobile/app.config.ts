import { ExpoConfig, ConfigContext } from "@expo/config";
import * as dotenv from "dotenv";

// initialize dotenv
dotenv.config();

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: "Foodhouse",
  slug: "foodhouse",
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.foodhousecmr.foodhouse",
    config: {
      googleMapsApiKey: process.env.EXPO_PUBLIC_MAP_QUERY_KEY,
    },
  },
  android: {
    adaptiveIcon: {
      foregroundImage: "./assets/images/adaptive-icon.png",
      backgroundColor: "#ffffff",
    },
    softwareKeyboardLayoutMode: "pan",
    package: "com.foodhousecmr.foodhouse",
    config: {
      googleMaps: {
        apiKey: process.env.EXPO_PUBLIC_MAP_QUERY_KEY,
      },
    },
  },
});
